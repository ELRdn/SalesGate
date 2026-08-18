---
title: SalesGate Design System
description: UI/UX Visual Design System — the single source of truth for how SalesGate looks, feels, and behaves. Any AI reading this document should be able to produce visually consistent SalesGate UI without seeing existing screens.
last_updated: 2026-08-16
---

# SalesGate Design System

> **If an implementation decision conflicts with this document, this document wins.**
> Do not invent new colors, spacing values, component variants, or layout patterns without updating DESIGN.md first.

---

## 1. Design Mission

SalesGate is an **approval console for human-operated AI sales outreach**. It is not a CRM, not a chat app, and not a generic SaaS dashboard. It is a **mission control surface** where operators make fast, confident decisions about what AI agents send on their behalf.

The UI must feel like a tool that **commands respect and earns trust** — not one that entertains.

### Core Job

> A single operator reviews 10-30 AI-drafted emails per session, spends 15-30 seconds each, and approves/rejects with confidence.

---

## 2. Product Personality

| Trait | Description |
|---|---|
| **Controlled** | Every element has a clear purpose. No decoration. |
| **Dense** | Information density is a feature. Operators are power users. |
| **Calm** | Low visual noise. Quiet confidence. |
| **Trustworthy** | The UI must feel safe. Errors are visible. Actions are undoable where possible. |
| **Operational** | Built for doing work, not browsing. Keyboard-first where possible. |
| **Human-in-command** | The human is always in control. AI drafts, humans decide. |

### The Anti-Brand

SalesGate is **not**:
- A playful CRM with mascot illustrations
- A futuristic AI dashboard with glowing gradients
- A Notion-style minimal workspace
- A Slack-like chat interface
- An enterprise BI dashboard with charts everywhere

---

## 3. Design Principles

1. **Clarity over cleverness** — Labels are explicit. Icons are accompanied by text. No mystery meat navigation.
2. **Speed to decision** — The most important action (Approve) is always visible and prominent. Operators should never hunt for the action button.
3. **Information density** — Show more, not less. Operators are power users who want context at a glance.
4. **Consistent patterns** — Every card, badge, button, and form follows the same rules. No per-page inventing.
5. **Visible state** — The system's state is always clear. Loading, empty, error, and success states are all defined.
6. **Accessible by default** — Sufficient contrast, keyboard navigable, focus visible. Not an afterthought.

---

## 4. Anti-Patterns

These patterns are **prohibited** in SalesGate UI:

| Anti-Pattern | Why |
|---|---|
| AI-gradient aesthetics (purple/blue glows) | This is an operational tool, not an AI showcase |
| Excessive glassmorphism | Reduces readability of dense content |
| Huge rounded cards (rounded-2xl+) | Feels playful, undermines trust |
| Floating chat-centric layouts | This is not a chat app |
| Decorative animations | Adds latency to decision-making |
| Excessive whitespace | Wastes screen real estate for power users |
| Emoji-heavy headings | Unprofessional for a trust-critical tool |
| Unlabeled icon-only buttons | Reduces discoverability |
| Cards that span full width with no max | Loses readability in long lines |
| Auto-hiding toasts without explicit close | Operators need to confirm actions happened |

---

## 5. Foundations

### 5.1 Colors

SalesGate uses a **dark zinc palette** with semantic accent tokens. The design system uses Tailwind CSS v4 utility classes mapped to semantic purposes.

#### Background

| Token | Tailwind | Usage |
|---|---|---|
| `--bg-app` | `bg-zinc-950` | App background, page background |
| `--bg-surface` | `bg-zinc-900/60` | Cards, panels, elevated surfaces |
| `--bg-surface-solid` | `bg-zinc-900` | Forms, inputs, filter bars |
| `--bg-inset` | `bg-zinc-950/60` | Nested content areas within cards |
| `--bg-elevated` | `bg-zinc-800` | Buttons (ghost/secondary), active states |

#### Border

| Token | Tailwind | Usage |
|---|---|---|
| `--border-default` | `border-zinc-800` | Standard card/panel borders |
| `--border-strong` | `border-zinc-700` | Hover states, focus rings |
| `--border-focus` | `border-emerald-500` | Focus ring on inputs |

#### Text

