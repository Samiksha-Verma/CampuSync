# CampuSync

AI-powered centralized career management platform for a single college. Built as a microservices monorepo — three roles (Student, Faculty, Admin), real-time dashboard updates via Socket.io, no multi-tenancy, no gamification.

## Monorepo structure

```
CampuSync/
├── package.json                     # root — `npm run dev` starts all ten together (concurrently)
├── api-gateway/                     # ✅ Phase 2 — single entry point, routes to services, verifies JWT
├── services/
│   ├── auth-service/                # ✅ Phase 1 — built
│   ├── user-service/                # ✅ Phase 2 — built
│   ├── events-service/              # ✅ Phase 3 — built
│   ├── opportunities-service/       # ✅ Phase 3 — built
│   ├── certification-service/       # ✅ Phase 3 — built
│   ├── notification-service/        # ✅ Phase 4 — built (out of original order, see below)
│   ├── document-vault-service/      # ✅ Phase 5 — built
│   ├── ai-service/                  # ✅ Phase 6 — built
│   └── mock-test-service/           # ✅ Phase 7 — built
└── frontend/                        # empty — future phase
```

All ten backend services and the gateway are implemented — every originally-planned service is now built. Only `frontend` remains.

As of Phase 2, **all requests should go through the gateway** (`http://localhost:5000/api/...`) rather than hitting `auth-service` / `user-service` directly on their own ports — that's how the frontend will talk to the backend.

---

## Phase 1 — Auth Service

Handles login and JWT issuance for all three roles.

- **Student**: `collegeId` + password → OTP emailed → OTP verified → JWT
- **Faculty**: email + password → JWT (no OTP)
- **Admin**: email + password → JWT (no OTP)
- **Admin → add Faculty**: admin-only, protected route. Generates a temp password, emails it to the new faculty member. If the email fails to send, the faculty account is rolled back (not left orphaned).

### Tech

Express + MongoDB (Mongoose) + JWT + bcrypt + Nodemailer.

### Data models

| Model | Key fields |
|---|---|
| `Student` | `collegeId` (format `ABC/2023/005`, unique), `passwordHash`, `name`, `email`, `branch`, `year`, `isVerified` |
| `Faculty` | `email` (unique), `passwordHash`, `name`, `addedBy` (ref → Admin) |
| `Admin` | `email` (unique), `passwordHash`, `name` |
| `Otp` | `student` (ref), `otpHash`, `expiresAt` (TTL-indexed — Mongo auto-deletes expired OTPs) |

---

## Phase 2 — User Service

Manages profile data for all three roles — separate from auth credentials, in its own database.

- **`GET /users/profile/:userId`** — fetch a profile. Any authenticated user can view any profile. If the caller is looking at *their own* `userId` and no profile exists yet, it's created on the spot (empty). Looking up someone else's `userId` that has no profile yet returns 404.
- **`PUT /users/profile/:userId`** — update a profile. Students/Faculty may only edit their own; Admin may edit anyone's. Creates the profile on first write (upsert) — no separate "create profile" call needed.
- **`POST /users/profile/:userId/avatar`** — upload/replace an avatar image (`multipart/form-data`, field name `avatar`). Same self-or-admin rule as `PUT`. Images are uploaded to Cloudinary; `avatarUrl` is updated to the returned secure URL.

### Why role isn't always known

A `Profile` document only knows a user's `role` (student/faculty/admin) when that user has touched their own profile at least once (their JWT carries the role). If an Admin edits someone else's profile before that person has ever logged into their own, the `role` field is simply left blank until the real owner's next self-edit fills it in. This is a deliberate simplification — user-service has no way to ask auth-service "what role is this userId" without adding cross-service coupling, and it isn't needed for Phase 2's endpoints.

### Tech

Express + MongoDB (Mongoose) + JWT (verifies tokens issued by auth-service, using the same `JWT_SECRET`) + Multer + Cloudinary.

### Data model

| Model | Key fields |
|---|---|
| `Profile` | `userId` (unique, matches a Student/Faculty/Admin `_id` from auth-service), `role` (student/faculty/admin, optional), `phone`, `college`, `branch`, `year`, `linkedin`, `github`, `skills[]`, `bio`, `avatarUrl` |

---

## Phase 2 — API Gateway

Single entry point on its own port (`5000`). Everything the frontend talks to goes through here.

- `/api/auth/*` → proxied to `auth-service`
- `/api/users/*` → proxied to `user-service`
- Commented-out placeholders in [api-gateway/config/services.js](api-gateway/config/services.js) and [api-gateway/server.js](api-gateway/server.js) show the pattern for mounting each future service (`/api/events`, `/api/opportunities`, etc.) as it's built.
- CORS is handled here (`FRONTEND_ORIGIN` env var), not in the downstream services' role in production.

### JWT verification: both gateway and service layer

The gateway verifies the JWT before forwarding any protected route, so bad tokens are rejected at the front door without wasting a hop into a backend service. **Each service also independently re-verifies the same token** using the shared `JWT_SECRET` — this matters because in local dev every service has its own open port, so a service is reachable directly, not only through the gateway. The gateway also forwards the decoded identity as `x-user-id` / `x-user-role` headers for convenience/logging, but no service *trusts* those headers for authorization — they always re-derive identity from the `Authorization` header themselves.

One consequence of proxying: the gateway does **not** run `express.json()` or any other body parser. It only ever inspects the `Authorization` header. Parsing the body at the gateway would consume the request stream and break proxying for JSON bodies and file uploads alike.

### Route-level authorization at the gateway

Today the gateway enforces exactly one role restriction itself — `POST /api/auth/admin/add-faculty` requires an `admin` token, mirroring the rule already built into auth-service. Beyond that, the gateway just requires *some* valid token on `/api/users/*`, `/api/events/*`, `/api/opportunities/*`, and `/api/certifications/*`; all finer-grained role and ownership rules live inside each service, since that's where the business logic actually belongs.

---

## Phase 3 — Events, Opportunities & Certification Services

Three independent content services, all following the same shape: Admin/Faculty post content, Students browse it, expired postings quietly drop out of the default list without being deleted.

**Real-time sync deferred:** the original project brief calls for Admin/Faculty changes to reflect instantly on Student dashboards via Socket.io. That's deliberately **not** part of Phase 3 — it gets its own phase later (likely alongside `notification-service`) so the real-time architecture can be designed once, properly, instead of bolted onto three services separately. Phase 3 is REST-only; the frontend will need to poll or refetch for now. *(Resolved in Phase 4, below — `notify()` calls were added to all three services' create/update/delete handlers once notification-service existed to receive them.)*

**Ownership model:** Faculty may only edit/delete content *they personally created*; Admin can edit/delete anyone's. This is enforced by an `ownership.js` middleware (identical in all three services) that fetches the record, checks `record.createdBy === req.user.id || req.user.role === 'admin'`, and attaches the record to `req.record` so the controller doesn't re-query.

**Expiry model:** nothing is ever physically deleted for expiring — a `deadline` field just stops matching the default list filter (`deadline >= now`). Two things keep history reachable:
- `GET /:id` on any single record **always** returns it, expired or not, so old direct links keep working.
- Admin/Faculty can pass `?includeExpired=true` on any list endpoint to see the full history in one view. The flag is silently ignored for Students — they never see expired postings, list or no flag.

### Events Service

- `GET /events` (`?includeExpired=true`) · `GET /events/:id` · `POST /events` (Admin/Faculty) · `PUT /events/:id` / `DELETE /events/:id` (creator or Admin)

| Model | Key fields |
|---|---|
| `Event` | `name`, `organizingClub`, `coordinatorName`, `contactInfo`, `description`, `deadline`, `registrationLink`, `createdBy` |

### Opportunities Service

Offcampus internships/jobs only, and **purely an information listing**. Students click `applicationLink` and apply directly on the company's own site, entirely outside CampuSync — the platform has no way to know whether they applied or what happened, and (as of a correction to the original design) deliberately doesn't try to track it.

