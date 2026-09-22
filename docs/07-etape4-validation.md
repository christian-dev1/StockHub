ÉTAPE 4 : VALIDÉE

## Résumé

Module backend stock implémenté : entrées, sorties, ajustements, transferts atomiques, lots, expiration, FEFO, bons persistés, audit, filtres, sécurité et concurrence PostgreSQL. Le scénario API +20 dans A, transfert 7 vers B, sortie 2 dans B produit A=13, B=5, total=18. La sortie de 20 depuis A est refusée lorsque le stock négatif est désactivé. Une sortie contrôlée avec le paramètre activé produit -2.

## État avant intervention

Le répertoire stock contenait une ébauche non suivie par Git : 21 fichiers Java de domaine/contrats/contexte, et une migration V4 non suivie. Aucun adaptateur de persistance, moteur complet, contrôleur REST ni test stock n'était présent. Le backend possédait déjà les paramètres entreprise, permissions, politiques d'accès, gardes d'extension, séquences, audit et migrations V1–V3.

## Fichiers ajoutés

Par rapport à cet état de départ : 14 fichiers Java de production, 3 classes de tests et 2 documents. L'inventaire complet des fichiers stock livrés (35 Java de production, 3 de tests), tous nouveaux au sens Git, figure en annexe. Les ajouts fonctionnels principaux sont :

- `StockOperations`, les quatre use cases et `StockQueries`.
- `StockGuards` et `StockSearch`.
- `JdbcStockRepository` et `JdbcStockSearch`.
- `StockDocumentLine`.
- `StockController`, `StockExceptionHandler`, `StockResponses`.
- `StockDomainTest`, `StockOperationsTest`, `StockIntegrationTest`.
- `docs/06-stock-api.md` et ce rapport.

## Fichiers modifiés

L'ébauche existante a été complétée : validations de quantités dans `StockLevel` et `Batch`, réponses 404 dans `StockContext`, ajout des lignes persistées à V4. Le formatage Java du module a été harmonisé. Aucun fichier préalablement suivi par Git n'a été modifié. Aucune modification des frontends ni des migrations V1, V2, V3.

## Migration V4

`Backend/src/main/resources/db/migration/V4__stock.sql` crée les cinq tables : stock_levels, batches, stock_movements, stock_documents, stock_document_lines. Elle ajoute FK, index, unicités, versions pour niveaux/lots, horodatages et triggers d'immutabilité. Pas de CHECK interdisant les niveaux négatifs ; lots non négatifs et mouvements strictement positifs. Flyway a exécuté V4 dans PostgreSQL Testcontainers et sur la pile Docker locale reconstruite.

## Modèle métier

`StockLevel` porte la quantité par entreprise/produit/emplacement ; `Batch` porte le lot et ses dates ; `StockMovement` est un enregistrement immuable avec avant/après ; `StockDocument` et `StockDocumentLine` constituent le bon persistant. Aucun stock n'est stocké dans Product.

## Use cases

`EnterStockUseCase`, `ExitStockUseCase`, `AdjustStockUseCase` et `TransferStockUseCase` utilisent un moteur transactionnel commun. Un ajustement fournit une quantité cible absolue et un motif obligatoire ; le moteur calcule le delta. Les quantités des mouvements sont strictement positives, avec trois décimales maximum et unités discrètes respectées.

## Endpoints

Les 12 endpoints demandés sont présents. `/stocks/{id}` utilise le nom de paramètre habituel `{id}` pour l'identifiant produit, sans modifier l'URI réelle. Les POST répondent 201. Pagination conforme au backend (`content`, `page`, `size`, `totalElements`, `totalPages`). Tous les filtres demandés sont disponibles. Le champ catalogue existant `minStock` correspond à `minimumStock` et gouverne `lowStock`.

Le détail des requêtes, réponses, filtres, tris et conventions se trouve dans [06-stock-api.md](06-stock-api.md).

## Permissions

Matrice existante conservée, sans nouvelle nomenclature :