| Token | Tailwind | Usage |
|---|---|---|
| `--text-primary` | `text-zinc-100` | Headings, primary content |
| `--text-body` | `text-zinc-300` | Body text, message content |
| `--text-secondary` | `text-zinc-400` | Timestamps, secondary info |
| `--text-muted` | `text-zinc-500` | Labels, placeholders, hints |

#### Accent / Brand

| Token | Tailwind | Usage |
|---|---|---|
| `--accent-primary` | `emerald-400` | Brand accent, links, positive indicators |
| `--accent-primary-action` | `bg-emerald-600` | Primary action buttons (Approve, Submit) |
| `--accent-primary-hover` | `hover:bg-emerald-500` | Primary button hover |
| `--accent-edit` | `bg-sky-600` | Edit actions |
| `--accent-edit-hover` | `hover:bg-sky-500` | Edit button hover |

#### Status Semantics

| Token | Tailwind | Status |
|---|---|---|
| `--status-awaiting` | `amber-400/500` | AWAITING_APPROVAL — needs attention |
| `--status-approved` | `emerald-400/500` | APPROVED — ready for agent pickup |
| `--status-edited` | `green-400/500` | EDITED — human-modified, ready |
| `--status-rejected` | `red-400/500` | REJECTED — agent notified |
| `--status-claimed` | `sky-400/500` | CLAIMED — agent picked up |
| `--status-sent` | `green-400/500` | SENT — successfully delivered |
| `--status-failed` | `rose-400/500` | FAILED — needs attention |
| `--status-archived` | `zinc-400/500` | ARCHIVED — no action needed |

#### Risk / Warning

| Token | Tailwind | Usage |
|---|---|---|
| `--risk-bg` | `bg-red-500/10` | Risk flag pill background |
| `--risk-text` | `text-red-400` | Risk flag text |
| `--risk-ring` | `ring-red-500/30` | Risk flag border ring |
| `--warning-bg` | `bg-red-950/30` | Hash mismatch warning card |
| `--warning-border` | `border-red-800/50` | Hash mismatch warning border |
| `--evidence-bg` | `bg-emerald-950/20` | Evidence panel background |
| `--evidence-border` | `border-emerald-900/40` | Evidence panel border |
| `--evidence-text` | `text-emerald-400` | Evidence panel label |

---

### 5.2 Typography

SalesGate uses the **system font stack** (no custom font loading). The `antialiased` class is applied globally.

| Role | Tailwind | Size | Weight | Usage |
|---|---|---|---|---|
| Page title | `text-2xl font-bold tracking-tight` | 24px | 700 | Page h1 (e.g., "ダッシュボード") |
| Section heading | `font-semibold` | 16px (base) | 600 | Card titles, section headers |
| Body | `text-sm leading-relaxed` | 14px | 400 | Email body, descriptions |
| Label | `text-xs font-semibold` | 12px | 600 | Panel labels (e.g., "根拠") |
| Secondary | `text-xs` | 12px | 400 | Timestamps, metadata, hints |
| Stat value | `text-3xl font-bold` | 30px | 700 | Dashboard stat numbers |
| Badge | `text-xs font-medium` | 12px | 500 | Status badges, risk flags |
| Mono (IDs) | `font-mono text-xs` | 12px | 400 | Lead IDs, Hash values, Message-IDs |

#### Language

- UI labels are in **Japanese** (e.g., "承認", "却下", "編集して承認")
- Technical identifiers remain in English (e.g., `AWAITING_APPROVAL`, `submit_draft`)
- Status labels are Japanese with English constant names in code

---

### 5.3 Spacing

SalesGate uses a **4px base grid**. All spacing values are multiples of 4.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--space-xs` | 4px | `p-1` / `gap-1` | Tight grouping (badge internals) |
| `--space-sm` | 8px | `p-2` / `gap-2` | Button padding, small gaps |
| `--space-md` | 12px | `p-3` | Card inner padding (compact) |
| `--space-lg` | 16px | `p-4` / `gap-4` | Card padding, standard gaps |
| `--space-xl` | 20px | `p-5` | Card padding (approval card) |
| `--space-2xl` | 24px | `px-6` | Page gutter, section gaps |
| `--space-3xl` | 32px | `py-8` | Page vertical padding |

---

### 5.4 Radius

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--radius-sm` | 6px | `rounded-md` | Navigation links, filter tabs |
| `--radius-md` | 8px | `rounded-lg` | Buttons, inputs, form elements |
| `--radius-lg` | 12px | `rounded-xl` | Cards, panels |
| `--radius-full` | 9999px | `rounded-full` | Badges, pills, status dots |

