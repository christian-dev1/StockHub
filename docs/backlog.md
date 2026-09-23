# StockHub — Backlog

Statuts : ✅ fait · 🔄 en cours · ⏳ à faire

## Phase 1 — Squelette ✅
- ✅ Dépôt git, `.editorconfig`, `.gitignore`, `.env.example`
- ✅ Backend Spring Boot 4.1 / Modulith 2.1 / Flyway V1 (extensions, triggers utilitaires, séquences de documents, registre d'événements)
- ✅ Profils dev / test / prod, Actuator (health, probes, Prometheus), Swagger, logs structurés ECS en prod, `X-Request-Id`
- ✅ Modèle d'erreur `ApiError` localisé FR/EN, handlers 401/403 JSON
- ✅ Tests : intégration Testcontainers PostgreSQL 18, Modulith `verify()`, règles ArchUnit Clean Architecture
- ✅ Angular 21 zoneless : Tailwind 4 + PrimeNG (preset aligné sur les tokens), dark/light/system, FR/EN, shell responsive, pages 403/404/500, feature `dashboard` en 3 couches, ESLint (URL API interdites hors `api.routes.ts`)
- ✅ Next 16 : Tailwind 4 + tokens, next-themes, next-intl (clés typées), TanStack Query, shell mobile-first, pages 403/404/500, feature `system` en 3 couches, Vitest + Testing Library
- ✅ Dockerfiles (backend en couches, nginx same-origin, Next standalone), `docker-compose.yml` avec health checks
- ✅ CI GitHub Actions (backend, Angular, Next, stack Docker + smoke test)

## Phase 2 — Sécurité & entreprises ✅
- ✅ Migration V2 : companies, locations, users, roles, permissions, role_permissions, user_locations, refresh_tokens, audit_logs (append-only par trigger)
- ✅ Auth : login, refresh rotatif + détection de réutilisation, logout, me, change-password ; Argon2id ; JWT HS512 (Spring Resource Server) ; limitation des tentatives
- ✅ CurrentUser résolu côté serveur, token version, LocationAccessPolicy, caches d'autorités invalidés après commit
- ✅ Company : création atomique (entreprise + emplacement principal + 1er ADMIN), activation/désactivation motivée, profil, paramètres, optimistic locking
- ✅ User : création, profil, rôle, emplacements, activation, reset mot de passe, garde « dernier ADMIN » et « pas soi-même »
- ✅ Audit synchrone dans la transaction (connexions, échecs, réutilisation de token, entreprises, utilisateurs)
- ✅ Profil `demo` (Alpha Market, Beta Distribution) + bootstrap super admin par variables d'environnement
- ✅ Tests : JWT absent/altéré/expiré/révoqué, 403 permission, 404 inter-entreprises, entreprise/utilisateur désactivé, réutilisation refresh, verrouillage login
- ✅ Angular : login, changement de mot de passe, AuthStore (token en mémoire), intercepteur refresh single-flight, guards, menu utilisateur, navigation par permissions, écrans entreprises (plateforme), utilisateurs, paramètres entreprise ; composants DataTable/Pagination/FormField/SearchField/StatusBadge/ErrorState
- ✅ Next : login, changement de mot de passe, session en mémoire, AuthGate, client HTTP avec refresh, menu utilisateur, restriction aux rôles de vente
- ⏳ Reporté en Phase 8 (audit) : sessions support SUPER_ADMIN (lecture seule, motivées, auditées) et écran du journal d'audit

## Stabilisation post-audit (22/09/2026) ✅
Corrige les anomalies de `docs/audit/2026-09-22-audit.md` sans nouvelle fonctionnalité métier.
- ✅ Next : dates affichées dans le fuseau de l'entreprise (repli : fuseau du navigateur, puis UTC) — `core/i18n/time-zone*`
- ✅ Angular : même règle via `DisplayTimeZone` + pipe `dateTime` (remplace `DatePipe`)
- ✅ M-01 débordement `p-inputnumber` (paramètres) ; L-04 titres sur plusieurs lignes
- ✅ M-02 connexion Next à 320 px (menu Préférences) ; M-03 langue/thème dans le menu utilisateur mobile
- ✅ M-04 VENDEUR refusé par le back-office Angular (`backOfficeGuard`, page `/sales-app-only`)
- ✅ M-08 403 avant 400 : `@PreAuthorize` évalué avant la liaison/validation du corps
- ✅ M-05/M-06/L-01 contrastes, noms accessibles des `p-select`, cibles tactiles (liens, recherche, interrupteur 44×24)
- ✅ M-07 « aucun résultat » + réinitialiser les filtres (entreprises, utilisateurs)
- ✅ L-02/L-03/L-05 libellés d'actions (« Créer l'utilisateur »), e-mail en double sur mobile, police des filtres
- ✅ Routes Next sans page retirées des constantes (POS, scan, produits, ventes, paramètres)
- ✅ M-13 suite Playwright `e2e/` (rôles, session, thème, états vides, fuseau + smoke 7 largeurs × thèmes × FR/EN × axe), branchée en CI