| Rôle | VIEW | ENTRY | EXIT | ADJUST | TRANSFER | BATCH |
|---|---|---|---|---|---|---|
| ADMIN | Oui | Oui | Oui | Oui | Oui | Oui |
| MANAGER | Oui | Oui | Oui | Oui | Oui | Oui |
| MAGASINIER | Oui | Oui | Oui | Non | Oui | Oui |
| VENDEUR | Oui | Non | Non | Non | Non | Non |

BATCH_MANAGE était déjà accordé au MANAGER dans V2 ; aucune modification de cette matrice.

## allowNegativeStock

Le paramètre entreprise est lu pour chaque opération, défaut false conservé. false entraîne INSUFFICIENT_STOCK avant toute persistance définitive d'une quantité négative. true autorise un solde négatif pour les produits sans suivi par lots, testé à -2.

Pour un produit suivi par lots, les lots restent non négatifs et leur somme égale le niveau global : les sorties sont donc limitées aux lots utilisables même avec true. Cette décision conserve les invariants demandés sans créer de lot fictif. Elle est documentée et testée.

## Lots / expiration

Une entrée suivie par lots crée ou alimente un lot. Une sortie consomme des lots ; un produit sans lots ne requiert aucun batch. Expiration obligatoire si expiryTracked, lequel implique batchTracked. Les vues exposent VALID, EXPIRING_SOON et EXPIRED selon expiryWarningDays et le fuseau entreprise. La date d'expiration est incluse dans la validité ; le lot est expiré le lendemain. BATCH_EXPIRED bloque un lot imposé lors d'une sortie/transfert normal.

## FEFO

Lots non expirés et non vides seulement, ordre d'expiration croissant, répartition multi-lots. Le test 3/5/10 avec sortie 7 vérifie 0/1/10 et deux mouvements. Les lots expirés restent exclus. Pour les lots sans date, le numéro départage les lots ; il ne s'agit pas d'une garantie FIFO de réception.

## Transferts

Deux mouvements liés TRANSFER_OUT/TRANSFER_IN par allocation, une référence commune, vérifications des deux emplacements et verrouillage stable. Le test 20/5 avec transfert 7 vérifie 13/12. Un trigger PostgreSQL injecte une erreur lors de la mise à jour de la destination : le test vérifie le rollback intégral des niveaux et l'absence de document de transfert. Les transferts multi-lots conservent numéro, expiration et fabrication.

## Bons entrée/sortie

Séquences existantes par entreprise/type/année : BE et BS, également AJ/TR pour ajustements/transferts. `number` est la référence interne ; `reference` du document est la référence externe optionnelle. Les mouvements portent le numéro interne comme référence. Numérotation BS consécutive et changement d'année BE testés. Les lignes persistées contiennent produit, lot facultatif, quantité et soldes avant/après ; le détail expose les lignes complètes, emplacements, auteur, nom de l'auteur au moment de l'opération, date et motif. Génération graphique PDF non incluse, conformément au périmètre autorisé.

## Audit

AuditRecorder.record() est utilisé dans la transaction pour STOCK_ENTRY, STOCK_EXIT, STOCK_ADJUSTMENT et STOCK_TRANSFER. Les mouvements complets fournissent produit, emplacement, lot, quantité, avant/après, référence et motif. Les transferts ajoutent les emplacements source et destination aux métadonnées. Audit d'entrée et de transfert vérifié en intégration.

## Isolation entreprise

L'entreprise vient du contexte authentifié. Tests Company A/B sur niveaux, mouvements, lots, documents et les quatre opérations. Ressources étrangères retournées en 404, listes cloisonnées. Le solde de l'entreprise propriétaire ne change pas après les tentatives étrangères.

## Restriction emplacement

LocationAccessPolicy et les emplacements du contexte utilisateur sont réutilisés. Les lectures filtrent le périmètre. Entrée, sortie, ajustement et transfert refusent un emplacement non autorisé. Un transfert contrôle source ET destination. Le détail d'un document de transfert requiert l'accès aux deux.

ProductUsageGuard bloque suppression et changement de suivi lorsqu'un stock non nul existe ; LocationDeactivationGuard retourne LOCATION_HAS_STOCK sur un emplacement contenant encore du stock. Tests réalisés sur un emplacement secondaire pour vérifier réellement ce garde.

