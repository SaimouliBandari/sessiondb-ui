# Frontend Integration (Phases 1–3) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the backend behavior from Phases 1–3 (Dialect Layer, Access Engine, AI BYOK) into the SessionDB UI so the app correctly uses existing APIs, handles new errors, and adds AI config and generate/explain flows. The plan is structured so that when later phases (e.g. Session Engine, Alerting, Reporting) land, the same patterns can be reused.

**Architecture:** The UI is assumed to be a React 18 + TypeScript app (Vite, React Router, Context for state). Integration is done by: (1) centralizing API calls and error handling, (2) handling Phase 2's 403 "no data access" on query execute, (3) adding AI API client and screens for config, generate-SQL, and explain. All paths below are relative to the **UI project root** (your React app—e.g. a `frontend/` folder in this repo or a separate repo).

**Tech Stack:** React 18, TypeScript, Vite, React Router v6, fetch or axios (per project rules: use axios), JWT in `Authorization: Bearer <token>`.

**Reference:** Backend contract and error shapes are in the backend repo's `docs/frontend-integration.md`.

---

## Task 1: API client base and auth

**Files:**
- Create: `src/api/client.ts` (or `src/services/api.ts` if you already have a services layer)
- Modify: Wherever you store the auth token (e.g. `src/context/AuthContext.tsx` or `src/store/auth.ts`)

**Step 1: Create the API client**

Create an axios instance that sends the JWT and uses the base URL from env.

**Step 2: Export typed error helper**

In the same file or `src/api/errors.ts`: `getApiErrorMessage(err)`, `getApiErrorCode(err)`.

---

## Task 2: Handle Phase 2 — 403 "no data access" on query execute

**Files:**
- Modify: The component or service that calls `POST /v1/query/execute` (e.g. `src/pages/Query/Editor.tsx`, `src/hooks/useQueryData.ts`)

Use the API client for execute; where you handle execute errors, show a user-friendly message when the backend returns 403 with code `AUTH002` (no data access to this instance).

---

## Task 3: AI API client (Phase 3)

**Files:**
- Create: `src/api/ai.ts`

Add types and functions: `getAIConfig()`, `updateAIConfig()`, `generateSQL(instanceId, prompt)`, `explainQuery(query)`.

---

## Task 4: AI config screen (Phase 3)

**Files:**
- Create: `src/pages/SettingsAIConfig.tsx` (or under `src/pages/Settings/`)
- Modify: App router to add route `/settings/ai` or `/ai-config`

On mount: call `getAIConfig()`. Form: provider type, API key (password), optional base URL, model name. Submit calls `updateAIConfig(...)`.

---

## Task 5: Generate SQL from prompt in query UI (Phase 3)

**Files:**
- Modify: Query / SQL editor page (e.g. `src/pages/Query/Editor.tsx`)

Add "Generate with AI" (button or link) that opens a modal/section with prompt input and instance selector. Call `generateSQL(selectedInstanceId, prompt)`; if not configured, show "Configure your AI provider in Settings → AI". On success, put returned `sql` into the editor; optionally show note if `requiresApproval`.

---

## Task 6: Explain query (Phase 3)

**Files:**
- Modify: Same query/SQL editor page

Add "Explain" button (enabled when query has content). Call `explainQuery(currentQueryText)`. If not configured, show same message. On success, show `explanation` in tooltip/modal/inline.

---

## Task 7: Optional — instance-scoped permissions in user/role UI (Phase 2)

**Files:**
- Modify: User create/edit and/or role create/edit forms (wherever you send `permissions` to the backend)

Include `instanceId` in permission payloads when it's a data permission.

---

## Task 8: Document and future phases

**Files:**
- Create or modify: `docs/README.md` or `FRONTEND.md` in the UI repo

Add a short "Backend integration" section: link to backend's `docs/frontend-integration.md`, note 403 + AUTH002, list AI endpoints, and a line for future phases.

---

## Summary checklist

| Task | What |
|------|------|
| 1 | API client (axios + JWT + 401 redirect) and error helpers |
| 2 | Query execute uses client; handle 403 AUTH002 "no data access" |
| 3 | AI API client (get/put config, generate-sql, explain) |
| 4 | AI config page (GET/PUT /ai/config) |
| 5 | "Generate with AI" in query UI using selected instance |
| 6 | "Explain" in query UI |
| 7 | (Optional) instanceId in permission payloads for user/role |
| 8 | Docs: link to frontend-integration.md and note for future phases |

---

## When later phases land

- Add new API modules (e.g. `src/api/session.ts`, `src/api/alerts.ts`, `src/api/reports.ts`) and new routes/pages as needed.
- Reuse the same `api` client, `getApiErrorMessage` / `getApiErrorCode`, and the pattern: feature screen → API call → success/error handling.
