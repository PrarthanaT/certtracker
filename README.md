# CertTracker — AWS DVA-C02 Study Tracker

A full-stack study tracker built to conquer the AWS Certified Developer Associate (DVA-C02) exam. Track weekly topics, log study sessions, record practice scores, and monitor countdown to exam day.

## Screenshot

> <img width="1469" height="956" alt="Screenshot 2026-05-13 at 6 49 28 PM" src="https://github.com/user-attachments/assets/1a841206-32e2-4329-9c7e-e17e43196434" />


## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| State / Data | TanStack Query v5 |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Prisma ORM (LibSQL adapter) |
| Charts | Recharts |
| Extras | canvas-confetti, dark mode |

## Features

- **10-Week Study Plan** — expandable week cards with topic checklists, colored service tags, per-week progress bars, and auto-saving notes. Confetti burst when a week hits 100%.
- **Domain Weights** — horizontal bar chart of DVA-C02 exam domains (Development 32%, Security 26%, Deployment 24%, Troubleshooting 18%) with a focus tip card.
- **Practice Scores** — track up to 5 practice exams with live pass/fail badges. "Ready to book?" banner turns green when your last two scores both hit target.
- **Study Log** — timestamped session log with optional duration. Press `/` anywhere to focus the input. Delete with inline confirm.
- **Countdown** — click "Days to Exam" stat card to set your exam date. Color shifts green → amber → red as the day approaches.
- **Dark / Light mode** — toggle in the header, persisted to localStorage. Defaults to dark.
- **JSON Export** — download all your data (weeks, topics, notes, study log, practice scores) as a single JSON file.

## Project Structure

```
certtracker/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx             # Layout, stats bar, tab nav, dark mode
│   │   ├── api.ts              # Typed API client
│   │   ├── types.ts            # Shared TypeScript types & constants
│   │   ├── main.tsx            # React entry point + QueryClientProvider
│   │   └── components/
│   │       ├── WeeklyPlan.tsx  # 10-week plan with optimistic topic toggles
│   │       ├── Domains.tsx     # Domain weights chart
│   │       ├── PracticeScores.tsx
│   │       ├── StudyLog.tsx    # Session log with / shortcut
│   │       └── Resources.tsx   # Curated links grid
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
├── server/
│   ├── src/index.ts            # Express server + all REST routes
│   ├── prisma/
│   │   ├── schema.prisma       # Week, Topic, Note, StudyLog, PracticeScore
│   │   ├── seed.ts             # 10 weeks of DVA-C02 content
│   │   └── migrations/
│   ├── prisma.config.ts        # Prisma 7 config (LibSQL adapter + seed)
│   └── package.json
├── package.json                # Root scripts (dev, build, install:all)
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Set up the database

```bash
cd server
npx prisma migrate dev
npx prisma db seed
cd ..
```

### 3. Run in development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Build for production

```bash
npm run build
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/weeks` | All weeks with topics and notes |
| PUT | `/api/weeks/:id` | Update notes, topics, or isOpen |
| PATCH | `/api/topics/:id` | Toggle a topic's completed state |
| POST | `/api/notes` | Upsert a week note |
| GET | `/api/practice-scores` | All practice exam slots |
| PUT | `/api/practice-scores/:id` | Save a score |
| GET | `/api/study-log` | All study log entries |
| POST | `/api/study-log` | Add a log entry |
| DELETE | `/api/study-log/:id` | Remove an entry |
| GET | `/api/export` | Download full data as JSON |

## Pushing to GitHub

After cloning or initializing locally, run:

```bash
git remote add origin https://github.com/<your-username>/certtracker.git
git branch -M main
git push -u origin main
```
