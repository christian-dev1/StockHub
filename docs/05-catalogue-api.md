# API catalogue — référence (état au 22/09/2026)

Modules : `warehouse` (emplacements), `product` (catégories, produits, images, import), `supplier`, `barcode`.
Contrat complet et à jour : Swagger (`/swagger-ui.html`, `/v3/api-docs`). Chaque opération y indique la permission requise (`x-required-authority`) et ses réponses d'erreur (`ApiError`).

## Conventions

| Sujet | Règle |
|---|---|
| Recherche | paramètre `q` (convention déjà utilisée par `/users` et `/platform/companies`) |
| Pagination | `page` (à partir de 0, une valeur négative devient 0), `size` (1 à 100, défaut 20, ramené dans l'intervalle) |
| Tri | `sort=champ,asc|desc` ; un champ hors liste blanche est ignoré (tri par défaut) |
| Réponse paginée | `{ content, page, size, totalElements, totalPages }` |
| Concurrence | `PUT` exige la `version` lue ; version périmée → 409 `CONCURRENT_MODIFICATION` |
| Création | 201 + en-tête `Location` ; suppression → 204 |
| Autre entreprise | un identifiant d'une autre entreprise répond comme un identifiant inconnu (404, ou erreur de référence inconnue) |
| Erreurs | format global `ApiError { timestamp, status, code, message, path, requestId, fieldErrors[] }` ; les messages métier sont en anglais, les frontends traduisent par `code` |

**Exceptions à la pagination (documentées)**

- `GET /locations` : liste complète, sans pagination ni `q` (quelques emplacements par entreprise). Filtrée selon les emplacements autorisés de l'utilisateur ; `includeInactive=true` n'a d'effet que pour les rôles qui gèrent les emplacements.
- `GET /categories` : liste complète en ordre d'arbre (chaque catégorie suivie de ses sous-catégories), filtrable par `q`, sans pagination.

| Liste | `q` cherche dans | Filtres | Tri autorisé |
|---|---|---|---|
| `/products` | nom (contient + similarité trigramme), SKU (commence par), code-barres (exact) | `categoryId` (inclut les sous-catégories), `supplierId`, `active`, `batchTracked`, `expiryTracked`, `hasBarcode` | `name`, `sku`, `salePrice`, `purchasePrice`, `minStock`, `createdAt`, `updatedAt` |
| `/suppliers` | nom, code, contact, e-mail, ville | `active` | `code`, `name`, `city`, `leadTimeDays`, `createdAt` |

## Règles métier vérifiées

**Emplacements** : code unique par entreprise (insensible à la casse, normalisé en majuscules) ; types `STORE`, `WAREHOUSE`, `DEPOT` ; exactement un emplacement principal par entreprise, garanti par un index unique en base ; le principal est toujours actif (contrainte en base) et ne peut pas être désactivé (`LOCATION_PRIMARY_CANNOT_BE_DISABLED`) : il faut d'abord en désigner un autre ; un emplacement inactif ne peut pas devenir principal (`LOCATION_INACTIVE`) ; pas de suppression (désactivation seulement) ; d'autres modules peuvent refuser une désactivation (`LocationDeactivationGuard`, prévu pour le stock).

**Catégories** : pas de code, nom unique par entreprise (insensible à la casse) ; deux niveaux maximum (catégorie → sous-catégorie, `CATEGORY_DEPTH_EXCEEDED`), ce qui rend tout cycle impossible ; parent d'une autre entreprise → `CATEGORY_PARENT_UNKNOWN` ; suppression (logique) refusée tant qu'il reste des produits ou des sous-catégories (`CATEGORY_IN_USE`), le nom redevient alors disponible.

**Fournisseurs** : code unique par entreprise, généré si absent ; e-mail valide, pays ISO à 2 lettres ; `leadTimeDays` de 0 à 365, facultatif (utilisé plus tard par les prévisions ; la valeur par défaut de l'entreprise s'applique quand il est vide) ; jamais supprimés, seulement désactivés ; un fournisseur inactif ne peut plus être choisi pour un produit, mais un produit qui y est déjà lié le garde.

**Produits** : SKU unique par entreprise (insensible à la casse), généré `PRD-000001…` si vide ; un SKU vide en mise à jour garde l'actuel ; code-barres unique par entreprise quand il est renseigné ; format détecté (EAN-13, UPC-A, EAN-8 avec clé GS1 valide, sinon CODE128) ou imposé ; prix et `minStock` ≥ 0 ; quantités entières pour les unités discrètes ; `expiryTracked` exige `batchTracked` ; le suivi par lots ne peut pas changer tant que le produit a du stock (`ProductUsageGuard`, prévu pour le stock) ; suppression logique (SKU et code-barres libérés), refusée si du stock existe.

**Images** : PNG, JPEG ou WebP, type détecté depuis le contenu (jamais depuis le nom ni l'en-tête) ; 2 Mo maximum ; SVG refusé ; stockées en base (petites, pas de système de fichiers partagé) ; servies avec `X-Content-Type-Options: nosniff`.

**Import CSV/XLSX** : `template` → `preview` (valide ligne par ligne, n'écrit rien, conserve les lignes 1 h) → `commit` (revalide et applique tout ou rien, une seule fois). Contrôles : SKU ou code-barres en double dans le fichier, code-barres déjà utilisé, catégorie inconnue (ou créée si `createMissingCategories=true`), fournisseur inconnu ou inactif, valeurs et prix invalides, règles du domaine. Toutes les références sont résolues dans l'entreprise de l'appelant ; un SKU existant met à jour le produit (les cellules vides gardent la valeur actuelle).

**Codes-barres** : génération EAN-13 (préfixe GS1 `20`, réservé à l'usage interne, clé de contrôle calculée) ou CODE128 (`SH` + compteur), unique par entreprise (en cas de collision, le numéro suivant est pris) ; un code existant n'est remplacé que si `replaceExisting=true` ; rendu PNG et SVG (EAN-13, EAN-8, UPC-A, CODE128) ; planche PDF A4 (3×8, 2×7, 4×10), 1 000 étiquettes maximum, position de départ réglable.

## Endpoints et permissions

| Méthode | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/locations`, `/locations/{id}` | `WAREHOUSE_VIEW` |
| POST | `/api/v1/locations` | `WAREHOUSE_CREATE` |
| PUT | `/api/v1/locations/{id}` | `WAREHOUSE_UPDATE` |
| POST | `/locations/{id}/activate`, `/deactivate`, `/set-primary` | `WAREHOUSE_UPDATE` |
| GET | `/api/v1/categories`, `/categories/{id}` | `CATEGORY_VIEW` |
| POST / PUT / DELETE | `/api/v1/categories`, `/categories/{id}` | `CATEGORY_MANAGE` |
| GET | `/api/v1/suppliers`, `/suppliers/{id}` | `SUPPLIER_VIEW` |
| POST | `/api/v1/suppliers` | `SUPPLIER_CREATE` |
| PUT / POST | `/suppliers/{id}`, `/activate`, `/deactivate` | `SUPPLIER_UPDATE` |
| GET | `/api/v1/products`, `/products/{id}`, `/products/lookup?code=` | `PRODUCT_VIEW` |
| POST | `/api/v1/products` | `PRODUCT_CREATE` |
| PUT / POST | `/products/{id}`, `/activate`, `/deactivate` | `PRODUCT_UPDATE` |
| DELETE | `/products/{id}` | `PRODUCT_DELETE` |
| GET | `/products/{id}/image` | `PRODUCT_VIEW` |
| PUT / DELETE | `/products/{id}/image` | `PRODUCT_UPDATE` |
| GET / POST | `/products/imports/template`, `/preview`, `/{jobId}/commit` | `PRODUCT_IMPORT` |
| POST | `/products/{id}/barcode` | `BARCODE_GENERATE` |
| GET | `/products/{id}/barcode.png`, `.svg` | `PRODUCT_VIEW` |
| POST | `/api/v1/barcodes/labels` | `BARCODE_PRINT` |

| Fonction | ADMIN | MANAGER | MAGASINIER | VENDEUR |
|---|:-:|:-:|:-:|:-:|
| Voir emplacements / catégories / produits / images / codes-barres | ✔ | ✔ | ✔ | ✔ |
| Créer, modifier, activer, désactiver, désigner le principal (emplacements) | ✔ | — | — | — |
| Gérer les catégories | ✔ | ✔ | — | — |
| Voir les fournisseurs | ✔ | ✔ | ✔ | — |
| Créer / modifier les fournisseurs | ✔ | ✔ | — | — |
| Créer / modifier / supprimer les produits, gérer les images | ✔ | ✔ | — | — |
| Importer des produits | ✔ | ✔ | — | — |
| Générer des codes-barres, imprimer des étiquettes | ✔ | ✔ | ✔ | — |

Le VENDEUR ne voit que les emplacements qui lui sont attribués. SUPER_ADMIN n'a accès à aucune donnée catalogue (pas d'entreprise). Cette matrice est vérifiée endpoint par endpoint par `CataloguePermissionMatrixIntegrationTest`.
