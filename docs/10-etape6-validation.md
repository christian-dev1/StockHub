# ÉTAPE 6 DASHBOARDS : VALIDÉE

## Résumé

Remplacement du dashboard « trop vide » par quatre tableaux de bord métier réellement différents
(SUPER_ADMIN, ADMIN, MANAGER, MAGASINIER), adossés à un read-model SQL dédié. **Aucune donnée
fictive** : chaque chiffre affiché vient de PostgreSQL via `GET /api/v1/dashboard/*` et
`GET /api/v1/platform/dashboard`. Le module `sale` n'existe pas : aucun KPI de vente/revenu n'est
affiché (ni `0 €`, ni série vide). Next.js non touché.

## Backend dashboard

Module Modulith `dashboard/` en lecture seule (`application` / `domain` / `infrastructure` /
`presentation`), agrégats 100 % SQL (`FILTER`, `GROUP BY`, `generate_series`), une requête par
figure, zéro N+1, aucune entité chargée puis sommée en Java. Contrat détaillé :
`docs/09-dashboards.md`.

### Endpoints ajoutés

| Endpoint | Permission | Contenu |
|---|---|---|
| `GET /api/v1/dashboard/summary` | `STOCK_VIEW` | KPI, état du stock, lots, stock par emplacement, « à traiter » |
| `GET /api/v1/dashboard/stock-flow` | `STOCK_VIEW` | Entrées vs sorties agrégées (HOUR/DAY/WEEK/MONTH), zero-fillées |
| `GET /api/v1/dashboard/recent-activity` | `STOCK_VIEW` | Derniers bons (filtre `type`, `limit`, `locationId`) |
| `GET /api/v1/dashboard/top-movements` | `STOCK_VIEW` | Produits les plus mouvementés |
| `GET /api/v1/platform/dashboard` | `PLATFORM_STATS_VIEW` | Totaux plateforme, activité par seau (UTC), événements d'audit |

Paramètres : `period` (TODAY/7D/30D/3M/1Y/CUSTOM + `from`/`to`), `locationId`. Migration `V5` :
permission `STOCK_VALUE_VIEW` (ADMIN, MANAGER) + index
`ix_stock_movements_company_time (company_id, created_at)`.

### KPI disponibles

