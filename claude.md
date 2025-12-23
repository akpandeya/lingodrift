# Claude Code Guide for LingoDrift

## Project Overview
Full-stack language learning platform with exam management, user tracking, and progress analytics. Monorepo with FastAPI backend and React frontend, following strict TDD and DDD principles.

## Monorepo Structure

```
flashcards/
├── backend/              # FastAPI + PostgreSQL + SQLAlchemy
├── frontend/             # React + TypeScript + Vite
├── .agent/
│   ├── rules/
│   │   └── context.md
│   └── skills/          # Symlinked to claude-tdd-skills
├── .github/workflows/   # CI/CD pipelines
├── docker-compose.yml
└── claude.md           # This file
```

## Tech Stack

### Backend
- **Framework:** FastAPI 0.124.4 (Python 3.13)
- **Database:** PostgreSQL 16 + SQLAlchemy 2.0
- **Migrations:** Alembic
- **Testing:** pytest + pytest-cov
- **Package Manager:** UV (astral-sh/uv)

### Frontend
- **Framework:** React 18 + TypeScript 5
- **Build Tool:** Vite 7
- **Testing:** Vitest + React Testing Library
- **Styling:** Tailwind CSS 3
- **HTTP Client:** Axios with interceptors

## Development Workflow (Strict TDD)

### Backend Development (Python)

1. **RED:** `/test_writer_py` creates pytest test in `backend/tests/`
2. **GREEN:** `/code_writer_py` implements domain/application logic
3. **REFACTOR:** Improve while keeping tests green
4. **VERIFY:** `/test_runner` runs `uv run pytest --cov`

```bash
# Watch mode for TDD
cd backend
uv run pytest --watch

# With coverage
uv run pytest --cov --cov-report=html
```

### Frontend Development (TypeScript)

1. **RED:** `/test_writer_ts` creates Vitest test in `*.test.tsx`
2. **GREEN:** `/code_writer_ts` implements component/hook
3. **REFACTOR:** Extract reusable logic
4. **VERIFY:** `/test_runner` runs `npm run test`

```bash
# Watch mode
cd frontend
npm run test

# Coverage
npm run test:coverage
```

## Available Agents

**Backend (Python):**
```bash
/test_writer_py  # Generate pytest tests for backend
/code_writer_py  # Implement Python code following TDD and DDD patterns
```

**Frontend (TypeScript):**
```bash
/test_writer_ts  # Generate Vitest tests for frontend
/code_writer_ts  # Implement TypeScript code following TDD and DDD patterns
```

**Shared:**
```bash
/test_runner     # Run pytest (backend) or Vitest (frontend) - auto-detects
/ddd_architect   # Domain modeling and architecture guidance
```

## Domain-Driven Design

### Bounded Contexts

1. **Exam Management**
   - Exam creation, sections, questions
   - Question types: multiple choice, fill-in-blank, essay, audio
   - Business rules: section ordering, question points

2. **User Management**
   - User registration, authentication (JWT)
   - OAuth providers (Google, GitHub)
   - Profile management

3. **Attempt Tracking**
   - Exam attempts with timing
   - Scoring and grading logic
   - Attempt history

4. **Analytics** (future)
   - Progress reports
   - Performance statistics
   - Learning insights

### Aggregates

**Exam Aggregate**
```
Exam (root)
├── ExamSection (entity)
│   └── Question (entity)
└── Metadata (value object)
```

**User Aggregate**
```
User (root)
└── ExamAttempt (entity)
```

### Domain Events

- ExamCreated
- ExamPublished
- ExamAttemptStarted
- ExamAttemptCompleted
- UserRegistered
- UserEmailVerified

### Repository Pattern

```python
# Domain interface
class ExamRepository(ABC):
    @abstractmethod
    async def find_by_id(self, exam_id: int) -> Optional[Exam]:
        pass

    @abstractmethod
    async def save(self, exam: Exam) -> None:
        pass

# Infrastructure implementation
class SQLAlchemyExamRepository(ExamRepository):
    # Actual database queries
    pass
```

## Testing

### Backend Coverage Requirements

- **Domain Logic:** 90%+
- **Application Layer:** 85%+
- **API Routes:** 85%+
- **Overall:** 85%+

```bash
cd backend
uv run pytest --cov --cov-fail-under=85
```

### Frontend Coverage Requirements

- **Components:** 80%+
- **Hooks/Utils:** 90%+
- **Business Logic:** 90%+
- **Overall:** 80%+

```bash
cd frontend
npm run test:coverage
```

### Test Organization

**Backend:**
```
backend/
├── tests/
│   ├── test_main.py           # API integration tests
│   ├── domain/
│   │   └── test_exam.py       # Domain logic tests
│   ├── application/
│   │   └── test_use_cases.py  # Use case tests
│   └── infrastructure/
│       └── test_repositories.py
```

