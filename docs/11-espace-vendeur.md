# Espace VENDEUR — module ventes et application de vente (23/09/2026)

Référence du premier lot de la phase 7 : le module `sale` (backend) et l'espace
VENDEUR de l'application de vente **Next.js** (`Frontend-Next`, port 3100),
conformément au plan d'architecture (§1 et §5 : « Frontend-Next — POS & mobile —
VENDEUR »).

## 1. Ce que le vendeur peut faire

| Menu | Écran | Permission(s) exigée(s) (UI **et** API) |
|---|---|---|
| Tableau de bord | CA du jour, ventes du jour, panier moyen, CA sur 7 jours, dernières ventes, produits les plus vendus — **uniquement ses chiffres** | `SALE_VIEW` |
| Produits | Liste en lecture seule : recherche nom / SKU / code-barres, filtre catégorie (sous-catégories incluses), « en stock uniquement », prix de vente, disponibilité au point de vente, fiche produit | `PRODUCT_VIEW` + `STOCK_VIEW` |
| Nouvelle vente | Recherche instantanée ou scan (code + Entrée), panier (+ / − / saisie / retrait), total très visible, nom du client optionnel, moyen de paiement, validation | `SALE_CREATE` + `PRODUCT_VIEW` + `STOCK_VIEW` |
| Mes ventes | Liste de **ses** ventes : recherche n° / nom du client, période, moyen de paiement ; détail = reçu imprimable | `SALE_VIEW` (+ `RECEIPT_REPRINT` pour imprimer) |
| Mon profil | Nom, e-mail, rôle, entreprise, emplacements (lecture seule), changer le mot de passe, se déconnecter | session |
| Préférences | Langue, thème (clair / sombre / système), point de vente si plusieurs, devise de l'entreprise **en lecture seule**, exemple de format des montants | session |

Rien d'administratif n'existe dans l'application de vente (utilisateurs, rôles,
entreprise, emplacements, ajustements, transferts…) : ces URL tapées à la main
mènent à la page 404, et une page dont la permission manque mène à la page 403.

## 2. Permissions

Aucune permission créée ni modifiée : celles du VENDEUR existent depuis V2.