Entreprises (total/actives/désactivées), utilisateurs (total/actifs), produits, emplacements,
opérations du jour (plateforme) — produits actifs, références en stock, quantité totale, valeur du
stock, état du stock (normal/faible/rupture/négatif), lots (expirés / < 7 j / < `expiryWarningDays`),
entrées et sorties (aujourd'hui + période, en opérations et en quantités), stock par emplacement,
« à traiter » (ruptures, stocks faibles, lots expirés et bientôt expirés), activité récente,
produits les plus mouvementés.

### Formules utilisées

- **Valeur du stock** = `Σ max(quantity, 0) × purchase_price` sur les `stock_levels` du périmètre
  (« Quantités × prix d'achat » affiché sous le KPI) — calculée **uniquement** avec
  `STOCK_VALUE_VIEW`, sinon champ **absent** du JSON.
- **Stock faible** = `quantity > 0 AND min_stock > 0 AND quantity <= min_stock` ; **rupture** =
  `quantity <= 0` ; comptés par niveau (produit × emplacement).
- **Lots** : expirés `expiration_date < today`, < 7 j et < `expiryWarningDays` (fuseau entreprise).
- **Entrées** = (`ENTRY`,`RETURN_CUSTOMER`) ; **sorties** = (`EXIT`,`RETURN_SUPPLIER`,`SALE`) ;
  transferts et ajustements comptés à part. **1 opération = 1 bon**
  (`count(DISTINCT document_id)`), pas 1 ligne de mouvement.
- **Produit le plus mouvementé** = `count(DISTINCT document_id)` par produit sur la période.

## SUPER_ADMIN dashboard

Cartes : entreprises (actives · désactivées), utilisateurs (actifs), produits (+ emplacements
actifs), opérations de stock du jour (mention UTC). Graphique plateforme à bascule
« Nouvelles entreprises » / « Opérations de stock » sur 7 j / 30 j / 3 mois / 1 an (jours UTC).
Timeline « Activité administrative récente » (création/désactivation d'entreprise, création
d'utilisateur, changement de rôle… traduite FR/EN, avec entreprise et acteur). Carte santé
système (« Vérifié à » en fuseau entreprise). Aucun filtre d'emplacement.

## ADMIN dashboard

Header salutation + filtres période/emplacement ; 6 KPI (valeur du stock, produits actifs,
quantité totale, stock faible, ruptures, lots expirant bientôt + indice expirés) ; rangée
d'activité (entrées/sorties aujourd'hui et sur la période, en opérations + unités) ; grand
graphique **Entrées vs Sorties** ; « État du stock » (barre + légende cliquables vers la liste
filtrée) ; « Stock par emplacement » (multi-sites uniquement, métrique indiquée : valeur ou
références — masqué en mono-site) ; « Lots à surveiller » ; « Produits les plus mouvementés » ;
« À traiter » (avec actions rapides selon permissions) ; « Activités de stock récentes » (liens
vers les bons).

## MANAGER dashboard

Même socle métier que l'ADMIN (valeur stock, KPI, entrées/sorties, graphique, état du stock,
emplacements, lots, top mouvementés, activité) **sans** aucun élément d'administration : pas de
section Entreprises dans la navigation, accès `/platform/companies` → 403. Actions rapides selon
ses permissions réelles.

## MAGASINIER dashboard

Dashboard **opérationnel** distinct (pas une copie de l'ADMIN) : stock faible, ruptures, lots
expirant bientôt, mouvements aujourd'hui ; « À traiter » + activité récente avec onglets
Tout/Entrées/Sorties/Transferts ; « Lots à surveiller » ; actions rapides (entrée, sortie,
transfert si multi-sites, lots, stock) ; **aucune carte financière** (le backend ne calcule pas la
valeur : `scope.financial=false`, champ absent) ; mono-site : filtre emplacement masqué.

## Graphiques

- **Entrées / sorties** : barres groupées SVG maison (aucune dépendance ajoutée), 2 séries,
  agrégation journalière (≤ 31 j), hebdo (≤ 183 j), mensuelle (au-delà), totals + tooltip +
  bascule « Voir les données » en tableau.
- **État du stock** : barre proportionnelle + légende à pourcentages (normal/faible/rupture).
- **Stock par emplacement** : barres horizontales, mono-site → widget non rendu.
- **Plateforme** : nouvelle entreprises / opérations (bascule métrique).
- Tous : responsive (`ResizeObserver`), dark/light (tokens `series-*`), accessibles
  (`role="img"` + résumé, clavier ←/→, tableau équivalent, axe WCAG 2.2 AA au smoke).

## Lots / activités

« Lots à surveiller » : compteurs Expirés / < 7 jours / < `expiryWarningDays` + liste (produit,
lot, expiration, quantité, emplacement) et lien « Voir tous les lots » (`?status=`). Activité
récente : type, produit, quantité signée, emplacement (→ destination), auteur, heure (fuseau
entreprise), n° de bon cliquable.

## Permissions / isolation

Backend : `@PreAuthorize` (`STOCK_VIEW` / `STOCK_VALUE_VIEW` / `PLATFORM_STATS_VIEW`),
`LocationAccessPolicy` sur `locationId` (403 `LOCATION_ACCESS_DENIED` sinon), `company_id` dans
chaque clause SQL, transferts visibles seulement si les deux emplacements le sont, valeurs
financières jamais produites sans la permission (testées : champ absent du JSON). Frontend :
`dashboardVariant(role, can)` choisit la mise en page ; actions rapides filtrées par permissions ;
VENDEUR toujours hors back-office.

## Performance

Agrégats PostgreSQL (`COUNT/SUM/GROUP BY/FILTER`), une requête par widget, `generate_series`
côté serveur (Angular ne télécharge jamais les mouvements bruts pour un graphe), index
`(company_id, created_at)`, comptes plateforme en sous-requêtes scalaires. Aucun problème N+1.

## Tests backend — 243/243 (0 échec, 0 ignoré)

- `DashboardIntegrationTest` (9) : dataset **déterministe** dans une société fraîche
  (A : +20/−5 + transfert 3 ; B : +10/−2 ; C : +4/−4 ; D : lots X+3 j/Y expiré/Z+20 j) — toutes les
  valeurs calculées à la main : valeur stock 2020 = 15×100 + 8×50 + 6×20, quantité 29, état
  2/2/1, lots 1/1/2, entrées 6 / sorties 3 / transferts 1, quantités 40/11, emplacements
  1600/420, filtre `locationId` (9, 420, entrées 4), zero-fill du graphique (7 jours / 24 h /
  12-13 mois), activité récente et top, MAGASINIER sans valeur financière + emplacements interdits,
  MANAGER avec valeur, isolation inter-entreprises, erreurs (INVALID_PERIOD/FILTER, 401),
  plateforme (comptes SQL ↔ API, exclusion LOGIN_*, 403 croisés).
- `DashboardPeriodTest` (4) : presets, granularités, bornes CUSTOM, rejets.
- Les 230 autres tests (sécurité, catalogue, stock, isolation, Modulith, ArchUnit…) restent verts.

## Tests Angular — 217/217 (51 fichiers, 40 nouveaux)

- `dashboard.mapper.spec.ts` : paramètres (preset/custom/incomplet/emplacement), `stockValue`
  présent/null, compteurs absents → 0, listes vides, dates `platform`/récent.
- `company-dashboard.store.spec.ts` : loading→success, rechargement groupé summary+flow+top au
  changement de période (sans l'activité), rechargement de l'activité au changement d'emplacement,
  CUSTOM incomplet différé puis envoyé, purge des jours en quittant CUSTOM, **erreur sans perte
  des données précédentes**, onglets `type`, variante sans top.
- `dashboard.spec.ts` (entités) : `dashboardVariant` par rôle × permission, `statusShares`
  (vide, arrondis, négatifs).
- `chart.spec.ts` : `niceScale` (ticks ronds, couvre le max), `wallClock` (décalage navigateur
  impossible), `bucketLabel` (FR/EN, court/long), `labelIndexes` (dernier label toujours présent).
- + mappers santé, stores, repositories des étapes antérieures.
- `format:check` PASS, `lint` PASS, `build` PASS.

## E2E — 153/153 (37 E2E + 116 smoke), Playwright

Nouveau `e2e/tests/dashboard.spec.ts` (4), fixtures propres dans une emplacement dédié pour
être **déterministe** malgré les tests parallèles :

- **ADMIN** : KPI = API (valeur 1000 = 5×100 + 10×50, quantité 15, faible 1, rupture 0, entrées
  du jour 2) ; totaux du graphique = somme des seaux API (2/0) ; filtre emplacement ; période
  « Aujourd'hui » ; activité récente contient la fixture ; clic « Stock faible » →
  `/stock?state=LOW` ; aucune clé i18n brute.
- **MANAGER** : valeur du stock 1000 réelle, widgets métier visibles, aucune entrée de
  navigation « Entreprises », `/platform/companies` → 403.
- **MAGASINIER** (compte fraîchement créé, assigné à 1 emplacement) : `scope.financial=false`,
  aucun champ `stockValue` côté API **ni** carte côté UI, mono-site sans sélecteur, KPI
  opérationnels exacts (faible 1, rupture 0, mouvements du jour 2), actions entrée/sortie
  visibles et « Nouveau produit » absent, onglets d'activité, « à traiter » contient la fixture.
- **SUPER_ADMIN** : entreprises de l'API = carte, utilisateurs ≥ API, graphique et timeline
  réels, filtre « 7 jours », aucun KPI financier, i18n complet.

Régression : `angular-session` (fuseau entreprise vérifié sur l'activité récente), `stock-roles`,
`angular-roles`, catalogue, stock, thème/états — tout vert. Smoke : 116 tests (29 pages ×
7 largeurs [320→1440] × clair/sombre + FR/EN + axe WCAG 2.2 AA), **dashboard inclus**.

Corrections faites au passage : overflow horizontal du dashboard à 320 px (labels de graphe
clamped + `truncate` des libellés KPI), nav qualifiée « Navigation principale » dans
`stock-roles` (le dashboard a désormais un second `<nav>` : actions rapides).

## Responsive / Dark mode / i18n / Accessibilité

- **Responsive** : smoke 320/375/430/768/1024/1280/1440 sans scroll horizontal ni cible < 24 px.
- **Dark mode** : smoke clair + sombre sur le dashboard (axes, grilles, séries, tooltips via
  tokens ; système survivant au rechargement testé ailleurs).
- **i18n** : smoke FR + EN « fully translated » (0 clé brute, 0 phrase étrangère) ; toutes les
  chaînes du dashboard dans `fr.json`/`en.json`.
- **Accessibilité** : axe (wcag2a/aa, 21a/aa, 22aa) sans violation sur le dashboard en 375 et
  1280 ; graphiques : `role="img"` + résumé, navigation clavier, tableau de données équivalent,
  légendes avec pastilles + icônes (jamais couleur seule).

## KPI volontairement différés (module `sale` inexistant)

- revenus / chiffre d'affaires — **non affichés**
- nombre de ventes, panier moyen — **non affichés**
- top ventes / produits les plus vendus — remplacés par « Produits les plus mouvementés »
- évolution des ventes, ventes par période / par vendeur — contrat documenté (`09-dashboards.md`
  §7) mais aucun champ, aucune carte `0 €`, aucune série vide.

## Problèmes ouverts

- Budget de bundle initial : 802,26 kB / 800 kB (warning préexistant, +0 depuis l'étape 5 ;
  serait à splitter si une page le mérite).
- Un test unitaire Angular a été observé flaky une fois sous charge parallèle
  (`error-status-page`, timeout 5 s) — vert sur les exécutions suivantes.
- Le filtre de période ne s'applique pas à l'activité récente (volontaire : liste « derniers
  bons ») — clarifiable dans l'UI si besoin.
- Les données de démo et des E2E s'accumulent dans Alpha (produits/emplacements uniques par
  exécution) — déjà noté à l'étape 5.