> **Rule: Never exceed `rounded-xl` (12px) in primary application UI.** No `rounded-2xl` or `rounded-3xl`.

---

### 5.5 Borders

| Element | Class | Weight |
|---|---|---|
| Card border | `border border-zinc-800` | 1px solid |
| Card hover | `hover:border-zinc-700` | 1px solid |
| Input focus | `focus:border-emerald-500` | 1px solid |
| Badge ring | `ring-1 ring-{color}/30` | 1px ring |
| Section divider | `border-b border-zinc-800` | 1px solid |
| Dashed empty state | `border-dashed border-zinc-800` | 1px dashed |

---

### 5.6 Shadows

SalesGate uses **minimal shadows**. The primary depth mechanism is background opacity and border contrast.

| Element | Shadow | Usage |
|---|---|---|
| Cards | None | Depth via `bg-zinc-900/60` + `border-zinc-800` |
| Sticky nav | `backdrop-blur` | `bg-zinc-950/80 backdrop-blur` |
| Hover states | Border color shift | `hover:border-zinc-700` |

> **No drop shadows on cards.** Depth is communicated through border and background contrast.

---

### 5.7 Icons

- Icons are **inline emoji** (not icon libraries) for simplicity and universal rendering
- Standard icon mapping:
  - ✅ Approve / Success
  - ✏️ Edit
  - ❌ Reject / Close
  - 📋 Evidence / Document
  - ⚠️ Risk / Warning
  - 🔁 Retry
  - 📝 Feedback / Memo
  - 📤 Sent
  - 🗄 Archive
  - 🚦 Brand (SalesGate traffic light)
- Emoji are **never used as the sole indicator** — always paired with text labels
- Exception: Status badge emoji are supplementary (text is the primary signal)

---

### 5.8 Motion

SalesGate uses **minimal animation**. Motion is functional, not decorative.

| Interaction | Animation | Duration |
|---|---|---|
| Button hover | Background color transition | `transition` (Tailwind default ~150ms) |
| Card hover | Border color transition | `transition` (~150ms) |
| Nav link hover | Background color transition | `transition` (~150ms) |
| Page transitions | None (server-rendered) | — |
| Loading state | Button `disabled:opacity-50` | Immediate |
| Toast notification | None implemented | — |

> **No entrance animations, no page transitions, no skeleton loaders, no confetti.**

---

## 6. Application Shell

### 6.1 Desktop Layout

```
+-----------------------------------------------------------+
| 🚦 SalesGate  [ダッシュボード] [承認キュー] [リード] ...      |  <- Sticky top nav
+-----------------------------------------------------------+
|                                                           |
|  +-----------------------------------------------------+  |
|  |  Page Content                                       |  |
|  |  max-w-6xl (1152px)                                 |  |
|  |  px-6 py-8                                          |  |
|  +-----------------------------------------------------+  |
|                                                           |
+-----------------------------------------------------------+
```

- **No sidebar.** Navigation is a horizontal top bar.
- Content is **centered** with `max-w-6xl mx-auto`.
- Page padding: `px-6` horizontal, `py-8` vertical.

### 6.2 Mobile Layout

- Nav links wrap horizontally, remain visible.
- Content width is full (minus page padding).
- Approval cards stack vertically.
- Action buttons wrap to multiple rows on small screens.

### 6.3 Navigation Bar (Nav)

```
+------------------------------------------------------------------+
| 🚦 SalesGate     [ダッシュボード] [承認キュー] [リード] ...        |
|  emerald-400         zinc-300 (hover: white + zinc-800 bg)       |
+------------------------------------------------------------------+
```

- **Sticky top**: `sticky top-0 z-10`
- **Background**: `bg-zinc-950/80 backdrop-blur` (translucent dark)
- **Border**: `border-b border-zinc-800`
- **Brand**: `text-emerald-400 font-bold` with 🚦 emoji
- **Tagline**: `text-xs font-normal text-zinc-500` — "Approval-first AI SDR Hub" (hidden on mobile via `hidden sm:inline`)
- **Links**: `text-sm text-zinc-300`, hover → `bg-zinc-800 text-white`, active → same as hover
- **Link padding**: `rounded-md px-3 py-1.5`

