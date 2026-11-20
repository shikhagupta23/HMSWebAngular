# MediPilot360 Shell & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle app chrome (sidebar + header + layout) and both dashboards to match the MediPilot360 mockup for Doctor, Receptionist, Admin, and SuperAdmin, using live APIs only.

**Architecture:** Shared CSS tokens + unified fixed-sidebar shell for all roles. Clinic dashboard (`/dashboard`) composes KPI + today’s appointments + timeline + recent patients from existing APIs. Admin/SuperAdmin dashboard (`/superadmin`) keeps existing summary/modals, restyled with the same tokens. No mock widgets; omit blocks without APIs.

**Tech Stack:** Angular 20 NgModules, Bootstrap 5, Font Awesome, RxJS, existing `ApiService` / `DashboardService` / `Appointment` / `PatientService` / `AuthService` / `MenuService`.

**Spec:** `docs/superpowers/specs/2026-09-18-medipilot-dashboard-shell-design.md`

## Global Constraints

- Live data only — if no API, omit the widget (no stubs, no fake lists)
- Do not add nav items without real routes (no EMR / Imaging / Tasks / Messages)
- Keep `MENU_ITEMS` + `MenuService` + `featureKey` gating
- Routes unchanged: Doctor/Receptionist → `/dashboard`; Admin/SuperAdmin → `/superadmin`
- Reuse existing services; prefer restyle over rewrite of business logic
- Tokens: page BG `#F5F7FB`, surface `#FFFFFF`, primary `#2F6FED`, radius ~12px
- Omit: Ctrl+K, notification/message badges, Tasks, Alerts, trend % vs yesterday
- NgModules / `standalone: false` (match project)
- Commit only when user asks (do not auto-commit unless instructed)

---

## File map

| File | Responsibility |
|------|----------------|
| Create `src/styles/_mp-tokens.scss` | MediPilot design tokens + shared card/badge helpers |
| Modify `src/styles.scss` | Import `_mp-tokens.scss` |
| Modify `src/app/Layout/main-layout/main-layout.html` + `.scss` | Doctor/Receptionist fixed-rail shell |
| Modify `src/app/Layout/adminlayout/adminlayout.html` + `.scss` | Align Admin/SuperAdmin shell with same classes |
| Modify `src/app/shared/components/header/header.html` + `.ts` + `.scss` | Welcome + date + profile (no search/badges) |
| Modify `src/app/shared/components/asidebar/asidebar.html` + `.scss` | MediPilot nav + user footer |
| Modify `src/app/shared/components/admin-sidebar/admin-sidebar.html` + `.scss` | Same visual language |
| Modify `src/app/shared/components/dashboard/*` | Clinic dashboard UI + data wiring |
| Modify `src/app/modules/superadmin/components/dashboard/*` | Restyle Admin/SuperAdmin dashboard |
| Modify `src/app/shared/shared-module.ts` | Declare any new shared child components if split |

---

### Task 1: Design tokens + global import

**Files:**
- Create: `src/styles/_mp-tokens.scss`
- Modify: `src/styles.scss`

**Interfaces:**
- Produces: CSS variables `--mp-bg`, `--mp-surface`, `--mp-primary`, `--mp-text`, `--mp-muted`, `--mp-radius`, `--mp-shadow`, plus utility classes `.mp-card`, `.mp-badge`, `.mp-kpi`, `.mp-shell`, `.mp-sidebar`, `.mp-topbar`

- [ ] **Step 1: Add token stylesheet**

Create `src/styles/_mp-tokens.scss`:

