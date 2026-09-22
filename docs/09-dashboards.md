# StockHub — Dashboards (étape 6)

Contrat des endpoints de tableau de bord, formules des KPI, périodes, agrégations et permissions.
Toutes les figures sont calculées par PostgreSQL (`COUNT` / `SUM` / `GROUP BY` via
`NamedParameterJdbcTemplate`) : aucune statistique n'est calculée en Java à partir d'entités
chargées, et aucune valeur n'est inventée côté client (`Math.random`, séries vides et valeurs
hardcodées sont interdites).

> **Ventes non modélisées** : le module `sale` n'existe pas. Aucun KPI de revenu, de chiffre
> d'affaires, de panier moyen, de top ventes ou d'évolution des ventes n'est affiché — ni `0 €`,
> ni série vide : ce serait trompeur. Voir §7 « Contrat futur ventes ».

## 1. Architecture

Module Spring Modulith `dashboard/` (lecture seule, aucune écriture) :

```
dashboard/
├── application/
│   ├── dto/DashboardViews.java          # contrats de réponse (records)
│   ├── port/DashboardReadModel.java     # port de lecture + CompanyScope
│   └── usecase/
│       ├── CompanyDashboardQueries.java # portée entreprise, contrôle d'accès
│       └── PlatformDashboardQueries.java # santé plateforme (SUPER_ADMIN)
├── domain/model/DashboardPeriod.java    # périodes, granularité, validité
├── infrastructure/persistence/JdbcDashboardReadModel.java  # agrégations SQL
└── presentation/controller/
    ├── DashboardController.java         # /api/v1/dashboard/*
    └── PlatformDashboardController.java # /api/v1/platform/dashboard
```

Le read-model agregge les modules `company`, `user`, `product`, `warehouse`, `stock` et `audit`
**sans casser leurs frontières** : aucune logique métier n'est dupliquée, aucune entité d'un autre
module n'est écrite. Toute la logique statistique vit dans le use case + la query SQL ; les
contrôleurs ne font que lier les paramètres.

## 2. Endpoints

### 2.1 Dashboard entreprise — `GET /api/v1/dashboard/*`

Permission : `STOCK_VIEW` (ADMIN, MANAGER, MAGASINIER).

| Endpoint | Renvoie |
|---|---|
| `/summary` | KPI, état du stock, lots à surveiller, stock par emplacement, liste « à traiter » |
| `/stock-flow` | Séries entrées vs sorties agrégées par seau (hour/day/week/month), zero-fillées |
| `/recent-activity` | Dernières opérations de stock (1 bon = 1 ligne), du plus récent au plus ancien |
| `/top-movements` | Produits les plus mouvementés sur la période (pas des ventes) |

