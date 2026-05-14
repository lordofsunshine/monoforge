# MonoForge Design System

Design-spec для минималистичного GitHub-like сервиса MonoForge. Документ описывает визуальный язык, токены, компоненты, состояния, responsive-поведение и accessibility-правила. Его можно передать другому ИИ или разработчику для реализации компонентов на Next.js App Router, TypeScript и Tailwind CSS.

## 0. Дизайн-принцип

MonoForge выглядит как рабочий инженерный инструмент: тихий, точный, быстрый. Он берет от GitHub структуру репозитория, от терминала моноширинную строгость, от Notion воздух и чтение, от brutalism честные линии и прямую композицию.

Главное правило: интерфейс не соревнуется с кодом. Код, README, issues и метаданные всегда важнее декоративных элементов.

## 1. Цветовая система

Цветовая система строго монохромная. Цвет не используется для брендинга, статусов или привлечения внимания. Состояния выражаются контрастом, границей, толщиной линии, opacity, pattern и текстом.

### Semantic tokens

Использовать semantic tokens вместо прямых цветов в компонентах.

```css
:root {
  --mf-bg: 255 255 255;
  --mf-bg-subtle: 247 247 247;
  --mf-bg-muted: 238 238 238;
  --mf-surface: 255 255 255;
  --mf-surface-raised: 250 250 250;
  --mf-text: 10 10 10;
  --mf-text-muted: 82 82 82;
  --mf-text-faint: 132 132 132;
  --mf-border: 218 218 218;
  --mf-border-strong: 168 168 168;
  --mf-inverse: 10 10 10;
  --mf-inverse-text: 255 255 255;
  --mf-focus: 0 0 0;
  --mf-shadow: 0 0 0;
}

.dark {
  --mf-bg: 10 10 10;
  --mf-bg-subtle: 18 18 18;
  --mf-bg-muted: 30 30 30;
  --mf-surface: 13 13 13;
  --mf-surface-raised: 22 22 22;
  --mf-text: 245 245 245;
  --mf-text-muted: 176 176 176;
  --mf-text-faint: 116 116 116;
  --mf-border: 50 50 50;
  --mf-border-strong: 90 90 90;
  --mf-inverse: 245 245 245;
  --mf-inverse-text: 10 10 10;
  --mf-focus: 255 255 255;
  --mf-shadow: 0 0 0;
}
```

### Tailwind theme mapping

```ts
const monoForgeTheme = {
  colors: {
    background: "rgb(var(--mf-bg) / <alpha-value>)",
    subtle: "rgb(var(--mf-bg-subtle) / <alpha-value>)",
    muted: "rgb(var(--mf-bg-muted) / <alpha-value>)",
    surface: "rgb(var(--mf-surface) / <alpha-value>)",
    raised: "rgb(var(--mf-surface-raised) / <alpha-value>)",
    foreground: "rgb(var(--mf-text) / <alpha-value>)",
    secondary: "rgb(var(--mf-text-muted) / <alpha-value>)",
    faint: "rgb(var(--mf-text-faint) / <alpha-value>)",
    line: "rgb(var(--mf-border) / <alpha-value>)",
    lineStrong: "rgb(var(--mf-border-strong) / <alpha-value>)",
    inverse: "rgb(var(--mf-inverse) / <alpha-value>)",
    inverseText: "rgb(var(--mf-inverse-text) / <alpha-value>)",
    focus: "rgb(var(--mf-focus) / <alpha-value>)"
  }
}
```

### Usage rules

- `background`: общий фон приложения.
- `surface`: панели, модальные окна, command palette.
- `subtle`: hover, zebra rows, quiet blocks.
- `muted`: skeleton, pressed state, inactive tab background.
- `foreground`: основной текст.
- `secondary`: вторичный текст, метаданные.
- `faint`: timestamps, disabled text, separators text.
- `line`: обычные границы.
- `lineStrong`: активные границы, selected rows, important dividers.
- `inverse`: primary action background.
- `inverseText`: текст на primary action.