```scss
:root {
  --mp-bg: #f5f7fb;
  --mp-surface: #ffffff;
  --mp-primary: #2f6fed;
  --mp-primary-soft: #e8f0fe;
  --mp-text: #1f2937;
  --mp-muted: #6b7280;
  --mp-border: #e5e7eb;
  --mp-success: #16a34a;
  --mp-warning: #f59e0b;
  --mp-danger: #dc2626;
  --mp-radius: 12px;
  --mp-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.mp-shell {
  background: var(--mp-bg);
  min-height: 100vh;
}

.mp-card {
  background: var(--mp-surface);
  border: 1px solid var(--mp-border);
  border-radius: var(--mp-radius);
  box-shadow: var(--mp-shadow);
}

.mp-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.mp-badge--success { background: #dcfce7; color: var(--mp-success); }
.mp-badge--info { background: var(--mp-primary-soft); color: var(--mp-primary); }
.mp-badge--danger { background: #fee2e2; color: var(--mp-danger); }
.mp-badge--warn { background: #ffedd5; color: #c2410c; }
```

- [ ] **Step 2: Import tokens in global styles**

In `src/styles.scss`, add near the top:

```scss
@use './styles/mp-tokens';
```

If project uses `@import` elsewhere, match that style. File is `_mp-tokens.scss` → import path `styles/mp-tokens`.

- [ ] **Step 3: Verify build loads tokens**

Run: `npx ng build --configuration=development`  
Expected: build succeeds; no Sass resolve errors for `mp-tokens`.

- [ ] **Step 4: Stop for review** (commit only if user requests)

---

### Task 2: Unified shell layout (main + admin)

**Files:**
- Modify: `src/app/Layout/main-layout/main-layout.html`
- Modify: `src/app/Layout/main-layout/main-layout.scss` (create if missing)
- Modify: `src/app/Layout/adminlayout/adminlayout.html`
- Modify: `src/app/Layout/adminlayout/adminlayout.scss`

**Interfaces:**
- Consumes: `.mp-shell` classes from Task 1
- Produces: DOM structure `mp-shell` → `mp-sidebar` + `mp-main` (`mp-topbar` + `mp-content` + `router-outlet`)

- [ ] **Step 1: Rewrite Doctor/Receptionist layout markup**

Replace the Bootstrap `col-lg-4` / `col-lg-8` split in `main-layout.html` with:

```html
@if (isAdminOrSuperadmin) {
  <app-adminlayout></app-adminlayout>
}

@if (isDoctorOrReceptionist) {
  <div class="mp-shell main-wrapper">
    <aside class="mp-sidebar">
      <app-asidebar></app-asidebar>
    </aside>
    <div class="mp-main">
      <app-header-common></app-header-common>
      <div class="mp-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  </div>
}

<app-footer></app-footer>
```

Keep existing `@if` role flags from `main-layout.ts` (do not change role detection logic).

- [ ] **Step 2: Shell SCSS for main layout**

Add/update `main-layout.scss`:

```scss
.mp-shell.main-wrapper {
  display: flex;
  min-height: 100vh;
  background: var(--mp-bg);
}

.mp-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--mp-surface);
  border-right: 1px solid var(--mp-border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.mp-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mp-content {
  padding: 20px 24px 32px;
}

@media (max-width: 991px) {
  .mp-shell.main-wrapper { flex-direction: column; }
  .mp-sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
}
```

Ensure `main-layout` component `styleUrl` points at this file.

- [ ] **Step 3: Align admin layout to same shell**

Update `adminlayout.html` to the same flex structure, keeping `app-admin-sidebar` and `app-header-common`:

```html
<div class="mp-shell main-wrapper">
  <aside class="mp-sidebar">
    <app-admin-sidebar></app-admin-sidebar>
  </aside>
  <div class="mp-main">
    <app-header-common></app-header-common>
    <div class="mp-content">
      <router-outlet></router-outlet>
    </div>
  </div>
</div>
```

Reuse the same `.mp-shell` / `.mp-sidebar` / `.mp-main` / `.mp-content` rules in `adminlayout.scss`.

- [ ] **Step 4: Manual smoke**

Run: `npx ng serve`  
Login as Doctor and Admin.  
Expected: fixed left rail + content; no broken outlet; footer still present.

- [ ] **Step 5: Stop for review**

---

### Task 3: MediPilot header (welcome + date + profile)

