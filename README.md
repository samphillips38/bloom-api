# Bloom API

REST API backend for the Bloom learning platform — an interactive course-based education app inspired by Brilliant.

## Tech Stack

- **Runtime:** Node.js (≥18)
- **Framework:** Express with TypeScript
- **Database:** PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/)
- **Auth:** JWT + bcrypt (email/password & social login)
- **Validation:** Zod
- **Security:** Helmet, CORS

## Project Structure

```
src/
├── config/          # Environment variables & database connection
├── controllers/     # Route handlers (auth, courses, progress)
├── db/              # Drizzle schema, migrations & seed scripts
├── middleware/       # Auth & error handling middleware
├── routes/          # Express route definitions
├── services/        # Business logic layer
└── index.ts         # App entry point
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Path        | Auth | Description          |
|--------|-------------|------|----------------------|
| POST   | `/register` | No   | Create new account   |
| POST   | `/login`    | No   | Email/password login |
| POST   | `/social`   | No   | Social OAuth login   |
| GET    | `/profile`  | Yes  | Get current user     |

### Courses (`/api/courses`)
| Method | Path                        | Auth | Description               |
|--------|-----------------------------|------|---------------------------|
| GET    | `/`                         | No   | List all courses          |
| GET    | `/categories`               | No   | List categories           |
| GET    | `/recommended`              | No   | Get recommended courses   |
| GET    | `/:id`                      | No   | Course detail with levels |
| GET    | `/lessons/:id`              | No   | Lesson with content       |
| GET    | `/levels/:levelId/lessons`  | No   | Lessons in a level        |

### Progress (`/api/progress`)
| Method | Path                  | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| GET    | `/stats`              | Yes  | User stats & streak      |
| GET    | `/course/:courseId`   | Yes  | Progress for a course    |
| GET    | `/lesson/:lessonId`   | Yes  | Progress for a lesson    |
| POST   | `/update`             | Yes  | Update lesson progress   |
| POST   | `/energy/consume`     | Yes  | Consume energy point     |

## Database Schema

The PostgreSQL database contains the following tables:

- **users** — accounts with email, name, energy, premium status
- **streaks** — daily activity tracking per user
- **categories** — course groupings (e.g. Math, Science, CS)
- **courses** — individual courses with theme colors and metadata
- **levels** — ordered sections within a course
- **lessons** — individual lessons/exercises/quizzes within levels
- **lesson_content** — ordered content blocks (text, images, interactive, questions)
- **user_progress** — per-lesson completion and scoring

## Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

| Variable             | Description                     | Default                  |
|----------------------|---------------------------------|--------------------------|
| `DATABASE_URL`       | PostgreSQL connection string    | `postgresql://localhost:5432/bloom` |
| `JWT_SECRET`         | Secret key for JWT signing      | *(dev default provided)* |
| `JWT_EXPIRES_IN`     | Token expiration                | `7d`                     |
| `PORT`               | Server port                     | `3000`                   |
| `NODE_ENV`           | Environment                     | `development`            |

## Deployment

### Docker

```bash
docker build -t bloom-api .
docker run -p 3000:3000 --env-file .env bloom-api
```

### Railway

The project includes a `railway.json` configuration for one-click deployment on [Railway](https://railway.app). The health check endpoint is available at `/health`.