- `GET /opportunities` (`?includeExpired=true`, `?type=internship|job`) · `GET /opportunities/:id`
- `POST /opportunities` (Admin/Faculty) · `PUT` / `DELETE /opportunities/:id` (creator or Admin)

| Model | Key fields |
|---|---|
| `Opportunity` | `companyName`, `role`, `eligibilityCriteria`, `skillsRequired[]`, `stipendOrSalary`, `deadline`, `applicationLink`, `description`, `type` (`internship`/`job`), `createdBy` |

> **Correction after initial build:** this service originally also had an `Application` model tracking student applications and status (`POST /:id/apply`, `GET /applications/me`, `PUT /applications/:id/status`), plus a targeted notification + email on status change. All of that was removed — see [Notes for later phases](#notes-for-later-phases) for what that removal left behind in `notification-service`.

### Certification Service

- `GET /certifications` (`?includeExpired=true`, `?category=...`) · `GET /certifications/:id` · `POST /certifications` (Admin/Faculty) · `PUT` / `DELETE /certifications/:id` (creator or Admin)

| Model | Key fields |
|---|---|
| `Certification` | `courseName`, `platform`, `companyName`, `deadline`, `description`, `externalLink`, `category`, `createdBy` |

### Gateway registration

`/api/events/*`, `/api/opportunities/*`, `/api/certifications/*` are now proxied the same way `/api/users/*` is — gateway requires a valid JWT, forwards `x-user-id`/`x-user-role`, and leaves role/ownership enforcement to the service.

---

## Phase 4 — Notification Service + Real-Time Sync

Built out of the original phase order, reprioritized ahead of the frontend specifically so real-time sync didn't get retrofitted after the frontend already assumed polling (see the note left at the end of the Phase 3 section). This is what finally satisfies the original spec's "critical requirement": Admin/Faculty changes reflect live on the Student dashboard.

- **`GET /notifications/me`** (Student only) — the student's notification history (bell icon)
- **`PUT /notifications/:id/read`** (Student only) — mark one as read
- **`POST /notifications/broadcast`** (internal only, never through the gateway) — called by events/opportunities/certification-service after every create/update/delete. Persists a `Notification`, pushes it live over Socket.io, and — for targeted notifications only — emails the student. *(At the time this was built, opportunities-service also called it after application status changes — that whole flow was later removed; see the Opportunities Service section above and the note at the end of this section.)*
- A Socket.io server students connect to after login, for the live push half of this (persistence is the other half, covered below).

### The broadcast design: no fan-out, no auth-service call at write time

The literal spec called for `recipientId` on the `Notification` model, which reads as "one row per recipient." Taken literally for a "new event posted" broadcast, that means writing one `Notification` document per student on every single post — which in turn means notification-service needs the full list of student IDs, and that list lives in auth-service's database, a service notification-service otherwise never talks to.

Instead: broadcast-type notifications are stored as **one document** with `recipientId: null`. `GET /me` merges two things for the requesting student — their own targeted notifications (`recipientId === their id`), and every broadcast created *after their account existed* (`recipientId: null AND createdAt >= accountCreatedAt`). That cutoff matters: without it, a student who joined today would suddenly see a backlog of every broadcast ever posted, including ones from before they had an account. `accountCreatedAt` rides along in the student's own JWT (added to `signStudentToken` in `auth-service/utils/token.js`) specifically so this comparison needs zero cross-service calls at request time.

**A necessary consequence I added, not in the original field list:** a single `isRead: Boolean` can't represent "read" per-student when one document is shown to every student. `PUT /:id/read` on a broadcast would otherwise mark it read for everyone, not just the caller. So broadcast documents also carry `readBy: [String]` (student IDs who've read it); targeted documents keep using the plain `isRead` flag. `GET /me` always returns a single computed `isRead` either way, so callers never need to know which kind of document they're looking at. This was verified live — see below.

### Email: targeted only, not broadcast

The spec asked for email notifications for "students who have email notifications enabled (default on)." No preference-toggle infrastructure was built for this — there's no Settings module yet to turn it off, so a stored "on by default" flag with no way to ever become "off" would just be dead code; this is deferred to whenever Settings gets built.

More significant: **only targeted notifications get emailed** (e.g. "your application was accepted"), not broadcasts (e.g. "new event posted"). Two reasons. First, mechanical: emailing a broadcast to every student needs the same full-student-list problem the persistence design above was specifically built to avoid — resolving one student's email for a targeted notification is a much smaller, justified ask (see below), but listing every student's email is the same cross-service fan-out problem again. Second, and honestly the bigger reason: blasting every student's inbox every time a Faculty member fixes a typo in an event description is the kind of thing that trains people to ignore your emails. If you actually want broadcast emails, they should probably be digested/batched rather than one-email-per-edit — worth a real conversation, not a default I should pick silently.

### The one addition to auth-service: a single-student lookup

Resolving one student's email/name for a targeted notification still needs *something* to bridge notification-service to auth-service's data. Rather than resolving it inline in opportunities-service (which would spread auth-service calls across every content service) or skipping the email entirely, auth-service got one small addition: `GET /auth/internal/students/:id`, returning just `{ id, name, email }`. Protected the same way as every other internal route (below) — deliberately not the same as the "list all students" endpoint that was explicitly avoided for the persistence design, since resolving one known ID is a much narrower, bounded operation than enumerating everyone.

### Internal service-to-service auth

Neither `POST /notifications/broadcast` nor `GET /auth/internal/students/:id` carry an end-user JWT — nobody's logged in during a server-to-server call. Both are gated by a shared `INTERNAL_SERVICE_SECRET` (same value across every service, checked via an `x-internal-secret` header), the same pattern as the shared `JWT_SECRET` everywhere else. Neither route is proxied through the gateway; calling services reach notification-service and auth-service directly on their own URLs. The gateway additionally has an explicit hard block on `/api/notifications/broadcast` (see below) so the path is a `404` at the front door too, not just correctly rejected one hop later for lacking a secret a browser could never supply anyway.

### Sockets through the gateway

The frontend connects to `ws://localhost:5000` with `path: '/api/notifications/socket'` — never a second host/port. The gateway proxies the WebSocket upgrade to notification-service using `http-proxy-middleware`'s `ws: true` mode, wired manually via `server.on('upgrade', ...)` (this requires the gateway to use `http.createServer(app)` explicitly instead of `app.listen()`, so the raw server is available to attach that handler to).

This path is deliberately **not** behind the gateway's `verifyToken`: a raw WebSocket upgrade never passes through Express middleware at all (Node's `http.Server` fires a separate `'upgrade'` event that bypasses `app.use()` entirely — `verifyToken` would never even see it), and Socket.io's own handshake auth (`io.use()` in `notification-service/socket/socketServer.js`, checking `socket.handshake.auth.token`) is the real, authoritative check — same defense-in-depth principle as every REST service independently re-verifying its own JWT regardless of the gateway.

On connect, a student's socket joins **two** rooms: `student:<their id>` and the shared `students` room. Broadcasts emit once to `students`; targeted notifications would emit only to one student's personal room, so other students' sockets never receive a payload meant for someone else. Only `role: 'student'` tokens are accepted; Faculty/Admin can't connect (not needed yet — nothing currently pushes notifications *to* them).

### Data model

| Model | Key fields |
|---|---|
| `Notification` | `recipientId` (a Student `_id`, or `null` for broadcast), `type`, `message`, `relatedEntityId`, `isRead` (targeted), `readBy[]` (broadcast) |

> **Post-removal status:** the targeted half of this (personal rooms, `isRead`, the auth-service email lookup) has no active caller in the codebase right now — its one use case, opportunity application status changes, was removed shortly after this phase (see the Opportunities Service correction above). Nothing was deleted, since it's generic infrastructure a future targeted-notification need could reuse as-is, but it's worth knowing it's currently dormant rather than assuming it's exercised by anything live today.

---

## Phase 5 — Document Vault Service

Lets Students securely store and retrieve documents (resume, certificates, offer letters, ID documents, internship proof). Student-only by design — no Admin/Faculty access to any student's vault, matching a deliberate decision made before building (see below).