**Frontend:**
```
frontend/src/
├── components/
│   ├── Sidebar.tsx
│   └── Sidebar.test.tsx
├── pages/
│   └── auth/
│       ├── Login.tsx
│       └── Login.test.tsx
└── hooks/
    ├── useAuth.ts
    └── useAuth.test.ts
```

## CI/CD Pipelines

### ci-backend.yml
Runs on changes to `backend/**`
- Install dependencies (UV)
- Run pytest with coverage
- Report coverage

### ci-frontend.yml
Runs on changes to `frontend/**`
- Install dependencies (npm)
- Lint (ESLint)
- Test (Vitest) with coverage
- Build (Vite)

### deploy-staging.yml
Auto-deploys on push to main
- Deploy frontend to `/var/www/lingodrift/`
- Deploy backend via Docker Compose
- Run Alembic migrations
- Reload Caddy

### deploy-production.yml
Manual deployment (workflow_dispatch)
- Same as staging but to production paths
- Requires approval

## Common Tasks

### Add New API Endpoint

```bash
# 1. Write test first
cd backend
/test_writer "Test POST /api/exams endpoint creates new exam"

# 2. Implement
/code_writer "Implement exam creation endpoint in routes/exams.py"

# 3. Run tests
uv run pytest -k test_create_exam

# 4. Verify
uv run pytest --cov
```

### Add New React Component

```bash
# 1. Write test
cd frontend
/test_writer "Test ExamCard component displays title and level"

# 2. Implement
/code_writer "Create ExamCard component in components/"

# 3. Run tests
npm run test -- ExamCard

# 4. Verify
npm run test:coverage
```

### Database Migration

```bash
# 1. Modify SQLAlchemy models in backend/models.py
# 2. Generate migration
cd backend
uv run alembic revision --autogenerate -m "Add exam time limit"

# 3. Review migration file in alembic/versions/
# 4. Test migration
uv run alembic upgrade head

# 5. Add to repository
git add alembic/versions/
```

## Self-Documenting Code

Write clear, descriptive code. Avoid comments except for business rules.

**GOOD:**
```typescript
function calculateExamScorePercentage(
  correctAnswers: number,
  totalQuestions: number
): number {
  return Math.round((correctAnswers / totalQuestions) * 100);
}
```

**BAD:**
```typescript
function calc(c: number, t: number): number {
  return Math.round((c / t) * 100); // calculate score
}
```

**Business rule comments:**
```python
def can_attempt_exam(user: User, exam: Exam) -> bool:
    # Business rule: Users must complete tutorial before attempting level A2+ exams
    # This ensures users understand the exam interface
    if exam.level in ["A2", "B1", "B2", "C1"] and not user.tutorial_completed:
        return False
    return True
```

## Docker Development

### Start Full Stack

```bash
docker-compose up
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Database: localhost:5432

### Run Tests in Docker

```bash
# Backend tests
docker-compose exec backend uv run pytest

# Frontend tests
docker-compose exec frontend npm run test:run
```

## Authentication

### JWT Flow
1. User logs in: POST `/api/auth/login`
2. Backend returns JWT token
3. Frontend stores in localStorage
4. Axios interceptor adds to headers
5. Backend validates on protected routes

### OAuth Flow
1. User clicks "Login with Google"
2. Redirect to OAuth provider
3. Callback to `/api/auth/oauth/callback`
4. Backend creates/updates user
5. Returns JWT token

## Best Practices

1. **Tests first** - All code requires tests before implementation
2. **Domain-driven** - Model the language learning domain accurately
3. **Self-documenting** - Clear names, minimal comments
4. **Type safety** - TypeScript strict mode, Pydantic validation
5. **API contracts** - Pydantic schemas for request/response
6. **Error handling** - Proper HTTP status codes, error messages
7. **Security** - Input validation, SQL injection prevention, XSS protection

## Troubleshooting

### Backend

```bash
# Database connection issues
docker-compose down
docker-compose up db

# Migration issues
uv run alembic downgrade -1
uv run alembic upgrade head

# Test failures
uv run pytest -v --tb=short
```

### Frontend

```bash
# Dependency issues
rm -rf node_modules package-lock.json
npm install

# Test failures
npm run test -- --reporter=verbose

# Build issues
rm -rf dist
npm run build
```

## Resources

- **Skills:** `/Users/dipukumari/Documents/akpandeya/claude-tdd-skills/`
- **FastAPI:** https://fastapi.tiangolo.com
- **SQLAlchemy:** https://docs.sqlalchemy.org
- **React:** https://react.dev
- **Vitest:** https://vitest.dev

## Notes

- Backend uses UV for fast Python package management
- Frontend uses Vite for fast builds
- All deployments require passing tests
- Staging auto-deploys, production is manual