**Files:**
- Modify: `src/app/shared/components/header/header.html`
- Modify: `src/app/shared/components/header/header.ts`
- Modify: `src/app/shared/components/header/header.scss`

**Interfaces:**
- Consumes: `AuthService.user$`, `getUserRole()`, existing logout / navigateByRole
- Produces: top bar UI without search or notification badges

- [ ] **Step 1: Extend header.ts with display helpers**

Add to `Header` class:

```typescript
todayLabel = '';

ngOnInit(): void {
  this.todayLabel = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date());
}

get welcomeSubtitle(): string {
  const role = (this.role || '').toLowerCase();
  if (role === 'doctor') return "Here's what's happening in your clinic today.";
  if (role === 'receptionist') return "Here's what's happening at the front desk today.";
  if (role === 'admin') return "Here's your hospital overview for today.";
  if (role === 'superadmin') return "Here's your platform overview for today.";
  return "Here's what's happening today.";
}
```

Use template `*ngIf="user$ | async as user"` for the name.

- [ ] **Step 2: Replace header.html structure**

```html
<header class="mp-topbar">
  <div class="mp-topbar__left">
    <a (click)="navigateByRole()" class="mp-topbar__brand d-md-none">
      <img src="assets/img/Medipilot360.png" alt="MediPilot360" class="mp-topbar__logo" />
    </a>
    <div class="mp-topbar__welcome" *ngIf="user$ | async as user">
      <h1>Welcome back, {{ user.userName }}</h1>
      <p>{{ welcomeSubtitle }}</p>
    </div>
  </div>

  <div class="mp-topbar__right">
    <div class="mp-topbar__date">
      <i class="fa-regular fa-calendar"></i>
      <span>{{ todayLabel }}</span>
    </div>

    <div class="topbar-profile" (click)="toggleProfileMenu()">
      <div class="profile-avatar"><i class="feather feather-user"></i></div>
      <div class="profile-info d-none d-md-block" *ngIf="user$ | async as user">
        <div class="hospitalName">{{ user.hospitalName }}</div>
        <div class="name">{{ user.userName }}</div>
        <div class="status">{{ role }}</div>
      </div>
      <i class="fa fa-chevron-down ms-2"></i>
      <div class="profile-dropdown" *ngIf="showProfileMenu">
        <a routerLink="/superadmin/change-password">
          <i class="fa-solid fa-lock"></i> Change Password
        </a>
        <a routerLink="/superadmin/profile-setting">
          <i class="fa fa-user-cog"></i> Profile Settings
        </a>
        <a (click)="logout()">
          <i class="fa fa-sign-out-alt"></i> Logout
        </a>
      </div>
    </div>
  </div>
</header>
```

Do **not** add search or notification icons.

- [ ] **Step 3: Style top bar**

In `header.scss`, style `.mp-topbar` as flex space-between, white surface, bottom border, padding; welcome `h1` ~20–22px; muted subtitle; date pill.

- [ ] **Step 4: Smoke test header**

Login Doctor + Admin.  
Expected: greeting shows name; date shows; profile dropdown still works; logo click still navigates by role.

- [ ] **Step 5: Stop for review**

---

### Task 4: Restyle sidebars (doctor + admin)

**Files:**
- Modify: `src/app/shared/components/asidebar/asidebar.html`
- Modify: `src/app/shared/components/asidebar/asidebar.scss`
- Modify: `src/app/shared/components/admin-sidebar/admin-sidebar.html`
- Modify: `src/app/shared/components/admin-sidebar/admin-sidebar.scss`

**Interfaces:**
- Consumes: `MenuService.getFilteredMenu(MENU_ITEMS)`, existing doctor details for Doctor role
- Produces: blue active pill nav; brand block; bottom user strip

- [ ] **Step 1: Restructure asidebar.html**

Keep menu loop logic; wrap with brand + footer:

```html
<div class="mp-nav">
  <div class="mp-nav__brand">
    <img src="assets/img/Medipilot360.png" alt="MediPilot360" />
    <div>
      <strong>MediPilot360</strong>
      <small>360° Healthcare Platform</small>
    </div>
  </div>

  <nav class="mp-nav__menu">
    <!-- existing *ngFor menu / children / routerLinkActive logic unchanged -->
  </nav>

  <div class="mp-nav__user" *ngIf="role">
    <div class="mp-nav__avatar"><i class="fa-solid fa-user-doctor"></i></div>
    <div>
      <div class="mp-nav__name">
        {{ doctorDetails?.doctorName || userName || role }}
      </div>
      <div class="mp-nav__meta">
        {{ doctorDetails?.doctorSpeciality || role }}
      </div>
    </div>
  </div>
</div>
```

Set `userName` from `AuthService` in `ngOnInit` (do not invent fields).

- [ ] **Step 2: Active-state SCSS**

```scss
.mp-nav__menu a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--mp-text);
  text-decoration: none;
}

.mp-nav__menu li.active > a,
.mp-nav__menu a.active {
  background: var(--mp-primary);
  color: #fff;
}
```

- [ ] **Step 3: Mirror visual language on admin-sidebar**

Apply the same brand / menu / user footer structure to `admin-sidebar` without changing its menu source.

- [ ] **Step 4: Smoke test nav**

Doctor: Dashboard active blue; Patients/Appointments still navigate.  
Admin: Superadmin Dashboard + Hospitals/Users still work.  
Expected: no new fake menu labels.

- [ ] **Step 5: Stop for review**

---

### Task 5: Clinic dashboard KPIs + host shell

**Files:**
- Modify: `src/app/shared/components/dashboard/dashboard.ts`
- Modify: `src/app/shared/components/dashboard/dashboard.html`
- Modify: `src/app/shared/components/dashboard/dashboard.scss`

**Interfaces:**
- Consumes: `DashboardService.getDahBoardData(isToday)` / `getDashboardSummary(isToday)`, `AuthService.hasFeature`, `FeatureAccessKeys`
- Produces: KPI row matching mockup (no trend %). Host ready for Task 6–7 panels.

- [ ] **Step 1: Define KPI view model in dashboard.ts**

```typescript
kpis = [
  {
    title: "Today's Appointments",
    value: () => this.totalAppointments,
    icon: 'fa-calendar-day',
    tone: 'blue',
    featureKey: FeatureAccessKeys.Appointments,
    click: () => this.navigateByCard('appointments'),
  },
  {
    title: 'Completed',
    value: () => this.completedAppointments,
    icon: 'fa-circle-check',
    tone: 'green',
    featureKey: FeatureAccessKeys.CompletedAppointments,
    click: () => this.navigateByCard('completed'),
  },
  {
    title: 'Upcoming',
    value: () => this.scheduledAppointments,
    icon: 'fa-clock',
    tone: 'purple',
    featureKey: FeatureAccessKeys.ScheduledAppointments,
    click: () => this.navigateByCard('scheduled'),
  },
  {
    title: 'Patients',
    value: () => this.totalPatients,
    icon: 'fa-user-injured',
    tone: 'orange',
    featureKey: FeatureAccessKeys.Patients,
    click: () => this.navigateByCard('patients'),
  },
  {
    title: "Today's Revenue",
    value: () => this.totalRevenue,
    icon: 'fa-indian-rupee-sign',
    tone: 'teal',
    featureKey: FeatureAccessKeys.Revenue,
    click: undefined as (() => void) | undefined,
  },
];
```

Keep existing `loadDashboardData` mapping. Prefer `getDashboardSummary` if it returns the same fields used today.

- [ ] **Step 2: KPI markup**