- **`POST /vault/upload`** (Student only) — `multipart/form-data`, field name `document`, plus a `category` field. Accepts PDF, DOC/DOCX, JPEG, PNG, up to 10MB.
- **`GET /vault/me`** (Student only) — the caller's own documents, optionally filtered with `?category=resume`
- **`GET /vault/:id/download`** (Student only, own documents) — streams the file back through our server
- **`DELETE /vault/:id`** (Student only, own documents) — deletes from both MongoDB and the real Cloudinary resource

### Why documents are stored differently than avatars

user-service's avatars use Cloudinary's default **public** access mode — fine, since a profile picture is meant to be publicly viewable. Vault documents can include ID documents, so this phase deliberately uploads them as Cloudinary **`authenticated`** resources instead: a bare, unsigned fetch of the stored `fileUrl` returns `401`, even though that exact URL is what's returned in the upload/list API responses. This was verified live, not assumed — see the test results below.

The `/download` endpoint itself proxies the file: it generates a fresh, correctly-signed URL server-side, fetches the bytes, and streams them back — the client never sees a Cloudinary URL, ownership is re-checked on every single download, and there's no bypassable link to leak via browser history or a screenshot.

### A real bug, found and fixed during live testing

The first working version used `cloudinary.url(publicId, { type: 'authenticated', sign_url: true })` to generate the server-side download URL. It looked right and matched Cloudinary's general-purpose URL-signing docs, but every download 502'd — the signed URL itself came back `401` from Cloudinary. Debugging by generating a URL manually and diffing it against the URL Cloudinary's own Upload API had returned at upload time turned up two real problems, fixed in order:

1. **Missing format extension** — `cloudinary.url()` without an explicit `format` doesn't reproduce the same path Cloudinary signed at upload time, so the signature can't match.
2. **Missing version** — even with the format fixed, `cloudinary.url()` defaults to version `1` when none is given, which is *never* a real asset's actual version, so the signature still didn't match.

Fixing both got the generated *path* byte-for-byte identical to the known-working one — but the *signature* was still different, and downloads still `401`'d. That turned out to be the real issue: `sign_url` computes a signature meant for tamper-proofing transformation parameters on public delivery URLs — it's the wrong signing scheme entirely for an `authenticated`-type resource. The fix was switching to `cloudinary.utils.private_download_url(publicId, format, { resource_type, type: 'authenticated' })` — Cloudinary's purpose-built helper for exactly this case, which signs against the Admin API instead and was confirmed working by fetching the URL it generates directly before wiring it into the controller.

Net effect on the schema: `cloudinaryFormat` earned a permanent place on the `Document` model (still needed by `private_download_url`); a `cloudinaryVersion` field added mid-debugging turned out to be unnecessary once the real fix landed, and was removed rather than left as dead weight.

### Data model

| Model | Key fields |
|---|---|
| `Document` | `studentId`, `category` (`resume`/`certificate`/`offer_letter`/`id_document`/`internship_proof`/`other`), `fileName`, `fileUrl`, `fileType`, `uploadedAt`, plus `cloudinaryPublicId` / `cloudinaryResourceType` / `cloudinaryFormat` — not in the original field list, but required to reliably delete and re-download the right Cloudinary resource later |

### Gateway registration

`/api/vault/*` is proxied the same way `/api/users/*` is — gateway requires a valid JWT; the student-only role check and self-only ownership are enforced inside document-vault-service. No special gateway handling was needed for either uploads or downloads (both are just bytes flowing through the same body-agnostic proxy that already worked for avatar uploads).

---

## Phase 6 — AI Service

Powers four student-facing AI features. Built stateless by design — see below — so unlike every other service in this project, it has no MongoDB database at all.

- **`POST /ai/resume-analyzer`** (Student only) — accepts either a fresh PDF upload (`multipart/form-data`, field `resume`) or a `documentId` referencing an existing document-vault-service document. Returns `{ analysis: { atsScore, keywordSuggestions[], formattingFeedback[], skillGaps[], summary } }`.
- **`POST /ai/chat`** (Student only) — `{ message, history? }` → `{ reply }`. Conversational, career/academic/opportunity-scoped.
- **`GET /ai/recommendations`** (Student only) — fetches the caller's own profile from user-service and the current opportunity listing from opportunities-service, then asks the model to rank them. Returns `{ recommendations: [{ opportunityId, companyName, role, matchScore, reason }] }`.
- **`POST /ai/interview/start`**, **`POST /ai/interview/next`**, **`POST /ai/interview/summary`** (Student only) — the Voice Mock Interview flow: `start` takes a resume (upload or `documentId`) plus the target role and returns the candidate summary, skill areas, and first question; `next` takes the growing Q&A history and returns the next question (deterministically wraps up at 9 questions); `summary` takes the full transcript and returns one aggregated report (`clarityScore`/`relevanceScore`/strengths/improvements/per-area breakdown). Replaced the earlier single-question `POST /ai/interview-feedback`.

### Provider: Gemini, not Claude — switched mid-build

This service was originally built against the Anthropic Claude API, fully wired and ready to test. Live testing got as far as confirming the request pipeline end-to-end — gateway routing, JWT verification, request formatting — before hitting a real `400` from Anthropic: *"Your credit balance is too low to access the Anthropic API."* Not a bug (a `401` would mean a bad key; this was a billing response to a well-formed, authenticated request) — but the decision was made to switch providers rather than pay for Anthropic credits, since Gemini has a usable free tier. The migration replaced `@anthropic-ai/sdk` with `@google/generative-ai`, keeping every endpoint's request/response contract byte-for-byte identical — only `utils/geminiClient.js` (formerly `claudeClient.js`) and the per-controller schema/content-block shapes changed.

Two mechanical differences worth knowing if you're comparing this to how Claude would've done it:
- **Structured JSON**: Claude's tool-forcing (`tool_choice`) became Gemini's `responseMimeType: 'application/json'` + `responseSchema` on `generationConfig`. Same intent (force valid JSON matching a schema, no free-text parsing to fail on), different mechanism, different schema syntax (Gemini's `SchemaType.OBJECT`/`STRING`/`NUMBER`/`ARRAY` enum instead of Claude's lowercase JSON Schema strings).
- **Chat roles**: Claude uses `user`/`assistant`; Gemini uses `user`/`model`. The `/ai/chat` endpoint's own request contract still speaks `user`/`assistant` (nothing about the public API changed) — `chatController.js` translates at the boundary so callers never see the difference.

### A real bug, caught immediately by testing (not assumed away)

The initial Gemini model name (`gemini-2.0-flash`) turned out to be retired. The first live call came back a real `404`, and — critically — Gemini's own error message named the exact replacement: *"models/gemini-2.0-flash is no longer available... use models/gemini-3.6-flash."* Fixed in one line and re-verified. This is the same discipline as every other phase's testing: a failure surfaces a fact about the real system, not something to route around or mock past.

### Why cross-service depth is deliberately uneven

Resume Analyzer and Chat Assistant are self-contained by design — Resume Analyzer only ever sees the resume itself (ATS/formatting/keyword feedback doesn't need the student's branch), and Chat relies on conversation history rather than a per-message profile fetch that would add latency and a cross-service dependency to every single turn. Opportunity Recommendation is the one endpoint that's inherently cross-service, because ranking opportunities against a student's profile is the entire feature — it calls both user-service and opportunities-service, forwarding the caller's own JWT to each rather than inventing new internal-auth machinery (both services already accept and correctly scope any authenticated student's own token).

### Why resume input works two ways, and why DOCX is rejected

`POST /ai/resume-analyzer` accepts either a fresh upload or a `documentId`. For the vault path, the student's own `Authorization` header is forwarded as-is to document-vault-service's existing `/vault/:id/download` endpoint — that endpoint already enforces "students can only download their own documents," so referencing someone else's document correctly comes back `403`/`404` with zero new authorization code written for this service. Claude and Gemini could both read PDF natively as multimodal input; Groq's text-only model can't, so the PDF's text is now extracted server-side (`utils/extractPdfText.js`, via `pdfjs-dist` — see the Groq migration note below) before it ever reaches the model. DOCX/DOC are still rejected rather than adding a second document format to parse; non-PDF resumes get a clear `400` at two different points depending on the path taken — Multer's file filter for a fresh upload, a `Content-Type` check on the vault path.

