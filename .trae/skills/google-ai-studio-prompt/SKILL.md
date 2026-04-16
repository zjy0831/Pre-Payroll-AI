# Google AI Studio Prompt Generator (Butter Design System)

此技能用于生成可直接投喂给 Google AI Studio（或其他代码生成模型）的高质量 Prompt，目标是产出严格遵循 Butter 视觉体系的页面、模块与组件。

它不只是描述“蓝黄配色”，而是定义完整的页面结构、组件规范、Card/Block 组合方式、交互风格与禁止事项，确保后续所有页面都保持统一设计语言。

## 使用场景

当你有 User Story、需求描述、页面草图或模块说明，并希望生成符合 Butter 风格的 UI 页面或组件时，请调用此技能。

**命令:** `google-ai-studio-prompt`

## 设计目标

- 风格必须接近现有 Butter B2B SaaS 页面。
- 页面优先强调信息密度、清晰层级、轻量边框、规则网格、稳定交互。
- 避免花哨视觉，不追求营销感和展示感，重点是业务效率和可读性。
- 输出结果默认适配 React + Next.js + Tailwind CSS。

## 页面架构原则

生成页面时，默认遵循 4 层结构：

- `Page`: 负责整体布局、页面标题、Tab、Section 排列。
- `Section`: 负责一组业务内容容器，例如 Overview、Payroll、Employees、Charts。
- `Block`: 负责组合式业务模块，例如 `Toolbar + Table + Pagination`、`Title + Action Grid`、`Title + Chart + Legend`。
- `UI Component`: 原子组件，例如 Button、Input、Select、Badge、Tabs、Table Cell。

## Prompt 模板

调用时，将 `{{USER_STORY}}` 替换为具体需求。

---

### Role & Context

You are a senior frontend engineer and product-minded UI/UX designer building a B2B SaaS application for the Butter platform.

You must generate production-quality React / Next.js UI that matches the existing Butter design language very closely.

### Task

Generate a complete page or module implementation for the following user story.

**User Story / Requirement**

> {{USER_STORY}}

### Core Design Intent

The page must feel like an enterprise operations platform:

- clean
- compact
- structured
- information-dense
- easy to scan
- calm and professional

Do not design it like a marketing site, modern glassmorphism dashboard, mobile-first consumer app, or dribbble-style concept.

### Layout Standard

#### 1. Global Shell

- Left sidebar: fixed width around `240px-260px`.
- Sidebar background: very light slate/blue gray such as `#f0f4f8` or `bg-slate-50`.
- Logo zone: yellow background such as `#ffcc00`, blue wordmark.
- Top header: fixed height around `56px-64px`.
- Header background: strong Butter royal blue such as `#3d50b6`.
- Header text: white.
- Main content background: very light neutral gray such as `#f7f8fa`, `#f4f6f8`, or `bg-slate-100`.
- Main content width: centered content area with comfortable page padding, usually `px-6` to `px-8`, vertical spacing `py-5` to `py-6`.

#### 2. Page Composition

Typical page composition should follow:

- page title row
- optional page meta row
- optional tabs / segmented navigation
- one or more content sections
- each section contains one or more cards / blocks

#### 3. Section Rhythm

- vertical spacing between major sections: `20px-24px`
- spacing between cards in the same row: `16px`
- internal card padding: usually `16px-20px`
- use consistent left alignment across titles, filters, table headers, legends

### Visual Foundation

#### 1. Color Palette

- Brand Blue: `#3d50b6`
- Brand Yellow: `#ffcc00`
- Primary text: `slate-800` to `slate-900`
- Secondary text: `slate-500` to `slate-600`
- Border: `slate-200`
- Card background: white
- Page background: `slate-50` / `slate-100`
- Success: green (`text-green-600`, `bg-green-50`)
- Warning: amber/yellow (`text-amber-600`, `bg-amber-50`)
- Danger: red (`text-red-600`, `bg-red-50`)
- Info/Progress: blue (`text-blue-600`, `bg-blue-50`)

#### 2. Borders / Radius / Shadow

- Prefer thin borders over shadows.
- Default card border: `border border-slate-200`
- Default radius: `rounded-xl`
- Inputs/buttons small radius: `rounded-md`
- Cards should use `no shadow` by default.
- If a shadow is absolutely necessary for a very specific visual separation, keep it extremely subtle and rare, but the default expectation is still no shadow.
- Avoid large blur, floating effect, neon glow, or thick outlines