### Status without color

- Open issue: `border-solid`, label `OPEN`.
- Closed issue: `border-dashed`, label `CLOSED`.
- Draft/private: dotted border.
- Warning: двойная граница или `ring-1 ring-lineStrong`.
- Error: высокий контраст текста, префикс `Error:`, `aria-invalid`.
- Success: не использовать зеленый цвет, показывать короткий quiet toast.

## 2. Типографика

### Fonts

- Interface: Geist Sans или Inter.
- Code and metrics: Geist Mono, JetBrains Mono или ui-monospace.
- Не использовать декоративные шрифты.

### Scale

```txt
xs: 12px / 16px
sm: 13px / 18px
base: 14px / 22px
md: 15px / 24px
lg: 18px / 28px
xl: 22px / 32px
2xl: 28px / 36px
```

### Typography roles

- App body: `text-sm leading-6`.
- Repository title: `text-xl md:text-2xl font-semibold tracking-normal`.
- Page title: `text-2xl font-semibold`.
- Section title: `text-xs uppercase tracking-[0.12em] text-secondary`.
- Metadata: `font-mono text-xs text-secondary`.
- Code: `font-mono text-[13px] leading-6`.
- Compact code: `font-mono text-[12px] leading-5`.

### Rules

- Letter spacing: 0 for normal text. Uppercase labels may use `tracking-[0.12em]`.
- Avoid huge hero text inside the app.
- Use tabular numbers for metrics: `tabular-nums`.
- README uses readable width: `max-w-3xl`.
- Code viewer uses full width with horizontal scroll.

## 3. Размеры, spacing, radius

### Spacing scale

Use Tailwind defaults with strict conventions:

```txt
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
```

### Layout widths

- App max width: `max-w-[1240px]`.
- Reading width: `max-w-3xl`.
- Code width: full container.
- Sidebar: `w-64` desktop, hidden or sheet on mobile.
- Repo grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.

### Radius

- Button: `rounded-md`.
- Input: `rounded-md`.
- Card: `rounded-lg` max 8px.
- Badge: `rounded-sm`.
- Modal: `rounded-lg`.
- Code block: `rounded-md`.

### Borders and shadows

- Use borders first.
- Avoid soft colored shadows.
- If elevation is needed: `shadow-[0_12px_40px_rgb(var(--mf-shadow)/0.08)]`.
- Brutalist hover may use `translate-x-[-1px] translate-y-[-1px] shadow-[2px_2px_0_rgb(var(--mf-focus))]`.

## 4. Visual features

### 4.1 Commit pulse

Small ASCII/line graph showing repository activity. It should be quiet, compact and monochrome.

Visual form:

```txt
▁▁▂▃▁▅▂▆▁▃▇▂
```

Implementation:

- Generate 12-30 bars from activity counts.
- Use Unicode block characters or thin vertical bars.
- In dark theme use `text-secondary`.
- On hover show exact period in tooltip.
- Must have `aria-label="Repository activity: 12 updates in the last 30 days"`.

Tailwind:

```txt
font-mono text-xs tracking-normal text-secondary tabular-nums
```

### 4.2 Repo fingerprint

Unique monochrome pattern generated from repository name and owner slug. It is not an avatar clone; it is a technical fingerprint.

Rules:

- 5x5 or 6x6 grid.
- Deterministic hash input: `owner/repo`.
- Mirror horizontally for recognizability.
- Cells use only foreground, border, transparent.
- Use as small square in RepoCard and larger header texture.

Tailwind wrapper:

```txt
size-9 shrink-0 overflow-hidden rounded-md border border-line bg-subtle
```

### 4.3 Focus mode

Code reading mode with minimal UI.

Behavior:

- Hide global nav, repo health strip and sidebar.
- Keep path, file actions, line numbers and exit button.
- Shortcut: `f`.
- Escape exits focus mode.
- Preserve scroll position.

Tailwind page:

```txt
min-h-dvh bg-background text-foreground
```

### 4.4 README as cover