```html
<ul class="nav nav-pills mb-3 dashboard-tabs">
  <li class="nav-item">
    <button class="nav-link" [class.active]="activeTab === 'today'" (click)="onTabChange('today')">Today</button>
  </li>
  <li class="nav-item">
    <button class="nav-link" [class.active]="activeTab === 'overall'" (click)="onTabChange('overall')">Overall</button>
  </li>
</ul>

<div class="mp-kpi-row">
  <ng-container *ngFor="let card of kpis">
    <div class="mp-kpi mp-card" *ngIf="authService.hasFeature(card.featureKey)"
         [class.cursor]="!!card.click" (click)="card.click && card.click()">
      <div class="mp-kpi__icon" [attr.data-tone]="card.tone">
        <i class="fa-solid" [ngClass]="card.icon"></i>
      </div>
      <div>
        <div class="mp-kpi__label">{{ card.title }}</div>
        <div class="mp-kpi__value">
          <ng-container *ngIf="card.title === 'Today\'s Revenue'; else plain">₹{{ card.value() }}</ng-container>
          <ng-template #plain>{{ card.value() }}</ng-template>
        </div>
      </div>
    </div>
  </ng-container>
</div>

<div class="mp-dash-grid" *ngIf="activeTab === 'today'">
  <!-- Task 6: appointments + timeline -->
  <!-- Task 7: recent patients -->
</div>
```

- [ ] **Step 3: KPI SCSS**

Grid 5 columns on xl, wrap on smaller breakpoints; icon tones via `[data-tone]`.

- [ ] **Step 4: Verify KPI load**

Login Doctor on `/dashboard`.  
Expected: numbers load from API; click navigates; Overall tab still refreshes summary; no trend text.

- [ ] **Step 5: Stop for review**

---

### Task 6: Today’s appointments list + day timeline

**Files:**
- Modify: `src/app/shared/components/dashboard/dashboard.ts`
- Modify: `src/app/shared/components/dashboard/dashboard.html`
- Modify: `src/app/shared/components/dashboard/dashboard.scss`

**Interfaces:**
- Consumes: `Appointment.getAllPatientAsPerDoctor(page, pageSize, search, status, date)` — same as `ViewTodaysAppointments.loadAppointments`
- Status map: `0` scheduled/upcoming, `1` ongoing, `2` completed, `4` cancelled, `3` all
- Produces: `todayAppointments: any[]`, `appointmentTab`, filtered list, timeline from same list

- [ ] **Step 1: Inject Appointment and load today’s list**

```typescript
private appointmentService = inject(Appointment);

todayAppointments: any[] = [];
appointmentTab: 'all' | 'upcoming' | 'completed' | 'cancelled' = 'all';

loadTodayAppointments(): void {
  const today = this.getTodayDate();
  this.appointmentService
    .getAllPatientAsPerDoctor(1, 100, '', 3, today)
    .subscribe({
      next: (res: any) => {
        this.todayAppointments = res?.dataList ?? [];
      },
      error: () => {
        this.todayAppointments = [];
      },
    });
}
```

Call from `ngOnInit` and when `activeTab === 'today'`.

- [ ] **Step 2: Filters + status helpers**

```typescript
get filteredTodayAppointments(): any[] {
  const list = this.todayAppointments;
  switch (this.appointmentTab) {
    case 'upcoming':
      return list.filter((x) => x.appointmentStatus === 0 || x.appointmentStatus === 1);
    case 'completed':
      return list.filter((x) => x.appointmentStatus === 2);
    case 'cancelled':
      return list.filter((x) => x.appointmentStatus === 4);
    default:
      return list;
  }
}

statusLabel(status: number): string {
  if (status === 2) return 'Completed';
  if (status === 4) return 'Cancelled';
  if (status === 1) return 'Ongoing';
  return 'Upcoming';
}

statusBadgeClass(status: number): string {
  if (status === 2) return 'mp-badge mp-badge--success';
  if (status === 4) return 'mp-badge mp-badge--danger';
  if (status === 1) return 'mp-badge mp-badge--warn';
  return 'mp-badge mp-badge--info';
}
```

Inspect one live API row and bind real property names for time/type/patient (e.g. `appointmentTime` vs `slotTime`). Do not invent fields.

- [ ] **Step 3: HTML panels**