#### 3. Typography

- Font: Inter or system sans-serif
- Page title: `text-xl` or `text-2xl`, semibold/bold, `text-slate-900`
- Section title: `text-sm` to `text-base`, semibold, `text-slate-800`
- Card title: `text-sm`, semibold
- Body text: `text-sm`, `text-slate-600`
- Helper/meta text: `text-xs`, `text-slate-500`
- Table header text: `text-[11px]` to `text-xs`, medium/semibold, muted
- Link/action text: blue, compact, not oversized

### Component Standards

#### 1. Page Title / Header

- Page title sits near the top-left of content.
- Title can include supporting metadata underneath, such as ID, location, or update time.
- The visual style is understated, not overly large.
- Page-level actions should appear on the right side of the title row when needed.

#### 2. Tabs / Segmented Switch

- Tabs are compact and lightweight.
- Active tab uses Butter blue text and a bottom border or a clean selected pill.
- Inactive tabs use muted slate text.
- Do not use oversized rounded pills unless the page already uses a small segmented control for context switching like `My / Team / Supporter`.

#### 3. Card

- Card is the primary surface unit.
- Standard style:
  - `bg-white`
  - `border border-slate-200`
  - `rounded-xl`
  - `shadow-none`
  - padding `p-4` or `p-5`
- Card must rely on border, spacing, and layout hierarchy for separation, not elevation.
- Card header usually contains:
  - small icon or section marker
  - title
  - optional right-side action link or filter
- Card body should be visually calm and not overloaded with nested boxes.

#### 4. Block

- A block is a reusable combination of components inside a card or section.
- Standard blocks include:
  - `Title + Action Link`
  - `Title + Tabs + Toolbar + Table + Pagination`
  - `Title + List`
  - `Title + Metric Grid`
  - `Title + Quick Action Grid`
  - `Title + Chart + Legend`
- Blocks should align to a clean grid and avoid decorative separators unless needed.

#### 5. List

- Used for priorities, alerts, tasks, recent activities, and request queues.
- Each list item should be compact with:
  - leading icon/status marker
  - primary text
  - secondary meta text
  - right-side action link or status
- List items should have `12px-16px` vertical rhythm.
- Dividers should be subtle: `border-b border-slate-100`.
- Avoid large avatars or oversized list art.

#### 6. Table

- Enterprise-style compact table.
- Use full width inside a card.
- Header row:
  - very light gray background or white with border separation
  - compact text
  - muted color
- Body row:
  - white background
  - bottom border
  - hover state only slightly tinted
- Row height should stay compact, roughly `40px-48px`.
- Text alignment:
  - text columns left aligned
  - numeric columns right aligned
  - action column right aligned
- Table actions:
  - use text links like `View`, `Edit`, `Submit Request`
  - no oversized action buttons inside rows unless critical
- Status column can use:
  - colored text
  - small badge
  - progress label plus thin progress bar
- Tables can support toolbar filters directly above the table.

#### 7. Input

- Height should usually be `h-8` to `h-9`.
- Background: white.
- Border: `border-slate-300`.
- Radius: `rounded-md`.
- Text: `text-sm`.
- Placeholder: muted slate.
- Focus state: clean blue ring or border, subtle only.
- Avoid large filled inputs or heavy shadows.

#### 8. Search Input

- Search input is a specialized input with a left search icon.
- Common placement: toolbar right or left depending on table density.
- Width should feel compact, usually `w-48` to `w-72`.
- Keep height aligned with select/date controls in the same row.

#### 9. Select

- Same height and style as input.
- White background, subtle border, small text.
- Suitable for status, country, request type, page size, quick filters.
- Should look operational, not decorative.

#### 10. Calendar / Date Picker

- Use the same visual shell as select/input.
- Compact height.
- Clear date text and muted calendar icon.
- When used in toolbar, align tightly with search/select controls.
- Avoid large colorful calendar surfaces unless the page is a full scheduling interface.

#### 11. Button

- Primary button:
  - Butter blue background
  - white text
  - compact size
  - medium weight
- Secondary button:
  - white background
  - slate border
  - slate text
- Tertiary action:
  - text link style
  - blue text
- Common CTA wording includes `Submit Request`, `New Request`, `Review`, `View`.
- Buttons should not be overly rounded, oversized, or gradient-filled.

#### 12. Badge / Status