### 6.4 Header (Page)

Each page has a header section:

```
+--------------------------------------------+
| ページタイトル                                |  <- text-2xl font-bold tracking-tight
| 説明文（省略可能）                            |  <- text-sm text-zinc-500 mt-1
+--------------------------------------------+
```

- Page title: `text-2xl font-bold tracking-tight` (no emoji in titles)
- Description: `text-sm text-zinc-500 mt-1`
- Header may include a right-aligned action area (e.g., filter tabs)

---

## 7. Core Components

### 7.1 Button

| Variant | Classes | Usage |
|---|---|---|
| **Primary** | `bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50` | Approve, Submit, Primary action |
| **Secondary (Edit)** | `bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500` | Edit actions |
| **Ghost** | `bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700` | Cancel, Back, Reject (low emphasis) |
| **Destructive** | `bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50` | Confirm reject, Delete |
| **Warning/Retry** | `bg-amber-600 px-4 py-2 text-sm font-medium hover:bg-amber-500 disabled:opacity-50` | Retry failed |
| **Link** | `text-sm text-emerald-400 hover:underline` | Inline links (e.g., "すべて見る →") |

#### Button Rules

- All buttons are `rounded-lg` (8px)
- Minimum touch target: 36px height
- Primary action is always **leftmost** in a button group
- Disabled state: `disabled:opacity-50` (no cursor change)
- Loading state: `disabled={isPending}` with opacity
- Text is always a **verb** ("承認", "却下する", "編集して承認", "戻る")
- Button groups use `flex gap-2`

### 7.2 Badge (Status)

| Property | Value |
|---|---|
| Shape | `rounded-full` |
| Padding | `px-2 py-0.5` |
| Font | `text-xs font-medium` |
| Border | `ring-1 ring-{color}/30` |
| Background | `bg-{color}/10` |
| Text | `text-{color}` |

Status badges use the semantic color mapping defined in Section 5.1.

### 7.3 Input

```html
<input class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm
              focus:border-emerald-500 focus:outline-none" />
```

- Full width within container
- Background: `bg-zinc-900` (solid, not transparent)
- Border: `border-zinc-700` (visible)
- Focus: `focus:border-emerald-500 focus:outline-none`
- Font: `text-sm`
- Padding: `px-3 py-2`

### 7.4 Textarea

```html
<textarea rows="10"
  class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm
         focus:border-emerald-500 focus:outline-none" />
```

- Same styling as Input
- `rows` varies: 3 (reject feedback), 10 (email body edit)
- `whitespace-pre-wrap` for display (not editing) mode

### 7.5 Table / List

SalesGate uses **card-based lists**, not traditional HTML tables.

List item pattern:
```html
<div class="space-y-2">
  <a class="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4
            transition hover:border-zinc-700">
    <div class="flex items-center justify-between gap-3">
      <p class="truncate text-sm font-medium">Title</p>
      <Badge />
    </div>
    <p class="mt-1 truncate text-xs text-zinc-500">Metadata</p>
  </a>
</div>
```

- Each row is a **card** (bordered, rounded)
- Layout: `flex items-center justify-between gap-3`
- Title: `truncate text-sm font-medium`
- Metadata: `mt-1 truncate text-xs text-zinc-500`
- Hover: `hover:border-zinc-700` (border lightens)

### 7.6 Card

| Property | Value |
|---|---|
| Border | `border border-zinc-800` |
| Background | `bg-zinc-900/60` |
| Radius | `rounded-xl` (12px) |
| Padding | `p-5` (approval card), `p-4` (list items), `p-3` (compact panels) |
| Hover | `hover:border-zinc-700` (for clickable cards) |
| Max width | Determined by parent (`max-w-6xl` page container) |

Card variants:
- **Standard card** (dashboard stats): `rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`
- **List item card**: `rounded-xl border border-zinc-800 bg-zinc-900/60 p-4`
- **Inset panel** (evidence, hash warning): `rounded-lg border border-{color}-900/40 bg-{color}-950/20 p-3`
- **Empty state**: `rounded-xl border border-dashed border-zinc-800 p-12 text-center`

### 7.7 Dialog / Modal

