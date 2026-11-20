# MediPilot360 Dashboard & Shell Redesign

**Date:** 2026-09-18  
**Status:** Draft — awaiting user review  
**Repo:** HMSWebAngular (frontend only; ASP.NET API remote)

## Goal

Restyle the app chrome (sidebar + top header + layout) and both dashboards to match the MediPilot360 clinic dashboard mockup, for Doctor, Receptionist, Admin, and SuperAdmin — using **live APIs only**. If no API exists for a mockup widget, **omit that widget**.

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Scope | **B** — Full chrome (sidebar + header + dashboards) |
| Roles | Doctor, Receptionist, Admin; also restyle SuperAdmin dashboard |
| Data | **C** — Live data only; no mocks/stubs for missing APIs |
| Approach | **2** — Shared MediPilot shell + role-specific widget kits |

## Out of scope (v1)

- Fake/mock data for Tasks, Alerts, Imaging, Messages, EMR nav, Ctrl+K search
- New backend endpoints
- Pixel-perfect every mockup block when API is missing
- Changing business routes or feature-access keys (only UI + composition)

---

## §1 — Shell (sidebar + header + layout)

### Layout

Replace doctor/receptionist Bootstrap 3-column sticky sidebar split and align Admin/SuperAdmin layout with one pattern:

```
┌──────────────┬─────────────────────────────────────┐
│ Fixed sidebar│ Top bar (greeting | date | profile) │
│ Brand        ├─────────────────────────────────────┤
│ Existing nav │ <router-outlet>                     │
│ User footer  │                                     │
└──────────────┴─────────────────────────────────────┘
```

### Sidebar

- Brand: existing MediPilot logo + “MediPilot360”
- Nav source: existing `MENU_ITEMS` + `MenuService` (role + `featureKey`) — **no** new fake items (EMR, Imaging, Tasks, etc.)
- Active state: primary blue pill (mockup)
- Footer: avatar / name / role from `AuthService` (specialty only if already available from API)
- Touch: restyle `asidebar` and `admin-sidebar`, or extract one shared shell sidebar used by both layouts

### Top bar

- Left: “Welcome back, {userName}” + short role-aware subtitle
- Right: client date + existing profile dropdown (change password / profile / logout)
- **Omit:** Ctrl+K search, notification badge, message badge (no API)

### Design tokens

| Token | Value (approx) |
|--------|----------------|
| Page BG | `#F5F7FB` |
| Surface | `#FFFFFF` |
| Primary | `#2F6FED` |
| Text | slate / gray scale |
| Radius | ~12px |
| Shadow | soft card shadow |
| Icons | existing Font Awesome |

### Files likely touched

- `src/app/Layout/main-layout/*`
- `src/app/Layout/adminlayout/*`
- `src/app/shared/components/header/*`
- `src/app/shared/components/asidebar/*`
- `src/app/shared/components/admin-sidebar/*`
- Shared token SCSS (new small file under assets or shared styles)

---

## §2 — Clinic dashboard (Doctor / Receptionist)

**Route:** `/dashboard`  
**Component:** `src/app/shared/components/dashboard/*`

### Include (live APIs)

| Block | Data source |
|--------|-------------|
| KPI row | `DashboardAPI/dashBoardSummary` (`IsToday`) via `DashboardService` |
| Today’s appointments list + status tabs | Existing today’s appointment / `getDoctorAppointmentByStatus` (same as today’s appointments screen) |
| Day timeline (“calendar”) | Derived from same today’s appointment list (sorted by time) |
| Recent patients | Existing patient list APIs already used in app |
| Pending lab count | Only if LabTest API can supply a reliable count; otherwise omit |

KPI cards (feature-gated with `hasFeature` as today):

- Today’s Appointments  
- Completed  
- Upcoming / Scheduled  
- Patients  
- Revenue  

**Omit:** trend % vs yesterday (no API).

### Omit entirely

My Tasks, Alerts & Notifications, Imaging, Messages, Ctrl+K.

### Behavior

- Today / Overall: keep where summary supports `IsToday`
- List + timeline: **today-only**
- Card/list clicks → existing appointment / patient / invoice routes
- Reuse SignalR refresh pattern from today’s appointments if already present

### Component split (suggested)

- Host `dashboard` composes: KPI row, today’s appointments panel, day timeline, recent patients
- Shared MediPilot card/panel SCSS from §1 tokens

---

## §3 — Admin / SuperAdmin dashboard

**Route:** `/superadmin`  
**Component:** `src/app/modules/superadmin/components/dashboard/*`

### Visual

Same tokens, KPI card style, and panel language as §2.

### Content (existing APIs / current behavior)

Role-gated cards and modals already driven by:

- `getDashboardSummary` / `dashBoardSummary`
- Active packages list + modal
- Inactive users list + modal
- Admin: Active Doctors list + modal
- SuperAdmin: Registered Hospitals, etc.

Today / Overall tabs remain.

### v1 note

Admin does **not** require embedding the full clinic appointment list on `/superadmin` in v1 (KPIs + existing nav suffice). Can add later if requested.

### Omit

Same as §2: Tasks, Alerts, Imaging, Messages, Ctrl+K.

---

## Routing (unchanged)

| Role | Dashboard home |
|------|----------------|
| Doctor, Receptionist | `/dashboard` (§2) |
| Admin, SuperAdmin | `/superadmin` (§3) |

Both use unified shell (§1).

---

## Reuse

- `ApiService`, `ApiEndpoints`, `DashboardService`
- `AuthService` / `hasFeature` / `MenuService` / `MENU_ITEMS`
- Existing appointment & patient feature services for list panels
- Toast / loader interceptors

## Risks

1. Env split (`environment.delvelopment` vs `environment.ts`) — wrong base URL while testing  
2. Sparse typing / `any` on dashboard payloads — map defensively  
3. Admin vs Doctor layout currently diverge — shell unify may regress mobile/CSS from legacy assets  
4. Omitting mockup widgets may look “incomplete” vs image — intentional under rule C  
5. SignalR token/`safeStorage` quirks if wiring realtime refresh on new panels  

## Success criteria

1. Doctor / Receptionist / Admin / SuperAdmin see MediPilot-styled sidebar + top bar  
2. Clinic dashboard matches mockup structure for **available** API-backed blocks only  
3. SuperAdmin/Admin dashboard restyled; existing KPIs/modals still work  
4. No new nav items without routes; no mock widget data  
5. Feature gating and role menus still work  

## Implementation order (for later plan)

1. Tokens + shell (layouts, header, sidebars)  
2. Clinic dashboard widgets on live APIs  
3. SuperAdmin/Admin dashboard restyle  
4. Responsive pass + smoke test per role  

---

## Approvals

- Approach 2: approved  
- §1 Shell: approved  
- §2 Clinic dashboard: approved  
- §3 Admin/SuperAdmin dashboard: approved  
