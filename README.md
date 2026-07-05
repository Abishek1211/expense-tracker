# 💸 Expense Tracker

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![CI](https://github.com/Abishek1211/expense-tracker/actions/workflows/backend-ci.yml/badge.svg)

A full-stack expense tracking application with a Spring Boot REST API and a React dashboard.

**Features:** JWT auth with per-user data · natural-language quick add ("coffee 150 yesterday") ·
monthly summaries, 6-month trend chart, and spending insights · category budgets with progress
bars · recurring expenses (auto-created monthly) · search, filters, and CSV export · dark mode ·
optimistic UI with undo · a one-click **demo account** so you can try it without registering.

> 📷 _Screenshot placeholder — add a screenshot of the dashboard here._

**Live demo:** _frontend URL placeholder_ · **API docs:** _backend URL placeholder_`/swagger-ui.html`


## Tech Stack

| Layer      | Technology                                                              |
| ---------- | ----------------------------------------------------------------------- |
| Backend    | Java 21, Spring Boot 3.5, Spring Data JPA, Spring Security + JWT, Flyway, springdoc-openapi |
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS 4, TanStack Query, Recharts    |
| Database   | PostgreSQL (prod), H2 in-memory (dev), Testcontainers (integration tests) |
| Deployment | Render (backend, Docker) + Vercel (frontend)                            |
| CI         | GitHub Actions (path-filtered monorepo workflows)                       |

## Repository Layout

```
expense-tracker/
├── backend/     # Spring Boot REST API (Gradle, Kotlin DSL)
├── frontend/    # React + Vite SPA
├── docs/        # Architecture & deployment guides
└── .github/     # CI workflows
```

## Getting Started Locally

### Backend (port 8080)

Requires JDK 21.

```bash
cd backend
./gradlew bootRun          # starts with the `dev` profile → H2 in-memory DB
```

- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:expensedb`, user `sa`)
- Health check: http://localhost:8080/actuator/health

Run tests: `./gradlew test` (integration tests need Docker for Testcontainers; they are
skipped automatically when Docker is unavailable).

### Frontend (port 5173)

Requires Node 20+.

```bash
cd frontend
cp .env.example .env       # points at http://localhost:8080 by default
npm install
npm run dev
```

## API Summary

Auth (public): register or log in to get a JWT, then send it as `Authorization: Bearer <token>`.

| Method | Path                    | Description                          | Status          |
| ------ | ----------------------- | ------------------------------------ | --------------- |
| POST   | `/api/v1/auth/register` | Create an account, returns a JWT     | 201 / 400 / 409 |
| POST   | `/api/v1/auth/login`    | Exchange credentials for a JWT       | 200 / 401       |

Expenses (require a Bearer token; every query is scoped to the authenticated user):

| Method | Path                                  | Description                              | Status    |
| ------ | ------------------------------------- | ---------------------------------------- | --------- |
| GET    | `/api/v1/expenses`                    | Paged list; filters: `year`, `month`, `category`, `page`, `size`, `sort` | 200 |
| GET    | `/api/v1/expenses/{id}`               | Get one expense                          | 200 / 404 |
| POST   | `/api/v1/expenses`                    | Create an expense                        | 201 / 400 |
| PUT    | `/api/v1/expenses/{id}`               | Update an expense                        | 200 / 400 / 404 |
| DELETE | `/api/v1/expenses/{id}`               | Delete an expense                        | 204 / 404 |
| GET    | `/api/v1/expenses/summary?year=&month=` | Monthly totals grouped by category     | 200       |
| GET    | `/api/v1/expenses/trend?months=6`     | Monthly totals for the last N months     | 200       |
| GET    | `/api/v1/expenses/insights?year=&month=` | Spending insights vs the previous month | 200     |
| GET    | `/api/v1/expenses/export`             | CSV download of the filtered expenses    | 200       |
| GET/PUT/DELETE | `/api/v1/budgets[/{category}]` | Category budget limits                   | 200 / 204 |
| GET/POST/PUT/DELETE | `/api/v1/recurring[/{id}]` | Recurring expense definitions             | 200 / 201 / 204 |

The list endpoint also accepts `q` (note search), `from`, and `to` (ISO dates).

Errors follow a consistent shape:

```json
{
  "timestamp": "2026-07-03T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/expenses",
  "fieldErrors": { "amount": "Amount must be greater than zero" }
}
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — layered design, request flow, DTO/mapper rationale
- [Deployment](docs/DEPLOYMENT.md) — Render + Vercel step-by-step
- [Security](SECURITY.md) — JWT auth design, limitations, hardening ideas

## License

MIT — use it, fork it, learn from it.
