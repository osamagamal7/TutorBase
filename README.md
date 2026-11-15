# Tutorbase

Tutorbase is a web platform for independent tutors and small schools. Tutors publish courses, upload materials, set weekly availability for live one-to-one sessions, and create quizzes. Students browse the catalogue, enroll for free, read materials, book sessions, take quizzes, and see their progress. An AI assistant answers questions using only the materials of enrolled courses, with citations, and helps tutors generate quiz questions.

The product rules, data model, and API are in [`docs/PROJECT-SPEC.md`](docs/PROJECT-SPEC.md). Screen layouts are in the [wireframes](https://cursor.com/canvas/store-313d95f8-a359-408f-b7f5-88523446e4f6/52a8c66e-bc0f-4c11-93e5-5fca28bde28b).

## Users

| Role | What they can do | How they get the role |
| --- | --- | --- |
| Student | Browse, enroll, read materials, book sessions, take quizzes, use the AI assistant | Chooses "I want to learn" at sign-up |
| Tutor | Everything a student can, plus create and manage their own courses, materials, quizzes, and availability | Chooses "I want to teach" at sign-up |
| Admin | Stored for moderation and support; no admin UI in v1 | Created by the seed script only |

## Core flows

1. **Tutor onboarding.** Sign up as a tutor, fill in a profile (bio, meeting link, session length), create a course, upload materials, create a quiz, set availability, and publish.
2. **Student learning.** Sign up as a student, browse the catalogue, enroll, read materials and mark them done, take a quiz, and see progress on the dashboard.
3. **Booking.** An enrolled student picks a free slot in their own time zone, both people get a confirmation email, the session appears on both dashboards, a reminder goes out 24 hours before, and either side can cancel (the student up to 12 hours before).
4. **AI.** An enrolled student asks a question in the course assistant and gets a streamed answer with citations. A tutor can generate quiz questions from a material and reviews them before saving. A study-plan assistant can propose bookings; it never creates one on its own.

## Scope

**v1**

- Email and password sign-up and log-in, with sessions in secure cookies.
- Public course catalogue with search and filters, and a public course page.
- Course editor: details, PDF and Markdown materials, quizzes, and enrolled students with progress.
- Weekly availability and session length (30, 45, or 60 minutes).
- Free enrollment, material downloads, and marking materials as done.
- Session booking and cancellation, with confirmation, cancellation, and reminder emails.
- Multiple-choice quizzes with unlimited attempts; the best score counts.
- Settings: name, UI language, time zone, tutor profile, download my data, delete my account.
- Two UI languages: English and one of German, French, Spanish, or Dutch.

**AI**

- "Ask this course" assistant with streaming answers and citations. Retrieval is limited in SQL to courses the student is enrolled in or the tutor owns.
- Quiz question generator. The tutor always reviews questions before they are saved.
- Study-plan assistant that can propose bookings and never creates them automatically.
- Usage limits, cost tracking, and an evaluation script.

**Out of scope until v1 is live**

Google OAuth, password reset by email, paid courses with Stripe (test mode), rescheduling, blocked dates, an admin UI, real-time notifications, in-app video calls, ratings and reviews, group sessions, and mobile apps. Tutors paste their own meeting link.

## Stack

TypeScript end to end.

| Layer | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js (App Router), React 19, Tailwind, shadcn/ui, TanStack Query, React Hook Form + Zod |
| API | NestJS, REST JSON under `/api/v1`, OpenAPI at `/api/docs` |
| Database | PostgreSQL + Drizzle ORM; pgvector in the same database |
| Jobs and cache | Redis + BullMQ |
| Files | S3-compatible storage (MinIO locally, Cloudflare R2 in production), presigned uploads |
| Email | Mailpit locally, Resend in production |
| AI | Vercel AI SDK; Ollama locally, a hosted provider for the live demo |
| Testing | Vitest or Jest, Supertest + Testcontainers, Playwright |
| Hosting | Vercel (web), Neon (Postgres), Upstash (Redis), a container host or a small VPS for the API |

The browser talks only to the Next.js app. `/api/*` is rewritten to the API so session cookies stay on one origin (`SameSite=Lax`).

## Repository layout

```text
apps/
  web/                    Next.js app
    src/app/[locale]/     routes, prefixed with the locale (/en/courses, /de/courses)
    src/lib/api/          API client (mock, then real) behind one interface
    messages/             i18n strings
    e2e/                  Playwright tests
  api/                    NestJS app
    src/modules/          auth, users, courses, enrollments, materials, availability,
                          bookings, quizzes, progress, notifications, ai, health
    src/db/               Drizzle schema, migrations, seed
    test/                 integration tests (Testcontainers)
packages/
  shared/                 Zod schemas and types used by both apps
docs/                     product spec, tasks, and how to follow the build
```

## Screens

All routes are locale-prefixed.

| Screen | Route | Who |
| --- | --- | --- |
| Landing | `/` | Public |
| Sign up and log in | `/signup`, `/login` | Public |
| Course catalogue | `/courses` | Public |
| Course detail | `/courses/[slug]` | Public |
| Tutor dashboard | `/tutor` | Tutor |
| Course editor | `/tutor/courses/[id]` | Tutor (owner) |
| Availability and tutor profile | `/tutor/availability` | Tutor |
| Quiz builder | `/tutor/courses/[id]/quizzes/[quizId]` | Tutor (owner) |
| Student dashboard | `/student` | Student |
| Course learning page | `/student/courses/[slug]` | Enrolled student |
| Book a session | `/student/courses/[slug]/book` | Enrolled student |
| Take quiz and result | `/student/quizzes/[quizId]` | Enrolled student |
| Settings | `/settings` | Signed in |
| Study plan | `/student/courses/[slug]/plan` | Enrolled student |

## Build phases

| Phase | Outcome |
| --- | --- |
| 0. Kickoff | Repo, CI, and an agreed spec |
| 1. Frontend | Clickable UI with mock data, deployed |
| 2. Backend | Real API, database, auth, and the core flows working end to end |
| 3. Production | v1 live: Docker, CI/CD, monitoring, emails, GDPR export and account deletion |
| 4. AI | RAG assistant with citations, quiz generator, study-plan assistant, evals |

Work is split into tickets in [`docs/tasks/`](docs/tasks/README.md). Each ticket is one issue and, normally, one pull request. The week-by-week order is in [`docs/HOW-TO-FOLLOW.md`](docs/HOW-TO-FOLLOW.md).

## Quality bar

- Every screen has loading, empty, and error states, works at 375 px wide, is usable with a keyboard, and keeps all copy in the i18n files.
- Every endpoint validates input with a shared Zod schema, checks role and ownership, returns `{ error: { code, message, details } }`, and has an integration test for success and for forbidden.
- Times are stored in UTC and shown in the viewer's time zone. A tutor's weekly windows stay fixed in the tutor's time zone across daylight-saving changes.
- Passwords are at least 10 characters and hashed with argon2id. Only a hash of the session token is stored.

## Docs

| Document | What it is |
| --- | --- |
| [`docs/PROJECT-SPEC.md`](docs/PROJECT-SPEC.md) | Scope, business rules, data model, API, screens |
| [`docs/tasks/`](docs/tasks/README.md) | Tickets with scope and acceptance criteria |
| [`docs/HOW-TO-FOLLOW.md`](docs/HOW-TO-FOLLOW.md) | Day-one setup and the order to build the tickets |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Stack, what each phase covers, and references |
| [Wireframes](https://cursor.com/canvas/store-313d95f8-a359-408f-b7f5-88523446e4f6/52a8c66e-bc0f-4c11-93e5-5fca28bde28b) | All 14 screens, desktop and mobile |
| [`scripts/create-issues.mjs`](scripts/create-issues.mjs) | Creates a GitHub issue for every ticket |

The spec wins when a ticket and the spec disagree: fix one of them in a pull request so they match again.