README is the project cover, not a leftover markdown block.

Layout:

- Title from repo name.
- Description and key metadata above README.
- README content in a bordered reading surface.
- First viewport should show repository identity and hint of README.

Tailwind:

```txt
border-y border-line bg-surface px-4 py-8 md:px-8 md:py-10
prose prose-neutral dark:prose-invert max-w-3xl
```

### 4.5 Terminal command bar

Global command/search via `Ctrl+K` and `Cmd+K`.

Behavior:

- Search repositories, files, issues and commands.
- Supports typed commands: `repo new`, `issue open`, `theme dark`, `density compact`.
- Must trap focus while open.
- Close with Escape.

Visual:

```txt
> search repositories, files, issues...
```

### 4.6 Code density switch

Two modes:

- Compact: more rows, smaller line-height, dense tree.
- Comfortable: larger rows, more breathing room.

Store in user preference and localStorage fallback.

Class strategy:

```txt
data-density="compact"
data-density="comfortable"
```

### 4.7 Monochrome badges

Badges never use color meaning.

Variants:

- Solid: important system label.
- Outline: normal label.
- Dashed: closed or archived.
- Dotted: draft or private.
- Ghost: quiet metadata.

### 4.8 Project health strip

Thin metric strip below repo header.

Items:

- issues
- updates
- size
- stars
- compression ratio later

Visual:

```txt
border-y border-line bg-subtle text-xs
```

### 4.9 Silent UI

Notifications should not shout.

Rules:

- Toast appears bottom-right desktop, bottom mobile.
- Auto-dismiss after 3-4 seconds.
- No confetti, no colored success banners.
- Destructive actions use modal confirmation.

## 5. Components

Each component must support light/dark themes, keyboard navigation, loading state and disabled state where relevant.

### 5.1 Button

Purpose:

- Trigger commands, navigation, upload, star, submit.

Variants:

- `primary`: inverse fill for one main action per surface.
- `secondary`: bordered quiet action.
- `ghost`: navigation and icon actions.
- `danger`: monochrome destructive, text plus strong border.
- `icon`: square button with icon only and required aria-label.

Sizes:

- `sm`: `h-8 px-2.5 text-xs`
- `md`: `h-9 px-3 text-sm`
- `lg`: `h-10 px-4 text-sm`
- `icon`: `size-9`

Base classes:

```txt
inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40
```

Primary:

```txt
border-inverse bg-inverse text-inverseText hover:bg-foreground active:translate-y-px
```

Secondary:

```txt
border-line bg-surface text-foreground hover:border-lineStrong hover:bg-subtle active:bg-muted
```

Ghost:

```txt
border-transparent bg-transparent text-secondary hover:bg-subtle hover:text-foreground active:bg-muted
```

Danger:

```txt
border-lineStrong bg-surface text-foreground hover:border-foreground hover:bg-subtle active:bg-muted
```

Loading:

```txt
relative text-transparent after:absolute after:size-4 after:rounded-full after:border after:border-current after:border-t-transparent after:animate-spin
```

### 5.2 Input

Purpose:

- Text fields, search, repo name, issue title.

Base:

```txt
h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-foreground shadow-none transition-colors placeholder:text-faint hover:border-lineStrong focus:border-foreground focus:outline-none focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-faint
```

Terminal search variant:

```txt
h-12 border-0 bg-transparent px-0 font-mono text-base outline-none placeholder:text-faint focus:ring-0
```

Invalid:

```txt
border-foreground ring-2 ring-focus/20
```

Textarea:

```txt
min-h-28 resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm leading-6
```

### 5.3 Card

Purpose:

- Repeated items, repo cards, issue cards, small panels.

Base:

```txt
rounded-lg border border-line bg-surface transition-[border-color,background-color,box-shadow,transform] duration-150
```

Interactive:

```txt
hover:border-lineStrong hover:bg-subtle focus-within:border-lineStrong
```

Padding:

```txt
p-4 md:p-5
```

Do not nest cards inside cards. Use separators and sections inside a card.

