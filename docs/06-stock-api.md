# Stock — API backend (étape 4)

## Contrat et périmètre

Le module `stock` est autonome au sens Spring Modulith. Le catalogue fournit les produits, l'entreprise ses paramètres, le module entrepôts les emplacements. Les extensions publiques `ProductUsageGuard` et `LocationDeactivationGuard` sont implémentées sans accès aux classes internes des autres modules.

Les noms existants `batchTracked`, `expiryTracked` et `minStock` correspondent respectivement à `trackLots`, `trackExpiration` et `minimumStock` du cahier des charges. Aucune interface Angular ou Next n'est ajoutée.

## Endpoints et permissions

| Méthode | URI | Permission |
|---|---|---|
| GET | `/api/v1/stocks` | STOCK_VIEW |
| GET | `/api/v1/stocks/{id}` (id du produit) | STOCK_VIEW |
| GET | `/api/v1/stock-movements` | STOCK_VIEW |
| GET | `/api/v1/stock-movements/{id}` | STOCK_VIEW |
| POST | `/api/v1/stock/entries` | STOCK_ENTRY |
| POST | `/api/v1/stock/exits` | STOCK_EXIT |
| POST | `/api/v1/stock/adjustments` | STOCK_ADJUST |
| POST | `/api/v1/stock/transfers` | STOCK_TRANSFER |
| GET | `/api/v1/batches` | BATCH_MANAGE |
| GET | `/api/v1/batches/{id}` | BATCH_MANAGE |
| GET | `/api/v1/stock-documents` | STOCK_VIEW |
| GET | `/api/v1/stock-documents/{id}` | STOCK_VIEW |

Le nom du paramètre `{id}` suit la convention des contrôleurs existants ; sur `/stocks/{id}`, il désigne le produit et la réponse est une page de ses niveaux par emplacement. Les POST réussis retournent 201 et le document créé ; le GET du document restitue ses lignes.

La matrice V2 n'est pas modifiée : ADMIN et MANAGER ont les six permissions ; MAGASINIER les possède sauf STOCK_ADJUST ; VENDEUR a seulement STOCK_VIEW. BATCH_MANAGE est donc déjà accordé au MANAGER. La permission d'entrée/sortie/transfert autorise la gestion des lots nécessaire à cette opération ; les consultations dédiées de lots demandent BATCH_MANAGE.

## Exemples de requêtes

Entrée sans lots :

```json
{
  "locationId": "<UUID emplacement>",
  "reason": "Réception initiale",
  "reference": "BL-FOURNISSEUR-42",
  "lines": [{ "productId": "<UUID produit>", "quantity": 20 }]
}
```

Pour une entrée suivie par lots, chaque ligne contient `batchNumber`, et éventuellement `manufacturingDate` et `expirationDate` au format `YYYY-MM-DD`. `expirationDate` est obligatoire quand `expiryTracked=true`. Le numéro du lot est normalisé (espaces externes supprimés, majuscules) ; les dates d'un lot existant ne peuvent pas être remplacées par l'entrée.

Sortie :

```json
{
  "locationId": "<UUID emplacement>",
  "reason": "Sortie magasin",
  "lines": [{ "productId": "<UUID produit>", "quantity": 2 }]
}
```

`batchId` peut imposer un lot sur une ligne de sortie/transfert. Sinon le moteur répartit la quantité sur les lots disponibles. `type`, facultatif, accepte ENTRY ou RETURN_CUSTOMER pour une entrée, EXIT ou RETURN_SUPPLIER pour une sortie.

Ajustement :

```json
{
  "locationId": "<UUID emplacement>",
  "productId": "<UUID produit>",
  "countedQuantity": 12,
  "reason": "Correction de comptage"
}
```

L'ajustement fixe une quantité absolue et produit un mouvement positif ou négatif correspondant au delta. Pour un produit suivi par lots, `batchId` est obligatoire et la quantité cible concerne ce lot. Une raison est obligatoire. Aucun mouvement de quantité nulle n'est créé (`STOCK_UNCHANGED`). L'ajustement permet de corriger un lot expiré ; les sorties normales et transferts ne peuvent pas le consommer.

Transfert :

```json
{
  "sourceLocationId": "<UUID source>",
  "destinationLocationId": "<UUID destination>",
  "reason": "Réapprovisionnement",
  "lines": [{ "productId": "<UUID produit>", "quantity": 7 }]
}
```

Les documents acceptent 1 à 100 lignes. Les quantités déplacées doivent être strictement positives, avec au maximum trois décimales ; UNIT, BOX et PACK imposent un entier.

## Filtres et pagination

Chaque liste accepte `page` (base zéro), `size` (20 par défaut, maximum 100) et `sort=champ,asc|desc`. Réponse standard : `content`, `page`, `size`, `totalElements`, `totalPages`.

| Ressource | Filtres | Champs de tri |
|---|---|---|
| Stocks | locationId, productId, search, lowStock, outOfStock | createdAt, updatedAt, quantity |
| Mouvements | locationId, productId, type, performedBy, reference, dateFrom, dateTo | createdAt, reference, type |
| Lots | locationId, productId, batchNumber, expirationFrom, expirationTo, status | createdAt, expirationDate, batchNumber, quantity |
| Documents | type, locationId, reference, dateFrom, dateTo | createdAt, reference, type |

Les filtres se combinent avec AND. `search` recherche dans le nom et SKU ; `lowStock=true` signifie quantité <= minStock avec minStock > 0 ; `outOfStock=true` inclut zéro et les valeurs négatives. `dateFrom` et `dateTo` sont des instants ISO 8601 avec fuseau ; les bornes sont inclusives. Les dates d'expiration utilisent `YYYY-MM-DD`. Le filtre `status` des lots désigne VALID, EXPIRING_SOON ou EXPIRED ; la réponse expose séparément le statut de quantité ACTIVE/DEPLETED et `expiryStatus`.

