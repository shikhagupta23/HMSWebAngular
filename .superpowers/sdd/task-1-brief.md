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

If project uses `@import` elsewhere, match that style. File is `_mp-tokens.scss` â†’ import path `styles/mp-tokens`.

- [ ] **Step 3: Verify build loads tokens**

Run: `npx ng build --configuration=development`  
Expected: build succeeds; no Sass resolve errors for `mp-tokens`.

- [ ] **Step 4: Stop for review** (commit only if user requests)

---