### 5.4 RepoCard

Purpose:

- Repository preview in dashboard, explore and profile.

Structure:

- Repo fingerprint.
- Owner/name.
- Visibility badge.
- Description.
- Tags or language badges.
- Commit pulse.
- Metrics row: stars, issues, size, updated.

Desktop classes:

```txt
group rounded-lg border border-line bg-surface p-4 transition hover:border-lineStrong hover:bg-subtle focus-within:border-foreground
```

Title:

```txt
font-medium text-foreground underline-offset-4 group-hover:underline
```

Description:

```txt
mt-2 line-clamp-2 text-sm leading-6 text-secondary
```

Metrics:

```txt
mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-faint
```

Loading:

```txt
animate-pulse rounded-lg border border-line bg-surface p-4
```

### 5.5 FileTree

Purpose:

- Browse repository files without loading the whole tree.

Behavior:

- Load only current directory.
- Folders first, then files.
- Keyboard: arrows move, Enter opens, Backspace parent directory.
- Compact and comfortable density.

Container:

```txt
overflow-hidden rounded-lg border border-line bg-surface
```

Header:

```txt
flex h-10 items-center justify-between border-b border-line bg-subtle px-3 font-mono text-xs text-secondary
```

Row comfortable:

```txt
grid min-h-11 grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-3 text-sm last:border-b-0 hover:bg-subtle focus:bg-subtle focus:outline-none
```

Row compact:

```txt
grid min-h-8 grid-cols-[1fr_auto] items-center gap-2 border-b border-line px-2 font-mono text-xs last:border-b-0 hover:bg-subtle focus:bg-subtle focus:outline-none
```

File name:

```txt
flex min-w-0 items-center gap-2 truncate
```

Meta:

```txt
font-mono text-xs text-faint tabular-nums
```

### 5.6 CodeViewer

Purpose:

- Read source files with line numbers, raw download and focus mode.

Behavior:

- No heavy editor in MVP.
- Syntax highlighting can be server-rendered later.
- Horizontal scroll is allowed.
- Text preview only for allowed size.

Container:

```txt
overflow-hidden rounded-lg border border-line bg-surface
```

Toolbar:

```txt
flex min-h-11 items-center justify-between gap-3 border-b border-line bg-subtle px-3
```

Path:

```txt
min-w-0 truncate font-mono text-xs text-secondary
```

Code scroller:

```txt
max-h-[calc(100dvh-220px)] overflow-auto bg-surface
```

Line:

```txt
grid grid-cols-[4rem_minmax(0,1fr)] font-mono text-[13px] leading-6
```

Line number:

```txt
select-none border-r border-line bg-subtle px-3 text-right text-faint tabular-nums
```

Line content:

```txt
whitespace-pre px-4 text-foreground
```

Selected line:

```txt
bg-muted
```

Empty or unsupported:

```txt
flex min-h-52 items-center justify-center px-6 text-center text-sm text-secondary
```

### 5.7 IssueCard

Purpose:

- List item for issues.

Structure:

- Status badge.
- Title.
- Number.
- Author.
- Updated time.
- Comment count.
- Labels.

Base:

```txt
grid gap-2 border-b border-line px-4 py-4 last:border-b-0 hover:bg-subtle
```

Title row:

```txt
flex min-w-0 items-start justify-between gap-3
```

Title link:

```txt
font-medium text-foreground underline-offset-4 hover:underline
```

Meta:

```txt
font-mono text-xs text-faint
```

Open state:

```txt
border-l-2 border-l-foreground
```

Closed state:

```txt
border-l-2 border-l-lineStrong opacity-75
```

### 5.8 UserProfileHeader

Purpose:

- Public identity block for user profile.

Layout:

- Avatar or monochrome initials block.
- Name, username, bio.
- Stats row.
- Optional pinned metadata.

Wrapper:

```txt
border-b border-line bg-background px-4 py-8 md:px-8 md:py-10
```

Inner:

```txt
mx-auto grid max-w-[1240px] gap-6 md:grid-cols-[auto_1fr] md:items-end
```

Avatar:

```txt
size-20 rounded-lg border border-line bg-subtle font-mono text-xl font-semibold md:size-24
```

Name:

```txt
text-2xl font-semibold text-foreground
```

Username:

```txt
font-mono text-sm text-secondary
```

Stats:

```txt
mt-4 flex flex-wrap gap-4 font-mono text-xs text-secondary
```

### 5.9 CommandPalette

Purpose:

- Global command and search UI.

Behavior:

- Open via `Ctrl+K` and `Cmd+K`.
- Focus input on open.
- Arrow keys navigate results.
- Enter executes.
- Escape closes.
- Results grouped: Repositories, Files, Issues, Commands.
- Use `role="dialog"` for modal wrapper and combobox/listbox semantics inside.

Overlay:

```txt
fixed inset-0 z-50 bg-background/70 backdrop-blur-sm
```

Panel:

```txt
fixed left-1/2 top-16 z-50 w-[min(680px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-lg border border-lineStrong bg-surface shadow-[0_24px_80px_rgb(var(--mf-shadow)/0.22)]
```

Input row:

```txt
flex items-center gap-3 border-b border-line px-4
```

Prompt:

```txt
font-mono text-secondary
```

Result item:

```txt
flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 text-sm hover:bg-subtle aria-selected:bg-muted
```

Shortcut hint:

```txt
rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] text-faint
```

### 5.10 Badge

Purpose:

- Visibility, labels, status, language, metadata.

Base:

```txt
inline-flex h-6 shrink-0 items-center rounded-sm px-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em]
```

Outline:

```txt
border border-line bg-transparent text-secondary
```

Solid:

```txt
border border-foreground bg-foreground text-background
```

Dashed:

```txt
border border-dashed border-lineStrong bg-transparent text-secondary
```

Dotted:

```txt
border border-dotted border-lineStrong bg-transparent text-secondary
```

Ghost:

```txt
border border-transparent bg-subtle text-secondary
```

### 5.11 Modal

Purpose:

- Confirm destructive actions, create repo, edit labels.

Behavior:

- Trap focus.
- Escape closes unless destructive process is loading.
- Clicking overlay closes only for non-critical modals.
- Initial focus on first safe action.

Overlay:

```txt
fixed inset-0 z-50 bg-background/70 backdrop-blur-sm
```

Panel:

```txt
fixed left-1/2 top-1/2 z-50 w-[min(520px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-lineStrong bg-surface shadow-[0_24px_80px_rgb(var(--mf-shadow)/0.22)]
```

Header:

```txt
border-b border-line px-5 py-4
```

Body:

```txt
px-5 py-4 text-sm leading-6 text-secondary
```

Footer:

```txt
flex items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3
```

### 5.12 Toast

Purpose:

- Quiet confirmation and error feedback.

Rules:

- One to three toasts maximum.
- No bright colors.
- Error toast has stronger border and explicit text.

Container:

```txt
fixed bottom-4 right-4 z-50 grid w-[min(360px,calc(100vw-32px))] gap-2
```

Toast:

```txt
rounded-lg border border-line bg-surface px-4 py-3 text-sm text-foreground shadow-[0_12px_40px_rgb(var(--mf-shadow)/0.12)]
```

Error:

```txt
border-lineStrong
```

Description:

```txt
mt-1 text-xs leading-5 text-secondary
```

## 6. Component states

### Default

- Clear border.
- Calm background.
- Text uses semantic hierarchy.
- No decorative glow.

### Hover

- Slight background shift: `hover:bg-subtle`.
- Border strengthens: `hover:border-lineStrong`.
- Links underline only on hover.
- Optional brutalist nudge only for major interactive cards.

### Active

- Buttons: `active:translate-y-px`.
- Rows: `active:bg-muted`.
- Tabs: strong bottom border or inverse background.

### Focus

- Always visible with keyboard.
- Use `focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2`.
- For dense rows use background plus outline.
- Never remove focus outline without replacement.

