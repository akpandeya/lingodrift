# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository Purpose

LingoDrift is a full-stack language learning platform with exam management, user tracking, and progress analytics. Helps users prepare for standardized language exams through interactive practice tests and spaced repetition.

## Monorepo Structure

```
lingodrift/
├── backend/              # FastAPI + PostgreSQL + SQLAlchemy
├── frontend/             # React + TypeScript + Vite
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml
└── CLAUDE.md            # This file
```

## TDD Agents

This project uses agents from the agentic-workflows repository for strict Test-Driven Development workflows.

**Backend (Python):**
- `/test_writer_py` - Write pytest tests for backend (RED phase)
- `/code_writer_py` - Implement Python code with DDD patterns (GREEN phase)

**Frontend (TypeScript):**
- `/test_writer_ts` - Write Vitest tests for frontend (RED phase)
- `/code_writer_ts` - Implement TypeScript code with DDD patterns (GREEN phase)

**Shared:**
- `/test_runner` - Run pytest (backend) or Vitest (frontend) - auto-detects
- `/ddd_architect` - Domain modeling and architecture guidance

See `../agentic-workflows/CLAUDE.md` for complete agent documentation and TDD workflow.

## Related Repositories

- `../agentic-workflows` - TDD/DDD agent definitions and workflows
- `../akpandeya.com` - Personal website (may share authentication patterns)
- `../oracle-infrastructure` - Deployment infrastructure (SSH access required)

## SSH and Git Permissions

This project uses 1Password for SSH/git credential management.

**Permission Pattern**: Always test SSH and git connections early in tasks to trigger 1Password approval prompts:

```bash
# Test connections at the start of tasks
ssh exterminator echo "Connected"  # Oracle infrastructure access
gh auth status                      # GitHub CLI authentication

# Wait for 1Password approval
# User can then step away from PC
# Proceed with actual work
```

### SSH Configuration

**Oracle Infrastructure Access**:
- **SSH alias**: `exterminator` (defined in `~/.ssh/config`)
- **Auth**: 1Password SSH Agent (requires manual approval)
- **Purpose**: Deployment, infrastructure management, production access

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

## Common Commands

### Backend Development

```bash
# Start development server
cd backend
uv run uvicorn main:app --reload

# Run tests
uv run pytest                         # Run all tests
uv run pytest --watch                 # Watch mode for TDD
uv run pytest --cov                   # With coverage
uv run pytest --cov --cov-report=html # HTML coverage report
uv run pytest --cov --cov-fail-under=85 # Enforce 85% coverage

# Database migrations
uv run alembic revision --autogenerate -m "Description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

### Frontend Development

```bash
# Start development server
cd frontend
npm run dev                   # http://localhost:5173

# Testing
npm run test                  # Watch mode for TDD
npm run test:run              # Run once
npm run test:coverage         # With coverage
npm run test:ui               # Open Vitest UI

# Linting & Building
npm run lint                  # ESLint
npm run build                 # Production build
npm run preview               # Preview production build
```

### Docker Development

```bash
# Start full stack
docker-compose up

# Services available at:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - Database: localhost:5432

# Run tests in Docker
docker-compose exec backend uv run pytest
docker-compose exec frontend npm run test:run
```

## Development Workflow (Strict TDD)

### Backend (Python)
1. **RED:** `/test_writer_py` creates pytest test in `backend/tests/`
2. **GREEN:** `/code_writer_py` implements domain/application logic
3. **REFACTOR:** Improve while keeping tests green
4. **VERIFY:** `/test_runner` runs `uv run pytest --cov`

### Frontend (TypeScript)
1. **RED:** `/test_writer_ts` creates Vitest test in `*.test.tsx`
2. **GREEN:** `/code_writer_ts` implements component/hook
3. **REFACTOR:** Extract reusable logic
4. **VERIFY:** `/test_runner` runs `npm run test`

## Domain Model

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

### Ubiquitous Language

- "Exam" not "test" or "quiz"
- "Section" not "part" or "chapter"
- "Attempt" not "session" or "take"
- "Question" not "item" or "problem"

## Testing Requirements

### Backend Coverage
- **Domain Logic:** 90%+
- **Application Layer:** 85%+
- **API Routes:** 85%+
- **Overall:** 85%+

### Frontend Coverage
- **Components:** 80%+
- **Hooks/Utils:** 90%+
- **Business Logic:** 90%+
- **Overall:** 80%+

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

## Common Tasks

### Add New API Endpoint

```bash
# 1. Write test first
cd backend
/test_writer_py "Test POST /api/exams endpoint creates new exam"

# 2. Implement
/code_writer_py "Implement exam creation endpoint in routes/exams.py"

# 3. Run tests
uv run pytest -k test_create_exam

# 4. Verify coverage
uv run pytest --cov
```

### Add New React Component

```bash
# 1. Write test
cd frontend
/test_writer_ts "Test ExamCard component displays title and level"

# 2. Implement
/code_writer_ts "Create ExamCard component in components/"

# 3. Run tests
npm run test -- ExamCard

# 4. Verify coverage
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

## Best Practices

1. **Tests first** - All code requires tests before implementation
2. **Domain-driven** - Model the language learning domain accurately
3. **Self-documenting** - Clear names, minimal comments
4. **Type safety** - TypeScript strict mode, Pydantic validation
5. **API contracts** - Pydantic schemas for request/response
6. **Error handling** - Proper HTTP status codes, error messages
7. **Security** - Input validation, SQL injection prevention, XSS protection

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

- **TDD/DDD Agents:** `../agentic-workflows/`
- **FastAPI:** https://fastapi.tiangolo.com
- **SQLAlchemy:** https://docs.sqlalchemy.org
- **React:** https://react.dev
- **Vitest:** https://vitest.dev

## Notes

- Backend uses UV for fast Python package management
- Frontend uses Vite for fast builds
- All deployments require passing tests
- Staging auto-deploys, production is manual
