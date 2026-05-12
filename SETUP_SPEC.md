# SvelteKit Project Setup Specification

Replicates the `hiro-core` environment: **SvelteKit 2 + Svelte 5 + TailwindCSS 4 + TypeScript + Prisma 7 + PostgreSQL**.

---

## 1. Prerequisites

| Tool       | Version             | Notes                                |
| ---------- | ------------------- | ------------------------------------ |
| Node.js    | `^24.0 \|\| ^25.9`  | Pinned via `.nvmrc` (`v24.15.0`)     |
| npm        | bundled with Node   | `engine-strict=true` in `.npmrc`     |
| PostgreSQL | 14+                 | Local or remote instance             |

```bash
nvm install 24
nvm use 24
```

---

## 2. Scaffold the Project

```bash
npx sv create my-app
# Choose: SvelteKit minimal, TypeScript (syntax), add Prettier + ESLint
cd my-app
```

---

## 3. Root Config Files

### `.nvmrc`

```
v24.15.0
```

### `.npmrc`

```
engine-strict=true
```

### `.gitignore`

```
node_modules

# Output
.output
.vercel
.netlify
.wrangler
/.svelte-kit
/build

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.*
!.env.example
!.env.test

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

# Prisma
prisma/migrations/

# Uploads
uploads/
```

### `.prettierrc`

```json
{
	"useTabs": true,
	"singleQuote": true,
	"trailingComma": "none",
	"printWidth": 100,
	"plugins": ["prettier-plugin-svelte"],
	"overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

### `.prettierignore`

```
# Package Managers
package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lock
bun.lockb

# Miscellaneous
/static/
```

---

## 4. `package.json`

```json
{
	"name": "my-app",
	"private": true,
	"version": "0.0.1",
	"type": "module",
	"engines": {
		"node": "^24.0 || ^25.9"
	},
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"prepare": "svelte-kit sync || echo ''",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
		"format": "prettier --write .",
		"format:check": "prettier --check .",
		"lint": "eslint .",
		"lint:fix": "eslint . --fix",
		"validate": "npm run format:check && npm run lint && npm run check",
		"db:generate": "prisma generate",
		"db:push": "prisma db push",
		"db:migrate": "prisma migrate dev",
		"db:studio": "prisma studio",
		"db:seed": "tsx prisma/seed.ts"
	}
}
```

### Install dev dependencies

```bash
npm i -D \
  @eslint/js@^9.18.0 \
  @sveltejs/adapter-auto@^6.0.0 \
  @sveltejs/kit@^2.22.0 \
  @sveltejs/vite-plugin-svelte@^6.0.0 \
  @tailwindcss/vite@^4.0.0 \
  eslint@^9.18.0 \
  eslint-plugin-svelte@^3.0.0 \
  globals@^16.0.0 \
  prettier@^3.4.2 \
  prettier-plugin-svelte@^3.3.3 \
  prisma@^7.5.0 \
  svelte@^5.0.0 \
  svelte-check@^4.0.0 \
  tailwindcss@^4.0.0 \
  tsx@^4.21.0 \
  typescript@^5.0.0 \
  typescript-eslint@^8.20.0 \
  vite@^7.0.4
```

### Install runtime dependencies

```bash
npm i \
  @prisma/adapter-pg@^7.5.0 \
  @prisma/client@^7.5.0 \
  @types/bcryptjs@^2.4.6 \
  @types/jsonwebtoken@^9.0.10 \
  @types/pg@^8.18.0 \
  bcryptjs@^3.0.3 \
  dotenv@^17.3.1 \
  jsonwebtoken@^9.0.3 \
  lucide-svelte@^0.577.0 \
  pg@^8.20.0 \
  zod@^4.3.6
```

> Optional (only if you need Claude API calls): `@anthropic-ai/sdk@^0.79.0`

---

## 5. SvelteKit Config

### `svelte.config.js`

```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

### `vite.config.ts`

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()]
});
```

### `tsconfig.json`

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler",
		"allowArbitraryExtensions": true
	}
}
```

---

## 6. ESLint Config

### `eslint.config.js`

```js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: { parser: ts.parser }
	},
	{
		files: ['**/*.svelte'],
		languageOptions: { parserOptions: { parser: ts.parser } },
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/prefer-svelte-reactivity': 'off'
		}
	},
	{
		files: ['**/*.ts'],
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{ ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/'] }
);
```

---

## 7. TailwindCSS 4

### `src/app.css`

```css
@import 'tailwindcss';

@theme {
	--color-primary: #d97706;
	--color-primary-dark: #b45309;
	--color-primary-light: #f59e0b;

	--color-secondary: #ea580c;
	--color-secondary-dark: #c2410c;
	--color-secondary-light: #f97316;

	--color-accent: #0d9488;
	--color-accent-dark: #0f766e;
	--color-accent-light: #14b8a6;

	--color-dark: #1a1a1a;
	--color-light: #fffbf0;
}

@theme inline {
	--variant-dark: .dark;
}

@custom-variant dark (&:where(.dark, .dark *));

:root.dark {
	color-scheme: dark;
}
```

Import once in your root layout: `import '../app.css';`

---

## 8. Prisma + PostgreSQL

### `prisma.config.ts`

```ts
import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	schema: path.join('prisma', 'schema.prisma'),
	datasource: {
		url: process.env.DATABASE_URL!
	}
});
```

### `prisma/schema.prisma` (starter)

```prisma
generator client {
	provider = "prisma-client-js"
}

datasource db {
	provider = "postgresql"
	url      = env("DATABASE_URL")
}
```

### `src/lib/prisma.ts` (singleton)

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 9. Environment Variables

### `.env.example` (commit this)

```
DATABASE_URL="postgresql://username:password@localhost:5432/my_app?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
JWT_EXPIRES_IN="7d"
```

Copy to `.env` and fill in real values. `.env` is gitignored.

---

## 10. Bootstrap Sequence

```bash
# 1. install deps
npm install

# 2. set up DB
cp .env.example .env       # then edit credentials
npx prisma generate
npx prisma db push

# 3. (optional) seed
npm run db:seed

# 4. run
npm run dev
```

---

## 11. Conventions

- **Indentation**: tabs (Prettier `useTabs: true`).
- **Quotes**: single quotes, no trailing commas, 100-char print width.
- **Prisma**: custom string PKs (e.g. `xxxCode`), `@map()` for snake_case columns, `@@map()` for table names.
- **TailwindCSS 4**: define palette in `@theme`, class-based dark mode via `.dark` selector.
- **Path alias**: `$lib` → `src/lib/` (provided by SvelteKit).
- **Auth pattern (if needed)**:
  - `src/lib/server/auth.ts` — JWT + bcryptjs
  - `src/lib/server/guards.ts` — `requireAuth()`, `requireRole()`
  - `src/lib/routes.ts` — centralized route constants
  - `src/hooks.server.ts` — verify JWT on each request

---

## 12. Verification

```bash
npm run validate    # format:check + lint + check
npm run build       # production build
```

If all three pass, the environment matches `hiro-core`.