### Disabled

- `disabled:opacity-40`.
- `disabled:pointer-events-none`.
- Disabled text: `text-faint`.
- Disabled controls still need readable labels.

### Loading

- Skeletons use monochrome blocks.
- Avoid spinners except buttons and uploads.
- Skeleton base:

```txt
animate-pulse rounded bg-muted
```

### Empty

- Quiet, specific, actionable.
- Example: `No files yet. Upload a folder to begin.`
- Empty states should not use illustrations in MVP.

### Error

- State exact cause and next action.
- Use text and border, not color.
- Inputs must set `aria-invalid="true"` and connect error copy with `aria-describedby`.

## 7. Tailwind implementation examples

### App shell

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-4 md:px-6">
          <a href="/" className="font-mono text-sm font-semibold">MonoForge</a>
          <button className="h-8 rounded-md border border-line px-3 font-mono text-xs text-secondary hover:border-lineStrong hover:bg-subtle">
            Ctrl K
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
```

### Repository header

```tsx
<section className="border-b border-line bg-background px-4 py-6 md:px-8">
  <div className="mx-auto max-w-[1240px]">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-mono text-xs text-secondary">acme</p>
        <h1 className="mt-1 truncate text-2xl font-semibold text-foreground">monoforge</h1>
      </div>
      <button className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-3 text-sm hover:border-lineStrong hover:bg-subtle">
        Star
      </button>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-4">
      <div className="bg-subtle px-3 py-2 font-mono text-xs text-secondary">12 issues</div>
      <div className="bg-subtle px-3 py-2 font-mono text-xs text-secondary">4 updates</div>
      <div className="bg-subtle px-3 py-2 font-mono text-xs text-secondary">18.2 MB</div>
      <div className="bg-subtle px-3 py-2 font-mono text-xs text-secondary">92 stars</div>
    </div>
  </div>
</section>
```

### Repo card

```tsx
<article className="group rounded-lg border border-line bg-surface p-4 transition hover:border-lineStrong hover:bg-subtle">
  <div className="flex items-start gap-3">
    <div className="size-9 rounded-md border border-line bg-subtle" />
    <div className="min-w-0 flex-1">
      <a className="font-medium text-foreground underline-offset-4 group-hover:underline" href="/acme/monoforge">
        acme/monoforge
      </a>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">
        Minimal monochrome project forge for code, files and issues.
      </p>
    </div>
  </div>
  <div className="mt-4 flex items-center justify-between gap-3">
    <span className="font-mono text-xs text-secondary">▁▂▁▅▃▆▂▇▁</span>
    <span className="font-mono text-xs text-faint">18.2 MB</span>
  </div>
</article>
```

### Code density root

```tsx
<div data-density="compact" className="group/code">
  <div className="grid min-h-8 grid-cols-[4rem_minmax(0,1fr)] font-mono text-[12px] leading-5 group-data-[density=comfortable]/code:min-h-10 group-data-[density=comfortable]/code:text-[13px] group-data-[density=comfortable]/code:leading-6">
    <span className="border-r border-line bg-subtle px-3 text-right text-faint">1</span>
    <code className="whitespace-pre px-4">export const name = "MonoForge"</code>
  </div>