Paramètres communs :

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `period` | `TODAY`, `7D`, `30D`, `3M`, `1Y`, `CUSTOM` | `30D` |
| `from`, `to` | `YYYY-MM-DD` (fuseau de l'entreprise), requis si `period=CUSTOM`, `to` ≤ aujourd'hui | — |
| `locationId` | UUID d'un emplacement **actif de l'entreprise et autorisé pour l'utilisateur** | tous les emplacements visibles |
| `type` (`recent-activity` uniquement) | `ENTRY`, `EXIT`, `TRANSFER`, `ADJUSTMENT` | tous |
| `limit` | `recent-activity` 1–20 (défaut 8), `top-movements` 1–10 (défaut 5) | — |

Erreurs : `400 INVALID_PERIOD` / `INVALID_FILTER`, `403 FORBIDDEN` / `LOCATION_ACCESS_DENIED`,
`404 LOCATION_NOT_FOUND`, `401` sans token.

### 2.2 Dashboard plateforme — `GET /api/v1/platform/dashboard`

Permission : `PLATFORM_STATS_VIEW` (SUPER_ADMIN uniquement ; un utilisateur d'entreprise reçoit
`403`, et le SUPER_ADMIN ne dispose pas du dashboard entreprise — `403` aussi).

Paramètres : `period` / `from` / `to` (jours **UTC**, la plateforme spanne plusieurs fuseaux).
Renvoie `totals`, `activity` (nouvelles entreprises + opérations de stock par seau) et
`recentEvents` (derniers événements d'audit administratifs : création/désactivation d'entreprise,
création d'utilisateur, changement de rôle… ; connexions et éditions catalogue exclus).

## 3. Périodes et granularité

Presets (bornes incluses, finent aujourd'hui) : `TODAY` = aujourd'hui, `7D` = today − 6 jours,
`30D` = today − 29, `3M` = today − 3 mois + 1 jour, `1Y` = today − 1 an + 1 jour.
`CUSTOM` : `from`/`to` obligatoires, `to` non futur, durée ≤ 3 ans (`MAX_DAYS`).

Granularité des seaux de graphique (calculée par `DashboardPeriod`) :

| Durée | Seau | Buckets |
|---|---|---|
| 1 jour | `HOUR` | 24 |
| ≤ 31 jours | `DAY` | 7 / 30 |
| ≤ 183 jours | `WEEK` (lundi ISO) | — |
| > 183 jours | `MONTH` | 12–13 pour `1Y` |

L'API renvoie les séries **déjà agrégées et zero-fillées** (`generate_series` + `FILTER`) :
Angular ne télécharge jamais des milliers de mouvements pour dessiner un graphique.

## 4. Formules des KPI

### Valeur du stock

```
stockValue = Σ max(quantity, 0) × purchase_price     (over stock_levels in scope ⋈ products)
```

- Le `purchasePrice` vient du produit (« Quantités × prix d'achat », affiché sous le KPI).
- **Ce n'est ni un revenu ni un chiffre d'affaires** : c'est la valeur d'achat du stock en place.
- Calculée **seulement** si l'utilisateur porte `STOCK_VALUE_VIEW` (ADMIN, MANAGER) ; sinon la
  clause SQL produit `NULL::numeric` et le champ est **absent du JSON** (pas zéro, pas `0 €`).
  Le MAGASINIER ne reçoit donc jamais de donnée financière (pas de valeur masquée en CSS).

### État du stock (par niveau `stock_levels`, un produit-compte **par emplacement**)

| État | Condition SQL |
|---|---|
| Rupture (`out`) | `quantity <= 0` |
| Stock faible (`low`) | `quantity > 0 AND min_stock > 0 AND quantity <= min_stock` |
| Stock normal (`normal`) | `quantity > 0 AND NOT (min_stock > 0 AND quantity <= min_stock)` |
| Négatif (`negative`) | `quantity < 0` (sous-ensemble de la rupture, affiché à part) |

### Lots à surveiller (`batches`, `quantity > 0`)

| Compteur | Condition |
|---|---|
| Expirés | `expiration_date < today` |
| Expire < 7 jours | `expiration_date BETWEEN today AND today + 7` |
| Expire bientôt | `expiration_date BETWEEN today AND today + expiryWarningDays` (réglage entreprise, 30 j par défaut) |

`today` est calculée dans le **fuseau de l'entreprise**.

### Entrées / sorties

Définition des types de mouvements (`stock_movements.type`) :

| Catégorie | Types |
|---|---|
| **Entrées** | `ENTRY`, `RETURN_CUSTOMER` |
| **Sorties** | `EXIT`, `RETURN_SUPPLIER`, `SALE` |
| Transferts (comptés à part) | `TRANSFER_OUT`, `TRANSFER_IN` |
| Ajustements (comptés à part) | `ADJUSTMENT_POSITIVE`, `ADJUSTMENT_NEGATIVE` |

- **Une opération = un bon** (`stock_documents`) : une sortie FEFO étalée sur deux lots est une
  seule sortie (`count(DISTINCT document_id)`).
- Les cartes distinguent explicitement **nombre d'opérations** et **quantités mouvementées**
  (`entryQuantity` / `exitQuantity`) ; les quantités de produits hétérogènes ne sont jamais
  additionnées comme une valeur financière.
- Fenêtres : « aujourd'hui » (début→lendemain dans le fuseau entreprise) et « sur la période ».

### Produits les plus mouvementés

```
operations   = count(DISTINCT document_id) par produit sur la période
enteredQty   = Σ quantités des types d'entrée
exitedQty    = Σ quantités des types de sortie
tri          = operations DESC, Σ quantités DESC, nom
```

Libellé obligatoire : **« Produits les plus mouvementés »** (« Most moved products »), jamais
« Top ventes ».

### Stock par emplacement

Métrique : **valeur du stock** si `STOCK_VALUE_VIEW`, sinon **nombre de références en stock**
(`count(DISTINCT product_id) WHERE quantity > 0`) ; la métrique utilisée est affichée au-dessus
des barres. Le graphique n'est rendu que si l'entreprise a **plus d'un emplacement visible**
(`multiLocation && locationId == null`), sinon l'espace est utilisé pour un widget utile.

### Plateforme

`companies` / `activeCompanies` / `disabledCompanies` (toutes sociétés), `users` / `activeUsers`
(utilisateurs d'entreprise, non supprimés), `products`, `locations` (actifs),
`operationsToday` (bons de stock du jour UTC). Jours de l'activité en **UTC**.

## 5. Portée, permissions, isolation

Le backend détermine **les données accessibles** ; Angular ne fait que la présentation.

| Rôle | Dashboard | Valeur stock | Portée |
|---|---|---|---|
| SUPER_ADMIN | `platform` | — | Toute la plateforme (`PLATFORM_STATS_VIEW`) |
| ADMIN | `business` | oui | Entreprise, tous ses emplacements |
| MANAGER | `business` | oui | Entreprise, tous ses emplacements |
| MAGASINIER | `operations` | **non** (jamais calculée) | Ses **emplacements assignés uniquement** |
| VENDEUR | hors Angular (`/sales-app-only`) | — | — |

- **Isolation entreprise** : `company_id` présent dans **chaque** clause WHERE du read-model
  (testé : une entreprise ne voit aucun chiffre de l'autre, `locationId` d'autrui → 404).
- **Emplacements** : `LocationAccessPolicy` vérifie l'accès au `locationId` demandé ; sans ça le
  scope se restreint à `user.locationIds()`. Un transfert n'apparaît dans l'activité récente que
  si **les deux emplacements** sont visibles.
- Les listes « à traiter », l'état du stock et les lots suivent le même scope que les KPI.
- Côté Angular : `dashboardVariant(role, can)` choisit la mise en page (plat. / métier /
  opérationnelle) ; les actions rapides sont filtrées par permission réelle (`STOCK_ENTRY`,
  `STOCK_EXIT`, `STOCK_TRANSFER` si multi-sites, `PRODUCT_CREATE`, `BARCODE_PRINT`,
  `BATCH_MANAGE`, `STOCK_VIEW`).

## 6. Performance

- Une requête SQL par figure ; **zéro N+1**, aucune entité chargée puis agrégée en Java.
- Filtres `FILTER (WHERE …)` PostgreSQL, sous-requêtes scalaires pour les totaux plateforme.
- Index : `ix_stock_movements_company_time (company_id, created_at)` (migration `V5`) pour le
  graphique d'activité et les compteurs de période.
- Le JSON omet les champs financiers interdits (`@JsonInclude` via records nullables) : pas de
  donnée sensible jamais transportée puis masquée.

## 7. Contrat futur ventes (non implémenté)

Quand le module `sale` existera, les KPI suivront le même read-model :

```
GET /api/v1/dashboard/sales   (ou extension de /summary, NON nulle tant que sale n'existe pas)
  revenue        = Σ lignes de vente (nettes, devise de l'entreprise)
  salesCount     = count(ventes)
  averageBasket  = revenue / salesCount
  topProducts    = classement par quantity vendue
  byPeriod       = agrégats (buckets identiques à §3)
  bySeller       = groupé par vendeur (permission SALE_VIEW)
```

Jusque-là : **aucun champ « ventes » n'est renvoyé, aucune carte 0 € n'est affichée**.

## 8. Frontend (`features/dashboard/`, 3 couches)

- `data/` : `DashboardDataSource` (seul HTTP), modèles wire, `dashboard.mapper`
  (`stockValue` absent → `null`), `HttpDashboardRepository`.
- `domain/` : entités (`DashboardSummary`, `StockFlow`, `RecentOperation`, `TopMovements`,
  `PlatformDashboard`), `dashboardVariant`, `statusShares`, géométrie de graphe pure (`chart.ts` :
  `niceScale`, `bucketLabel`, `labelIndexes`).
- `presentation/` : `DashboardPage` (accueil, salutation + variante de rôle),
  `BusinessDashboard` (ADMIN/MANAGER), `OperationsDashboard` (MAGASINIER),
  `PlatformDashboardView` (SUPER_ADMIN), `DashboardFiltersBar` (période + emplacement),
  `QuickActions` (permissions), widgets avec 4 états (`loading` / `error` / `empty` / `success`)
  via `WidgetCard` + `WidgetState` (une erreur de graphe ne bloque pas les KPI ; `switchMap`
  annule les requêtes obsolètes ; les données précédentes restent affichées pendant un rechargement).

Graphiques : **bar chart SVG maison** (aucune dépendance supplémentaire), responsive
(`ResizeObserver`), accessible (`role="img"` + libellé, navigation clavier flèches, bascule
« Voir les données » en tableau), dark mode par tokens (`bg-series-*`, `fill-series-*`,
`stroke-chart-grid`). Filtres : un changement de période/emplacement recharge
summary + flow + top **en parallèle** (3 requêtes, pas une par carte) ; l'activité récente n'est
rechargée que si l'emplacement change.

i18n : toutes les chaînes dans `public/i18n/{fr,en}.json}` sous `dashboard.*` (titres, KPI,
filtres, légendes, types de mouvements, empty states, tooltips, actions d'audit traduites —
repli sur le code brut si inconnu).

Tests : `docs/10-etape6-validation.md`.