Not currently implemented. If needed:
- Use native `<dialog>` or simple overlay
- Background: `bg-black/50` overlay
- Content: Standard card styling centered on screen
- **Avoid if possible** — inline editing (toggle between view/edit mode) is preferred

### 7.8 Toast / Notification

Not currently implemented. Planned behavior:
- Position: Top-right corner
- Duration: Auto-dismiss after 5 seconds
- Variants: Success (emerald), Error (red), Warning (amber)
- **Must have explicit close button** (per Anti-Patterns: no auto-hide without close)

---

## 8. SalesGate Components

### 8.1 Approval Card (Core Component)

This is the **most important component** in SalesGate. It must be pixel-consistent across implementations.

```
+------------------------------------------------------------------+
| 株式会社サンプル / 田中太郎 <tanaka@example.com>    [承認待ち]       |
| DSH · 4 min ago                                       (amber)    |
+------------------------------------------------------------------+
| ⚠ Risk flags                                                     |
| [過去に連絡済み] [未検証の主張]                                       |
| (red pill badges: bg-red-500/10 text-red-400 ring-1)              |
+------------------------------------------------------------------+
| 📋 根拠                                                           |
| Evidence text in emerald panel                                    |
| (bg-emerald-950/20 border-emerald-900/40 text-zinc-300)          |
+------------------------------------------------------------------+
| 件名                                                              |
| (font-semibold text-zinc-100)                                     |
|                                                                   |
| メール本文                                                         |
| (whitespace-pre-wrap text-sm text-zinc-300                        |
|  bg-zinc-950/60 rounded-lg p-4)                                  |
+------------------------------------------------------------------+
| 🔒 Hash locked ✓         [✏️ 編集して承認] [❌ 却下] [✅ 承認]        |
| (text-xs text-zinc-500)   (sky)         (ghost)  (emerald)        |
+------------------------------------------------------------------+
```

#### Anatomy (top to bottom)

1. **Header row**: `flex items-start justify-between gap-4`
   - Left: Subject (`font-semibold text-zinc-100`) + metadata line (`text-xs text-zinc-500`)
   - Right: `<ApprovalStatusBadge>` component
2. **Risk flags** (conditional): `mt-3 flex flex-wrap gap-2` — Red pill badges
3. **Evidence panel** (conditional): `mt-4 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3`
4. **Hash mismatch warning** (conditional): `mt-3 rounded-lg border border-red-800/50 bg-red-950/30 p-3`
5. **Body**: Either display (`p-4 bg-zinc-950/60 rounded-lg`) or edit mode (textarea)
6. **Decision bar**: `mt-4 flex flex-wrap gap-2` — Action buttons
7. **Decision memo** (conditional): `mt-3 rounded-lg bg-zinc-950/60 p-3 text-xs text-zinc-400`

#### Edit Mode

When "編集して承認" is clicked:
- Subject becomes an `<input>` (same styling as Section 7.3)
- Body becomes a `<textarea rows={10}>` (same styling as Section 7.4)
- Action buttons change to: "編集して承認" (emerald primary) + "戻る" (ghost)

#### Reject Mode

When "却下" is clicked:
- A `<textarea rows={3}>` appears with placeholder "却下理由・エージェントへのフィードバック"
- Action buttons: "却下する" (red destructive) + "戻る" (ghost)
- Feedback is **optional** (not required)

### 8.2 Evidence Panel

```
+----------------------------------------------+
| 📋 根拠                                       |
| Evidence text (whitespace-pre-wrap)           |
+----------------------------------------------+
```

- Container: `mt-4 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3`
- Label: `text-xs font-semibold text-emerald-400` with 📋 emoji
- Body: `mt-1 whitespace-pre-wrap text-sm text-zinc-300`

### 8.3 Risk Flags

```
[⚠ 過去に連絡済み]  [⚠ 未検証の主張]
```

- Container: `mt-3 flex flex-wrap gap-2`
- Each flag: `rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400 ring-1 ring-red-500/30`
- Always prefixed with ⚠ emoji

### 8.4 Lead Row

Used in `/leads` page. Same list item pattern as Section 7.5.

- Company name as primary text
- Contact name + email as secondary
- Status badge (using `LEAD_STATUS_COLOR` mapping)
- Touch count displayed as text

### 8.5 Task Row