Inside `.mp-dash-grid`:

```html
<section class="mp-card mp-panel mp-panel--appointments">
  <header class="mp-panel__head">
    <h3>Today's Appointments</h3>
    <div class="mp-panel__tabs">
      <button type="button" [class.active]="appointmentTab==='all'" (click)="appointmentTab='all'">All ({{ todayAppointments.length }})</button>
      <button type="button" [class.active]="appointmentTab==='upcoming'" (click)="appointmentTab='upcoming'">Upcoming</button>
      <button type="button" [class.active]="appointmentTab==='completed'" (click)="appointmentTab='completed'">Completed</button>
      <button type="button" [class.active]="appointmentTab==='cancelled'" (click)="appointmentTab='cancelled'">Cancelled</button>
    </div>
  </header>
  <div class="mp-appt-row" *ngFor="let a of filteredTodayAppointments"
       [routerLink]="['/appointment/todayappointments']">
    <div class="mp-appt-time">{{ a.appointmentTime || a.slotTime || a.time }}</div>
    <div class="mp-appt-patient">
      <strong>{{ a.patientName }}</strong>
      <small>{{ a.age }} · {{ a.gender }} · {{ a.uhid || a.pid }}</small>
    </div>
    <div>{{ a.appointmentType || a.type || '—' }}</div>
    <span [ngClass]="statusBadgeClass(a.appointmentStatus)">{{ statusLabel(a.appointmentStatus) }}</span>
  </div>
  <div class="text-muted p-3" *ngIf="!filteredTodayAppointments.length">No appointments for this filter.</div>
</section>

<section class="mp-card mp-panel mp-panel--timeline" *ngIf="todayAppointments.length">
  <header class="mp-panel__head"><h3>Today's Calendar</h3></header>
  <div class="mp-timeline">
    <div class="mp-timeline__item" *ngFor="let a of todayAppointments">
      <div class="mp-timeline__time">{{ a.appointmentTime || a.slotTime || a.time }}</div>
      <div class="mp-timeline__body">{{ a.patientName }}</div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Layout SCSS**

Two-column grid: appointments flex 2, timeline flex 1; stack on mobile.

- [ ] **Step 5: Smoke test**

Open `/dashboard` as Doctor with today’s appointments.  
Expected: list matches today’s appointments page data; tabs filter; empty filter shows empty state; no Tasks panel.

- [ ] **Step 6: Stop for review**

---

### Task 7: Recent patients panel

**Files:**
- Modify: `src/app/shared/components/dashboard/dashboard.ts`
- Modify: `src/app/shared/components/dashboard/dashboard.html`
- Modify: `src/app/shared/components/dashboard/dashboard.scss`

**Interfaces:**
- Consumes: `PatientService.getPatients(1, 8, '')` (same pattern as All Patients screen for that role)
- Produces: `recentPatients: any[]`

- [ ] **Step 1: Load recent patients**

```typescript
private patientService = inject(PatientService);
recentPatients: any[] = [];

loadRecentPatients(): void {
  this.patientService.getPatients(1, 8, '').subscribe({
    next: (res: any) => {
      this.recentPatients = res?.dataList ?? res?.data ?? [];
    },
    error: () => {
      this.recentPatients = [];
    },
  });
}
```

Call on init. Hide section with `*ngIf="recentPatients.length"`.

- [ ] **Step 2: Markup**

```html
<section class="mp-card mp-panel mp-panel--patients" *ngIf="recentPatients.length">
  <header class="mp-panel__head">
    <h3>Recent Patients</h3>
    <a routerLink="/patient/allpatient">View all</a>
  </header>
  <div class="mp-patient-grid">
    <a class="mp-patient-card" *ngFor="let p of recentPatients" routerLink="/patient/allpatient">
      <strong>{{ p.fullName || p.patientName || p.name }}</strong>
      <small>{{ p.uhid || p.pid }}</small>
      <small>{{ p.age }} · {{ p.gender }}</small>
    </a>
  </div>
