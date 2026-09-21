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

## Phase 2 — Sécurité & entreprises ⏳
- ⏳ Migration V2 : companies, locations (principal), users, roles, permissions, role_permissions, user_locations, refresh_tokens, support_sessions, audit_logs (append-only)
- ⏳ Auth : login, refresh rotatif + détection de réutilisation, logout, me, change-password ; Argon2id ; JWT HS512
- ⏳ TenantContext, CurrentUser, LocationAccessPolicy, cache des autorités
- ⏳ Company : création atomique (entreprise + emplacement principal + 1er ADMIN), activation/désactivation, paramètres
- ⏳ User : CRUD, rôle, emplacements, activation, reset mot de passe, garde « dernier ADMIN »
- ⏳ Audit minimal des actions sensibles
- ⏳ Données de démonstration (profil dev)
- ⏳ Tests sécurité : JWT invalide/expiré, 403 permission, 404 inter-entreprises, entreprise désactivée, réutilisation refresh
- ⏳ Angular : login, AuthStore, intercepteurs (bearer, refresh 401), guards (auth, permission), écrans plateforme (entreprises) et utilisateurs
- ⏳ Next : login, session, protection des routes, intercepteur refresh

## Phases 3 → 12 ⏳
Voir `00-architecture-plan.md` §11 et §13.