Used in `/tasks` page. Same list item pattern.

- Task title as primary text
- Type label + assigned agent as secondary
- Status badge (using `TASK_STATUS_COLOR` mapping)

### 8.6 Agent Badge (Planned)

Not currently a standalone component. When implemented:
- Small badge showing agent name
- Consistent with Badge styling (Section 7.2)
- Displayed in Approval Card header and Task Row

### 8.7 Hash Verification Badge

Displayed in Approval Card header area when hash is locked:
- Text: `🔒 Hash locked ✓` or `🔒 Hash locked`
- Style: `text-xs text-zinc-500`
- When mismatch detected: Full warning panel (see Section 8.1, item 4)

### 8.8 Decision Bar

The action button row at the bottom of Approval Card:

**When AWAITING_APPROVAL:**
```
[✅ 承認]  [✏️ 編集して承認]  [❌ 却下]
(emerald)    (sky)             (ghost/zinc-800)
```

**When FAILED:**
```
[🔁 再送信を許可]
(amber)
```

**When EDIT mode:**
```
[編集して承認]  [戻る]
(emerald)       (ghost)
```

**When REJECT mode:**
```
[却下する]  [戻る]
(red)       (ghost)
```

#### Button Hierarchy

| Priority | Action | Color | Style |
|---|---|---|---|
| 1 (Primary) | 承認 | emerald-600 | Primary |
| 2 (Secondary) | 編集して承認 | sky-600 | Secondary |
| 3 (Tertiary) | 却下 | zinc-800 | Ghost |
| — | 再送信を許可 | amber-600 | Warning |
| — | 戻る | zinc-800 | Ghost |

---

## 9. Status Semantics

### ApprovalItem Statuses

| Status | Badge Color | Label | Meaning |
|---|---|---|---|
| `AWAITING_APPROVAL` | amber | 承認待ち | Agent submitted, awaiting human review |
| `APPROVED` | emerald | 承認済み | Human approved, ready for agent claim |
| `EDITED` | green | 編集承認済み | Human edited and approved |
| `REJECTED` | red | 却下 | Human rejected with optional feedback |
| `CLAIMED` | sky | 送信待ち(claim済) | Agent claimed, sending |
| `SENT` | green | 送信済み | Successfully delivered |
| `FAILED` | rose | 送信失敗 | Delivery failed, retryable |
| `ARCHIVED` | zinc | アーカイブ | Auto-archived after 7 days |

### Lead Statuses

| Status | Badge Color | Label |
|---|---|---|
| `ACTIVE` | emerald | アクティブ |
| `RESPONDED` | sky | 返信あり |
| `SLEEPING` | zinc | 休眠 |
| `SUPPRESSED` | red | 抑制中 |

### Task Statuses

| Status | Badge Color | Label |
|---|---|---|
| `PENDING` | amber | 未着手 |
| `IN_PROGRESS` | sky | 進行中 |
| `DONE` | emerald | 完了 |
| `CANCELLED` | zinc | キャンセル |

---

## 10. Pages

### 10.1 Dashboard (`/`)

```
+------------------------------------------------------------+
| ダッシュボード                                               |
| 営業はAIに、判断はあなたに。承認ゲートの状態を確認しましょう。     |
+------------------------------------------------------------+
| +----------+ +----------+ +----------+ +----------+        |
| | 承認待ち   | |今日の送信 | |アクティブ | |未完了    |        |
| |    5     | |    12    | |    23    | |    8     |        |
| | (amber)  | |(emerald) | |  (sky)   | | (violet) |        |
| +----------+ +----------+ +----------+ +----------+        |
+------------------------------------------------------------+
| +-- 承認待ちの下書き ------+  +-- 最近の送信ログ ----------+  |
| | [Approval Card items]   |  | [Log items]               |  |
| | (max 5)                 |  | (max 8)                   |  |
| +-------------------------+  +---------------------------+  |
+------------------------------------------------------------+
```

- Stats grid: `grid grid-cols-2 gap-4 lg:grid-cols-4`
- Each stat card: `rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`
- Stat label: `text-sm text-zinc-500`
- Stat value: `text-3xl font-bold {color}`
- Two-column section: `mt-8 grid gap-6 lg:grid-cols-2`

### 10.2 Approvals (`/approvals`)

