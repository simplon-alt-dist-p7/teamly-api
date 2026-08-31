# Guide des tests — teamly-api

## Vue d'ensemble

Le projet a **3 niveaux de tests**, chacun avec sa config, son suffixe de fichier et sa commande npm.

| Niveau          | Suffixe        | Emplacement | Base de données       | Commande           |
| --------------- | -------------- | ----------- | --------------------- | ------------------ |
| **Unitaire**    | `.spec.ts`     | `src/`      | Non (repos in-memory) | `npm test`         |
| **Intégration** | `.int-spec.ts` | `src/`      | Oui (`teamly_test`)   | `npm run test:int` |
| **E2E**         | `.e2e-spec.ts` | `test/`     | Oui (`teamly_test`)   | `npm run test:e2e` |

---

## Commandes npm

```bash
# Unitaires — rapides, sans Docker
npm test
npm run test:watch          # mode watch
npm run test:cov            # avec couverture

# Intégration — Prisma + Postgres
npm run test:int
npm run test:int:watch

# E2E — app Nest complète + Supertest + Postgres
npm run test:e2e

# Lancer UN fichier précis
npm test -- create-shift.handler
npm run test:int -- employee.service
npm run test:e2e -- create-shift

# Setup DB test manuellement
npm run db:test:setup       # docker + create DB + migrations
```

Tous les tests se lancent depuis le dossier `teamly-api/`.

---

## Config Jest #1 — Unitaires (`package.json`)

```json
"jest": {
  "rootDir": "src",
  "modulePaths": ["<rootDir>/.."],
  "testRegex": ".*\\.spec\\.ts$",
  ...
}
```

### `rootDir: "src"`

Jest considère `src/` comme racine. Il ne scanne **que** ce dossier.

```
teamly-api/
├── src/           ← Jest cherche ici
│   └── **/*.spec.ts
├── test/          ← ignoré par npm test
└── prisma/        ← ignoré par npm test
```

### `testRegex: ".*\\.spec\\.ts$"`

Seuls les fichiers finissant par `.spec.ts` sont exécutés.

| Fichier                        | Match ? |
| ------------------------------ | ------- |
| `create-shift.handler.spec.ts` | ✅      |
| `employee.service.int-spec.ts` | ❌      |
| `create-shift.e2e-spec.ts`     | ❌      |

### `modulePaths: ["<rootDir>/.."]`

`<rootDir>` = `src/` → `<rootDir>/..` = racine du projet.

Permet les imports absolus depuis la racine :

```typescript
import { AppModule } from 'src/app.module';
import { PrismaService } from 'prisma/prisma.service';
```

---

## Config Jest #2 — E2E (`test/jest-e2e.json`)

```json
{
  "rootDir": ".",
  "modulePaths": ["<rootDir>/.."],
  "testRegex": ".e2e-spec.ts$",
  ...
}
```

Utilisée via :

```bash
jest --config ./test/jest-e2e.json
```

(`npm run test:e2e` ajoute le setup DB et `.env.test`.)

### `rootDir: "."`

Relatif au dossier du fichier config → `test/`. Jest ne scanne **que** `test/`.

```
teamly-api/
├── src/           ← ignoré par test:e2e
└── test/          ← Jest cherche ici
    ├── app.e2e-spec.ts
    ├── create-shift.e2e-spec.ts
    └── utils/
        └── get-access-token.ts
```

### `testRegex: ".e2e-spec.ts$"`

Tous les fichiers se terminant par `.e2e-spec.ts`.

### `modulePaths`

Même rôle que pour les unitaires : `<rootDir>/..` = racine projet, pour résoudre `src/...` et `prisma/...`.

---

## Config Jest #3 — Intégration (inline dans le script)

Pas de fichier JSON dédié. Le script surcharge Jest :

```bash
jest --testRegex=".*\.int-spec\.ts$"
```

Hérite du reste de la config `package.json` (dont `rootDir: "src"`).

| Fichier                        | Match ? |
| ------------------------------ | ------- |
| `employee.service.int-spec.ts` | ✅      |
| `create-shift.handler.spec.ts` | ❌      |

Charge aussi `.env.test` et setup DB :

```bash
npm run db:test:setup && dotenv -e .env.test -- jest --testRegex="..."
```

---

## Schéma : quelle config pour quel test ?

```
npm test
  └── package.json → jest
        rootDir: src
        regex: *.spec.ts

npm run test:int
  └── package.json → jest + override regex
        rootDir: src
        regex: *.int-spec.ts
        + .env.test + db:test:setup

npm run test:e2e
  └── test/jest-e2e.json
        rootDir: test/
        regex: *.e2e-spec.ts
        + .env.test + db:test:setup
```

---

## Base de données de test

Les tests **int** et **e2e** utilisent Postgres via Docker.

```
npm run db:test:setup
  ├── db:test:up       → docker compose up -d
  ├── db:test:create   → CREATE DATABASE teamly_test
  └── db:test:migrate  → prisma migrate deploy (avec .env.test)
```

Variables dans `.env.test` (ex. `DATABASE_URL` → `teamly_test`).

**Important** : int et e2e partagent la **même DB**. Utilise des emails uniques ou un `beforeEach` qui nettoie :

```typescript
beforeEach(async () => {
  await prisma.shift.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
});
```

---

## Conventions de nommage et placement

```
teamly-api/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts              # unitaire
│   ├── employee/tests/
│   │   └── employee.service.int-spec.ts      # intégration
│   └── shift/
│       ├── applications/tests/unit/
│       │   └── create-shift.handler.spec.ts  # unitaire
│       └── domain/tests/
│           └── shift.entity.spec.ts          # unitaire
└── test/
    ├── jest-e2e.json                         # config e2e
    ├── app.e2e-spec.ts                       # e2e
    ├── create-shift.e2e-spec.ts              # e2e
    └── utils/
        └── get-access-token.ts               # helpers e2e
```

| Tu veux tester…     | Suffixe        | Où                    |
| ------------------- | -------------- | --------------------- |
| Handler, entity, VO | `.spec.ts`     | `src/` (près du code) |
| Service + Prisma    | `.int-spec.ts` | `src/`                |
| Route HTTP complète | `.e2e-spec.ts` | `test/`               |

---

## Erreurs fréquentes

### `No tests found` / `0 matches`

Tu utilises la **mauvaise commande** pour le type de fichier.

| Erreur                   | Cause                                  | Solution           |
| ------------------------ | -------------------------------------- | ------------------ |
| e2e avec `npm test`      | regex `*.spec.ts`, rootDir `src/`      | `npm run test:e2e` |
| unitaire avec `test:e2e` | regex `*.e2e-spec.ts`, rootDir `test/` | `npm test`         |

### `Cannot find module 'src/...'` ou `'prisma/...'`

Il manque `modulePaths` dans la config Jest. Vérifier que `jest-e2e.json` contient :

```json
"modulePaths": ["<rootDir>/.."]
```

### `BadRequestException: Vérifier les informations`

Email déjà en base (`teamly_test` sale). Fix : `beforeEach` avec cleanup, ou emails uniques.

### Bouton ▶ de l'IDE sur un e2e

L'IDE utilise souvent la config default (`npm test`). Pour les e2e, lancer via le terminal :

```bash
npm run test:e2e -- create-shift
```

---

## Cheat sheet

```bash
# Tous les unitaires
npm test

# Un handler précis
npm test -- create-shift.handler

# Intégration employee
npm run test:int -- employee.service

# E2E shift
npm run test:e2e -- create-shift

# DB test seule
npm run db:test:setup
```
