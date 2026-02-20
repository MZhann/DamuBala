# DamuBala — Tech Stack

> AI-Based Application for Developing Cognitive, Emotional, and Social Skills in Children (ages 4–10).  
> **Diploma Project — 2026**

---

## 📐 Architecture Overview

The project follows a **monorepo** structure with two independent packages:

```
DamuBala/
├── api/    → Backend (REST API server)
├── web/    → Frontend (Web application)
└── README.md
```

- **api/** and **web/** each have their own `package.json`, `node_modules`, and `tsconfig.json`.
- Communication between frontend and backend happens via **REST API** over HTTP (`fetch`).
- The API base URL is configured in the frontend through the `NEXT_PUBLIC_API_URL` environment variable.

---

## 🔧 Backend (`api/`)

### Runtime & Language

| Technology     | Version      | Purpose                            |
| -------------- | ------------ | ---------------------------------- |
| **Node.js**    | 18+          | JavaScript runtime                 |
| **TypeScript** | ^5.9.3       | Static typing for the entire API   |
| **ES Modules** | `"type": "module"` | Native ESM module system      |

### Framework & Libraries

| Library            | Version  | Purpose                                        |
| ------------------ | -------- | ---------------------------------------------- |
| **Express**        | ^5.2.1   | HTTP server / routing framework                |
| **Mongoose**       | ^9.2.1   | MongoDB ODM (Object Document Mapper)           |
| **jsonwebtoken**   | ^9.0.3   | JWT token creation & verification              |
| **bcrypt**         | ^6.0.0   | Password hashing                               |
| **Zod**            | ^4.3.6   | Request body / schema validation               |
| **cors**           | ^2.8.6   | Cross-Origin Resource Sharing middleware        |
| **dotenv**         | ^17.3.1  | Environment variable management (`.env` files) |

### Dev Tooling

| Tool               | Version  | Purpose                                     |
| ------------------- | -------- | ------------------------------------------- |
| **tsx**             | ^4.21.0  | TypeScript execution & hot-reload (`tsx watch`) |
| **ts-node-dev**     | ^2.0.0   | Alternative TS dev runner                   |
| **@types/node**     | ^25.3.0  | Node.js type definitions                    |
| **@types/express**  | ^5.0.6   | Express type definitions                    |
| **@types/bcrypt**   | ^6.0.0   | Bcrypt type definitions                     |
| **@types/cors**     | ^2.8.19  | CORS type definitions                       |
| **@types/jsonwebtoken** | ^9.0.10 | JWT type definitions                     |

### Database

| Technology   | Purpose                                |
| ------------ | -------------------------------------- |
| **MongoDB**  | NoSQL document database (local or Atlas) |
| **Mongoose** | ODM with schema definitions and validation |

### Backend Architecture Pattern

```
api/src/
├── index.ts          → Server bootstrap (Express app init, middleware, routes)
├── config/           → Database connection (db.ts)
├── models/           → Mongoose schemas/models (User, Child, GameSession, EmotionRecord, Achievement)
├── controllers/      → Business logic per route group (6 controllers)
├── routes/           → Express route definitions (6 route files)
├── middleware/       → Auth (JWT), error handling (3 middleware files)
└── utils/            → Helpers, tokens, scoring rules (3 util files)
```

### Authentication Strategy

- **JWT-based** authentication
- Passwords hashed with **bcrypt**
- `requireAuth` middleware that validates token and sets `req.user`
- Token configuration: `JWT_SECRET` + `JWT_EXPIRES_IN` (default: 7 days)

---

## 🌐 Frontend (`web/`)

### Framework & Language

| Technology     | Version  | Purpose                                |
| -------------- | -------- | -------------------------------------- |
| **Next.js**    | 16.1.6   | React framework (App Router)           |
| **React**      | 19.2.3   | UI library                             |
| **React DOM**  | 19.2.3   | React DOM renderer                     |
| **TypeScript** | ^5       | Static typing                          |

### Styling

| Library                 | Version  | Purpose                                 |
| ----------------------- | -------- | --------------------------------------- |
| **TailwindCSS**         | ^4       | Utility-first CSS framework             |
| **@tailwindcss/postcss** | ^4      | PostCSS plugin for Tailwind integration |
| **tw-animate-css**      | ^1.4.0   | Animation utilities for Tailwind        |
| **tailwind-merge**      | ^3.5.0   | Intelligent Tailwind class merging      |
| **clsx**                | ^2.1.1   | Conditional className utility           |
| **class-variance-authority** | ^0.7.1 | Component variant styling (CVA)      |

### UI Component Library

| Library         | Version  | Purpose                                   |
| --------------- | -------- | ----------------------------------------- |
| **shadcn/ui**   | ^3.8.5   | Pre-built Radix-based UI components       |
| **Radix UI**    | ^1.4.3   | Headless accessible UI primitives         |
| **Lucide React** | ^0.575.0 | Icon library                             |

**Installed shadcn/ui components:**
- `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `progress`

**shadcn/ui configuration:**
- Style: **New York**
- Base color: **Neutral**
- CSS Variables: **Enabled**
- Icon library: **Lucide**
- RSC support: **Enabled**

### Forms & Validation

| Library                  | Version  | Purpose                                |
| ------------------------ | -------- | -------------------------------------- |
| **React Hook Form**      | ^7.71.1  | Performant form state management       |
| **@hookform/resolvers**  | ^5.2.2   | Zod/Yup resolver for React Hook Form   |
| **Zod**                  | ^4.3.6   | Schema validation (shared with backend) |

### Dev Tooling

| Tool                  | Version  | Purpose                     |
| --------------------- | -------- | --------------------------- |
| **ESLint**            | ^9       | Code linting                |
| **eslint-config-next** | 16.1.6  | Next.js ESLint rules        |
| **@types/react**      | ^19      | React type definitions      |
| **@types/react-dom**  | ^19      | React DOM type definitions  |
| **@types/node**       | ^20      | Node.js type definitions    |

### Frontend Architecture Pattern

```
web/src/
├── app/              → Next.js App Router pages & layouts (16 items)
├── components/       → Reusable components
│   ├── ui/           → shadcn/ui components (10 components)
│   ├── games/        → Game-specific components (2 items)
│   ├── Mascot.tsx    → App mascot component
│   └── Sidebar.tsx   → Navigation sidebar
├── lib/              → Utilities & context providers
│   ├── api.ts        → API client (fetch wrapper)
│   ├── auth-context.tsx  → Authentication context (React Context)
│   ├── child-context.tsx → Child profile context (React Context)
│   └── utils.ts      → General utilities (clsx + twMerge)
└── types/            → Shared TypeScript type definitions
```

### State Management

- **React Context API** — used for Auth and Child profile state
- **React Hook Form** — for form state
- No external state management library (Redux, Zustand, etc.)

### Rendering Strategy

- **React Server Components (RSC)** — used by default for pages
- **Client Components** — used where needed (forms, game logic, interactive elements)

---

## 🔗 Shared Across Frontend & Backend

| Technology     | Purpose                                      |
| -------------- | -------------------------------------------- |
| **TypeScript** | End-to-end type safety                       |
| **Zod ^4.3.6** | Schema validation (same version in both)     |
| **ES Modules** | Modern JavaScript module system              |
| **npm**        | Package manager                              |

---

## 🗄 Data Models (MongoDB Collections via Mongoose)

| Model             | Description                                  |
| ----------------- | -------------------------------------------- |
| **User**          | Parent account (email, password, name, role) |
| **Child**         | Child profile (parentId, name, age, avatar, language) |
| **GameSession**   | Game play record (childId, gameKey, score, duration, difficulty) |
| **EmotionRecord** | Emotion tracking (childId, emotion, intensity, context) |
| **Achievement**   | Badges & rewards system                      |

---

## 🚀 NPM Scripts

### Backend (`api/`)
```bash
npm run dev    # tsx watch src/index.ts  → hot-reload dev server
npm run build  # tsc                     → compile TypeScript
npm start      # node dist/index.js      → run production build
```

### Frontend (`web/`)
```bash
npm run dev    # next dev    → development server (localhost:3000)
npm run build  # next build  → production build
npm start      # next start  → serve production build
npm run lint   # eslint      → run linter
```

---

## 🌍 Supported Languages

- 🇷🇺 Russian (Русский)
- 🇰🇿 Kazakh (Қазақша)

---

## 📌 Summary Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      DamuBala                            │
├────────────────────────┬─────────────────────────────────┤
│      Frontend (web/)   │         Backend (api/)          │
├────────────────────────┼─────────────────────────────────┤
│  Next.js 16.1.6        │  Node.js 18+                   │
│  React 19.2.3          │  Express 5.2.1                 │
│  TypeScript 5          │  TypeScript 5.9.3              │
│  TailwindCSS 4         │  MongoDB + Mongoose 9.2.1      │
│  shadcn/ui (New York)  │  JWT + bcrypt                  │
│  Radix UI 1.4.3        │  Zod 4.3.6 (validation)        │
│  React Hook Form 7.71  │  CORS + dotenv                 │
│  Lucide React (icons)  │  tsx (dev runner)               │
│  ESLint 9              │                                 │
├────────────────────────┴─────────────────────────────────┤
│              REST API (HTTP / JSON)                      │
├──────────────────────────────────────────────────────────┤
│              MongoDB (local or Atlas)                    │
└──────────────────────────────────────────────────────────┘
```