```
+------------------------------------------------------------+
| 承認キュー                                                   |
| すべての外部送信はここでの承認を通過します。                    |
|                                     [承認待ち|承認済み|...]    |  <- Filter tabs
+------------------------------------------------------------+
| +-- Approval Card ----------------------------------------+ |
| | ...                                                      | |
| +----------------------------------------------------------+ |
| +-- Approval Card ----------------------------------------+ |
| | ...                                                      | |
| +----------------------------------------------------------+ |
+------------------------------------------------------------+
```

- Filter bar: `flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-sm`
- Active filter: `bg-emerald-600 font-medium text-white`
- Inactive filter: `text-zinc-400 hover:bg-zinc-800 hover:text-white`
- Card list: `space-y-4`

### 10.3 Leads (`/leads`)

- Standard list view with card-based rows
- Lead form at top (for adding new leads)
- CSV import button
- Status filter

### 10.4 Tasks (`/tasks`)

- Standard list view
- Task form at top (with assignee field)
- Status filter tabs

### 10.5 Settings (`/settings`)

- Form-based page, max-width constrained
- Sections: Daily limits, Follow-up rules, Slack Webhook, Playbook management
- Playbook section: Export/Import/Apply/Delete buttons

---

## 11. Responsive Rules

### Desktop (>=768px)

- Full layout as described in Section 6.1
- Two-column grid on Dashboard
- Horizontal filter tabs on Approvals
- Full nav bar visible

### Mobile (<768px)

- Nav links may wrap, tagline hidden
- Single column layout
- Approval cards stack vertically
- Decision bar buttons wrap to multiple rows
- Filter tabs scroll horizontally or wrap
- Stats grid: 2 columns (always)
- Page padding reduced: `px-4` instead of `px-6`

### Key Mobile Consideration

> **Mobile Approval UX is critical.** Many operators will review approvals on their phone between meetings. The approval card must be fully functional on a 360px wide screen.

---

## 12. Interaction Rules

### Approve

```
Click [✅ 承認]
  -> Button becomes disabled (opacity-50)
  -> Server action fires (approveApprovalItem)
  -> Card disappears from pending list
  -> No confirmation dialog needed (operator is intentional)
```

### Edit and Approve

```
Click [✏️ 編集して承認]
  -> Subject becomes editable input
  -> Body becomes editable textarea (rows=10)
  -> Buttons change to [編集して承認] + [戻る]
  -> Click [編集して承認]
    -> Server action fires (editAndApproveApprovalItem)
    -> Card disappears from pending list
  -> Click [戻る]
    -> Returns to view mode, no changes saved
```

### Reject

```
Click [❌ 却下]
  -> Feedback textarea appears (rows=3, optional)
  -> Buttons change to [却下する] + [戻る]
  -> Click [却下する]
    -> Server action fires (rejectApprovalItem)
    -> Card moves to rejected state
    -> Agent receives feedback via task system
  -> Click [戻る]
    -> Returns to view mode
```

### Retry (Failed)

```
Click [🔁 再送信を許可]
  -> Server action fires (retryFailedApprovalItem)
  -> Status changes from FAILED to APPROVED
  -> Card moves back to pending queue
```

### Hash Mismatch Warning

```
If hashMismatchAt is set:
  -> Red warning panel appears above body
  -> Text: "⚠️ 本文不一致を検知 (X ago)"
  -> Explanation: "送信された本文が承認原文と一致しませんでした..."
  -> No action available (detection only, not prevention)
```

---

## 13. Accessibility

### Contrast

All text colors against `bg-zinc-950` background:
- `text-zinc-100`: Contrast ratio ~15:1 (AAA)
- `text-zinc-300`: Contrast ratio ~10:1 (AAA)
- `text-zinc-400`: Contrast ratio ~6:1 (AA)
- `text-zinc-500`: Contrast ratio ~4:1 (AA for large text)

### Focus Management

- All interactive elements must have visible focus
- Input focus: `focus:border-emerald-500 focus:outline-none`
- Button focus: Browser default focus ring (acceptable on dark background)

### Keyboard Navigation

- All links and buttons are keyboard accessible
- Tab order follows visual order
- No keyboard traps

### Semantic HTML

- Use `<header>` for nav bar
- Use `<main>` for content area
- Use `<nav>` for navigation links
- Use `<section>` for content sections
- Use `<h1>` for page title, `<h2>` for section titles

