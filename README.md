# FocusArena 

Turn your focus sessions into a competitive battleground. **FocusArena** is a gamified productivity application that helps users stay accountable, compete with others in real-time, earn experience points (XP) and coins, buy rewards/badges, and build unstoppable daily habits.

---

##  Key Features

- ⏱️ **Gamified Focus Sessions**: Start solo or group focus timers where your coins are staked as a commitment.
- 🤝 **Real-Time Matchmaking**: Find focus partners or challenge opponents to real-time "focus battles" via WebSockets.
- 🪙 **XP & Economy System**: Earn XP and coins upon successful completion. Spend your hard-earned coins in the shop to unlock premium badges.
- 🏆 **Leaderboards & Profiles**: Level up, view detailed statistics, track your current focus streak, and climb the public leaderboard.
- 👥 **Friends & Social System**: Add friends, track their status, and challenge them directly to focus matchups.
- 🛡️ **Anti-Distraction warnings**: Keep tabs on your focus session. Tab switching or navigation generates warnings, keeping you honest.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **State & Real-Time**: Socket.io-client, React Context API
- **Animations & Notifications**: Framer Motion, React Hot Toast
- **Icons**: Lucide React

### Backend
- **Framework**: NestJS (TypeScript-based Node.js framework)
- **Database**: PostgreSQL (TypeORM for database integration, compatible with Neon/Render cloud hosting)
- **Real-Time Communications**: Socket.io / NestJS WebSockets
- **Security & Auth**: Passport.js (JWT strategies), bcrypt hashing, Helmet, Express Rate Limit
- **Cron Jobs**: NestJS Schedule (for auto-checking expired challenges and periodic tasks)

---

## 📂 Project Structure

```text
FocusArena/
├── focus-arena-frontend/      # Vite + React Client
│   ├── src/
│   │   ├── api/               # Axios services
│   │   ├── components/        # Shared components
│   │   ├── context/           # React Auth context
│   │   ├── pages/             # App page views (Dashboard, Matchmaking, etc.)
│   │   └── socket/            # WebSocket connection manager
│   └── package.json
│
├── focus-arena-backend/       # NestJS Server
│   ├── src/
│   │   ├── auth/              # JWT Login/Register
│   │   ├── challenges/        # Timer core logic, matchmaking queue, rewards
│   │   ├── badges/            # User profile badges and milestones
│   │   ├── friends/           # Friends network logic
│   │   ├── leaderboard/       # Leaderboard calculations
│   │   ├── realtime/          # Socket.io gateways
│   │   └── users/             # User profiles, coins, XP, levels
│   └── package.json
└── README.md                  # This file
```

---

##  Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (local or cloud-hosted like Neon)

### 1. Database Setup
Create a PostgreSQL database named `focus_arena`.

### 2. Backend Configuration
Navigate to the backend directory and set up environment variables:
```bash
cd focus-arena-backend
# Create a .env file and populate it with database and auth parameters (see below)
```

Create a `focus-arena-backend/.env` file with the following variables:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_postgres_username
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=focus_arena
# DATABASE_URL=   # Use this direct connection URL if hosting on cloud (e.g., Neon PostgreSQL)

JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1d
PORT=3000
```

Install backend dependencies and start the NestJS dev server:
```bash
npm install
npm run start:dev
```

### 3. Frontend Configuration
Navigate to the frontend directory:
```bash
cd ../focus-arena-frontend
```

Create a `.env` file or rely on the fallback development URL:
```env
VITE_API_URL=http://localhost:3000
```

Install frontend dependencies and start the Vite development server:
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 Key WebSocket Events

- `join_queue` / `leave_queue`: Enter or leave matchmaking lobby.
- `challenge_started`: Triggered when an opponent is found and matchmaking resolves.
- `user_joined`: Fired when a user joins a pending group/solo challenge.
- `user_kicked`: Fired when a participant is kicked from an arena.

---

##  Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Jalaj-01/focusarena/issues).

---

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

Built with ❤️ by [Jalaj](https://github.com/Jalaj-01) 🚀