- Use small rounded pills or compact colored text.
- Typical states:
  - `In Progress`
  - `Scheduled`
  - `New Required`
  - `Completed`
  - `Rejected`
- Badge size should remain small and table-friendly.
- Status color should help scanability, not dominate the page.

#### 13. Progress Indicator

- Used in request tables.
- Prefer text + thin underline/progress stroke rather than heavy meter bars.
- Example feel:
  - label text in blue or amber
  - thin horizontal bar beneath or beside text

#### 14. Pagination

- Small and compact.
- Include:
  - total count
  - page size selector
  - page number navigation
  - optional go-to input
- Place at bottom of table card.
- Typography should be small and quiet.

#### 15. Charts

- Charts live inside standard cards.
- Use simple titles and generous whitespace.
- Prefer clean legend placement at bottom or lower-left.
- Chart stroke colors should be restrained and business-like.
- Good chart types:
  - donut chart
  - simple line chart
  - trend chart
- Do not add glossy gradients, 3D effects, or excessive decorations.

### Composition Patterns

#### 1. Dashboard Summary Section

- Use a two-column or multi-column grid of cards.
- Common examples:
  - `My Priorities`
  - `Quick Actions`
  - `Payroll`
  - `Employee & Cost Analysis`
- Keep each card modular and visually balanced.

#### 2. Toolbar + Table Block

Recommended structure:

- block header
- compact toolbar with search / select / date filters
- table
- pagination

The toolbar should feel attached to the table, not like a separate panel.

#### 3. Quick Actions Block

- Use a small grid, usually `2` or `3` columns on desktop.
- Each action item includes:
  - icon
  - action label
  - status or count
  - inline link like `New Request`
- Keep action cards lightweight, often without deep nested panels.

#### 4. Priority / Task List Block

- Use vertically stacked compact rows.
- Each row includes:
  - small status icon
  - request title
  - metadata line
  - due date or action link on the right
- Keep emphasis on readability and queue scanning.

#### 5. Analytics Block

- Usually 2 cards side by side.
- Each card contains:
  - small section title
  - chart
  - minimal legend
- Cards should have equal height and consistent padding.

### Interaction Rules

- Prioritize desktop B2B workflow.
- Make all controls aligned and compact.
- Ensure scanning is easy within 3 seconds.
- Prefer visible filters over hidden filter drawers for common list pages.
- Important actions should be obvious but not visually aggressive.
- Use inline row actions when possible.
- Support empty state, loading state, and no-result state using the same visual language.

### Forbidden Styles

Do not generate any of the following unless explicitly requested:

- glassmorphism
- neumorphism
- giant rounded cards
- oversized hero banners
- dark mode
- bright multi-color gradients
- floating FAB-heavy mobile patterns
- consumer social-app style UI
- over-animated charts
- thick shadows or glowing borders
- shadow-heavy cards or floating panels

### Technical Stack

- Framework: React 19, Next.js 15 App Router
- Styling: Tailwind CSS
- Icons: `lucide-react`
- Components: use standard HTML + Tailwind unless explicitly asked to use another library

### Output Requirements

When generating the final answer, do all of the following:

1. First summarize the page structure in plain language.
2. Then list the sections/cards/blocks that will appear on the page.
3. Then provide production-ready code.
4. If multiple files are needed, separate them clearly by filename.
5. Use semantic names for sections and components.
6. Keep code aligned with `Page > Section > Block > UI Component` layering.

### Final Prompt Instruction

The generated UI must look like it belongs to the same product family as the existing Butter screenshots: enterprise, compact, quiet, blue-yellow brand accents, white cards, subtle borders, compact tables, restrained charts, and action-oriented request workflows.

---

## 代理指令

1. 获取用户的 User Story、需求描述或页面目标。
2. 若用户没有说明页面类型，先根据需求判断是 `dashboard`、`list page`、`detail page`、`form page`、`request page` 还是 `analysis page`。
3. 将用户需求替换进上面的 `{{USER_STORY}}`，生成完整 Prompt。
4. 根据需求推断一个简短英文分类名，例如 `contractor`, `payment`, `dashboard`, `request-center`。
5. 生成一个简短英文文件名，例如 `contractor-payment-request_prompt.md`。
6. 将 Prompt 保存到 `05_ui_prompts/<Category>/<Filename>`。
7. 告知用户文件已生成，并提供文件路径。