</section>
```

Bind real property names from the existing all-patient component.

- [ ] **Step 3: Lab pending panel — only if count is available**

If no dedicated pending-lab count endpoint exists in `ApiEndpoints`, **skip** Pending Reports entirely (rule C). Do not invent counts from LabTest catalog GET.

- [ ] **Step 4: Smoke test**

Expected: up to 8 patient cards; section hidden when empty/error; no Alerts widget.

- [ ] **Step 5: Stop for review**

---

### Task 8: Restyle SuperAdmin / Admin dashboard

**Files:**
- Modify: `src/app/modules/superadmin/components/dashboard/dashboard.html`
- Modify: `src/app/modules/superadmin/components/dashboard/dashboard.scss`
- Modify: `src/app/modules/superadmin/components/dashboard/dashboard.ts` (only if wrappers needed)

**Interfaces:**
- Consumes: existing `getDashboardSummary`, packages, inactive users, doctors list logic — do not remove
- Produces: MediPilot KPI cards + panels; modals still work

- [ ] **Step 1: Wrap existing cards in `.mp-kpi-row` / `.mp-card`**

Replace `dashboard-widget-box` wrappers with `mp-kpi mp-card` structure matching Task 5. Keep all `*ngIf="isAdmin"` / `isSuperAdmin` gates and click/modal hooks.

- [ ] **Step 2: Restyle modals lightly**

Keep Bootstrap modals; ensure headers use MediPilot typography; do not break pagination helpers (`paginatedPackages`, `paginatedUsers`, `paginatedDoctors`).

- [ ] **Step 3: SCSS**

Duplicate KPI selectors under this component scss if encapsulation requires.

- [ ] **Step 4: Smoke test Admin + SuperAdmin**

Login Admin: Active Doctors modal, appointment KPIs, packages/inactive if shown.  
Login SuperAdmin: Hospitals card + packages.  
Expected: Today/Overall still work; no clinic Tasks/Alerts added.

- [ ] **Step 5: Stop for review**

---

### Task 9: Responsive polish + role regression

**Files:**
- Modify: shell/dashboard SCSS as needed from findings

- [ ] **Step 1: Responsive pass**

Check widths ~375px and ~1280px for Doctor dashboard and Admin dashboard.  
Sidebar stacks; KPI cards wrap; appointment/timeline stack.

- [ ] **Step 2: Role matrix checklist**

| Role | Shell | Home | KPIs | Fake widgets absent |
|------|-------|------|------|---------------------|
| Doctor | yes | `/dashboard` | clinic | yes |
| Receptionist | yes | `/dashboard` | clinic | yes |
| Admin | yes | `/superadmin` | admin cards | yes |
| SuperAdmin | yes | `/superadmin` | platform cards | yes |

- [ ] **Step 3: Build**

Run: `npx ng build --configuration=development`  
Expected: success.

- [ ] **Step 4: Final review stop**

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| §1 Shell layout unify | Task 2 |
| §1 Header welcome/date/profile; no search/badges | Task 3 |
| §1 Sidebars restyle; existing MENU only | Task 4 |
| Tokens | Task 1 |
| §2 Clinic KPIs live | Task 5 |
| §2 Appointments + timeline | Task 6 |
| §2 Recent patients; lab only if API | Task 7 |
| §2 Omit Tasks/Alerts/etc. | Tasks 5–7 |
| §3 Admin/SuperAdmin restyle | Task 8 |
| Responsive + role smoke | Task 9 |

## Placeholder scan

No TBD steps. API field name variants (`appointmentTime` vs `slotTime`) resolved against live payload during Tasks 6–7.

## Type consistency

- `Appointment.getAllPatientAsPerDoctor(page, pageSize, search, status, date?)`
- `PatientService.getPatients(page, pageSize, search)`
- `DashboardService.getDahBoardData` / `getDashboardSummary`
- Status codes aligned with today’s appointments screen (`0/1/2/4`, all=`3`)