## Phase 3 — Catalogue 🔄
- ✅ Backend finalisé (22/09/2026, étape 2) : audit ciblé, erreurs 400/415 au lieu de 500 (paramètre, fichier ou type de contenu manquant), messages d'erreur formatés, champ fautif indiqué pour une valeur illisible, Swagger (codes 201/204, réponses `ApiError`, permission par opération, enums), tests d'isolation A/B, matrice des permissions exécutable — référence : `docs/05-catalogue-api.md`
- ✅ Angular (22/09/2026, étape 3) : features `locations`, `categories`, `suppliers`, `products` (image, import), `barcodes` (génération, étiquettes) en data/domain/presentation ; navigation et boutons selon les permissions ; E2E admin complet (emplacement → étiquette PDF), manager, magasinier ; smoke 7 largeurs × clair/sombre × FR/EN × axe
- ✅ Emplacements (CRUD, principal, activation) — UX adaptative mono/multi-sites
- ✅ Catégories (arbre 2 niveaux), fournisseurs
- ✅ Produits (recherche, filtres, image, import CSV/Excel avec prévisualisation)
- ✅ Codes-barres (CODE128, EAN-13, PNG/SVG, étiquettes PDF)
- ⏳ Next : catalogue et lookup par scan

## Phase 4 — Stock 🔄
- ✅ Backend (étape 4) : entrées, sorties, ajustements, transferts, lots, FEFO, bons — `docs/06-stock-api.md`
- ✅ Angular (22/09/2026, étape 5) : stock par emplacement, opérations, mouvements, lots/expiration, bons ; UX mono/multi-sites ; E2E admin/transfert/FEFO/magasinier — `docs/08-etape5-validation.md`
- ⏳ Next : consultation du stock

## Dashboards (étape 6) ✅
- ✅ Backend read-model `dashboard/` : endpoints summary / stock-flow / recent-activity / top-movements + platform/dashboard, agrégats SQL, permission `STOCK_VALUE_VIEW` (V5) — `docs/09-dashboards.md`
- ✅ Angular : 4 dashboards par rôle (SUPER_ADMIN plateforme, ADMIN/MANAGER métier, MAGASINIER opérationnel), graphiques SVG (entrées/sorties, état du stock, stock par emplacement), filtres période + emplacement, 4 états par widget, i18n FR/EN — `docs/10-etape6-validation.md`
- ✅ Aucune donnée fictive : KPI ventes/revenus absents tant que le module `sale` n'existe pas
- ✅ Tests : backend 243/243, Angular 217/217, Playwright 153/153
- ⏳ Étape suivante (ventes/POS/achats…) : voir `00-architecture-plan.md` §11 et §13

## Espace VENDEUR — Phase 7, premier lot (23/09/2026) ✅
- ✅ Backend module `sale` (V6) : vente atomique avec sortie de stock `SALE` (FEFO, stock négatif selon l'entreprise), prix et total calculés par le serveur, nom du client texte optionnel (pas de table client), idempotence, audit, tables immuables
- ✅ Visibilité : VENDEUR = ses ventes uniquement (filtre serveur, 404 sinon) ; résumé personnel ; catalogue de vente sans prix d'achat
- ✅ Next : tableau de bord vendeur, produits (lecture seule), nouvelle vente (recherche/scan, panier), mes ventes (filtres), reçu imprimable, profil, préférences ; menu et pages filtrés par permission
- ✅ Tests : backend 258/258, Next 41/41, Playwright vendeur 13 + smoke 9 pages Next — `docs/11-espace-vendeur.md`
- ⏳ Décision : place du VENDEUR dans le back-office Angular (voir §7 du document)
- ⏳ Reste de la phase 7 : ventes ADMIN/MANAGER (toutes les ventes), annulation, rendu de monnaie, scan caméra

## Phases 5 → 12 ⏳
Voir `00-architecture-plan.md` §11 et §13.
