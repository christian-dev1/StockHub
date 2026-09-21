# StockHub

Application professionnelle de gestion de stock **multi-entreprises** et **multi-emplacements** (boutiques, entrepôts, dépôts) : catalogue, stock par emplacement, lots et dates d'expiration, transferts, inventaires, commandes fournisseurs, point de vente, alertes, audit, rapports et prévisions de réapprovisionnement.

```text
StockHub/
├── Backend/            API REST Spring Boot — monolithe modulaire (Spring Modulith) + Clean Architecture
├── Frontend-Angular/   Back-office : Super Admin, Admin, Manager, Magasinier
├── Frontend-Next/      Application mobile-first : Vendeur, caisse (POS), scan de codes-barres
├── docs/               Architecture, modèle de données, flux, décisions (ADR)
└── docker-compose.yml  Environnement complet (PostgreSQL + backend + 2 frontends)
```

Les deux frontends sont **totalement indépendants** (aucun code partagé) et ne communiquent qu'avec le backend, via `/api/v1`.

## Rôle de chaque application

| Application | Public | Stack |
|---|---|---|
| **Backend** | Autorité unique : sécurité, isolation des entreprises, règles métier, transactions | Java 21, Spring Boot 4.1, Spring Modulith 2.1, Spring Security + JWT, JPA/Hibernate 7, PostgreSQL 18, Flyway, springdoc-openapi |
| **Frontend-Angular** | Administration et opérations d'entrepôt, desktop d'abord | Angular 21 (zoneless, Signals), PrimeNG 21, Tailwind CSS 4, ngx-translate, Vitest |
| **Frontend-Next** | Vente et consultation rapide, mobile d'abord | Next.js 16 (App Router), React 19, Tailwind CSS 4, Headless UI + Heroicons, TanStack Query, next-intl, Vitest |

## Architecture

- **Backend** : un module Spring Modulith par domaine métier (`company`, `user`, `auth`, `warehouse`, `product`, `supplier`, `stock`, `inventory`, `purchase`, `sale`, `barcode`, `alert`, `audit`, `report`, `forecasting`), chacun découpé en `domain / application / infrastructure / presentation`. Les frontières sont vérifiées par des tests (`ApplicationModules.verify()` + ArchUnit).
- **Frontends** : `core / shared / features`, chaque feature étant découpée en `data / domain / presentation`. Les routes frontend et les URL d'API sont centralisées dans `core/config/routes/{app,api}.routes.ts`. Une règle ESLint interdit les URL d'API écrites en dur ailleurs.
- **Même origine** : en production, nginx (Angular) et les rewrites Next.js redirigent `/api` vers le backend. Pas de CORS ouvert, et le cookie de refresh reste `SameSite=Strict`.

Détails : [`docs/00-architecture-plan.md`](docs/00-architecture-plan.md).

## Prérequis

| Outil | Version |
|---|---|
| Docker + Docker Compose v2 | 24+ |
| Java (dev backend) | 21 |
| Node.js (dev frontends) | ≥ 22.12 (images Docker : Node 24) |

## Démarrage rapide (Docker)

```bash
cp .env.example .env
# Éditer .env : POSTGRES_PASSWORD et JWT_SECRET (openssl rand -base64 64)
docker compose up -d --build --wait
```

| Service | URL |
|---|---|
| Back-office Angular | http://localhost:4300 |
| Application Next.js (POS) | http://localhost:3100 |
| API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Health | http://localhost:8080/actuator/health |
| PostgreSQL | localhost:5440 (lié à 127.0.0.1) |

Arrêt : `docker compose down` (ajouter `-v` pour supprimer les données).

## Développement local

```bash
# Base de données seule
docker compose up -d postgres

# Backend (profil dev, port 8080)
cd Backend && ./mvnw spring-boot:run

# Back-office Angular (port 4300, proxy /api -> 8080)
cd Frontend-Angular && npm ci && npm start

# Application Next.js (port 3100, rewrites /api -> 8080)
cd Frontend-Next && npm ci && npm run dev
```

Le backend peut aussi démarrer sur une base PostgreSQL éphémère (Testcontainers) : lancer `com.stockhub.support.TestStockHubApplication` depuis l'IDE.

## Variables d'environnement

| Variable | Utilisée par | Description |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | postgres, backend | Base de données |
| `JWT_SECRET` | backend | Secret HS512 encodé en Base64 (≥ 64 octets) |
| `SPRING_PROFILES_ACTIVE` | backend | `dev`, `test` ou `prod` |
| `SWAGGER_ENABLED` | backend | Active Swagger UI en production |
| `BACKEND_URL` | Angular (nginx), Next (build) | Adresse interne du backend |
| `POSTGRES_PORT`, `BACKEND_PORT`, `ANGULAR_PORT`, `NEXT_PORT` | compose | Ports exposés sur l'hôte |

Profils backend : `application.yml` (commun), `application-dev.yml`, `application-test.yml`, `application-prod.yml`. Le schéma est géré **uniquement par Flyway** (`ddl-auto: validate`).

## Tests et qualité

```bash
cd Backend && ./mvnw verify                  # unitaires, intégration Testcontainers, architecture, JaCoCo
cd Frontend-Angular && npm run lint && npm test && npm run build
cd Frontend-Next && npm run lint && npm run typecheck && npm test && npm run build
```

La CI GitHub Actions (`.github/workflows/`) exécute ces commandes, puis démarre la stack Docker complète et lance un smoke test.

## Rôles

`SUPER_ADMIN` (plateforme), puis, par entreprise : `ADMIN`, `MANAGER`, `MAGASINIER`, `VENDEUR`. Les droits reposent sur des **permissions** regroupées par rôle et limitées aux emplacements autorisés. Voir la matrice complète dans le plan d'architecture.

## Avancement

| Phase | Statut |
|---|---|
| 0 — Audit et plan | ✅ |
| 1 — Squelette (3 projets, Docker, CI, thème, i18n) | ✅ |
| 2 — Sécurité, entreprises, utilisateurs | ⏳ |
| 3 → 12 | à venir |