## Stock négatif, lots et expiration

`allowNegativeStock` est lu depuis l'entreprise à chaque opération. Sa valeur par défaut reste false, dans le domaine entreprise et dans V2. V4 ne pose aucune contrainte `quantity >= 0` sur `stock_levels`.

- false : une opération conduisant à un niveau négatif est refusée avec INSUFFICIENT_STOCK.
- true : une sortie, un transfert ou un ajustement d'un produit sans lots peut produire un niveau négatif.
- Produits suivis par lots : les lots restent non négatifs et leur somme égale le niveau global. Même avec true, une sortie reste limitée aux quantités des lots utilisables. Cette restriction conserve simultanément la traçabilité physique et l'invariant de somme ; aucun lot fictif ni solde négatif sans lot n'est créé.

Les dates sont évaluées dans le fuseau de l'entreprise. Un lot est valable jusqu'à sa date d'expiration incluse ; il devient EXPIRED le lendemain. EXPIRING_SOON inclut les lots expirant entre aujourd'hui et aujourd'hui + expiryWarningDays, bornes incluses. Un lot sans date est VALID.

Le FEFO écarte les lots expirés ou vides, trie par date croissante, puis par numéro pour départager ; les lots sans date viennent après. Un lot explicitement choisi et expiré est refusé avec BATCH_EXPIRED pour une sortie ou un transfert. L'entrée de lots déjà expirés reste possible pour représenter une réception réelle ; ils ne deviennent pas consommables pour autant.

## Transaction, concurrence et documents

Les mutations passent par `StockOperations`, sous `@Transactional`. `TransferStockUseCase` délègue au même moteur. Les niveaux inexistants sont insérés à zéro avec ON CONFLICT DO NOTHING puis verrouillés via SELECT FOR UPDATE. Tous les niveaux d'un document sont verrouillés dans un ordre stable emplacement/produit. Les lots sont ensuite verrouillés. Les versions des niveaux et lots sont incrémentées à chaque sauvegarde.

Les deux faces d'un transfert, les lots, le document, les mouvements, les lignes persistées, la séquence et l'audit partagent la transaction. Toute erreur annule l'ensemble. Un transfert produit TRANSFER_OUT et TRANSFER_IN pour chaque allocation, avec le même document et numéro de référence ; les dates et le numéro du lot sont conservés à destination.

Les références internes sont exposées sous `number` : BE-2026-000001 et BS-2026-000001 (AJ pour ajustements et TR pour transferts). `reference` du document est la référence externe facultative fournie par l'appelant ; `reference` d'un mouvement est le numéro interne du document. Les compteurs utilisent `document_sequences` et `SequenceGenerator`, par entreprise, type et année dans le fuseau entreprise.

`stock_document_lines` matérialise les lignes, chacune reliée à un mouvement immuable. Le GET d'un document restitue toutes ses lignes, y compris au-delà de 100 mouvements. Il expose également l'auteur et son nom figé au moment de l'opération, les emplacements, dates, motifs, quantités avant/après et identifiants de produits/lots. La génération graphique PDF reste hors périmètre.

## Isolation, audit et erreurs

L'entreprise et les emplacements autorisés proviennent de l'utilisateur authentifié, jamais d'un paramètre libre. Une référence à un produit, lot, document, mouvement ou emplacement d'une autre entreprise retourne 404. Les listes sont restreintes aux emplacements autorisés. Un document de transfert n'est visible que si les deux emplacements sont autorisés ; ses mouvements restent visibles individuellement sur les emplacements accessibles.

Les opérations contrôlent les permissions du contrôleur et `LocationAccessPolicy` sur chaque emplacement concerné. Les gardes empêchent la suppression/changement de suivi d'un produit avec quantité non nulle, et la désactivation d'un emplacement avec quantité non nulle (valeurs négatives incluses).

`AuditRecorder.record()` reçoit STOCK_ENTRY, STOCK_EXIT, STOCK_ADJUSTMENT et STOCK_TRANSFER avec les mouvements complets (produit, emplacement, lot, quantité, avant/après, référence, motif). Les transferts ajoutent les emplacements source/destination aux métadonnées.

| Code | HTTP | Signification |
|---|---|---|
| QUANTITY_INVALID / QUANTITY_MUST_BE_WHOLE | 400 | Quantité non valide ; convention choisie pour INVALID_QUANTITY |
| INVALID_FILTER | 400 | Format de filtre/pagination incorrect |
| RESOURCE_NOT_FOUND | 404 | Ressource absente ou étrangère ; convention commune utilisée pour BATCH_NOT_FOUND |
| LOCATION_ACCESS_DENIED | 403 | Convention existante de LocationAccessPolicy pour LOCATION_NOT_ALLOWED |
| FORBIDDEN | 403 | Permission absente |
| INSUFFICIENT_STOCK | 422 | Solde ou lots utilisables insuffisants |
| BATCH_REQUIRED | 422 | Informations du lot obligatoires |
| BATCH_EXPIRED | 422 | Lot expiré explicitement demandé en sortie/transfert |
| INVALID_TRANSFER | 422 | Source identique à la destination |
| BATCH_DATES_MISMATCH | 422 | Métadonnées incompatibles d'un même lot |
| LOCATION_HAS_STOCK | 422 | Emplacement contenant encore du stock |
| STOCK_CONFLICT | 409 | Conflit de verrouillage ; réessayer l'opération complète |

La migration V4 active `stockhub_forbid_mutation()` sur mouvements, documents et lignes : UPDATE/DELETE sont interdits en base. Swagger expose les endpoints, modèles typés, enums, filtres, pagination, permissions et catégories d'erreurs.
