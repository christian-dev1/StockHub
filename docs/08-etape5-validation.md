ÉTAPE 5 : VALIDÉE

## Résumé

Interface Angular de gestion du stock branchée sur le contrat de l'étape 4 (`06-stock-api.md`), sans modification du backend ni de Next.js : stock par emplacement, entrées, sorties, ajustements, transferts, mouvements, lots/expiration, bons (BE/BS/AJ/TR). Aucun endpoint deviné : chaque appel correspond à une ligne du contrat.

## Feature

`features/stock/` en trois couches :

- `data/` : `StockDataSource` (seul point HTTP), modèles wire, mappers (réponses → entités, commandes → corps de requête), `HttpStockRepository`.
- `domain/` : entités (états de stock, types de mouvements, statuts d'expiration, commandes), `StockRepository` abstrait, use cases (recherche stock/mouvements/lots/bons, opérations, références).
- `presentation/` : 6 pages, composants (sélecteur de produit, badges, lignes de bon, onglets d'opérations), formulaire d'opération, état en Signals (`StockContext`, `StockLookups`, `StockOperationStore`).

Les lots sont intégrés à `stock` (même module backend, mêmes recherches de noms) plutôt qu'une feature `batches` séparée.

Ajouts partagés : pipes `quantity` et `calendarDate`, `shared/utils/zoned-day` (bornes d'un jour dans le fuseau de l'entreprise). Correction d'un bug existant : le sélecteur « Par page » affichait 10 alors que la liste en montrait 20.

## Routes

| Route | Permission |
|---|---|
| `/stock` | STOCK_VIEW |
| `/stock/entry`, `/stock/exit`, `/stock/transfer`, `/stock/adjustment` | STOCK_ENTRY, STOCK_EXIT, STOCK_TRANSFER, STOCK_ADJUST |
| `/stock/movements` | STOCK_VIEW |
| `/stock/batches` | BATCH_MANAGE |
| `/stock/documents`, `/stock/documents/:id` | STOCK_VIEW |

Constantes dans `app.routes.ts`, endpoints dans `api.routes.ts` (sections `STOCK` et `BATCHES`), déclaration dans `app.router.ts` comme les autres features. Les opérations acceptent `?productId=&locationId=` (actions rapides depuis la liste).

## Permissions

Navigation « Stock » (Stock, Mouvements, Lots, Bons de stock) pour ADMIN, MANAGER et MAGASINIER. Les opérations proposées viennent des permissions de la session ; aucune règle métier dupliquée. MAGASINIER : entrée, sortie, transfert, lots ; pas d'ajustement (ni bouton ni route : `/stock/adjustment` → 403). VENDEUR : toujours exclu du back-office.

## Mono / multi-emplacements

Les emplacements viennent de la session (actifs et attribués). Avec un seul : pas de colonne ni de filtre d'emplacement, emplacement affiché en texte dans les formulaires, pas de transfert. Avec plusieurs : filtre, colonne, sélecteurs source/destination, transfert. L'emplacement principal est présélectionné.

## Opérations

- Entrée : champs de lot seulement si `batchTracked`, date d'expiration obligatoire seulement si `expiryTracked`. Stock actuel affiché.
- Sortie : stock disponible affiché ; avertissement non bloquant si la quantité le dépasse (le backend décide, y compris avec `allowNegativeStock`). Refus INSUFFICIENT_STOCK traduit avec « Disponible : X — demandé : Y ».
- Ajustement : Ajouter/Retirer, quantité, motif obligatoire, lot obligatoire pour un produit suivi par lots ; aperçu stock actuel / ajustement / stock après, puis confirmation. Le backend reçoit la quantité comptée (`countedQuantity`).
- Transfert : source ≠ destination (validation + échange automatique), stock source et destination affichés.
- Après succès : toast, bon (numéro cliquable), lignes avec lots et avant/après ; transfert : source et destination avant → après. Les quantités affichées sont relues depuis le backend.

## Mouvements, lots, expiration, FEFO, bons

- Mouvements : lecture seule ; filtres emplacement, produit, type, utilisateur, n° de bon, du/au (jours convertis en instants dans le fuseau de l'entreprise) ; tri serveur date/référence/type.
- Lots : numéro, produit, emplacement, quantité, fabrication, expiration, statut (Valide/Expire bientôt/Expiré, Épuisé). Filtres rapides « Expire bientôt » / « Expirés », expire avant/après, produit, statut. Lot sans date : pas de badge inutile.
- FEFO : aucune réimplémentation. Sorties et transferts ne demandent pas de lot ; le message « StockHub utilise en priorité les lots dont la date d'expiration est la plus proche. » est affiché, et les lots consommés apparaissent dans le résultat.
- Bons : liste filtrable et détail (en-tête, auteur, emplacements, motif, lignes). Pas de bouton PDF : aucun endpoint n'existe.

## Tests

- Angular unitaires : 177/177 (47 fichiers), dont 48 nouveaux : mappers, repository HTTP, use cases, entités, formulaire, `StockContext` (permissions, mono/multi-sites), messages d'erreur, jours zonés.
- Build PASS, lint PASS.
- Playwright : 149/149 (33 E2E + 116 smoke).
  - `stock-admin` : entrée +20 → 20, sortie 5 → 15, sortie 40 → INSUFFICIENT_STOCK traduit et 15 inchangé ; transfert 7 : A 20→13, B 5→12 ; FEFO : LOT-B (5, +200 j) puis LOT-A (3, +20 j), sortie 4 → LOT-A −3 (épuisé), LOT-B −1 (reste 4), vérifié dans le résultat et la page Lots ; ajustement avec aperçu et confirmation.
  - `stock-roles` : MAGASINIER à deux sites (entrée, sortie, transfert, lots, pas d'ajustement) ; MAGASINIER mono-site (pas de sélecteur, pas de transfert).
  - Smoke : 10 pages stock × 7 largeurs × clair/sombre × axe + FR/EN complets.
- Catalogue de l'étape 3 : ses E2E et smoke passent toujours.
- Backend non modifié.

## Problèmes ouverts

- Les réponses mouvements/lots ne contiennent pas le nom du produit ni du lot : Angular les récupère une fois par id (cache). Un champ `productName` côté API éviterait ces appels.
- Sans USER_VIEW (MAGASINIER), l'auteur d'un mouvement n'est nommé que s'il s'agit de l'utilisateur courant ; les bons, eux, portent toujours le nom.
- La liste de stock ne peut pas être triée par nom de produit (tris backend : quantité, dates).
- Les produits jamais entrés en stock n'apparaissent pas dans la liste (pas de niveau à zéro côté backend).
- Les données E2E s'accumulent dans la société de démo Alpha (emplacements et produits uniques par exécution).
