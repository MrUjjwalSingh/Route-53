# AWS Route 53 Clone — AI Build Prompt Pack

> **What this is.** A ready-to-paste prompt pack for an AI coding agent (Claude Code, Cursor, Copilot Agent, etc.) that builds the Scaler SDE Fullstack "AWS Route 53 Clone" assignment end to end.
>
> **How to use it.**
> 1. Paste **Part A — Master Spec** once at the start of the session. It is context, not a task. The agent should acknowledge and wait.
> 2. Then paste **Phase 0**, let it finish, run the verification gate, and only then paste **Phase 1**. Repeat through Phase 7.
> 3. If a phase fails its gate, fix it before moving on. Never paste two phases at once — that is how agents silently drop requirements.
> 4. **Part C — Appendix** is reference material. Paste the relevant appendix section alongside any phase that needs it (noted per phase).
>
> Each phase prompt is self-contained: it restates the stack, the paths, and the conventions, so it survives a context reset or a fresh session.

---
---

# PART A — MASTER SPEC

> Paste this block first. Tell the agent: *"This is the master specification for the project we are about to build. Read it, acknowledge it, and do not write any code yet. I will send you numbered phase prompts one at a time."*

## A1. Role and objective

You are a senior full-stack engineer building a **functional clone of the AWS Route 53 web console**.

The goal is **not** a generic CRUD app that manages DNS-shaped data. The goal is an application that a person who uses AWS daily would mistake for the real Route 53 console. Real DNS resolution is explicitly out of scope — nothing needs to actually resolve. Everything else about the experience should be faithful.

The single highest-weighted evaluation criterion is **UI similarity to Route 53**. When you face a tradeoff between "clean generic design" and "matches AWS exactly", always choose matching AWS.

## A2. Stack — fixed, do not substitute

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js, **App Router** | 15.x |
| Language (FE) | TypeScript, `strict: true` | 5.x |
| UI component library | **`@cloudscape-design/components`** | ^3.0 |
| Global styles / theming | `@cloudscape-design/global-styles` | ^1.0 |
| Table state helper | `@cloudscape-design/collection-hooks` | ^1.0 |
| Server state | `@tanstack/react-query` | ^5 |
| Backend framework | **FastAPI** | latest |
| Language (BE) | Python | 3.11+ |
| ORM | SQLAlchemy 2.x (declarative, typed) | 2.x |
| Validation | Pydantic v2 | 2.x |
| Database | **SQLite** (single file, on disk) | — |
| Tests (BE) | pytest + httpx `AsyncClient` | — |
| Deploy | Vercel (frontend) + Fly.io w/ volume (backend) | — |

### Why Cloudscape is mandatory

`@cloudscape-design/components` is **AWS's own open-source design system — the actual component library the real AWS Console, including Route 53, is built with.** Using it means `Table`, `AppLayout`, `Flashbar`, `SideNavigation`, `BreadcrumbGroup`, `Modal`, `FormField`, and `Wizard` render *pixel-identical* to the real console for free.

**Do not** rebuild these with Tailwind, shadcn/ui, MUI, or hand-written CSS. Do not install Tailwind at all. Any custom CSS you write must be limited to layout glue and must use Cloudscape design tokens (`@cloudscape-design/design-tokens`) rather than hard-coded colors, so dark mode keeps working.

**Required Next.js configuration** (Cloudscape ships untranspiled ESM):

```ts
// frontend/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@cloudscape-design/components',
    '@cloudscape-design/component-toolkit',
  ],
};

export default nextConfig;
```

Global stylesheet, imported exactly once in the root layout:

```ts
import '@cloudscape-design/global-styles/index.css';
```

Because Cloudscape components are stateful and browser-only, **every component that renders a Cloudscape element must be a Client Component** (`'use client'`). Server Components are used only for the outermost layouts and metadata.

## A3. Architecture and the request flow

### Layering rules — enforce these strictly

**Backend, top to bottom:**

```
api/routes/*.py    → HTTP concerns only. Parse, call a service, return a DTO.
                     NEVER contains business rules. NEVER touches the ORM session directly
                     beyond passing it through. Should be <30 lines per endpoint.
schemas/*.py       → Pydantic v2 request/response DTOs. Shape and field-level validation.
                     The ONLY thing routes are allowed to return.
services/*.py      → ALL Route 53 business rules live here. Zone creation side effects,
                     deletion guards, record conflict detection, change tracking.
                     Framework-agnostic — no FastAPI imports, no Request objects.
validation/*.py    → Pure functions. Per-record-type value validation. No I/O, no DB.
models/*.py        → SQLAlchemy declarative models. Columns and relationships only.
                     NO methods containing business logic.
```

**Frontend, top to bottom:**

```
app/**/page.tsx      → Route entry. Composes components, reads route params. Thin.
components/**        → Presentational + interactive UI. Receives data via props or hooks.
lib/hooks/*.ts       → TanStack Query hooks. The ONLY place fetching is triggered.
lib/api/*.ts         → Typed fetch wrappers, one module per resource. No React imports.
lib/validation/*.ts  → Client mirror of backend record rules, for instant field feedback.
context/*.tsx        → Cross-cutting state: auth user, flash notifications, theme.
```

### The end-to-end flow — trace it once, then follow it everywhere

Every feature in this app follows the same path. Implement it this way consistently:

```
┌─ BROWSER ────────────────────────────────────────────────────────────────┐
│                                                                          │
│  User clicks "Create record" in RecordsTable.tsx                         │
│         │                                                                │
│         ▼                                                                │
│  Next.js App Router navigates → app/(console)/hosted-zones/              │
│                                     [zoneId]/records/create/page.tsx     │
│         │                                                                │
│         ▼                                                                │
│  RecordForm.tsx (Client Component)                                       │
│    • renders Cloudscape <Form> + <FormField> + <Select>                  │
│    • on every keystroke → lib/validation/records.ts  (instant feedback,  │
│      identical rules to the backend, so errors appear before submit)     │
│         │ submit                                                         │
│         ▼                                                                │
│  lib/hooks/useRecords.ts → useMutation()                                 │
│         │                                                                │
│         ▼                                                                │
│  lib/api/records.ts → apiFetch('POST', `/hosted-zones/${id}/records`)    │
│    • credentials: 'include'  (session cookie rides along)                │
│    • throws a typed ApiError on non-2xx                                  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │  HTTP
┌─ FASTAPI ───────────────────────────▼────────────────────────────────────┐
│                                                                          │
│  api/routes/records.py                                                   │
│    • Depends(get_current_user)  → 401 if no valid session                │
│    • Depends(get_db)            → SQLAlchemy session                     │
│    • body parsed into schemas/record.py :: RecordCreate  → 422 on shape  │
│         │                                                                │
│         ▼                                                                │
│  services/record_service.py :: create_record()                           │
│    • zone exists? owned by this user?        → 404                       │
│    • validation/record_rules.py :: validate() → 400 InvalidChangeBatch   │
│    • CNAME conflict / apex CNAME check        → 400                      │
│    • duplicate (name, type, set_id) check     → 400                      │
│    • writes DnsRecord + creates a Change row (status PENDING)            │
│         │                                                                │
│         ▼                                                                │
│  models/dns_record.py → SQLAlchemy → SQLite file on disk                 │
│         │                                                                │
│         ▼                                                                │
│  returns schemas/record.py :: RecordResponse + ChangeInfo                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │  JSON
┌─ BROWSER ───────────────────────────▼────────────────────────────────────┐
│                                                                          │
│  useMutation onSuccess:                                                  │
│    • queryClient.invalidateQueries(['records', zoneId])  → table refetch │
│    • NotificationContext.push({type:'success', ...})     → Flashbar      │
│    • router.push(`/hosted-zones/${zoneId}`)              → back to table │
│    • change status pill shows PENDING → polls → INSYNC                   │
│                                                                          │
│  onError (ApiError):                                                     │
│    • field-level errors → mapped back onto the matching <FormField>      │
│    • global errors      → Flashbar error banner, form stays filled       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Non-negotiables that fall out of this flow:**
- Components never call `fetch` directly. Only `lib/api/*` does.
- Hooks are the only thing that calls `lib/api/*`.
- After any mutation, invalidate the relevant query key — never mutate local state as the source of truth.
- Every mutation produces exactly one Flashbar notification (success or error).
- Loading state is a Cloudscape `loading` prop on the `Table`, never a bare spinner replacing the page.

## A4. Complete folder structure

Create exactly this. Every file listed has a stated responsibility — do not merge files, do not invent parallel structures, do not add a `utils/` dumping ground.

```
route53-clone/
├── README.md                             # setup, architecture, DB schema, API overview
├── docker-compose.yml                    # runs frontend + backend together locally
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                        # pytest + tsc --noEmit + eslint + next build
│
├── backend/
│   ├── Dockerfile
│   ├── fly.toml                          # Fly.io app + mounted volume for the .db file
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── .env.example                      # DATABASE_URL, SESSION_SECRET, CORS_ORIGINS
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                       # FastAPI app, CORS, router registration, startup
│   │   ├── config.py                     # pydantic-settings Settings, reads .env
│   │   ├── database.py                   # engine, SessionLocal, Base, get_db dependency
│   │   ├── seed.py                       # idempotent demo data seeder
│   │   ├── errors.py                     # ApiError classes + exception handlers
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py               # re-export all models so Base sees them
│   │   │   ├── user.py                   # User
│   │   │   ├── session.py                # Session (auth token)
│   │   │   ├── hosted_zone.py            # HostedZone
│   │   │   ├── dns_record.py             # DnsRecord
│   │   │   ├── change.py                 # Change (PENDING → INSYNC)
│   │   │   └── tag.py                    # Tag (zone tags)
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── common.py                 # Paginated[T], ChangeInfo, ErrorEnvelope
│   │   │   ├── auth.py                   # LoginRequest, UserResponse
│   │   │   ├── zone.py                   # ZoneCreate, ZoneUpdate, ZoneResponse, ZoneDetail
│   │   │   ├── record.py                 # RecordCreate, RecordUpdate, RecordResponse
│   │   │   └── tag.py                    # TagUpsert, TagResponse
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                   # get_db, get_current_user, pagination params
│   │   │   └── routes/
│   │   │       ├── __init__.py           # aggregates all routers under /api
│   │   │       ├── auth.py               # POST /login /logout, GET /me
│   │   │       ├── hosted_zones.py       # CRUD /hosted-zones
│   │   │       ├── records.py            # CRUD /hosted-zones/{id}/records
│   │   │       ├── changes.py            # GET /changes/{id}
│   │   │       ├── export.py             # GET /hosted-zones/{id}/export
│   │   │       └── account.py            # GET /account (mocked AWS account info)
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py           # login, logout, session lookup
│   │   │   ├── zone_service.py           # zone CRUD + NS/SOA creation + delete guard
│   │   │   ├── record_service.py         # record CRUD + conflict rules + change rows
│   │   │   ├── change_service.py         # create change, PENDING→INSYNC transition
│   │   │   ├── id_generator.py           # Route53-shaped IDs (Z…, C…, nameservers)
│   │   │   └── bind.py                   # zone → BIND text / JSON export
│   │   │
│   │   └── validation/
│   │       ├── __init__.py
│   │       └── record_rules.py           # pure per-type value validators
│   │
│   └── tests/
│       ├── conftest.py                   # in-memory DB fixture, authed client fixture
│       ├── test_auth.py
│       ├── test_hosted_zones.py
│       ├── test_records.py
│       └── test_record_rules.py
│
└── frontend/
    ├── Dockerfile
    ├── next.config.ts                    # transpilePackages — see A2
    ├── tsconfig.json                     # strict: true, "@/*" path alias → src/*
    ├── package.json
    ├── eslint.config.mjs
    ├── .env.local.example                # NEXT_PUBLIC_API_BASE_URL
    └── src/
        ├── app/
        │   ├── layout.tsx                # root: html/body, global-styles import, Providers
        │   ├── providers.tsx             # 'use client' — QueryClient, Auth, Notif, Theme
        │   ├── globals.css               # ONLY layout glue, uses design tokens
        │   ├── page.tsx                  # redirects → /hosted-zones or /login
        │   ├── not-found.tsx             # AWS-styled 404
        │   │
        │   ├── login/
        │   │   └── page.tsx              # AWS sign-in styled page (no console shell)
        │   │
        │   └── (console)/                # route group — everything inside gets the shell
        │       ├── layout.tsx            # auth guard + ConsoleShell (AppLayout)
        │       ├── error.tsx             # error boundary, AWS-styled (Phase 6)
        │       ├── dashboard/
        │       │   └── page.tsx          # Route 53 dashboard w/ mocked widgets
        │       ├── hosted-zones/
        │       │   ├── page.tsx          # LIST: search, filter, sort, paginate
        │       │   ├── create/
        │       │   │   └── page.tsx      # CREATE form
        │       │   └── [zoneId]/
        │       │       ├── page.tsx      # DETAIL: zone info + records table + tabs
        │       │       ├── edit/
        │       │       │   └── page.tsx  # EDIT zone (comment, tags, rename)
        │       │       └── records/
        │       │           ├── create/
        │       │           │   └── page.tsx    # quick-create + wizard
        │       │           └── [recordId]/
        │       │               └── edit/
        │       │                   └── page.tsx
        │       ├── health-checks/page.tsx      # ComingSoon
        │       ├── traffic-policies/page.tsx   # ComingSoon
        │       ├── resolver/page.tsx           # ComingSoon
        │       └── profiles/page.tsx           # ComingSoon
        │
        ├── components/
        │   ├── layout/
        │   │   ├── ConsoleShell.tsx      # Cloudscape AppLayout wiring it all together
        │   │   ├── TopNavBar.tsx         # dark AWS header: logo, search, region, account
        │   │   ├── SideNav.tsx           # Route 53 SideNavigation tree
        │   │   ├── Breadcrumbs.tsx       # BreadcrumbGroup driven by the pathname
        │   │   └── NotificationFlashbar.tsx  # renders NotificationContext queue
        │   │
        │   ├── hosted-zones/
        │   │   ├── HostedZonesTable.tsx  # the list table + header actions + filters
        │   │   ├── HostedZoneForm.tsx    # shared by create + edit
        │   │   ├── ZoneDetailsPanel.tsx  # ColumnLayout of zone properties
        │   │   ├── ZoneTabs.tsx          # Records | DNSSEC signing | Tags
        │   │   ├── ZoneTagsTab.tsx
        │   │   └── DeleteZoneModal.tsx   # typed-confirmation delete
        │   │
        │   ├── records/
        │   │   ├── RecordsTable.tsx      # records list + selection + filters
        │   │   ├── RecordForm.tsx        # quick-create ⇄ wizard toggle
        │   │   ├── RecordTypeSelect.tsx  # typed dropdown w/ AWS descriptions
        │   │   ├── RecordValueField.tsx  # value input that adapts per record type
        │   │   ├── TtlField.tsx          # numeric + 1m/5m/15m/1h/1d quick-select
        │   │   ├── RoutingPolicySelect.tsx
        │   │   ├── ChangeStatusIndicator.tsx  # PENDING → INSYNC pill
        │   │   └── DeleteRecordsModal.tsx
        │   │
        │   └── common/
        │       ├── ComingSoon.tsx        # placeholder page for mocked sections
        │       ├── EmptyState.tsx        # Cloudscape empty-state for tables
        │       ├── TableHeaderActions.tsx
        │       └── ValueWithLabel.tsx    # Box label + value, AWS detail-page idiom
        │
        ├── lib/
        │   ├── api/
        │   │   ├── client.ts             # apiFetch, ApiError, credentials:'include'
        │   │   ├── auth.ts
        │   │   ├── zones.ts
        │   │   ├── records.ts
        │   │   └── account.ts
        │   ├── hooks/
        │   │   ├── useAuth.ts
        │   │   ├── useZones.ts           # useZones, useZone, useCreateZone, …
        │   │   ├── useRecords.ts
        │   │   └── useNotifications.ts
        │   ├── validation/
        │   │   └── records.ts            # MIRRORS backend record_rules.py exactly
        │   ├── constants/
        │   │   ├── recordTypes.ts        # the 9 types + AWS descriptions
        │   │   ├── routingPolicies.ts
        │   │   └── navigation.ts         # SideNav tree definition
        │   ├── types.ts                  # shared TS types matching backend DTOs
        │   └── format.ts                 # date, record-count, FQDN display helpers
        │
        └── context/
            ├── AuthContext.tsx
            ├── NotificationContext.tsx   # push()/dismiss() → Flashbar items
            └── ThemeContext.tsx          # applyMode(Mode.Dark|Light) + localStorage
```

## A5. Data model

SQLite. Create tables via SQLAlchemy `Base.metadata.create_all()` on startup (no Alembic needed for this scope).

**`users`** — mocked identity
`id` PK · `email` UNIQUE · `name` · `password_hash` · `aws_account_id` (12 digits, e.g. `123456789012`) · `created_at`

**`sessions`** — session persistence
`token` PK (opaque, `secrets.token_urlsafe(32)`) · `user_id` FK · `expires_at` · `created_at`

**`hosted_zones`**
`id` PK **TEXT** — Route 53 shape: `Z` + 20 uppercase alphanumerics
`name` — stored as FQDN **with trailing dot** (`example.com.`)
`type` — `Public` | `Private`
`comment` — nullable, shown as "Description" in the UI
`caller_reference` UNIQUE · `created_by` (default `-`) · `owner_user_id` FK · `created_at` · `updated_at`
Constraint: `UNIQUE(owner_user_id, name, type)`

**`dns_records`**
`id` PK (uuid4) · `zone_id` FK → `hosted_zones.id` **ON DELETE CASCADE**
`name` — FQDN with trailing dot
`type` — `A|AAAA|CNAME|TXT|MX|NS|PTR|SRV|CAA|SOA`
`ttl` INTEGER nullable (null when `alias` is true)
**`values` TEXT — a JSON array of strings**
`routing_policy` (default `Simple`) · `set_identifier` nullable · `weight` nullable
`alias` BOOL · `alias_target` nullable · `evaluate_target_health` BOOL · `health_check_id` nullable
**`is_system` BOOL** — true for the auto-created NS/SOA; blocks deletion
`created_at` · `updated_at`
Constraint: `UNIQUE(zone_id, name, type, set_identifier)`

> **Why `values` is a JSON array and not one row per value:** a Route 53 *record set* holds multiple values under one name+type — the apex NS record holds four nameservers, an A record can hold several IPs. The console renders them newline-separated inside a single table cell and edits them in a single textarea. Modelling one row per value would produce four NS rows where AWS shows one, and would break UI fidelity immediately.

**`changes`**
`id` PK TEXT — `C` + 14 uppercase alphanumerics · `zone_id` FK · `status` (`PENDING` | `INSYNC`) · `comment` · `submitted_at`

**`tags`**
`id` PK · `resource_id` (zone id) · `key` · `value` · `UNIQUE(resource_id, key)`

## A6. API contract

Base path `/api`. Cookie-based auth (`session` httpOnly cookie). All list endpoints are paginated.

```
POST   /api/auth/login                    {email, password} → UserResponse + Set-Cookie
POST   /api/auth/logout                                     → 204, clears cookie
GET    /api/auth/me                                         → UserResponse | 401
GET    /api/account                                         → mocked account/region info

GET    /api/hosted-zones                  ?search=&type=&page=&page_size=&sort=&order=
                                                            → Paginated[ZoneResponse]
POST   /api/hosted-zones                  {name, type, comment, vpc?}
                                                            → ZoneDetail + ChangeInfo
GET    /api/hosted-zones/{zone_id}                          → ZoneDetail
PATCH  /api/hosted-zones/{zone_id}        {comment?, name?}  → ZoneDetail
DELETE /api/hosted-zones/{zone_id}                          → 204 | 400 HostedZoneNotEmpty

GET    /api/hosted-zones/{zone_id}/records ?search=&type=&page=&page_size=
                                                            → Paginated[RecordResponse]
POST   /api/hosted-zones/{zone_id}/records                  → RecordResponse + ChangeInfo
PATCH  /api/hosted-zones/{zone_id}/records/{record_id}      → RecordResponse + ChangeInfo
DELETE /api/hosted-zones/{zone_id}/records/{record_id}      → 204 | 400 (is_system)

GET    /api/hosted-zones/{zone_id}/export ?format=json|bind → file download
GET    /api/changes/{change_id}                             → ChangeInfo

PUT    /api/hosted-zones/{zone_id}/tags   {tags: [{key, value}]} → TagResponse[]
```

**Error envelope — every 4xx/5xx returns this shape**, so the frontend can render authentic console errors:

```json
{ "error": { "code": "InvalidChangeBatch", "message": "...", "field": "values" } }
```

Codes to use: `InvalidInput`, `InvalidChangeBatch`, `HostedZoneAlreadyExists`, `HostedZoneNotEmpty`, `NoSuchHostedZone`, `NoSuchRecord`, `RRSetAlreadyExists`, `NotAuthorized`.

## A7. Definition of done

A phase is done when its stated verification gate passes. The **project** is done when:

- Login → logout → session survives a hard refresh
- Hosted zones: view, search, filter, sort, paginate, create, edit, delete — all persisting in SQLite across a backend restart
- DNS records: all 9 types create/validate/edit/delete inside a zone, with search and pagination
- Every mutation raises a Flashbar notification; every destructive action goes through a modal
- Dashboard + 5 "Coming Soon" pages reachable from the side nav
- Dark mode toggles and persists
- README documents setup, architecture, DB schema, and API
- A hosted link works from a clean browser with no local setup

---
---

# PART B — PHASE PROMPTS

> Paste one at a time. Run the gate before continuing.

---

## PHASE 0 — Scaffold, tooling, CI

```
PHASE 0 of 7 — Repository scaffold.

Build the skeleton only. No features, no business logic, no styling work beyond
proving Cloudscape renders.

CREATE THESE FILES:

  route53-clone/
  ├── .gitignore                 (node_modules, .next, __pycache__, *.db, .env*, .venv)
  ├── docker-compose.yml
  ├── README.md                  (title + one-paragraph stub; filled in at Phase 7)
  ├── .github/workflows/ci.yml
  ├── backend/
  │   ├── requirements.txt       fastapi, uvicorn[standard], sqlalchemy>=2,
  │   │                          pydantic>=2, pydantic-settings, python-multipart,
  │   │                          pytest, pytest-asyncio, httpx
  │   ├── pytest.ini
  │   ├── .env.example           DATABASE_URL=sqlite:///./route53.db
  │   │                          SESSION_SECRET=dev-secret-change-me
  │   │                          CORS_ORIGINS=http://localhost:3000
  │   └── app/
  │       ├── __init__.py
  │       ├── config.py          pydantic-settings Settings class reading the above
  │       ├── database.py        engine + SessionLocal + Base + get_db() generator
  │       └── main.py            FastAPI(title="Route 53 Clone API"),
  │                              CORSMiddleware (allow_credentials=True, origins from
  │                              settings), GET /api/health → {"status":"ok"}
  └── frontend/                  create with:
                                 npx create-next-app@15 frontend \
                                   --typescript --app --eslint --src-dir \
                                   --import-alias "@/*" --no-tailwind

     *** PIN TO 15 — DO NOT USE @latest. ***
     create-next-app@latest currently installs Next 16, where Turbopack is the
     default bundler and Cloudscape's transpilePackages requirement is far less
     proven. Next 15 (React 19) is the known-good pairing for this stack. If you
     deliberately move to 16 later, re-run the Phase 0 gate first — an unstyled
     Cloudscape render is the symptom of getting this wrong.

FRONTEND SETUP AFTER SCAFFOLDING:
  1. npm i @cloudscape-design/components @cloudscape-design/global-styles \
           @cloudscape-design/collection-hooks @cloudscape-design/design-tokens \
           @tanstack/react-query
  2. next.config.ts — add:
       transpilePackages: ['@cloudscape-design/components',
                          '@cloudscape-design/component-toolkit']
  3. src/app/layout.tsx — import '@cloudscape-design/global-styles/index.css'
  4. src/app/page.tsx — TEMPORARY smoke test: a 'use client' page rendering a
     Cloudscape <Alert>, <Button> and <Table> with two dummy rows. This exists only
     to prove Cloudscape compiles under the App Router. It is replaced in Phase 3.
  5. .env.local.example → NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
  6. tsconfig.json — confirm "strict": true

DO NOT INSTALL: tailwindcss, shadcn/ui, MUI, styled-components, or any other UI or
CSS framework. Cloudscape is the only component library in this project.

CI (.github/workflows/ci.yml) — on push and PR, two jobs:
  backend : pip install -r requirements.txt → pytest
  frontend: npm ci → npx tsc --noEmit → npm run lint → npm run build

VERIFICATION GATE — report the result of each:
  1. cd backend && uvicorn app.main:app --reload
     → http://localhost:8000/api/health returns {"status":"ok"}
     → http://localhost:8000/docs loads
  2. cd frontend && npm run dev
     → http://localhost:3000 shows a styled Cloudscape table (AWS look, Open Sans
       font, not unstyled HTML). If it looks unstyled, transpilePackages or the
       global-styles import is wrong — fix before proceeding.
  3. npx tsc --noEmit passes with zero errors.
```

---

## PHASE 1 — Database layer

```
PHASE 1 of 7 — Data model, SQLite, ID generation, seed data.

Project: AWS Route 53 console clone. Backend = FastAPI + SQLAlchemy 2 + SQLite,
already scaffolded in backend/app/. Models hold columns and relationships ONLY —
no business logic methods.

CREATE:

  backend/app/models/__init__.py     re-export every model so Base.metadata sees them
  backend/app/models/user.py         User
  backend/app/models/session.py      Session
  backend/app/models/hosted_zone.py  HostedZone
  backend/app/models/dns_record.py   DnsRecord
  backend/app/models/change.py       Change
  backend/app/models/tag.py          Tag
  backend/app/services/id_generator.py
  backend/app/seed.py

SCHEMA — use SQLAlchemy 2.0 typed style (Mapped[...] / mapped_column):

users            id PK | email UNIQUE | name | password_hash |
                 aws_account_id (12-digit string) | created_at
sessions         token PK | user_id FK→users | expires_at | created_at
hosted_zones     id PK TEXT | name | type | comment NULL | caller_reference UNIQUE |
                 created_by DEFAULT '-' | owner_user_id FK | created_at | updated_at
                 UNIQUE(owner_user_id, name, type)
dns_records      id PK TEXT | zone_id FK→hosted_zones ON DELETE CASCADE |
                 name | type | ttl INT NULL | values TEXT (JSON array of strings) |
                 routing_policy DEFAULT 'Simple' | set_identifier NULL | weight NULL |
                 alias BOOL DEFAULT 0 | alias_target NULL |
                 evaluate_target_health BOOL DEFAULT 0 | health_check_id NULL |
                 is_system BOOL DEFAULT 0 | created_at | updated_at
                 UNIQUE(zone_id, name, type, set_identifier)
changes          id PK TEXT | zone_id FK | status | comment NULL | submitted_at
tags             id PK | resource_id | key | value | UNIQUE(resource_id, key)

CRITICAL — `values` is a JSON-encoded array of strings, NOT one row per value.
A Route 53 record SET holds multiple values under one name+type (the apex NS record
holds four nameservers). The console shows them newline-separated in ONE cell and
edits them in ONE textarea. One-row-per-value would break UI fidelity.
Use a SQLAlchemy TypeDecorator (JSONEncodedList) so Python sees list[str].

Also: SQLite does not enforce foreign keys by default. Register a connection event
that issues `PRAGMA foreign_keys=ON` so the record cascade actually works.

id_generator.py — Route 53-shaped identifiers:
  new_zone_id()      -> 'Z' + 20 random uppercase A-Z0-9
  new_change_id()    -> 'C' + 14 random uppercase A-Z0-9
  new_record_id()    -> uuid4 hex
  new_nameservers()  -> a stable-looking set of four strings:
                        ns-<4 digits>.awsdns-<2 digits>.com
                        ns-<4 digits>.awsdns-<2 digits>.net
                        ns-<4 digits>.awsdns-<2 digits>.org
                        ns-<4 digits>.awsdns-<2 digits>.co.uk
  new_caller_reference() -> uuid4 str

seed.py — IDEMPOTENT (safe to run repeatedly; check-then-insert, never blind insert):
  • demo user: demo@route53clone.dev / "Passw0rd!" (hash it),
    name "Demo User", aws_account_id "123456789012"
  • three public hosted zones owned by that user, each with its auto NS + SOA
    system records, plus realistic extra records so tables/pagination look real:
      example.com.        ~12 records (A, AAAA, CNAME www, MX ×2, TXT SPF, CAA)
      my-startup.io.      ~8  records
      internal-corp.net.  private zone, ~5 records
  • Enough total records that pagination is visibly exercised.

Wire Base.metadata.create_all() into a FastAPI startup hook in main.py, and expose
seeding via `python -m app.seed`.

VERIFICATION GATE:
  1. python -m app.seed && python -m app.seed   (twice — second run must not
     duplicate rows or raise)
  2. sqlite3 route53.db ".schema"  → all 6 tables, correct constraints
  3. sqlite3 route53.db "SELECT id, name, type FROM hosted_zones;"
     → zone ids match ^Z[A-Z0-9]{20}$
  4. sqlite3 route53.db "SELECT name, type, values FROM dns_records WHERE type='NS';"
     → ONE row whose values column is a JSON array of FOUR nameserver strings
```

---

## PHASE 2 — Backend API and business rules

```
PHASE 2 of 7 — Auth, hosted zone + record CRUD, Route 53 business rules, tests.

Project: AWS Route 53 console clone. FastAPI + SQLAlchemy 2 + SQLite. Models exist
in backend/app/models/. This phase builds everything above them.

ENFORCE THE LAYERING — this is graded:
  routes/    HTTP only: parse → call service → return DTO. <30 lines per endpoint.
             No business rules. No raw ORM queries.
  schemas/   Pydantic v2 DTOs. The only thing routes may return.
  services/  ALL business rules. No FastAPI imports whatsoever.
  validation/ Pure functions. No I/O, no DB, no framework.

CREATE:
  app/errors.py                     ApiError base + subclasses + exception handlers
                                    emitting {"error":{"code","message","field"}}
  app/schemas/{common,auth,zone,record,tag}.py
  app/api/deps.py                   get_db, get_current_user, PaginationParams
  app/api/routes/__init__.py        aggregate router mounted at /api
  app/api/routes/{auth,hosted_zones,records,changes,export,account}.py
  app/services/{auth_service,zone_service,record_service,change_service,bind}.py
  app/validation/record_rules.py
  tests/{conftest,test_auth,test_hosted_zones,test_records,test_record_rules}.py

ENDPOINTS — implement exactly the contract in the Master Spec section A6.

AUTH (mocked, but behave like a real session system):
  POST /api/auth/login  → verify credentials, create a sessions row, set an httpOnly
                          cookie named "session" (samesite=lax, path=/, secure in prod)
  POST /api/auth/logout → delete the session row, clear the cookie
  GET  /api/auth/me     → resolve cookie → user, else 401
  get_current_user is a FastAPI dependency; EVERY zone/record route depends on it and
  scopes queries to that user's rows.

=== ROUTE 53 BUSINESS RULES — implement all of these exactly ===

1. ZONE CREATION SIDE EFFECTS. Creating a hosted zone auto-creates two records
   marked is_system=True:
     NS  — name = zone name, ttl = 172800, values = the four generated nameservers
     SOA — name = zone name, ttl = 900, values = [
             "ns-2048.awsdns-64.net. awsdns-hostmaster.amazon.com. "
             "1 7200 900 1209600 86400" ]   (first nameserver + these exact numbers)
   Normalise the zone name to a trailing dot. Reject duplicates for the same user
   with 400 HostedZoneAlreadyExists.

2. SYSTEM RECORD PROTECTION. DELETE on a record with is_system=True → 400.
   The apex NS record may be EDITED (values/TTL) but never deleted. SOA may be edited
   but never deleted.

3. ZONE DELETION GUARD. DELETE /hosted-zones/{id} → 400 HostedZoneNotEmpty if the
   zone still contains any record that is NOT one of its system NS/SOA records.
   Message: "The specified hosted zone contains non-required resource record sets
   and so cannot be deleted." (This mirrors the real API and drives a UI affordance
   in Phase 5.)

4. ZONE EDITING. Route 53 itself only permits editing the COMMENT and TAGS.
   Implement that faithfully. ADDITIONALLY permit renaming via PATCH {name} so the
   assignment's "Edit Hosted Zones" requirement is unambiguously satisfied — on
   rename, cascade the suffix of every record name in the zone. Note this deviation
   in a code comment; it gets documented in the README at Phase 7.

5. RECORD CONFLICT RULES:
   • duplicate (zone_id, name, type, set_identifier) → 400 RRSetAlreadyExists
   • a CNAME cannot coexist with ANY other record of the same name → 400
   • a CNAME cannot be created at the zone apex (name == zone name) → 400
   • record name MUST be inside the zone: name == zone_name or name.endswith
     ("." + zone_name) → else 400
   • when routing_policy != 'Simple', set_identifier is REQUIRED → 400

6. PER-TYPE VALUE VALIDATION — validation/record_rules.py, one pure function per
   type, returning a list of error strings:
     A     each value a valid IPv4 (ipaddress.IPv4Address)
     AAAA  each value a valid IPv6 (ipaddress.IPv6Address)
     CNAME exactly ONE value, a valid hostname
     TXT   each value wrapped in double quotes; each quoted string ≤255 chars
     MX    "<priority 0-65535> <hostname>"
     NS    each value a valid hostname
     PTR   valid hostname
     SRV   "<priority> <weight> <port> <target>" — three ints 0-65535 + hostname
     CAA   '<flags 0-255> <issue|issuewild|iodef> "<value>"'
     SOA   7 whitespace-separated fields
   TTL: integer 0..2147483647; required unless alias=True; must be null if alias.
   Return ALL errors at once, not just the first — the UI shows them per field.

7. CHANGE TRACKING. Every record create/update/delete AND every zone create inserts
   a changes row with status PENDING and returns ChangeInfo {id, status,
   submitted_at}. GET /api/changes/{id} returns INSYNC once >5 seconds have elapsed
   since submitted_at (compute on read; no background worker).

8. LIST ENDPOINTS: case-insensitive `search` (zones → name; records → name and
   values), `type` filter, `sort`/`order`, `page`/`page_size` (default 10). Return
   Paginated[T] = {items, total, page, page_size, total_pages}.
   Zone list items include a computed record_count.

9. EXPORT: ?format=json returns the zone + records as JSON; ?format=bind renders a
   valid BIND zone file (services/bind.py) with a Content-Disposition attachment
   header.

TESTS (pytest, in-memory SQLite fixture, httpx AsyncClient, authed-client fixture) —
cover at minimum: login/logout/me + 401 on unauthenticated access; zone CRUD; NS+SOA
auto-creation; delete guard fires and then succeeds after records are removed; system
record delete rejected; CNAME apex rejected; CNAME coexistence rejected; duplicate
rrset rejected; one valid + one invalid case for EACH of the 9 record types;
pagination and search.

VERIFICATION GATE:
  1. pytest -v → all green, and the suite covers every rule above
  2. Open http://localhost:8000/docs and manually: login → create a zone →
     confirm NS+SOA appear → try to delete the zone (expect 400 HostedZoneNotEmpty)
     → add an A record → try an invalid A record "999.1.1.1" (expect 400 with a
     readable message) → delete the A record → delete the zone (expect 204)
  3. Confirm no route file contains business logic and no service imports fastapi.
```

---

## PHASE 3 — Console shell, auth UI, dark mode

```
PHASE 3 of 7 — The AWS console shell. This phase decides whether the app LOOKS like
Route 53, so match the real console closely.

Project: AWS Route 53 console clone. Next.js 15 App Router + TypeScript strict +
Cloudscape. Backend from Phase 2 runs at NEXT_PUBLIC_API_BASE_URL.

Delete the temporary smoke-test page from Phase 0.

EVERY component rendering Cloudscape must be a Client Component ('use client').
Server Components only for the outer layouts.

CREATE:
  src/lib/types.ts                  TS types mirroring the backend DTOs exactly
  src/lib/api/client.ts             apiFetch<T>() — base URL from env,
                                    credentials:'include', JSON headers, parses the
                                    {"error":{code,message,field}} envelope into a
                                    typed ApiError class. NOTHING else may call fetch.
  src/lib/api/{auth,account}.ts
  src/lib/constants/navigation.ts   the side-nav tree, single source of truth
  src/lib/format.ts                 date/FQDN/record-count display helpers
  src/context/AuthContext.tsx       user, login(), logout(), isLoading
  src/context/NotificationContext.tsx  push({type,header,content}) / dismiss(id),
                                    auto-dismiss success after 5s
  src/context/ThemeContext.tsx      applyMode(Mode.Dark|Light) from
                                    '@cloudscape-design/global-styles',
                                    persisted to localStorage, restored before paint
  src/lib/hooks/useAuth.ts
  src/lib/hooks/useNotifications.ts
  src/app/providers.tsx             'use client' — QueryClientProvider + the three
                                    contexts, composed in that order
  src/app/layout.tsx                root: global-styles import, <Providers>
  src/app/page.tsx                  redirect → /hosted-zones (or /login)
  src/app/not-found.tsx
  src/app/login/page.tsx
  src/app/(console)/layout.tsx      auth guard + <ConsoleShell>
  src/components/layout/ConsoleShell.tsx
  src/components/layout/TopNavBar.tsx
  src/components/layout/SideNav.tsx
  src/components/layout/Breadcrumbs.tsx
  src/components/layout/NotificationFlashbar.tsx
  src/components/common/ComingSoon.tsx
  src/app/(console)/dashboard/page.tsx
  src/app/(console)/health-checks/page.tsx
  src/app/(console)/traffic-policies/page.tsx
  src/app/(console)/resolver/page.tsx
  src/app/(console)/profiles/page.tsx

LOGIN PAGE — mirror the AWS sign-in screen: centred narrow card on a light grey
background, AWS-style wordmark at top, "Sign in" heading, Email + Password
FormFields, full-width primary "Sign in" button, and a small helper box showing the
demo credentials (demo@route53clone.dev / Passw0rd!) so a reviewer can get in
instantly. On error show a Cloudscape <Alert type="error">. No console shell here.

CONSOLE SHELL — Cloudscape <AppLayout> with:
  navigation={<SideNav/>}  breadcrumbs={<Breadcrumbs/>}
  notifications={<NotificationFlashbar/>}  content={children}
  navigationHide=false, toolsHide=true, and the AppLayout must be the ONLY
  scroll container (do not wrap it in a div that also scrolls).

TOP NAV BAR — Cloudscape <TopNavigation>, rendered ABOVE AppLayout in a sticky
container.

  *** READ THIS BEFORE STYLING THE HEADER ***
  Cloudscape does NOT ship a dark-header variant of TopNavigation, and there is no
  supported "dark context" wrapper that darkens only the header while the rest of
  the app stays light. (This is an open feature request — cloudscape-design/
  components issue #2048.) Do not burn time hunting for an official API; it does
  not exist.
  Do this instead:
    1. Render <TopNavigation> normally, wrapped in <div id="app-header"> with
       position: sticky; top: 0; z-index: 1000.
    2. In globals.css add a SCOPED override giving it the real AWS console header
       colour — background #232f3e with light text/icons — targeted under
       #app-header only, so nothing else in the app is affected. Add a comment
       saying this is a deliberate custom override because Cloudscape has no dark
       header variant.
    3. In dark mode the header stays dark; verify the override does not fight
       the dark theme's own tokens.
  ACCEPTABLE FALLBACK: if the override proves brittle, ship the default light
  TopNavigation and move on. It still reads as an authentic Cloudscape-based AWS
  service console. Do NOT let this one detail block the phase.

Contents of the top nav:
  • identity: "AWS" wordmark linking to /dashboard
  • a search input in the middle
  • right-hand utilities, in this order:
      - a bell/notifications icon (decorative)
      - a "Light / Dark" theme toggle → ThemeContext  [BONUS FEATURE]
      - region menu: "N. Virginia (us-east-1)" with a few other regions listed
      - account menu: the user's email, "Account ID: 1234-5678-9012",
        with a "Sign out" item wired to logout()

SIDE NAV — Cloudscape <SideNavigation> with header {text:"Route 53", href:"/dashboard"}
and this exact tree (this IS the real Route 53 nav order):
  Dashboard                          /dashboard
  ──────── (divider)
  Hosted zones                       /hosted-zones
  Health checks                      /health-checks
  ──────── (divider, section "Traffic flow")
  Traffic policies                   /traffic-policies
  ──────── (divider, section "Resolver")
  Resolver                           /resolver
  Profiles                           /profiles
Active item must be driven by usePathname() and stay highlighted on child routes
(e.g. /hosted-zones/Z123... keeps "Hosted zones" active).

BREADCRUMBS — derived from the pathname. Route 53 always roots at "Route 53":
  Route 53 › Hosted zones
  Route 53 › Hosted zones › example.com
  Route 53 › Hosted zones › example.com › Create record

AUTH GUARD — (console)/layout.tsx calls useAuth(); while loading render a Cloudscape
<Spinner> centred; if unauthenticated router.replace('/login'). Session must survive
a hard refresh because the cookie is httpOnly and /auth/me re-resolves it.

DASHBOARD — a real-looking Route 53 dashboard, not a placeholder: <Header
variant="h1"> "Route 53 dashboard", a ColumnLayout of stat boxes (Hosted zones count
— fetched live; Health checks 0; Traffic policies 0; Domains 0) and a "Get started"
Container with the standard AWS marketing-ish copy.

COMING SOON — a reusable <ComingSoon title description/> using Cloudscape
<ContentLayout> + <Header variant="h1"> + a <Container> holding a centred Box with a
"Coming soon" message. The four placeholder pages each pass their own real Route 53
page title and description.

DARK MODE — applyMode must run before first paint (inline script or layout effect)
to avoid a light flash. Verify the top nav, side nav, tables, and modals ALL respond.

VERIFICATION GATE:
  1. / redirects to /login when logged out
  2. Sign in with the demo credentials → lands on the console shell
  3. HARD REFRESH (Cmd-Shift-R) → still signed in, no flicker to /login
  4. Every side-nav item routes to a real page; the active item highlights correctly
  5. Dark mode toggle flips the ENTIRE UI including the top bar; survives a refresh
  6. Sign out → back to /login; visiting /hosted-zones directly redirects to /login
  7. npx tsc --noEmit clean
```

---

## PHASE 4 — Hosted Zones CRUD

```
PHASE 4 of 7 — Hosted Zones: list, create, detail, edit, delete.

Project: AWS Route 53 console clone. Next.js 15 App Router + Cloudscape. Console
shell and auth exist from Phase 3; backend zone API exists from Phase 2.

CREATE:
  src/lib/api/zones.ts
  src/lib/hooks/useZones.ts      useZones(params), useZone(id), useCreateZone(),
                                 useUpdateZone(), useDeleteZone()
  src/components/hosted-zones/HostedZonesTable.tsx
  src/components/hosted-zones/HostedZoneForm.tsx      (shared: create + edit)
  src/components/hosted-zones/ZoneDetailsPanel.tsx
  src/components/hosted-zones/ZoneTabs.tsx
  src/components/hosted-zones/ZoneTagsTab.tsx
  src/components/hosted-zones/DeleteZoneModal.tsx
  src/components/common/{EmptyState,TableHeaderActions,ValueWithLabel}.tsx
  src/app/(console)/hosted-zones/page.tsx
  src/app/(console)/hosted-zones/create/page.tsx
  src/app/(console)/hosted-zones/[zoneId]/page.tsx
  src/app/(console)/hosted-zones/[zoneId]/edit/page.tsx

LIST PAGE — Cloudscape <Table> inside <ContentLayout>. Columns, in this exact order
(these are the real console's columns):
  Hosted zone name  → Link to /hosted-zones/{id}; display WITHOUT the trailing dot
  Type              → "Public hosted zone" | "Private hosted zone"
  Created by        → "-"
  Record count      → number
  Description       → comment, or "-"
  Hosted zone ID    → the Z… id, monospace-ish

Table <Header variant="h1"> "Hosted zones" with a counter "(12)", and header actions
right-aligned in this order: [Edit] [Delete] (both disabled until exactly one row is
selected) then [Create hosted zone] (variant="primary").
selectionType="single".

Filtering row above the table: a <TextFilter> with placeholder
"Find hosted zones" plus a <Select> for Type (Any type / Public / Private), then
<CollectionPreferences> (page size 10/20/50, column visibility) and <Pagination> on
the right. Server-side: pass search/type/page/page_size/sort/order to the API and
keep them in the URL query string so the view is shareable and survives a refresh.

Empty state: EmptyState with "No hosted zones", "Create a hosted zone to get
started.", and a Create button. Filtered-empty state differs: "No matches" +
"Clear filter".

CREATE PAGE — <Form> with a <Header variant="h1"> "Create hosted zone" and
actions [Cancel] [Create hosted zone]:
  Domain name   FormField w/ description "This is the name of the domain that you
                want to route traffic for." Validate a real domain shape on blur.
  Description   optional, "Optional comment about the hosted zone."
  Type          RadioGroup — "Public hosted zone" (description: "A public hosted
                zone determines how traffic is routed on the internet.") and
                "Private hosted zone" ("...routed within an Amazon VPC.")
  Tags          an ExpandableSection with add/remove key-value rows
On success: push a success Flashbar ("Hosted zone example.com created") and route to
the new zone's detail page. On ApiError: map field errors onto FormFields; show
non-field errors in a Flashbar; DO NOT clear the form.

DETAIL PAGE — this is the page a reviewer will study:
  Header variant="h1" = the zone name, with actions [Delete zone] [Edit zone]
  A <Container> "Hosted zone details" — ColumnLayout columns={3} of ValueWithLabel:
    Hosted zone name | Type | Record count | Hosted zone ID | Description |
    Name servers (the four NS values, one per line)
  Below it <Tabs>: "Records" (populated in Phase 5 — render a placeholder Container
  here), "DNSSEC signing" (ComingSoon-style), "Hosted zone tags" (working CRUD).

EDIT PAGE — reuses HostedZoneForm in edit mode. Description and tags are freely
editable. The domain name field is editable but sits behind an
<Alert type="warning"> explaining that renaming rewrites every record in the zone —
matching the backend behaviour from Phase 2.

DELETE MODAL — Cloudscape <Modal>, header "Delete hosted zone", a
<Box variant="span"> warning that this is permanent, and a confirmation input the
user must type the zone name into before the red [Delete] button enables.
If the API returns HostedZoneNotEmpty, do NOT just show a raw error: render an
<Alert type="error"> inside the modal explaining the zone still contains records,
with a link to the zone's Records tab. This is exactly how the real console behaves
and is a strong fidelity signal.

DATA-FLOW RULES (from the Master Spec — follow exactly):
  components → hooks → lib/api → backend.  Components never call fetch.
  Every mutation: invalidateQueries on success + exactly one Flashbar notification.
  Table loading state = the Table's own `loading` prop, never a page-level spinner.

VERIFICATION GATE:
  1. List shows the seeded zones with correct record counts
  2. Search "example" filters; the Type filter narrows to Public/Private; sorting by
     name and record count works; pagination works with page size 10 → 20
  3. Reload the page with filters applied → filters restored from the URL
  4. Create a zone → success Flashbar → lands on detail → NS and SOA already present
     in the details panel's Name servers field
  5. Edit description → persists after refresh
  6. Delete the zone you just created → succeeds
  7. Try to delete a SEEDED zone (which has extra records) → the modal shows the
     "contains records" error, not a crash
  8. Restart the backend → all data still there (SQLite persistence)
  9. npx tsc --noEmit clean
```

---

## PHASE 5 — DNS Records CRUD

```
PHASE 5 of 7 — DNS Records inside a hosted zone. The most detail-heavy phase.

Project: AWS Route 53 console clone. Next.js 15 App Router + Cloudscape. Zones UI
exists from Phase 4; record API + validation rules exist from Phase 2.

CREATE:
  src/lib/api/records.ts
  src/lib/hooks/useRecords.ts
  src/lib/validation/records.ts        MIRROR of backend validation/record_rules.py
  src/lib/constants/recordTypes.ts
  src/lib/constants/routingPolicies.ts
  src/components/records/RecordsTable.tsx
  src/components/records/RecordForm.tsx
  src/components/records/RecordTypeSelect.tsx
  src/components/records/RecordValueField.tsx
  src/components/records/TtlField.tsx
  src/components/records/RoutingPolicySelect.tsx
  src/components/records/ChangeStatusIndicator.tsx
  src/components/records/DeleteRecordsModal.tsx
  src/app/(console)/hosted-zones/[zoneId]/records/create/page.tsx
  src/app/(console)/hosted-zones/[zoneId]/records/[recordId]/edit/page.tsx
  → and replace the Records tab placeholder in ZoneTabs.tsx with <RecordsTable/>

RECORDS TABLE — columns in this exact order (the real console's):
  Record name              (display without the trailing dot; apex shows the zone name)
  Type
  Routing policy           ("Simple")
  Alias                    ("No" / "Yes")
  Value/Route traffic to   ALL values joined by newlines in ONE cell, wrapped in a
                           Box with whiteSpace pre-line; truncate >3 values with
                           "+N more"
  TTL (seconds)
  Evaluate target health   ("-" when not an alias)
  Health check ID          ("-")

Header: "Records" + counter, actions [Delete record] [Edit record] (enabled on
selection) and [Create record] (primary).
selectionType="multi". System records (is_system) must NOT be selectable for
deletion — use isItemDisabled so their checkbox is disabled, and surface a tooltip/
description explaining NS and SOA records cannot be deleted.

Above the table: <TextFilter> placeholder "Filter records by property or value",
a record-type <Select> (Any type + all 9 types), <CollectionPreferences>, and
<Pagination>. All server-side via the API, mirrored into the URL query string.

RECORD TYPE SELECT — options must carry the real AWS descriptions:
  A     – Routes traffic to an IPv4 address and some AWS resources
  AAAA  – Routes traffic to an IPv6 address and some AWS resources
  CNAME – Routes traffic to another domain name and to some AWS resources
  MX    – Specifies mail servers
  TXT   – Used to verify email senders and for application-specific values
  NS    – Name servers for a hosted zone
  PTR   – Maps an IP address to a domain name
  SRV   – Application-specific values that identify servers
  CAA   – Restricts CAs that can create SSL/TLS certificates for the domain
Render with Cloudscape <Select> using the `description` field so they appear exactly
as in the console dropdown.

CREATE RECORD PAGE — the real console offers two modes. Implement BOTH:
  • QUICK CREATE (default): a single <Container> "Quick create record" with a
    "Switch to wizard" link top-right.
  • WIZARD: Cloudscape <Wizard> with steps
      1. Choose routing policy   2. Configure records   3. Review and create
    and a "Switch to quick create" link.

Quick-create fields, in the real console's order:
  Record name    an Input with the zone name shown as a suffix addon
                 (e.g. [ www ] .example.com). Empty = the zone apex.
  Record type    RecordTypeSelect
  Value          RecordValueField — a multiline Textarea, one value per line, with a
                 constraint hint that CHANGES BY TYPE:
                   A     "Enter multiple values on separate lines. e.g. 192.0.2.1"
                   AAAA  "e.g. 2001:0db8:85a3::8a2e:0370:7334"
                   CNAME "e.g. example.com  (only one value allowed)"
                   MX    "e.g. 10 mailserver.example.com"
                   TXT   'e.g. "v=spf1 include:_spf.example.com ~all"'
                   SRV   "e.g. 1 10 5269 xmpp-server.example.com"
                   CAA   'e.g. 0 issue "ca.example.net"'
                   NS/PTR hostname hints
                 CNAME must force the textarea to a single line's worth of value.
  TTL (seconds)  TtlField — a numeric Input plus quick-select buttons/segmented
                 control for 1m (60), 5m (300), 15m (900), 1h (3600), 1d (86400)
  Routing policy RoutingPolicySelect — Simple routing (default), Weighted,
                 Geolocation, Latency, Failover, Multivalue answer. Non-Simple
                 choices reveal a required "Record ID" (set_identifier) field.

VALIDATION — validate on blur and on submit using lib/validation/records.ts, which
must implement the SAME rules as the backend so users get instant feedback:
  A/AAAA IP shape · CNAME single value + not at apex + no coexisting record ·
  TXT quoted, ≤255 per string · MX "<priority> <host>" · SRV four fields ·
  CAA "<flags> <issue|issuewild|iodef> \"<value>\"" · TTL 0..2147483647.
Show errors via FormField errorText. The backend remains the authority: on a 400,
map error.field back onto the matching FormField.

EDIT RECORD — same form pre-filled; Record name and Type are DISABLED (Route 53
does not allow changing them — you delete and recreate instead). Show a
<Box variant="small"> note saying so.

DELETE — <Modal> listing the selected records in a small table, warning that
deletion is permanent. Block system records. Multi-delete is allowed for
non-system records.

CHANGE STATUS — after any mutation, take the returned ChangeInfo and show a
<StatusIndicator type="pending"> "PENDING" pill in the Flashbar/near the table,
polling GET /api/changes/{id} every 2s until it reports INSYNC, then flip to
<StatusIndicator type="success"> "INSYNC". This propagation status is a signature
part of the real Route 53 experience — do not skip it.

ZONE DELETION AFFORDANCE — the Records tab header gains a "Delete all records"
action (non-system only), so a user blocked by HostedZoneNotEmpty in Phase 4 has a
path forward.

VERIFICATION GATE — for EACH of the 9 record types, create one valid record and one
invalid record and confirm the error message is specific and readable:
  A 192.0.2.1 / 999.1.1.1
  AAAA 2001:db8::1 / not-an-ip
  CNAME www→example.com / a CNAME at the apex (must be rejected)
  MX "10 mail.example.com" / "mail.example.com" (missing priority)
  TXT "\"v=spf1 ~all\"" / unquoted text
  NS / PTR / SRV "1 10 5269 xmpp.example.com" / "1 10 xmpp.example.com"
  CAA "0 issue \"ca.example.net\"" / "0 badtag \"x\""
Then:
  1. Multi-value: one A record with 3 IPs on 3 lines → table shows all three in ONE
     row, newline-separated
  2. NS and SOA rows cannot be selected for deletion
  3. Search and the type filter both work; pagination works
  4. Edit a record's TTL → persists after refresh
  5. PENDING → INSYNC transition is visible
  6. Delete all non-system records → the zone can now be deleted from Phase 4's modal
  7. Restart the backend → everything persisted
  8. npx tsc --noEmit clean
```

---

## PHASE 6 — States, polish, fidelity pass

```
PHASE 6 of 7 — Loading, empty, error states and a fidelity review. No new features.

Project: AWS Route 53 console clone. All CRUD works. This phase closes the gap
between "functional" and "feels like the real console".

1. LOADING STATES
   • Tables: use the Table `loading` + `loadingText` props ("Loading hosted zones",
     "Loading records"). Never replace the whole page with a spinner.
   • Detail pages: while the zone is loading, render the Container shells with
     Cloudscape <Spinner> in place of values, so layout does not jump.
   • Buttons performing mutations: `loading` prop + disabled while in flight, so
     double-submit is impossible.

2. EMPTY STATES — distinguish "nothing exists" from "nothing matched":
   • no zones      → "No hosted zones" / "Create a hosted zone to get started." + button
   • no records    → "No records" / "No records to display." + Create button
   • filtered out  → "No matches" / "We can't find a match." + [Clear filter]

3. ERROR STATES
   • Network/500 → Flashbar error with a [Retry] action wired to refetch
   • 404 on a zone id → an in-page <Alert type="error"> "Hosted zone not found" with
     a link back to /hosted-zones, NOT a Next.js crash screen
   • 401 mid-session → clear auth state and redirect to /login with an info Flashbar
     "Your session has expired. Please sign in again."
   • Add a React error boundary at (console)/error.tsx rendering an AWS-styled panel

4. NOTIFICATION DISCIPLINE — audit every mutation. Exactly one Flashbar item each,
   dismissible, success auto-dismissing after 5s, errors persisting. Copy must match
   AWS voice: "Hosted zone example.com was created successfully.",
   "Record www.example.com was deleted."

5. FIDELITY REVIEW — open the real Route 53 console (or its documentation
   screenshots) side by side and correct:
   • page titles and Header variants (h1 for page, h2 for containers)
   • the counter format in table headers — "(12)" not "12 items"
   • trailing dots hidden in UI display but preserved in the database
   • Button ordering: secondary actions left, primary action rightmost
   • Modal footer: [Cancel] then the primary/danger action, right-aligned
   • Consistent use of "Description" in the UI for what the API calls `comment`
   • date formatting: "August 13, 2026, 17:42 (UTC+05:30)"

6. ACCESSIBILITY + RESPONSIVE — every Table needs ariaLabels; every FormField a real
   label; icon-only buttons need ariaLabel. Check 1280px and 768px: AppLayout should
   collapse the side nav into a hamburger, and tables should scroll horizontally
   rather than breaking the layout.

7. DARK MODE AUDIT — walk every page in dark mode. Any hard-coded color in
   globals.css must become a Cloudscape design token from
   '@cloudscape-design/design-tokens'.

VERIFICATION GATE:
  1. Click every side-nav item in both light and dark mode — no unstyled or
     mis-colored areas
  2. Stop the backend, then use the app: every page shows a friendly error with a
     retry, nothing white-screens
  3. Delete the session cookie in devtools, then act → redirected to /login with the
     expiry message
  4. 768px viewport: nav collapses, tables scroll, no horizontal page overflow
  5. Visit /hosted-zones/ZDOESNOTEXIST123 → friendly "not found", not a crash
  6. npx tsc --noEmit and npm run lint both clean
```

---

## PHASE 7 — Documentation, Docker, deployment

```
PHASE 7 of 7 — README, containers, and a live hosted demo.

Project: AWS Route 53 console clone (Next.js 15 + FastAPI + SQLite), feature
complete. Deploy target: Vercel (frontend) + Fly.io with a mounted volume (backend).

1. README.md at the repo root — the assignment requires these four sections
   explicitly, so use these headings:

   ## Setup instructions
     Prerequisites; backend (venv → pip install → cp .env.example .env →
     python -m app.seed → uvicorn app.main:app --reload); frontend (npm ci →
     cp .env.local.example .env.local → npm run dev); one-command
     `docker compose up`; DEMO CREDENTIALS in a callout near the top.

   ## Architecture overview
     The layered diagram and the request-lifecycle trace from the Master Spec.
     State WHY: routes thin / services own rules / validation pure and mirrored
     client-side. Include the annotated folder tree.

   ## Database schema
     A table per entity with column, type, constraints, notes. An ASCII ER diagram
     showing users → hosted_zones → dns_records (cascade) and → changes/tags.
     Explicitly explain the `values` JSON-array decision and why one-row-per-value
     would break UI fidelity.

   ## API overview
     Every endpoint in a table: method, path, query params, request body, response,
     error codes. Link to /docs for live OpenAPI.

   Plus: a Features checklist mapping each assignment requirement to where it lives;
   a Screenshots section; a "Route 53 behaviours implemented" section (auto NS/SOA,
   deletion guard, CNAME rules, PENDING→INSYNC, per-type validation) — this is what
   demonstrates domain understanding; and a short "Deliberate deviations" section
   noting that the real console only allows editing a zone's comment/tags, so a
   guarded rename was added to satisfy the assignment's Edit requirement.

2. backend/Dockerfile — python:3.12-slim, install requirements, run uvicorn on
   $PORT, and ensure the SQLite file lives under a mounted volume path (/data).
   Default DATABASE_URL in the image → sqlite:////data/route53.db

3. frontend/Dockerfile — node:20-alpine multi-stage using Next.js standalone output.

4. docker-compose.yml — both services + a named volume for the DB, frontend on 3000
   with NEXT_PUBLIC_API_BASE_URL pointing at the backend service.

5. backend/fly.toml — app name, internal port, and a [mounts] block attaching a
   volume at /data so the SQLite file SURVIVES restarts. Without this the database
   resets on every deploy.

6. DEPLOY — backend first (fly volumes create, fly deploy, run the seeder once),
   then frontend to Vercel with NEXT_PUBLIC_API_BASE_URL set to the Fly URL.

7. *** CROSS-ORIGIN COOKIE CONFIG — the #1 thing that breaks in production ***
   Frontend and backend are on DIFFERENT domains, so the session cookie is
   third-party. Required:
     • Backend CORS: allow_origins = [the exact Vercel URL] (NOT "*", which is
       incompatible with credentials), allow_credentials=True
     • Cookie: samesite="none" AND secure=True in production (samesite="lax" only
       works locally on the same site). Drive this from an ENVIRONMENT env var.
     • Frontend: every request already sends credentials:'include' via apiFetch
   Get this wrong and login appears to succeed but /auth/me returns 401 forever.

8. Seed the production database once after the first deploy so the demo link has
   data. Add the live URL to the top of the README.

VERIFICATION GATE:
  1. docker compose up from a clean clone → app works at localhost:3000
  2. Deployed frontend URL in a fresh incognito window → sign in with the demo
     credentials → create a zone → add a record → sign out → sign back in → the data
     is still there
  3. Redeploy the backend → data STILL there (proves the volume mount works)
  4. Every README setup command works verbatim on a clean clone
  5. CI is green
```

---
---

# PART C — APPENDIX

## C1. Record type validation reference

Paste alongside Phase 2 and Phase 5.

| Type | Value format | Rules |
|---|---|---|
| `A` | `192.0.2.1` | Valid IPv4. Multiple values allowed. |
| `AAAA` | `2001:db8::1` | Valid IPv6. Multiple values allowed. |
| `CNAME` | `example.com` | **Exactly one** value. Not at zone apex. Cannot coexist with any other record of the same name. |
| `TXT` | `"v=spf1 include:_spf.example.com ~all"` | Each value double-quoted; each quoted string ≤255 chars. |
| `MX` | `10 mail.example.com` | `<priority 0–65535> <hostname>`. |
| `NS` | `ns-1.awsdns-01.com` | Valid hostname. Apex NS is a system record. |
| `PTR` | `example.com` | Valid hostname. |
| `SRV` | `1 10 5269 xmpp.example.com` | `<priority> <weight> <port> <target>`, three ints 0–65535. |
| `CAA` | `0 issue "ca.example.net"` | `<flags 0–255> <issue\|issuewild\|iodef> "<value>"`. |
| `SOA` | `ns-2048.awsdns-64.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400` | 7 fields. System record. |

Universal: TTL integer 0–2147483647; record name must equal the zone name or end with `.` + zone name; `set_identifier` required when routing policy ≠ Simple.

## C2. System records created with every public hosted zone

| | NS | SOA |
|---|---|---|
| Name | zone name | zone name |
| TTL | `172800` | `900` |
| Values | four `ns-####.awsdns-##.{com,net,org,co.uk}` | `<first-ns> awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400` |
| `is_system` | `true` | `true` |
| Deletable | **no** | **no** |
| Editable | yes | yes |

The SOA numbers are AWS's real defaults: serial `1`, refresh `7200`, retry `900`, expire `1209600` (2 weeks), minimum/negative-cache TTL `86400`.

## C3. Git and CI workflow

Have the agent work like a real team, one branch per phase:

```
main                      always deployable, protected
  └── feat/phase-0-scaffold
  └── feat/phase-1-data-model
  └── feat/phase-2-api
  └── feat/phase-3-console-shell
  └── feat/phase-4-hosted-zones
  └── feat/phase-5-dns-records
  └── feat/phase-6-polish
  └── feat/phase-7-deploy
```

Conventional commits (`feat(records): add per-type value validation`), one PR per phase, CI must pass before merge. This also makes the commit history itself legible to whoever grades the repo — a graded signal that costs nothing.

## C4. Requirement traceability

Every requirement in the assignment PDF, mapped to the phase that delivers it.

| Assignment requirement | Phase |
|---|---|
| Login | 3 |
| Logout | 3 |
| Session persistence | 2 (cookie) + 3 (guard) |
| IAM / Accounts / Billing mocked | 3 (top nav account + region menus) |
| Hosted Zones — View | 4 |
| Hosted Zones — Search | 4 |
| Hosted Zones — Create | 4 |
| Hosted Zones — Edit | 4 |
| Hosted Zones — Delete | 4 |
| Records — 9 types (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA) | 2 (rules) + 5 (UI) |
| Records — View / Search / Create / Edit / Delete | 5 |
| All data persists in SQLite | 1, verified in 4 / 5 / 7 |
| Navigation structure | 3 |
| Tables | 4, 5 |
| Forms | 4, 5 |
| Search | 4, 5 |
| Filters | 4, 5 |
| Pagination | 4, 5 |
| Modals | 4, 5 |
| Notifications | 3 (Flashbar infra) + 4, 5, 6 |
| Mocked: Dashboard | 3 |
| Mocked: Traffic Policies | 3 |
| Mocked: Health Checks | 3 |
| Mocked: Resolver | 3 |
| Mocked: Profiles | 3 |
| Bonus: Dark Mode | 3 |
| Deliverable: `frontend/` + `backend/` in one repo | 0 |
| README: setup instructions | 7 |
| README: architecture overview | 7 |
| README: database schema | 7 |
| README: API overview | 7 |
| Demo: hosted working link | 7 |

## C5. Failure modes to watch for

Things that commonly go wrong with AI-built versions of this project:

1. **The agent installs Tailwind anyway** and hand-rolls AWS styling. Check `package.json` after Phase 0. This single mistake costs the highest-weighted criterion.
2. **Cloudscape renders unstyled** — `transpilePackages` missing, or `global-styles/index.css` not imported. Caught by the Phase 0 gate; do not proceed past it.
3. **`create-next-app@latest` pulls Next 16**, whose default Turbopack bundler handles `transpilePackages` differently and is a much less proven pairing with Cloudscape. Phase 0 pins `@15` deliberately — if an agent "helpfully" upgrades, the symptom is #2.
4. **Chasing a dark TopNavigation via a nonexistent API.** Cloudscape has no dark-header variant and no supported dark-context wrapper. Phase 3 gives a scoped-CSS route and an explicit permission to fall back. Time-box it.
5. **One DB row per record value** — produces four NS rows where AWS shows one. Caught by the Phase 1 gate.
6. **Business logic drifts into route handlers.** Spot-check `api/routes/*.py` after Phase 2; anything over ~30 lines per endpoint is a smell.
7. **Client-side-only validation** with a permissive backend, or the two drifting apart. Both layers must implement C1.
8. **Session dies in production** — the cross-origin cookie issue in Phase 7 step 7.
9. **Phases pasted in bulk**, causing the agent to skim and silently drop requirements. One phase, one gate, every time.
