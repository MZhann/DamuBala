# DamuBala 🌟

AI-Based Application for Developing Cognitive, Emotional, and Social Skills in Children (ages 4–10).

## 📁 Project Structure

```
DamuBala/
├── api/           # Backend: Node.js + Express + MongoDB
├── web/           # Frontend: Next.js + TypeScript + TailwindCSS
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup (api/)

1. Navigate to api folder:
```bash
cd api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with the following variables:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/damubala
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

4. Start development server:
```bash
npm run dev
```

API will be available at `http://localhost:4000`

### Frontend Setup (web/)

1. Navigate to web folder:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

4. Start development server:
```bash
npm run dev
```

App will be available at `http://localhost:3000`

## 🎮 Features

### For Parents
- 👤 Registration & Login
- 👶 Child profile management (multiple children)
- 📊 Analytics dashboard with AI recommendations
- 🔐 PIN protection for child profiles

### For Children
- 🧠 **Memory Match** - Find matching pairs
- 🔢 **Math Adventure** - Solve math problems
- 😊 **Emotion Cards** - Recognize emotions (coming soon)
- 🔷 **Pattern Sequence** - Continue patterns (coming soon)
- 📝 **Word Builder** - Build words (coming soon)
- 🧩 **Puzzle Solve** - Solve puzzles (coming soon)

### Gamification
- ⭐ Points system
- 🏆 Achievements & badges
- 📈 Level progression

## 🛠 Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Zod validation

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui components

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Register parent
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user

### Children
- `GET /api/children` - List children
- `POST /api/children` - Create child
- `GET /api/children/:id` - Get child
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child

### Games
- `POST /api/games/sessions` - Save game session

### Analytics
- `GET /api/analytics/summary/:childId` - Get analytics summary

## 🇰🇿 Languages

- Russian (Русский)
- Kazakh (Қазақша)

## 📄 License

MIT

---

**Diploma Project** - 2026