| Concept demandé | Permission existante utilisée |
|---|---|
| VIEW_DASHBOARD (personnel) | `SALE_VIEW` (`GET /sales/me/summary`) |
| VIEW_PRODUCTS | `PRODUCT_VIEW` (+ `STOCK_VIEW` pour la disponibilité) |
| CREATE_SALE | `SALE_CREATE` |
| VIEW_OWN_SALES | `SALE_VIEW` + règle serveur « VENDEUR ⇒ ses ventes uniquement » |
| Réimprimer un reçu | `RECEIPT_REPRINT` |
| VIEW_OWN_PROFILE / UPDATE_OWN_PREFERENCES | session authentifiée (préférences stockées sur l'appareil) |
| VIEW_OWN_NOTIFICATIONS | — (module absent, voir §6) |

Refusés au VENDEUR (403, vérifié par tests) : `PRODUCT_CREATE/UPDATE/DELETE`,
`CATEGORY_MANAGE`, `STOCK_ENTRY/EXIT/ADJUST/TRANSFER`, `BATCH_MANAGE`,
`USER_*`, `COMPANY_VIEW/UPDATE`, `WAREHOUSE_CREATE/UPDATE`, `SUPPLIER_VIEW`,
`PRODUCT_IMPORT`, plateforme. `SALE_CANCEL` n'est pas accordé au VENDEUR.

## 3. API (module `sale`)

| Méthode | Chemin | Permission | Règles |
|---|---|---|---|
| POST | `/api/v1/sales` | `SALE_CREATE` | Corps : `locationId`, `customerName?`, `paymentMethod`, `lines[{productId, quantity}]`. **Aucun prix accepté** : prix repris du catalogue, total calculé par le serveur. En-tête `Idempotency-Key` optionnel (8–80 caractères `[A-Za-z0-9_-]`) : une nouvelle soumission renvoie la vente d'origine. 201 + `Location`. |
| GET | `/api/v1/sales` | `SALE_VIEW` | `search`, `from`, `to` (jours inclus, fuseau de l'entreprise), `paymentMethod`, `status`, `mine`, `page`, `size`, `sort`. **VENDEUR : toujours ses ventes**, quels que soient les paramètres. Autres rôles : ventes des emplacements autorisés, ou les leurs avec `mine=true`. |
| GET | `/api/v1/sales/{id}` | `SALE_VIEW` | 404 si la vente n'est pas visible (vente d'un autre vendeur, autre entreprise). |
| GET | `/api/v1/sales/me/summary?days=7` | `SALE_VIEW` | Chiffres du seul utilisateur connecté : jour, `days` derniers jours (1–90), top 5 produits, 5 dernières ventes. |
| GET | `/api/v1/sales/settings` | `SALE_CREATE` | Devise, règle de stock négatif, moyens de paiement (source unique : enum `PaymentMethod`). |
| GET | `/api/v1/sales/catalogue?locationId=` | `PRODUCT_VIEW` + `STOCK_VIEW` | Produits actifs, prix de vente, quantité vendable (lots non expirés seulement), **sans prix d'achat**. `search` (nom/SKU contient, code-barres exact, correspondances exactes en premier), `categoryId`, `inStock`. 403 `LOCATION_ACCESS_DENIED` si l'emplacement n'est pas attribué. |
| GET | `/api/v1/sales/catalogue/{productId}?locationId=` | idem | Fiche produit vendable. |

Il n'existe **aucun** endpoint de modification, suppression, annulation ou
remboursement de vente (405/404) ; les tables `sales` et `sale_lines` refusent
`UPDATE` et `DELETE` (trigger).

### Validation d'une vente (serveur)

Dans une seule transaction : panier non vide (≤ 100 lignes, produit unique par
ligne), quantités > 0 à 3 décimales au plus (entières pour UNIT/BOX/PACK),
moyen de paiement connu, nom du client ≤ 120 caractères (vide ⇒ `null`),
produits actifs de l'entreprise, emplacement actif **et attribué** au vendeur,
numéro `VT-AAAA-NNNNNN` (séquence sans trou par entreprise et par année),
sortie de stock par le moteur existant (verrous ordonnés, FEFO, lots expirés
exclus, stock négatif interdit sauf paramètre entreprise), bon de sortie `BS`
avec la vente en référence, mouvements de type `SALE`, audit `SALE_CREATED`.
Tout échec annule l'ensemble (aucune vente, aucun mouvement).

Codes d'erreur : `SALE_EMPTY`, `SALE_TOO_MANY_LINES`, `SALE_DUPLICATE_PRODUCT`,
`QUANTITY_INVALID`, `QUANTITY_MUST_BE_WHOLE`, `SALE_PAYMENT_METHOD_INVALID`,
`LOCATION_REQUIRED`, `FIELD_TOO_LONG` (400) · `LOCATION_ACCESS_DENIED` (403) ·
404 produit/emplacement inconnu · `IDEMPOTENCY_KEY_REUSED` (409) ·
`INSUFFICIENT_STOCK`, `PRODUCT_INACTIVE`, `BATCH_EXPIRED` (422).

## 4. Données (migration V6)

- `sales` : entreprise, emplacement, numéro, statut (`COMPLETED`), vendeur +
  nom du vendeur figé, **`customer_name` texte optionnel** (pas de table client),
  moyen de paiement, devise figée, total, bon de sortie, clé d'idempotence, date.
- `sale_lines` : position, produit, nom / SKU / unité / prix figés, quantité, total de ligne.
- Index : (entreprise, vendeur, date), (entreprise, emplacement, date), idempotence unique.

## 5. Frontend Next

Features en 3 couches (`data` / `domain` / `presentation`) : `catalogue`,
`sales`, `account`. Garde de page `RequirePermissions` (403), menu filtré par
permission (`core/layout/navigation.ts`). Panier conservé par utilisateur dans
`sessionStorage` (survit à un rechargement, disparaît avec l'onglet). Reçu :
impression navigateur (`window.print` + CSS `@media print`, largeur ticket 76 mm),
sans bibliothèque PDF. Le vendeur ne voit plus la carte « État de la plateforme ».

## 6. Non présent (non inventé)

- **Notifications** : pas de module ⇒ pas de menu.
- **Taxes / remises** : aucune règle ni permission ⇒ non affichées (message « aucune taxe ni remise configurée »).
- **Annulation / remboursement** : aucune logique ⇒ non proposés ; `SALE_CANCEL` n'est pas accordé au VENDEUR.
- **Modification de son profil** (nom, téléphone, avatar) : aucun endpoint « soi-même » ⇒ lecture seule.
- **Préférences côté serveur** (format de date, notifications, imprimante) : aucune table ⇒ préférences locales à l'appareil.
- **Rendu de monnaie** (montant reçu) : prévu par le plan, non demandé ici.

## 7. Décisions métier ouvertes

1. Le back-office Angular est ouvert au VENDEUR depuis le commit `ea22a0b`
   (garde `backOfficeGuard` neutralisée, page `/sales-app-only` supprimée) : le
   vendeur y voit notamment Stock, Mouvements et Bons en lecture. À trancher.
2. `GET /products` (back-office) renvoie le **prix d'achat** à tout porteur de
   `PRODUCT_VIEW`, VENDEUR compris. L'application de vente utilise le catalogue
   de vente (sans prix d'achat), mais l'API reste lisible.
3. `STOCK_VIEW` donne au VENDEUR la lecture des mouvements et bons de stock
   (`/stock-movements`, `/stock-documents`, `/dashboard/*`), limitée à ses
   emplacements. La matrice indique « disponibilité » seulement.