</div>
```

## 8. Responsive design

### Breakpoint strategy

- Mobile first.
- `sm`: small improvements only.
- `md`: introduce two-column layouts.
- `lg`: show sidebars and wider tables.
- `xl`: use full app width.

### Mobile rules

- Global nav becomes compact.
- Sidebar becomes sheet or hidden navigation.
- FileTree rows remain tappable: minimum 40px comfortable, 32px compact.
- CodeViewer keeps horizontal scroll.
- CommandPalette width: `calc(100vw - 24px)`.
- Modals use nearly full width.
- Repo health strip becomes 2-column grid.
- Avoid tables that require reading many columns. Convert to stacked rows.

### Desktop rules

- Use max-width container.
- Keep content aligned to grid.
- Show FileTree and README together only when enough width exists.
- CodeViewer can use full width.
- Sidebar can be sticky: `lg:sticky lg:top-20`.

### Layout examples

Repository overview:

```txt
mobile: header, health strip, file tree, README, metadata
desktop: header, health strip, main grid with content and side metadata
```

Repository file view:

```txt
mobile: path toolbar, code viewer, actions in menu
desktop: optional file sidebar, code viewer, actions visible
```

Issue list:

```txt
mobile: filters as horizontal scroll
desktop: filters left, issue list right
```

## 9. Accessibility

### Keyboard navigation

- All interactive elements must be reachable with Tab.
- CommandPalette: `Ctrl+K`, `Cmd+K`, Escape, arrows, Enter.
- FileTree: Up/Down, Enter, Backspace, Home, End.
- Modal: trap focus, return focus to trigger on close.
- Tabs: Left/Right arrows, Home, End.
- Focus mode: `f` toggles, Escape exits.

### ARIA

- Icon-only buttons require `aria-label`.
- Loading buttons use `aria-busy="true"`.
- Invalid fields use `aria-invalid="true"`.
- Error text is connected with `aria-describedby`.
- Modal uses `role="dialog"` and `aria-modal="true"`.
- CommandPalette uses dialog plus combobox/listbox pattern.
- FileTree can use `role="tree"` and `role="treeitem"` if implementing full tree keyboard behavior. Otherwise use normal links/buttons with clear labels.

### Contrast

- Text must meet WCAG AA.
- Do not put faint text on muted backgrounds for important information.
- Borders alone cannot be the only indicator for critical state. Add text label.
- Focus indicator must be visible in both themes.

### Motion

- Respect `prefers-reduced-motion`.
- Keep animations under 150ms for hover/focus.
- Menu open can use opacity and slight translate.
- Skeleton loading can pulse, but disable or reduce under reduced motion.

Tailwind:

```txt
motion-reduce:transition-none motion-reduce:animate-none
```

### Screen reader text

Use visually hidden labels for icon buttons and dense metrics.

```txt
sr-only
```

Example labels:

- `aria-label="Star repository"`
- `aria-label="Open command palette"`
- `aria-label="Enter focus mode"`
- `aria-label="Repository activity over the last 30 days"`
- `aria-label="Switch to compact code density"`

## 10. App Router integration

### Server-first components

Default to Server Components for:

- Repository pages.
- File tree fetch.
- README rendering.
- Issue list.
- Profile pages.

Use Client Components only for:

- CommandPalette.
- Upload interactions.
- Theme switch.
- Density switch.
- Modal open/close.
- Focus mode.
- Toasts.

### Route-level UI

Each major route should include:

- `loading.tsx` with skeletons.
- `error.tsx` with quiet error panel.
- `not-found.tsx` with plain recovery action.

### Streaming and suspense

- Stream README after repository header.
- Stream issue comments below issue metadata.
- Load file preview separately from file metadata.

## 11. Interaction copy

MonoForge copy is short, exact and calm.

Use:

- `New repo`
- `Upload`
- `Raw`
- `Focus`
- `Compact`
- `Comfortable`
- `No files yet`
- `File is over 25 MB`
- `README not found`

Avoid:

- Marketing slogans inside the app.
- Exclamation marks for routine success.
- Vague errors like `Something went wrong`.

## 12. Implementation checklist

Before shipping a component:

1. Works in light and dark themes.
2. Uses semantic tokens, not direct non-monochrome colors.
3. Has default, hover, active, focus, disabled and loading states where relevant.
4. Has keyboard behavior.
5. Has aria labels for icon-only controls.
6. Does not rely on color alone.
7. Fits mobile width without text overlap.
8. Uses Server Component by default unless interactivity requires client state.
9. Keeps animation minimal and respects reduced motion.
10. Does not nest cards inside cards.

## 13. References

- Tailwind CSS documentation: https://tailwindcss.com/docs
- Next.js App Router documentation: https://nextjs.org/docs/app