## Concurrence

Verrouillage pessimiste PostgreSQL, insertion du niveau manquant avec ON CONFLICT DO NOTHING puis SELECT FOR UPDATE ; ordre stable des niveaux et lots. Versions incrémentées lors des écritures. Une erreur de verrouillage reçoit STOCK_CONFLICT (409), réessayable par l'appelant.

Quatre tests avec deux threads, barrière de démarrage et transactions HTTP indépendantes : deux sorties, deux entrées, entrée+sortie, deux transferts. Sur stock=1, deux sorties donnent un succès, un refus, stock final=0. Aucun test concurrent n'est remplacé par deux appels séquentiels.

## Swagger

Endpoints annotés avec permissions, catégories d'erreurs, filtres explicites, pagination et modèles de réponse typés/enums. Le test lit réellement `/v3/api-docs`. Les conventions existantes sont conservées : QUANTITY_INVALID/QUANTITY_MUST_BE_WHOLE pour quantité invalide, RESOURCE_NOT_FOUND pour lot absent/étranger, LOCATION_ACCESS_DENIED pour emplacement interdit. STOCK_CONFLICT est spécifique aux conflits de verrouillage du stock.

## Tests

Validation du 22 septembre 2026, sur les sources finales :

| Catégorie | Résultat | Nombres exacts |
|---|---|---|
| Backend tests | PASS | 230 tests, 0 échec, 0 erreur, 0 ignoré ; 39 classes |
| Architecture | PASS | 7 règles ArchUnit + 2 tests Spring Modulith |
| Security stock | PASS | 6 tests : 4 rôles × 6 opérations, isolation entreprise, restriction emplacement |
| Integration | PASS | 131 tests PostgreSQL Testcontainers, dont 20 stock |
| Concurrency | PASS | 4 tests simultanés réels, inclus dans les 20 intégrations stock |
| E2E non-régression | PASS après relance ciblée | 103 scénarios : 101 succès initiaux, puis 2/2 succès à la relance |
| Docker | PASS | 4/4 services running/healthy : backend, PostgreSQL, Angular, Next |

Le module stock ajoute 40 tests (20 unitaires + 20 intégrations). Les 190 tests préexistants continuent de passer. `./mvnw verify` termine par BUILD SUCCESS en 2 min 39 s ; Flyway applique les quatre migrations. La reconstruction Docker du backend est réussie et V4 est également appliquée sur la pile locale.

Commandes exécutées :

```text
./mvnw verify
docker compose up -d --build --wait backend
npm run test:all
npm run test:all -- --last-failed
docker compose ps
```

La première tentative E2E dans le bac à sable ne pouvait pas lancer Chromium ; l'exécution réelle a été relancée hors bac à sable avec autorisation. Lors de celle-ci, deux scénarios smoke (« New product », « Next home », thème clair) ont dépassé le délai de connexion de 10 secondes, pendant une exécution simultanée de Maven. Ils passent tous deux lors de la relance ciblée après Maven, sans modification du code ou des délais. Les 103 scénarios ont donc chacun passé ; la première exécution complète n'était pas intégralement verte.

Preuves : rapports XML `Backend/target/surefire-reports/TEST-*.xml`, `/tmp/stock-verify-final.log`, `/tmp/stock-docker.log`, `/tmp/stock-e2e-final.log` et `/tmp/stock-e2e-retry.log`. Les fichiers `/tmp` sont temporaires.

Les catégories sont des sous-ensembles et ne s'additionnent pas. Les tests de rollback et d'immutabilité provoquent volontairement des erreurs PostgreSQL dans les journaux ; leurs assertions passent.

## Problèmes ouverts

Aucun blocage fonctionnel identifié pour le backend stock. Deux délais de connexion E2E ont été observés puis non reproduits à la relance ; leur cause précise n'a pas été isolée. Cette intermittence de test est conservée dans le bilan et ne doit pas être présentée comme un premier passage 103/103.

Limites délibérées : stock négatif uniquement pour produits sans lots afin de préserver la somme des lots non négatifs ; génération graphique PDF non réalisée ; aucune interface stock ajoutée.

