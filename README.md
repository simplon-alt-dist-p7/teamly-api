# teamly-api

API NestJS pour Teamly (auth, restaurants, employés).

## Prérequis

- Node.js (LTS)
- Docker + Docker Compose
- npm

## Configuration / setup

1. Installer les dépendances :

```bash
npm install
```

2. Variables d'environnement

- Dev : créer un fichier `.env` (non versionné) :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/teamly?schema=public
```

- Tests : fichier `.env.test` (ignoré par git) :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/teamly_test?schema=public
```

3. Démarrer Postgres :

```bash
docker compose up -d
```

Le compose démarre Postgres et crée la base `teamly` (dev).  
La base `teamly_test` est créée automatiquement par les scripts de test.

4. Migrations (dev) :

```bash
npx prisma migrate deploy
```

En local, tu peux aussi utiliser :

```bash
npx prisma migrate dev
```

5. Lancer l'API :

```bash
npm run start:dev
```

Par défaut : `http://localhost:3000`

## Tests

### Unitaires

```bash
npm test
```

Lance les fichiers `*.spec.ts` sous `src/` (sans setup DB automatique).

### Intégration

Les tests d'intégration utilisent Postgres (`teamly_test`) via `.env.test`.

```bash
npm run test:int
```

Ce script fait, dans l'ordre :

1. `db:test:up` — démarre Docker Compose
2. `db:test:create` — crée `teamly_test` si elle n'existe pas
3. `db:test:migrate` — applique les migrations Prisma sur la DB test
4. Lance Jest sur les fichiers matching `integration`

En watch (si la DB test est déjà prête) :

```bash
npm run test:int:watch
```

### E2E

```bash
npm run test:e2e
```

Même setup DB que les tests d'intégration, puis Jest avec `test/jest-e2e.json`.

### Scripts DB utiles

| Script                    | Rôle                         |
| ------------------------- | ---------------------------- |
| `npm run db:test:up`      | Démarre Postgres             |
| `npm run db:test:create`  | Crée `teamly_test` si besoin |
| `npm run db:test:migrate` | Migre la DB test             |
| `npm run db:test:setup`   | up + create + migrate        |

## Flux typique

1. `docker compose up -d`
2. Configurer `.env` et `.env.test`
3. `npm run start:dev` pour développer
4. `npm run test:int` pour valider service + DB