---

## 14. Writing / UI Copy

### Rules

- UI labels are in **Japanese**
- Technical identifiers (status codes, tool names) remain in **English**
- Buttons use **verb phrases** ("承認", "却下する", "編集して承認", "戻る")
- Avoid jargon in user-facing text
- Error messages should be specific and actionable
- Empty states explain what will appear and why

### Examples

| Context | Good | Bad |
|---|---|---|
| Empty approvals | "承認待ちはありません。エージェントが下書きを提出するとここに表示されます。" | "No data" |
| Button | "承認" | "OK" / "Submit" |
| Button | "却下する" | "No" / "Cancel" |
| Error | "エラーが発生しました" | "Error" |
| Metadata | "agent-name · 4 min ago" | "4 minutes ago by agent-name" |

---

## 15. Do / Don't Examples

### Do

- Use consistent card styling (`rounded-xl border border-zinc-800 bg-zinc-900/60`)
- Keep the approval card layout identical across all pages
- Show status badges with semantic colors
- Use `truncate` on titles to prevent layout breakage
- Show evidence and risk flags prominently
- Use Japanese labels for user-facing text

### Don't

- Don't use `rounded-2xl` or larger on cards
- Don't add drop shadows to cards
- Don't use gradients in backgrounds
- Don't use emoji as the sole indicator of meaning
- Don't create custom button styles per page
- Don't use light theme colors
- Don't add decorative illustrations
- Don't auto-hide important notifications
- Don't put primary actions at the bottom of long pages
- Don't use generic placeholder text ("Click here", "Learn more")

---

## 16. Reference SCREENS

### Approval Queue (Primary Screen)

```
+------------------------------------------------------------------+
| 🚦 SalesGate    [ダッシュボード] [承認キュー] [リード] [タスク] [設定] |
+------------------------------------------------------------------+
|                                                                    |
| 承認キュー                                                         |
| すべての外部送信はここでの承認を通過します。何も勝手に送られません。    |
|                                                                    |
| +-- [承認待ち] [承認済み] [失敗] [却下] [送信済み] [全件] ----------+ |
| +----------------------------------------------------------------+ |
|                                                                    |
| +----------------------------------------------------------------+ |
| 株式会社サンプル / 田中太郎 <tanaka@example.com>        [承認待ち]   |
| DSH · 4 min ago                                          (amber)  |
|--------------------------------------------------------------------|
| ⚠ 過去に連絡済み  ⚠ 未検証の主張                                     |
|--------------------------------------------------------------------|
| 📋 根拠                                                            |
| 社長ブログでDX推進の言及あり。競合導入の噂も。                          |
|--------------------------------------------------------------------|
| 件名: DX推進に関するご提案                                            |
|                                                                    |
| 田中様                                                               |
|                                                                    |
| お世話になっております。                                                |
| 先日ご投稿されたDX推進についてのブログ記事を拝見しました。                |
| 弊社でもsimilarな課題を解決した実績があり、                              |
| ぜひ詳細をお話しいただければと考えております。                            |
|--------------------------------------------------------------------|
| 🔒 Hash locked ✓           [✏️ 編集して承認] [❌ 却下] [✅ 承認]       |
+------------------------------------------------------------------+
```

---

## Appendix: File Mapping

| Design System Section | Source File |
|---|---|
| Nav | `src/components/nav.tsx` |
| Approval Card | `src/components/approval-card.tsx` |
| Status Badge | `src/components/status-badge.tsx` |
| Lead Row | `src/components/lead-row.tsx` |
| Task Row | `src/components/task-row.tsx` |
| Task Form | `src/components/task-form.tsx` |
| Settings Form | `src/components/settings-form.tsx` |
| Playbook Section | `src/components/playbook-section.tsx` |
| Layout Shell | `src/app/layout.tsx` |
| Dashboard | `src/app/page.tsx` |
| Approvals | `src/app/approvals/page.tsx` |
| Leads | `src/app/leads/page.tsx` |
| Tasks | `src/app/tasks/page.tsx` |
| Settings | `src/app/settings/page.tsx` |

> **For architecture, data flow, MCP tools, and database schema, see [ARCHITECTURE.md](./ARCHITECTURE.md).**
