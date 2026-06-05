# Vibecoding Project Tracker — Design

**Status:** Hackathon starter design doc · fill in the **`<TODO>`** sections before you tag `design-done`.

**Why this file exists.** This tracker is your tool. It should look like *your* tool — not a generic Kanban with default Tailwind blue. Twenty minutes of design decisions here will be visible on every screen for the next six weeks of Module 5.

**Who owns this.** Person B, during the same window the rest of the team is reviewing the PRD. By the time the team converges to start M4 (`data-model`), this file should be filled in and the colors should already be in `tailwind.config.js`.

---

## 1. Mood / vibe

One sentence that captures the feeling the tracker should leave you with.

`The tracker should give you a relieving feeling and should feel light.`

Two or three references that capture the vibe (links to dribbble shots, screenshots of apps you admire, Pinterest boards — anything visual):

- `https://dribbble.com/shots/27433821-Cabin-Booking-Web-Platform-with-Immersive-Animation`
- `https://dribbble.com/shots/27414455-Pricing-settings-Untitled-UI`
- `https://dribbble.com/shots/27436217-Mark-OS-hero-section`

Anti-references — what we are explicitly **not** trying to look like:

- `https://dribbble.com/shots/27439960-Growin-Finance-Management-Dashboard-Reports`

## 2. Color palette

These are the colors the build milestones will reference. Once chosen, paste the hex values into `tailwind.config.js` so the rest of the team can use Tailwind utility classes (e.g. `bg-brand-primary`, `border-due-warning`).

### Brand

| Token | Hex | Where it shows up |
|---|---|---|
| `brand-primary` | `#D1D0BB` | Header, "+" button, focus rings |
| `brand-accent` | `#F1F291` | Highlights, hover states, links |
| `surface-page` | `#FBFAEE` | Page background |
| `surface-card` | `#B5B392` | Card background |
| `text-primary` | `#0C0C08` | Body text |
| `text-muted` | `#313121` | Captions, dates, counts |

### Task type (M6 `tag-style`)

| Token | Hex | When used |
|---|---|---|
| `type-feature` | `#016509` | Cards tagged `feature` (accent stripe + icon) |
| `type-bug` | `#820D0D` | Cards tagged `bug` (accent stripe + icon) |

### Due-date states (M8 `due-tint`)

| Token | Hex | When used |
|---|---|---|
| `due-safe` | `#9AD29F` | More than 2 days out |
| `due-warning` | `#EED380` | Less than 24 hours |
| `due-overdue` | `#EB9373` | Past due |
| `due-neutral` | `#9BB8DA` | Done (overrides date) |

## 3. Typography

| Role | Font | Why |
|---|---|---|
| Heading | `Syne` | `More interesting than a normal font, fits the feeling of the page` |
| Body | `Inter` | `Fokus on readability` |
| Monospace (tags, badges, code) | `Inter` | `Fokus on readability` |

Suggested sizes (override only if the design demands it):

- Page title: 24 px / regular
- Section header: 16 px / regular
- Card title: 14 px / light
- Body: 14 px / light
- Caption: 12 px / light

## 4. Component principles

One short sentence per element. These set the tone for the build phase — Person A's modal and Person B's anchor board should both feel like they came from this doc.

- **Cards:** `solid fill, no boarder, slightly rounded corners, hovereffect: shadow` 
- **Buttons:** `Solid fill, one color, slightly rounded corners, hovereffect: shadow, no boarders`
- **Modal:** `centered, one color, solid fill, slightly rounded corners, backdrop slightly darkened and blured out, no boarders`
- **Empty states:** `no boarders, solid fill, one color` (e.g. "Dashed border, muted text, never sad.")
- **Drag affordance (if used):** `is used` (e.g. "None — we use a status dropdown.")

## 5. Voice / microcopy

Three lines of microcopy that capture the tone of the product. Keep it short — these are the words a stressed user reads at 11pm.

| Where | Text |
|---|---|
| "+" button label | `+ add Task` |
| Empty column placeholder | `-` |
| Toast after "Copy as Prompt Context" | `copied ✓` |
| Confirm-delete message | `Are you sure? Deleting can´t be undone.` |
| Handoff toast (M7 `task-owner`) | `Handed off to {name}.` |

## 6. Logo / wordmark

The tracker probably doesn't need a logo, but it does need a name and a wordmark style.

- **Product name:** `<TODO>` (match PRD §11 team identity)
- **Wordmark style:** `<TODO>` (e.g. "Just the name in the heading font, brand-primary color, no icon.")

## 7. Out of scope (this hackathon)

To keep design tight, the following are explicitly not part of `design-done`:

- A dark mode toggle. Pick one mode and ship it.
- Multiple themes. One brand, applied consistently.
- Animations beyond a 200 ms fade on toast notifications.
- A custom icon set. Use [Lucide icons](https://lucide.dev) via Tailwind classes if you need any.

---

*DESIGN.md version: hackathon-starter v1*