## Definition of Done

- [x] Backend build PASS
- [x] Tous les tests backend PASS ; E2E PASS après relance ciblée
- [x] Flyway PASS
- [x] ArchUnit PASS
- [x] Spring Modulith PASS
- [x] StockLevel fonctionnel
- [x] StockMovement immuable (UPDATE et DELETE testés directement sur PostgreSQL)
- [x] Entry PASS
- [x] Exit PASS
- [x] Adjustments PASS
- [x] allowNegativeStock=false PASS
- [x] allowNegativeStock=true PASS
- [x] Batches PASS
- [x] Expiration PASS
- [x] FEFO PASS
- [x] Multi-batch PASS
- [x] Transfer PASS
- [x] Transfer rollback PASS
- [x] Batch transfer PASS
- [x] BE/BS numbering PASS
- [x] Company isolation PASS
- [x] Location restriction PASS
- [x] Permissions PASS
- [x] Concurrency PASS
- [x] Audit PASS
- [x] ProductUsageGuard PASS
- [x] LocationDeactivationGuard PASS
- [x] Swagger PASS
- [x] Ancienne suite de tests toujours PASS

## Inventaire des fichiers Java livrés

- `Backend/src/main/java/com/stockhub/stock/application/command/StockCommands.java`
- `Backend/src/main/java/com/stockhub/stock/application/dto/StockViews.java`
- `Backend/src/main/java/com/stockhub/stock/application/port/StockDocumentRenderer.java`
- `Backend/src/main/java/com/stockhub/stock/application/port/StockReadRepository.java`
- `Backend/src/main/java/com/stockhub/stock/application/port/StockSearch.java`
- `Backend/src/main/java/com/stockhub/stock/application/query/StockFilters.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/AdjustStockUseCase.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/EnterStockUseCase.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/ExitStockUseCase.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/StockContext.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/StockGuards.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/StockOperations.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/StockQueries.java`
- `Backend/src/main/java/com/stockhub/stock/application/usecase/TransferStockUseCase.java`
- `Backend/src/main/java/com/stockhub/stock/domain/exception/StockErrors.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/Batch.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/BatchStatus.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/DocumentType.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/ExpiryStatus.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/MovementType.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/Quantities.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/StockDocument.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/StockDocumentLine.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/StockLevel.java`
- `Backend/src/main/java/com/stockhub/stock/domain/model/StockMovement.java`
- `Backend/src/main/java/com/stockhub/stock/domain/repository/BatchRepository.java`
- `Backend/src/main/java/com/stockhub/stock/domain/repository/StockLevelRepository.java`
- `Backend/src/main/java/com/stockhub/stock/domain/repository/StockMovementRepository.java`
- `Backend/src/main/java/com/stockhub/stock/domain/service/BatchAllocator.java`
- `Backend/src/main/java/com/stockhub/stock/infrastructure/persistence/JdbcStockRepository.java`
- `Backend/src/main/java/com/stockhub/stock/infrastructure/persistence/JdbcStockSearch.java`
- `Backend/src/main/java/com/stockhub/stock/package-info.java`
- `Backend/src/main/java/com/stockhub/stock/presentation/controller/StockController.java`
- `Backend/src/main/java/com/stockhub/stock/presentation/controller/StockExceptionHandler.java`
- `Backend/src/main/java/com/stockhub/stock/presentation/response/StockResponses.java`
- `Backend/src/test/java/com/stockhub/stock/StockDomainTest.java`
- `Backend/src/test/java/com/stockhub/stock/StockIntegrationTest.java`
- `Backend/src/test/java/com/stockhub/stock/application/usecase/StockOperationsTest.java`

Autres fichiers :

- `Backend/src/main/resources/db/migration/V4__stock.sql`
- `docs/06-stock-api.md`
- `docs/07-etape4-validation.md`

Les modifications ne sont pas commitées. Arrêt à l'étape 4 : aucune interface stock Angular ou Next, aucun module POS/Sale/PurchaseOrder/Inventory/Alert/Report/Forecasting ajouté.