### Error handling

`utils/groqClient.js` (originally `geminiClient.js`, before that `claudeClient.js`) logs the **original** SDK error before mapping it to a clean `GroqServiceError` with an HTTP status — this exact logging was missing on the first pass (added while debugging the Anthropic billing error, carried forward through every provider swap since) and is what made the billing failure, the retired-model failure, and later the Groq model-not-found failure all immediately diagnosable instead of just "the AI service rejected the request" with no trail. groq-sdk, unlike Gemini's SDK, *does* expose a clean typed error hierarchy with a reliable `.status` — mapping is more precise here than it was for Gemini, only falling back to message pattern-matching as a secondary check.

### Gateway registration

`/api/ai/*` is proxied like every other service, with one addition: an explicit 60-second `proxyTimeout`/`timeout`, since AI calls — especially resume analysis, which also extracts PDF text server-side first — can still take longer than the fast CRUD calls every other proxied service handles.

### Provider: Groq, not Gemini — switched again, post-launch

Gemini worked, but two real problems showed up under actual use rather than in a spec: (1) `gemini-3.6-flash`'s free tier turned out to cap at **20 requests/day per project**, confirmed via the raw Google API error (`quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier`) — a single 9-question Voice Interview alone costs ~10 calls, so the whole app could support roughly two completed interviews a day, total, before every student hit the same "temporarily unavailable" error; (2) Gemini also returned genuine transient `503`s ("high demand") independent of the quota issue. Both were real, live-reproduced findings, not assumptions — see the debugging trail that led here if you're looking at git history. The fix wasn't more retry logic; it was switching providers again, this time to Groq (`groq-sdk`, model `openai/gpt-oss-120b` — the originally-requested `llama-3.3-70b-versatile` had itself been retired from this account's available models by the time of migration, confirmed live against Groq's `/models` endpoint).

Two things that don't carry over automatically from the Gemini build, both discovered by testing rather than assumed:

- **PDF handling.** Gemini read a PDF as multimodal input directly; Groq's model is text-only. `utils/extractPdfText.js` now extracts text server-side first (`pdfjs-dist`, loaded via dynamic `import()` since that package is ESM-only as of v6 and this service is CommonJS everywhere else). A first attempt used the `pdf-parse` package instead — it turned out to bundle a long-abandoned 2016-era pdf.js internally and threw `bad XRef entry` on *perfectly valid* PDFs, including ones generated by `pdfkit` itself, confirmed with a direct side-by-side test before switching to `pdfjs-dist`.
- **Structured JSON.** Groq's OpenAI-compatible `response_format: { type: 'json_object' }` guarantees syntactically valid JSON but, unlike Gemini's `responseSchema`, takes no schema argument at all — the exact shape has to be spelled out in the prompt text itself (see each controller's `*_SCHEMA_DESCRIPTION` constant) and is checked post-parse (`requiredKeys` in `groqClient.js`) so a response missing a field fails loudly here instead of reaching the frontend incomplete.

One quality regression found and fixed during live re-testing of the Voice Interview: `openai/gpt-oss-120b`, unlike Gemini, would sometimes ask about the *same* skill area three times across a 9-question interview instead of spreading repeats across different areas once the first round was exhausted. Describing coverage in prose and trusting the model to self-balance wasn't enough — `nextQuestion` now computes the actual least-asked area(s) server-side and hands the model a closed shortlist it must choose from, rather than a suggestion it can override.

All four endpoints' request/response contracts stayed byte-for-byte identical through this migration, same as the Claude→Gemini switch before it — the frontend needed zero changes.

---

## Phase 7 — Mock Test Service

Aptitude/coding/reasoning practice tests with instant, server-side-only scoring. Separate from the AI-driven Mock Interview feature, which lives in `ai-service`'s `/ai/interview-feedback`.

- **`GET /mocktest/questions?category=aptitude&count=10`** (Student only) — a random set of questions via MongoDB's `$sample`, `correctOptionIndex` never included in the response. If the bank has fewer than `count` questions in that category, fewer come back — never an error, never a repeat within one test.
- **`POST /mocktest/submit`** (Student only) — `{ category, questions: [id,...], answers: [selectedOptionIndex|-1,...], timeTakenSeconds }`. The real `Question` documents are re-fetched fresh from the database by id and scored server-side against their actual `correctOptionIndex` — nothing about correctness is ever taken from the client, verified live (see below). Saves a `TestAttempt` and returns it alongside a `results` array with the correct answers now revealed.
- **`GET /mocktest/history`** (Student only) — the caller's own past attempts, newest first, optionally filtered with `?category=`.
- **`POST /mocktest/questions`** (Admin/Faculty only) — adds a question to the bank.

### The timer is client-managed, not server-enforced

`timeTakenSeconds` is submitted by the client and trusted as-is for the student's own record-keeping — the server does not track a session start time or reject late submissions. This was a deliberate choice, not an oversight: the endpoints as specified (`GET /questions` with no session created, straight to `POST /submit`) don't naturally support server-enforced timing without inventing a whole session concept the spec didn't ask for, and there's no leaderboard/gamification in this platform for a student to gain anything by misreporting their own time. `startedAt` is derived server-side as `completedAt - timeTakenSeconds` (`completedAt` itself is always the server's own clock, never client-supplied) so the model's three time fields all get populated sensibly without trusting the client for the one that actually matters.

### What else was decided without asking, and why

- **`createdBy` on `Question`**, even though no edit/delete endpoint exists yet for questions (only the four listed above) — consistent with every other content model in this project (`Event`/`Opportunity`/`Certification` all have it), and costs nothing to include now versus needing a migration if edit/delete get added later.
- **No `notify()` integration** — unlike Events/Opportunities/Certifications, adding a question to the bank doesn't broadcast to students. A new practice question isn't really "content" in the same sense as a posted event; nobody's dashboard needs a live push because Faculty added 3 more aptitude questions.
- **`GET /mocktest/questions` is student-only**, not open to Faculty/Admin the way Events/Opportunities/Certifications listings are. This mirrors the AI Service precedent (Resume Analyzer, Chat, Recommendations, Interview Feedback are all student-only) rather than the content-service precedent, since this is a personal practice feature, not an informational listing relevant to everyone.

### Data models

| Model | Key fields |
|---|---|
| `Question` | `category` (`aptitude`/`coding`/`reasoning`), `questionText`, `options[4]`, `correctOptionIndex`, `difficulty` (`easy`/`medium`/`hard`), `createdBy` |
| `TestAttempt` | `studentId`, `category`, `questions[]` (ids shown), `answers[]` (parallel array, `-1` = unanswered), `score`, `totalQuestions`, `startedAt`, `completedAt`, `timeTakenSeconds` |

### Seeding

```bash
cd services/mock-test-service
npm run seed:questions
```

Seeds 18 real questions (6 per category) with hand-verified answer keys — not filler text. Safe to re-run; skips any question whose exact text already exists.

### Gateway registration

`/api/mocktest/*` is proxied the same way as every other service — gateway requires a valid JWT, role/ownership enforcement happens inside mock-test-service.

---

## Running everything locally

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod` on `27017`, or a MongoDB Atlas URI) — auth-service and user-service use separate databases on the same instance
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (or another SMTP provider) for sending OTP/credential emails
- A free [Cloudinary](https://cloudinary.com/users/register/free) account for avatar image uploads

### 1. Set up auth-service

```bash
cd services/auth-service
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/campusync_auth
JWT_SECRET=<a long random string>
JWT_STUDENT_EXPIRES_IN=1d
JWT_STAFF_EXPIRES_IN=7d
OTP_EXPIRES_MIN=5
INTERNAL_SERVICE_SECRET=<a different long random string, shared by every service>
EMAIL_SERVICE=gmail
EMAIL_USER=<your gmail address>
EMAIL_PASS=<your gmail app password>
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@campusync.edu
ADMIN_PASSWORD=<pick a real password>
```

Seed the first Admin and some test Students (safe to re-run — skips anything that already exists):

```bash
npm run seed:admin
npm run seed:students
```

`seed:students` creates two students with **password `Student@123`** — `AEC/2023/005` and `AEC/2023/006`. **Edit the emails in `seed/seedStudents.js` to real inboxes you control** before seeding, or OTP emails won't reach anyone you can check.

### 2. Set up user-service

```bash
cd services/user-service
npm install
cp .env.example .env
```

Edit `.env` — **`JWT_SECRET` must be the exact same value as auth-service's**, since this service verifies tokens it didn't issue:

```
PORT=5002
MONGO_URI=mongodb://127.0.0.1:27017/campusync_users
JWT_SECRET=<same value as auth-service's JWT_SECRET>
CLOUDINARY_CLOUD_NAME=<from your Cloudinary dashboard>
CLOUDINARY_API_KEY=<from your Cloudinary dashboard>
CLOUDINARY_API_SECRET=<from your Cloudinary dashboard>
```

### 3. Set up events-service, opportunities-service, certification-service

Same pattern for each — `JWT_SECRET` and `INTERNAL_SERVICE_SECRET` must match everywhere:

```bash
cd services/events-service && npm install && cp .env.example .env
cd services/opportunities-service && npm install && cp .env.example .env
cd services/certification-service && npm install && cp .env.example .env
```

Each `.env` needs `PORT` (5003/5004/5005 by default), its own `MONGO_URI`, the shared `JWT_SECRET`, the shared `INTERNAL_SERVICE_SECRET`, and `NOTIFICATION_SERVICE_URL=http://localhost:5009` (used to notify students after every create/update/delete) — no email or Cloudinary config needed for these three.

### 4. Set up notification-service

```bash
cd services/notification-service
npm install
cp .env.example .env
```

Edit `.env` — same shared `JWT_SECRET` and `INTERNAL_SERVICE_SECRET` as everywhere else, plus its own email config (same Nodemailer pattern as auth-service) and `AUTH_SERVICE_URL` (used to resolve one student's email for a targeted notification):

```
PORT=5009
MONGO_URI=mongodb://127.0.0.1:27017/campusync_notifications
JWT_SECRET=<same value as every other service>
INTERNAL_SERVICE_SECRET=<same value as every other service>
AUTH_SERVICE_URL=http://localhost:5001
EMAIL_SERVICE=gmail
EMAIL_USER=<your gmail address>
EMAIL_PASS=<your gmail app password>
FRONTEND_ORIGIN=http://localhost:5173
```

### 5. Set up document-vault-service

```bash
cd services/document-vault-service
npm install
cp .env.example .env
```

Edit `.env` — same shared `JWT_SECRET`, and its own Cloudinary credentials (can be the same Cloudinary account as user-service, or a different one):

```
PORT=5006
MONGO_URI=mongodb://127.0.0.1:27017/campusync_vault
JWT_SECRET=<same value as every other service>
CLOUDINARY_CLOUD_NAME=<from your Cloudinary dashboard>
CLOUDINARY_API_KEY=<from your Cloudinary dashboard>
CLOUDINARY_API_SECRET=<from your Cloudinary dashboard>
```

### 6. Set up ai-service

```bash
cd services/ai-service
npm install
cp .env.example .env
```

Edit `.env` — same shared `JWT_SECRET`, plus a free Groq API key from [console.groq.com/keys](https://console.groq.com/keys). No `MONGO_URI` — this service is stateless (see Phase 6 above):

```
PORT=5007
JWT_SECRET=<same value as every other service>
GROQ_API_KEY=<from console.groq.com>
DOCUMENT_VAULT_SERVICE_URL=http://localhost:5006
USER_SERVICE_URL=http://localhost:5002
OPPORTUNITIES_SERVICE_URL=http://localhost:5004
```

### 7. Set up mock-test-service

```bash
cd services/mock-test-service
npm install
cp .env.example .env
```

Edit `.env` — same shared `JWT_SECRET`:

```
PORT=5008
MONGO_URI=mongodb://127.0.0.1:27017/campusync_mocktest
JWT_SECRET=<same value as every other service>
```

Seed the starter question bank (safe to re-run):

```bash
npm run seed:questions
```

### 8. Set up api-gateway

```bash
cd api-gateway
npm install
cp .env.example .env
```

Edit `.env` — **`JWT_SECRET` must again match every other service**:

```
PORT=5000
JWT_SECRET=<same value as every other service>
AUTH_SERVICE_URL=http://localhost:5001
USER_SERVICE_URL=http://localhost:5002
EVENTS_SERVICE_URL=http://localhost:5003
OPPORTUNITIES_SERVICE_URL=http://localhost:5004
CERTIFICATION_SERVICE_URL=http://localhost:5005
NOTIFICATION_SERVICE_URL=http://localhost:5009
DOCUMENT_VAULT_SERVICE_URL=http://localhost:5006
AI_SERVICE_URL=http://localhost:5007
MOCK_TEST_SERVICE_URL=http://localhost:5008
FRONTEND_ORIGIN=http://localhost:5173
```

### 9. Start all ten

One command, from the project root, instead of ten separate terminals. The root
`package.json` uses [concurrently](https://www.npmjs.com/package/concurrently) to
launch the gateway and all nine services together, each line in the terminal prefixed
with the service name so you can tell at a glance which one is complaining:

```bash
npm install   # once, to install concurrently itself
npm run dev   # or: npm start - both do the same thing
```

Because every service starts in parallel rather than in some fixed order, and
MongoDB Atlas is a remote cluster (not a local container that needs time to boot),
each service's `connectDB()` retries its Atlas connection with a short backoff
(5 attempts, 3s apart) instead of exiting on the first failed attempt - so a
service that happens to initialize before the network is fully ready recovers on
its own instead of dying and sitting there until you notice and restart it by hand.

**Stray processes from a previous session** (killed the terminal instead of Ctrl-C,
machine slept mid-session, etc.) leave old nodemon/node processes still bound to
ports 5000-5009 - the next `npm run dev` would otherwise fail with `EADDRINUSE` on
every single port. A `predev` hook runs automatically before every `dev`/`start` and
kills whatever's currently listening on those ten ports first, so this is handled
for you - no manual `taskkill`/`kill` needed:

```
> campusync@1.0.0 predev
> node scripts/kill-ports.js

[kill-ports] Killed PID 27316 (was holding port 5000)
[kill-ports] Killed PID 25448 (was holding port 5001)
...
```

Nothing stray to clean up? It says so and moves straight on:

```
[kill-ports] All clear - no stray processes on ports 5000-5009.
```

You can also run it on its own, without starting anything, via `npm run kill-ports`.

Prefer separate terminals for debugging one service in isolation (e.g. attaching a
debugger, or watching just one log stream)? The old per-service commands still work
exactly the same way:

```bash
cd services/auth-service && npm run dev
cd services/user-service && npm run dev
cd services/events-service && npm run dev
cd services/opportunities-service && npm run dev
cd services/certification-service && npm run dev
cd services/notification-service && npm run dev
cd services/document-vault-service && npm run dev
cd services/ai-service && npm run dev
cd services/mock-test-service && npm run dev
cd api-gateway && npm run dev
```

Either way, you should see all ten log a "listening on port ..." line. Confirm with:

```bash
curl http://localhost:5001/health   # auth-service
curl http://localhost:5002/health   # user-service
curl http://localhost:5003/health   # events-service
curl http://localhost:5004/health   # opportunities-service
curl http://localhost:5005/health   # certification-service
curl http://localhost:5009/health   # notification-service
curl http://localhost:5006/health   # document-vault-service
curl http://localhost:5007/health   # ai-service
curl http://localhost:5008/health   # mock-test-service
curl http://localhost:5000/health   # api-gateway
```

## Testing each endpoint (through the gateway)

Base URL: `http://localhost:5000/api`

### Auth

**Admin login:**

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campusync.edu","password":"<your ADMIN_PASSWORD>"}'
```

Save the returned `token` — you'll need it below.

**Admin adds a Faculty account** (gateway itself rejects this with 401/403 if the token is missing or not an admin token, before it ever reaches auth-service):

```bash
curl -X POST http://localhost:5000/api/auth/admin/add-faculty \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name":"Dr. Priya Nair","email":"priya.nair@example.com"}'
```

A temp password is emailed to the new faculty member.

**Faculty login:**

```bash
curl -X POST http://localhost:5000/api/auth/faculty/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.nair@example.com","password":"<temp password from the email>"}'
```

**Student login (sends OTP), then verify:**

```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"collegeId":"AEC/2023/005","password":"Student@123"}'

curl -X POST http://localhost:5000/api/auth/student/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"collegeId":"AEC/2023/005","otp":"<6-digit code from the email>"}'
```

### Users

All of these need `Authorization: Bearer <token>` from any of the logins above. Replace `<userId>` with the `id` from that login's response.

**Get a profile** (auto-creates an empty one the first time you fetch your own):

```bash
curl http://localhost:5000/api/users/profile/<userId> \
  -H "Authorization: Bearer <TOKEN>"
```

**Update your own profile:**

```bash
curl -X PUT http://localhost:5000/api/users/profile/<userId> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"phone":"9998887777","bio":"CS student","skills":["React","Node"],"linkedin":"https://linkedin.com/in/you"}'
```

Try this with a **different user's** `<userId>` and a non-admin token — expect `403`. Try it as Admin against any `<userId>` — expect success.

**Upload an avatar:**

```bash
curl -X POST http://localhost:5000/api/users/profile/<userId>/avatar \
  -H "Authorization: Bearer <TOKEN>" \
  -F "avatar=@/path/to/photo.jpg"
```

### Events

```bash
# Create (Admin/Faculty)
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Hackathon 2026","organizingClub":"CS Club","coordinatorName":"Priya Nair","contactInfo":"priya@aec.edu","deadline":"2026-12-31T23:59:59.000Z","registrationLink":"https://forms.example.com/hackathon"}'

# List (excludes expired by default)
curl http://localhost:5000/api/events -H "Authorization: Bearer <TOKEN>"

# List including history (Admin/Faculty only - ignored for Students)
curl "http://localhost:5000/api/events?includeExpired=true" -H "Authorization: Bearer <ADMIN_OR_FACULTY_TOKEN>"

# Edit / delete - only the creator or an Admin can do this; anyone else gets 403
curl -X PUT http://localhost:5000/api/events/<id> -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d '{"description":"updated"}'
curl -X DELETE http://localhost:5000/api/events/<id> -H "Authorization: Bearer <TOKEN>"
```

### Opportunities

```bash
# Create (Admin/Faculty)
curl -X POST http://localhost:5000/api/opportunities \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"companyName":"Acme Corp","role":"SWE Intern","deadline":"2026-12-31T23:59:59.000Z","applicationLink":"https://acme.example.com/apply","type":"internship"}'

# List, optionally filtered by type
curl "http://localhost:5000/api/opportunities?type=internship" -H "Authorization: Bearer <TOKEN>"

# Edit / delete - only the creator or an Admin can do this; anyone else gets 403
curl -X PUT http://localhost:5000/api/opportunities/<id> -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d '{"stipendOrSalary":"25000/month"}'
curl -X DELETE http://localhost:5000/api/opportunities/<id> -H "Authorization: Bearer <TOKEN>"
```

Pure listing — students apply on the company's own site via `applicationLink`, so there's no `/apply` endpoint or application-tracking of any kind.

### Certifications

```bash
curl -X POST http://localhost:5000/api/certifications \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"courseName":"AWS Cloud Practitioner","platform":"AWS Skill Builder","deadline":"2026-12-31T23:59:59.000Z","externalLink":"https://aws.example.com/cert","category":"Cloud"}'

curl "http://localhost:5000/api/certifications?category=Cloud" -H "Authorization: Bearer <TOKEN>"
```

### Notifications

```bash
# Student's own notification history
curl http://localhost:5000/api/notifications/me -H "Authorization: Bearer <STUDENT_TOKEN>"

# Mark one as read
curl -X PUT http://localhost:5000/api/notifications/<notificationId>/read -H "Authorization: Bearer <STUDENT_TOKEN>"
```

The live push isn't testable with curl - connect an actual Socket.io client (this is exactly what was used for live testing, see below):

```js
const { io } = require('socket.io-client');

const socket = io('http://localhost:5000', {
  path: '/api/notifications/socket',
  auth: { token: '<STUDENT_TOKEN>' },
});

socket.on('connect', () => console.log('connected', socket.id));
socket.on('notification', (payload) => console.log('received:', payload));
```

Leave that running, then create/update/delete an Event/Opportunity/Certification through the gateway as Admin/Faculty in another terminal — the `notification` event should fire within about a second.

### Document Vault

```bash
# Upload (Student only) - multipart, field name "document", plus a category field
curl -X POST http://localhost:5000/api/vault/upload \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -F "document=@/path/to/resume.pdf" \
  -F "category=resume"

# List your own documents, optionally filtered
curl http://localhost:5000/api/vault/me -H "Authorization: Bearer <STUDENT_TOKEN>"
curl "http://localhost:5000/api/vault/me?category=resume" -H "Authorization: Bearer <STUDENT_TOKEN>"

# Download - streams the file back; -O saves it using the server's filename
curl -O -J http://localhost:5000/api/vault/<documentId>/download -H "Authorization: Bearer <STUDENT_TOKEN>"

# Delete - removes from both MongoDB and Cloudinary
curl -X DELETE http://localhost:5000/api/vault/<documentId> -H "Authorization: Bearer <STUDENT_TOKEN>"
```

Try the download/delete with a different student's token against someone else's `documentId` — expect `403` either way.

### AI

```bash
# Resume Analyzer - either a fresh PDF upload...
curl -X POST http://localhost:5000/api/ai/resume-analyzer \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -F "resume=@/path/to/resume.pdf"

# ...or a reference to a document already in the vault (must be category-agnostic, but
# must actually be a PDF - non-PDF vault documents are rejected here even though the
# vault itself accepts DOCX for other document categories)
curl -X POST http://localhost:5000/api/ai/resume-analyzer \
  -H "Content-Type: application/json" -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{"documentId":"<vaultDocumentId>"}'

# Chat - send history back each time to keep the conversation going
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{"message":"What skills should I focus on for internships?"}'

# Recommendations - no body; ranks current opportunities against your own profile
curl http://localhost:5000/api/ai/recommendations -H "Authorization: Bearer <STUDENT_TOKEN>"

# Interview Feedback - question is optional but improves the relevance scoring
curl -X POST http://localhost:5000/api/ai/interview-feedback \
  -H "Content-Type: application/json" -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{"question":"Tell me about a challenge you overcame.","answer":"..."}'
```

### Mock Test

```bash
# Fetch a random set of questions (correctOptionIndex never included)
curl "http://localhost:5000/api/mocktest/questions?category=aptitude&count=5" -H "Authorization: Bearer <STUDENT_TOKEN>"

# Submit answers - questions/answers are parallel arrays (index i of one matches index i
# of the other); use -1 in `answers` for a question left unanswered. Score is always
# computed server-side from the real question bank, never trusted from the client.
curl -X POST http://localhost:5000/api/mocktest/submit \
  -H "Content-Type: application/json" -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{"category":"aptitude","questions":["<id1>","<id2>"],"answers":[0,2],"timeTakenSeconds":120}'

# Your own past attempts, optionally filtered
curl http://localhost:5000/api/mocktest/history -H "Authorization: Bearer <STUDENT_TOKEN>"
curl "http://localhost:5000/api/mocktest/history?category=coding" -H "Authorization: Bearer <STUDENT_TOKEN>"

# Add a question to the bank (Admin/Faculty only)
curl -X POST http://localhost:5000/api/mocktest/questions \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"category":"coding","questionText":"...","options":["a","b","c","d"],"correctOptionIndex":1,"difficulty":"medium"}'
```

### Postman

Import as a collection manually, or replicate the `curl` calls above as requests:
- Set `Content-Type: application/json` on JSON `POST`/`PUT` requests.
- For the avatar/document uploads, use `form-data` body type with a key named `avatar` or `document` (respectively) set to `File`.
- Add an `Authorization` header with value `Bearer <token>` on every protected request.

## What was tested live for Phase 7 (not just code review)

The core claim to actually verify here isn't "does this return JSON" — it's "is the score genuinely computed server-side, correctly." Every test below was designed around proving that, not just exercising each route once.

- **Score correctness, hand-verified**: fetched 4 real aptitude questions, worked out the correct answers by hand independently of the seed data, then deliberately submitted 3 right and 1 wrong. Server returned `score: 3` — exact match, not just "a plausible-looking number."
- **The "never trust the client" property, adversarially tested**: submitted a request with a fabricated `"score": 999` field alongside answers that were all actually wrong. The fabricated field was silently ignored entirely; the response contained the real computed score (`0`) — proving the controller doesn't even read a client-submitted score, not just that it overwrites one.
- **Tampered question ID, checked for graceful handling**: submitted a `questions` array containing an id that doesn't exist in the database. No crash, no 500 — the unresolvable question contributed `0` to the score and came back with `null` fields in `results`, exactly as the "re-fetch fresh from the database, never trust what the client claims a question is" design intends.
- **Small question pool, checked for graceful capping, not an error**: requested `count=100` for a category that only has 6 seeded questions. Got back exactly 6, no error — confirmed the `$sample` capping logic works at the actual boundary, not just for reasonable counts.
- **History and ownership**: after 3 real submissions, `GET /history` returned all 3 for that student, newest first; a second real student's `GET /history` correctly came back empty, confirming per-student scoping without an explicit `:id` ownership check being necessary (the filter is baked into the query itself).
- **Role checks in both directions**: Faculty/Admin blocked (`403`) from every student-only endpoint (including `GET /questions`, which is *not* open the way Events/Opportunities/Certifications listings are — see Phase 7 above for why); a Student blocked (`403`) from `POST /questions`; an Admin-created question correctly included `correctOptionIndex` in its own response (the creator needs to see what they made — only the student-facing `GET /questions` hides it).
- **Validation**: invalid `category` (`400`), mismatched `answers`/`questions` array lengths (`400`), negative `timeTakenSeconds` (`400`), a question with 3 options instead of 4 (`400`), `correctOptionIndex` out of range (`400`), no token (`401`).

Test artifacts (3 `TestAttempt` records and one question created purely to test the admin-creation path) were deleted afterward; the 18 real seeded questions were left in place and reverified as still exactly 18 — nothing from testing leaked into the permanent question bank.

## What was tested live for Phase 6 (not just code review)

Every test below hit the real Gemini API through the full stack (gateway → ai-service → Gemini, plus user-service/opportunities-service/document-vault-service for the endpoints that need them) — no mocked responses anywhere, per the explicit instruction for this phase.

- **Two real bugs, caught and fixed by testing, not assumed away**: the Anthropic billing error that triggered the provider switch, and after switching, a real `404` from Gemini for a retired model name (`gemini-2.0-flash`) — Gemini's own error response named the exact replacement (`gemini-3.6-flash`), fixed in one line and re-verified. Both were only visible because of the error-logging fix made while debugging the first one; without it, both would have surfaced only as "the AI service rejected the request."
- **Chat, with real multi-turn continuity**: sent a first message, got a genuine on-topic reply, then sent a follow-up ("which of those three should I prioritize, and why?") with that reply included as history — the second response correctly referenced back to the specific items from the first, confirming the `assistant`→`model` role translation and history threading both work, not just that a single request/response round-trips.
- **Interview Feedback, checked for actual judgment, not just schema compliance**: fed it a deliberately weak, filler-word-heavy answer ("So um... it was a good learning experience I guess"). Response correctly scored clarity low (35/100), explicitly named the STAR method as missing, and called out the specific filler words ("um", "like", "I guess") verbatim — i.e. it read and reasoned about the actual text, not a templated response.
- **Resume Analyzer, both input paths, with real PDF content Gemini had to actually read**: built a real (not fake-bytes) PDF containing a deliberately weak resume - vague "to-do list app" project, "Microsoft Word, Typing" as skills. Both the fresh-upload path and the vault-reference path (ai-service fetching the file server-side through document-vault-service, forwarding the caller's own JWT) returned analyses that correctly identified the specific weak content and gave a low ATS score (20-30) with concrete, accurate criticism - not a generic "looks fine" response.
- **Recommendations, checked for actual ranking not just a list**: set a real student profile to `branch: Computer Science, skills: [React, Node.js, Python, SQL]`, then created three real opportunities - one a strong match (React/Node full-stack intern), one a partial match (Python/SQL data analyst intern), one completely unrelated (Civil Engineering site supervisor). The response ranked the full-stack role highest (95), the data role second (85), and **excluded the Civil Engineering role entirely** rather than padding the list - genuine relevance filtering, not "return everything with a score."
- **Ownership enforced through a forwarded token, not a new authorization layer**: a second real student's token, used against the first student's `documentId` via the vault-reference resume-analyzer path, correctly came back `403`/"not accessible" — proving document-vault-service's own ownership check applies transparently when ai-service forwards someone's JWT on their behalf, with zero new auth code written in ai-service itself for this.
- **Validation and role checks**: missing `message`/`answer` fields (`400`), no file and no `documentId` (`400`), non-PDF file upload rejected by Multer (`400`), Faculty token rejected by every endpoint (`403`, student-only), no token at all (`401`).

One sub-case — a non-PDF document referenced through the *vault* path (as opposed to a direct non-PDF upload, which was tested) — wasn't independently live-tested: constructing a genuinely valid test DOCX file wasn't worth the effort for a single string-equality check that's already exercised by the analogous direct-upload path. Noted here rather than silently skipped.

All test data (a temporary Faculty record inserted directly for setup, three test opportunities, two test vault documents, and profile fields set for the test) was cleaned up afterward and reverified against the real database.

## What was tested live for Phase 5 (not just code review)

Tested against the real MongoDB Atlas cluster, real Cloudinary account, and real Gmail SMTP already wired in for prior phases — not stubs, per the explicit instruction for this phase.

- **The download bug, caught and fixed live**: the first implementation 502'd on every download. Rather than guess, generated the signed URL in isolation and diffed it character-by-character against Cloudinary's own known-working upload-time URL, which surfaced two missing parameters (format, version) and then a fundamentally wrong signing function - see the Phase 5 section above for the full path. Confirmed fixed by re-testing after each change until a download came back byte-for-byte identical to the uploaded file (verified with `diff`, not just "no error thrown").
- **The core security property, verified adversarially**: fetched the raw `fileUrl` from an upload response directly, with no auth of any kind, exactly as an attacker who intercepted that JSON response would - confirmed `401`, proving the "authenticated" Cloudinary resource type actually protects the file even though the URL itself is returned to the client.
- **Real Cloudinary deletion, verified via the Admin API**: after `DELETE /vault/:id`, called `cloudinary.api.resource()` directly for that `public_id` and confirmed it throws "Resource not found" - not just that the Mongo record was gone.
- Upload validation: invalid `category` rejected (`400`), disallowed file type (`.txt`) rejected (`400`) with the real Multer file filter
- Ownership: a second real student blocked (`403`) from downloading or deleting the first student's document
- Auth: no token rejected (`401`), a real Faculty token rejected (`403`, student-only)
- List + filter: `GET /me` and `GET /me?category=resume` both correct; an empty category returned `[]` correctly

No leftover test data - the delete step in the test itself was the final cleanup, confirmed by re-querying the real database afterward.

## What was tested live for Phase 4 (not just code review)

All seven backend components run together through the gateway, with a real `socket.io-client` connection (not curl - sockets need an actual client) authenticated with a real student JWT.

- **The full real-time chain, live**: a Socket.io client connected through the gateway, then `POST /api/events` as Faculty in a separate call — the connected client received the `notification` event over the wire in under a second, having traveled create-event → `notify()` → notification-service → Socket.io → gateway WS proxy → client.
- **Persistence + shared-document read-state correctness** (the main risk in the custom broadcast design): two students both saw the same broadcast notification via `GET /me`; Student1 marked it read; Student1's next fetch showed `isRead: true`; **Student2's fetch of the same document still showed `isRead: false`** — confirming `readBy` correctly isolates per-student read state on a document shared by many.
- **Targeted notifications end-to-end** *(the trigger for this test, application status changes, was removed shortly after — see the Opportunities Service correction note above; this is a historical record that the underlying targeted-notification machinery worked, not a currently-reproducible flow)*: Faculty accepted/rejected a real student's application → that student's socket (and only that student's — a second connected student's socket received nothing) got the live push; the persisted notification showed `scope: "targeted"`; the email was verified via Ethereal preview and contained the correct recipient and message text (`asha.rao.test@gmail.com` / "Your application to Acme Corp is now Rejected"), proving the auth-service email lookup resolved correctly.
- **Cross-student isolation on the REST side**: Student2's `GET /me` never included Student1's targeted notification; Student2 got `403` trying to mark it read.
- **Role restrictions**: Faculty got `403` on `GET /notifications/me` (student-only); a Faculty JWT was rejected by the socket handshake ("Only students can connect to this socket"); a missing token and an invalid token were both rejected with clear socket `connect_error` messages.
- **Internal-secret enforcement**: `POST /notifications/broadcast` and `GET /auth/internal/students/:id` both called directly (bypassing the gateway) with no secret and with a wrong secret — both correctly `401`.
- **Gateway-level blocking**: `POST /api/notifications/broadcast` through the gateway, with a real (non-admin, non-internal) student JWT attached, returned a flat `404` — confirming the explicit block works, not just the internal-secret fallback one hop downstream.

No new bugs were caught in this pass — the two deliberate deviations from the literal spec (the `readBy` field, and scoping email to targeted-only) were designed in up front specifically to avoid the correctness/architecture problems described in the Phase 4 section above, rather than discovered by testing after the fact.

## What was tested live for Phase 3 (not just code review)

All six services run together through the gateway, with two separate Faculty accounts (via a temporary Ethereal test inbox, reverted afterward) specifically to exercise the ownership rule — a single Faculty account can't tell "only the creator can edit" apart from "any Faculty can edit."

- Events: create, list (expired excluded by default), `includeExpired=true` honored for Admin/Faculty and silently ignored for Students, `GET /:id` returns an expired record directly, second Faculty blocked (`403`) from editing/deleting the first Faculty's event, Admin override succeeds, Student blocked (`403`) from creating
- Opportunities *(the apply/application-tracking parts of this list describe functionality removed shortly after — see the Opportunities Service correction note above; only create/list/edit/delete/ownership still exist)*: create both `internship` and `job`, `?type=` filter, apply (`201`), duplicate apply blocked (`409`), applying to an expired posting blocked (`400`), Faculty blocked (`403`) from applying (student-only), `applications/me` returns the student's own applications with the opportunity populated inline, a second student's application list correctly stays empty, a student blocked (`403`) from hitting the status-update endpoint, Faculty successfully sets status to `Accepted`, invalid status value rejected (`400`), and the status change is immediately visible back through `applications/me`
- Certifications: create, `?category=` filter, second Faculty blocked from editing another's cert, Admin override succeeds, Student blocked from deleting
- Cross-cutting: `404` for a nonexistent record on all three services, `401` at the gateway for all three prefixes with no token at all

## What was tested live for Phase 2 (not just code review)

All three services were run together against a real local MongoDB instance, with a temporary Ethereal test inbox standing in for Gmail (same technique used in Phase 1) so OTP/credential emails could be read back and confirmed, and a temporary in-memory stub standing in for the real Cloudinary account (which needs your own credentials — see below) so the rest of the avatar-upload pipeline could be verified without them. All temporary test code was reverted after testing; none of it shipped.

Verified through the gateway specifically (not by calling the services directly), to prove the proxying itself works:
- Admin/Faculty/Student login and full student OTP round-trip
- Gateway's own admin-only guard on `add-faculty`, including a real student token correctly getting `403`
- Profile lazy-creation on first `GET`/`PUT` of your own profile
- Ownership enforcement: a second student blocked (`403`) from editing the first student's profile
- Admin override: successfully edited another user's profile
- `404` for fetching someone else's profile that was never created
- Multipart avatar upload passed through the gateway untouched and reached user-service's Multer/Cloudinary pipeline correctly
- Non-image file upload rejected with `400`
- `x-user-id` / `x-user-role` headers confirmed actually arriving at user-service from the gateway
- CORS preflight (`OPTIONS`) returns the configured `FRONTEND_ORIGIN`

**One real bug was caught and fixed during this pass:** `add-faculty` originally created the Faculty record in MongoDB before attempting to email the credentials. If the email failed, the API returned an error but the account had already been created — an orphaned account the admin wasn't told about, and a later retry would then fail with "already exists." Fixed (in Phase 1, carried into this phase's testing) so the record is rolled back if the email can't be sent.

### To test the real Cloudinary upload yourself

Phase 2's live test used a stub instead of a real Cloudinary account (account creation isn't something to do on your behalf). To verify the actual image upload works: sign up free at [cloudinary.com](https://cloudinary.com/users/register/free), put your `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` in `services/user-service/.env`, and re-run the avatar upload `curl` command above — `avatarUrl` in the response should be a real `res.cloudinary.com` URL you can open in a browser.

## Notes for later phases

- Student account creation still has no dedicated endpoint (Phase 1 only seeds test students directly into MongoDB). If `user-service` or a future phase needs to create Student/Faculty auth records, that'll need to go back through `auth-service` (the only service with write access to those collections) rather than duplicating that logic here.
- **Broadcast notifications are never emailed**, only pushed live + persisted (see Phase 4 above for why). If mass content-update emails turn out to be wanted after all, that almost certainly wants a digest/batching design rather than one email per edit — worth a real conversation before building it.
- **No email preference toggle exists yet** — emails currently always send for targeted notifications since there's no Settings module to ever turn them off. Revisit when Settings gets built.
- Faculty/Admin can't connect to the notification socket (student-only for now) — fine today since nothing pushes notifications *to* them, but would need the room-joining logic extended if that changes.
- **Opportunities is a pure listing, not application-tracked** (corrected after initial build — see the Opportunities Service section). The targeted-notification pathway in `notification-service` (personal socket rooms, `isRead`, the auth-service email lookup) has no active caller as a result — kept as reusable generic infrastructure, not deleted, but currently dormant. If nothing ever ends up using targeted notifications, that's worth revisiting as actual dead code rather than "reusable infrastructure."
- **Document Vault has no Admin/Faculty access at all**, by explicit decision (see Phase 5 above) — even though categories like `offer_letter` and `internship_proof` suggest a college might eventually want to verify them. If that need shows up, it's a new, separate access path to design deliberately, not something to bolt on by just adding an admin-override to the existing ownership middleware.
- **Hosted model names churn, across both providers this service has used** — `gemini-2.0-flash` was retired mid-Phase-6; later, `llama-3.3-70b-versatile` was gone from this account's available Groq models by the time of the Groq migration (confirmed live against Groq's `/models` endpoint, not assumed). If `ai-service` starts returning `404`s, check `MODEL` in `ai-service/utils/groqClient.js` against Groq's currently available models first, before assuming a real bug.
- **AI Service has no rate limiting or per-student usage caps** of its own — every call is a real, potentially billed (or free-tier-quota-consuming) request to Groq. The free-tier daily quota problem that motivated leaving Gemini (see Phase 6 above) is a concrete example of why this matters in practice, not just in theory — worth a real conversation before this is student-facing at scale, regardless of provider.
- **Mock Test's timer is client-managed, not server-enforced** (see Phase 7 above) — a deliberate scope decision given the endpoint shapes specified and the lack of any leaderboard/gamification to game. If a "real exam" integrity requirement shows up later (proctoring, a hard cutoff), that needs a session concept this phase intentionally didn't build.
- **All ten backend services are now built.** Only `frontend` remains — the next phase is the first one that isn't "build another service behind the gateway."
