Project: Quiz Management System

Timebox: 2 hours (single continuous session)

Goals (minimal viable scope)

Must-have (for 2-hour window):

Admin panel (simple UI) to create a quiz with title and questions. Questions support: MCQ (multiple
choices), True/False, and free-text.

Public page to take a quiz and see immediate results after submission (score + per-question correct
answers for MCQ/TF, and 'manual' for text questions or simple exact-match scoring).

Backend API (CRUD for quizzes, submit attempts) with basic validation and error handling.

Database schema (Postgres / Neon) and migrations.

A short PLAN.md (this file), and at least 4 commits spaced ~30 minutes apart.

Nice-to-have (if time permits):

Persisted quiz attempts with timestamps.

Simple authentication for Admin (password in env, not full auth system).

Deployable build instructions / Dockerfile.

Assumptions

Single admin account is sufficient for the assignment (no full user management). Admin access can be
guarded by a simple environment password.

Questions will be simple: for MCQ we store options and the index of the correct option; True/False
is a boolean; text questions are exact-match (case-insensitive) for scoring.

A single correct answer per question (no multi-select) to keep implementation straightforward.

Neon (Postgres) will be used as the target DB; development can use a local connection string.

Tech choices & rationale

Frontend: Next.js (React) + TypeScript + Tailwind CSS + Redux Toolkit.

Next.js for routing and API routes; Tailwind for rapid styling; Redux Toolkit for predictable state
(quiz list, current attempt, admin UI state).

Backend / Database: Supabase (Postgres) as the primary database and auth/provider.

We'll use Supabase client directly from Next.js API routes and from the frontend where appropriate.
This avoids adding an ORM and keeps the implementation lightweight for the 2-hour window.

Why Supabase: it's Postgres under the hood, easy to use, provides hosted database service compatible
with the brief, and quick to integrate with Next.js. It also supports row-level security and auth if
we later opt to add admin authentication.

Rationale for choices: Keeping backend logic inside Next.js API routes minimizes infra setup and
speeds development. Redux Toolkit will manage client-side state for quiz-taking flow and admin form
builder.
