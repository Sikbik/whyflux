# Why Flux: design and storyboard

The art direction, the system and the storyboard for the whole page. Read the **Restyle v2** section
just below first (it overrides whatever follows it), then the rest of this file. The code in
`src/sections/<Name>/` is the source of truth for each chapter; `research/` holds the sourced facts.

**Copy and accuracy rules (they bind every line on the page):**
- Never state anything false or overclaimed. Every number and claim in `src/data` carries a source and a
  date; scopes go inside the claim ("on ArcaneOS nodes", "with 2+ copies"). `research/flux.md` section 11
  and `research/privacy.md` section 13 list the claims to avoid.
- This is a promotional page: lead with Flux's wins and never volunteer downsides. Named DePIN networks
  appear only in the Arena and Cost; the fragile-cloud chapter may name web2 clouds for their outages.
- No gradients or glows, no periods in headlines, taglines, CTAs or captions, no tags or chips, no FIG
  labels, no decorative numbering, few cards, and no over-explaining.

## Restyle v2 (supersedes conflicting rules below)

The first build read as a generic template, and it over-explained. Restyle v2 is the
correction. **Where this section and anything below disagree, this section wins.**

**The chapter specs in section 9 are historical.** The shipped chapters diverged on purpose, and the
code in `src/sections/<Name>/` is the source of truth. The biggest changes:
- 04 became **Open** (`#open`, folder still `DepinGap`): "Open to anyone, never on one machine", a
  two-axis map of generic deployment kinds with no named networks and no pull-the-plug lanes.
- 05 **Take it down** is two lanes, traditional hosting vs Flux; the marketplace-lease lane is gone.
- 06 **Operators** has no concentration beat. "Every node gets its turn" shows the round-robin queue
  and the full turn including parallel assets (10 chains, matched in full), all from `payoutCycle`.
- 07 **Sealed** is the operator's seat plus two figures and a receipts toggle; no enclave beat, no
  "who you still trust" band.
- 08 **Arena** opens on the matrix; head to head and shape are one click away; no "where Flux loses".
- Named DePIN networks appear only in Arena and Cost (web2 clouds also in Fragile, for outages).

### The direction

A high-end product launch page, not a dashboard. Large confident type. Generous negative space. One
strong visual or interaction per beat. Content set directly on the page. Asymmetric, editorial
composition. Motion that explains. A visitor should get each section in three seconds without reading a
paragraph; details and sources stay one tap away (the `Sources` popover, a hover, one "see the receipts"
toggle), never printed by default. When in doubt, remove.

### The hard rules

1. **No periods in headlines, taglines, catchphrases, interlude lines, eyebrows, CTAs or captions**, not
   even between two sentences. "Pull the plug" / "It keeps running" is two lines, not one line with a
   period. Use a line break, a comma or a rewrite. Body copy (ledes, paragraphs) keeps normal punctuation.
2. **No visible gradients, glows or blobs anywhere.** No gradient text, fills, borders or buttons; no
   `box-shadow` or `filter` glow; no radial hot spots; no blurred light blobs; no bloom plates (the old
   `fx-bokeh` is retired from the hero and footer). Use solid colour and solid light: a crisp line, a
   hard-edged dot, a flat tint. Solid hairlines drawn with `linear-gradient(var(--c), var(--c))` are fine
   (they render as solid lines), and so are hard-stop tick patterns. The one exception is an
   invisible-in-effect fade where an art plate or the globe meets black, and even that gives way to a
   solid translucent backing where one works (the hero's number strip is the example).
3. **No tags, chips, badges or pills.** No uppercase mono in a bordered or filled capsule: status and
   tier show through the colour or weight of the words, a small dot, an icon or position. Honesty notes
   ("illustrative", "snapshot") are a quiet phrase in a sentence or live in `Sources`.
4. **No numbering as decoration.** No giant outline numerals, no "07 /" in eyebrows or the nav, no
   "1 of 12" counters, no "01 02 03" step badges, no "Act I" markers.
5. **No FIG labels and no caption bars.** If a visual truly needs a sentence, write one plain sentence as
   body copy.
6. **Far fewer cards.** A grid of bordered boxes is not a layout. Compose with type, whitespace and a
   single hairline between rows. `Panel` is for an interactive instrument that genuinely needs a surface
   (a simulation, a picker, a console), and never a card inside a card.
7. **Fewer micro-labels and fewer instruments.** Tracked uppercase mono labels are kept to the few that
   earn their place. Tick rulers, corner crosshairs and hex lattices are rare, opt-in accents.
8. **Art plates belong to the section.** If a plate competes with the section's own animation, remove it,
   move it or rework the composition. A section may run with no plate at all.
9. **Don't over-explain.** One headline, at most a short lede, and a visual or interaction that makes the
   point alone. If a sentence restates what the visual already shows, delete it.
10. **Hover is calm.** A hairline that firms up, a pointer cursor, press compression. No spotlight, no glow.

### Type and layout in practice

- **Headlines are weight contrast.** Base weight 300, the payoff words in 700 (`*bold*`) or 700 in the
  accent colour (`**emphasis**`). One or two marked words, usually the last. Use `--fs-title` (up to
  88 px) for a section title, `--fs-display` for a big statement, `--fs-mega` for the hero only.
- **Voices.** Sentence case everywhere. Montserrat for headings, buttons and labels; Open Sans for
  reading; IBM Plex Mono only for real data (code, numbers in a readout), not for labels.
- **The section slate** is the title, an optional quiet eyebrow and a short lede. On a wide container the
  lede sits to the right of the title and hangs off its last baseline; below that it wraps under it. Omit
  the eyebrow whenever the title already says it.
- **Rows, not cards.** Divide rows with whitespace or one `var(--line-1)` hairline. Give numbers room:
  big light figures with a quiet name beneath them (the hero strip is the pattern).
- **Status** is the colour or weight of the words, plus at most a small dot: `Chip` renders exactly that.
- **Section order of reading:** headline, one visual, then (only if needed) one line of body copy. Put
  sources in `Sources`, caveats in the sources popover or a single receipts toggle.

### What changed in the kit

Every export and prop still compiles; a removed look is a no-op prop marked `@deprecated`, never a
deleted prop.

| Component | Now | No-op props |
| --- | --- | --- |
| `SectionHeader` | Light title with bold payoff, optional quiet `eyebrow`, `lede` beside the title on wide containers. No ghost numeral, no ruler, no bullet | `num`, `ghost` |
| `Eyebrow` | One quiet sentence-case line in the accent colour; `live` adds a breathing dot | `num` |
| `Interlude` | A light dim setup line and a bold white payoff, sized to the longest line so nothing clips; no outline type; `kicker` is quiet text (prefer none) | `outline` (alias of the new `quiet`) |
| `Nav` (shell) | Ticks plus the current chapter's name (no number); a solid progress hairline; a flat frosted bar once scrolled; the menu sheet groups chapters by act and keeps its close button reachable | none |
| `Figure` | Bare: no frame, crosshairs, FIG label or caption bar. `aside` (a legend, `Sources`) survives as a quiet row; `caption` only if it is a real sentence (a string of 56+ characters, or a node). New opt-in `frame` draws one hairline | `fig` |
| `Chip` | Plain inline text in the tone colour, with an optional small dot or icon. `solid` is a heavier weight. New `muted` keeps the words quiet and lets the dot carry the tone | none |
| `FreshnessChip` | A breathing green dot and muted words for live, amber words for snapshot, a grey dot for syncing | none |
| `Panel` | One solid hairline, a flat tint, a smaller chamfer (8, 12, 18 px). No glow, hot corner, lattice or grain. Crosshairs (`marks`) and `ruler` are opt-in (default off) | `hot`, `pattern`, `halo`, `spot` |
| `Sources` | A muted text link, "Sources" and a small icon, underlined on hover. No tag, no count (the count is in the accessible name) | none |
| `Stat` | The number first, then the name and provenance as plain text | none |
| `Toast` | A flat dark slab with a hairline and a small radius; a tone is a small dot before the words | none |
| `Button` | Solid faces, crisp edges. No glow behind, no hover glint | none |
| `Meter`, `HexGauge` | No bloom; sentence-case labels | none |
| `Ruler`, `Marquee` | Crisp ticks and a hard-edged strip | `fade` |

Tokens: new `--fs-title`, `--chamfer-panel`, `--panel-edge`. `--glow-1`, `--glow-2`, `--glow-hot`,
`--hot-glow` and `--accent-glow` still exist but are inert (they paint nothing), so nothing that reads
them breaks. `.t-label` (uppercase mono) is still there for the rare label that earns it.

### Checking your work

- The kit gallery shows every kit component in its v2 state, with the real hero, nav, footer and an
  interlude, and it needs no section to compile:
  `http://127.0.0.1:5190/src/ui/gallery/index.html` (dev only, not part of the app bundle). Scroll
  targets: `#top`, `#g-interlude`, `#g-header`, `#g-center`, `#g-figure`, `#g-panels`, `#g-kit`.
- Before you report a section: no period in a headline or caption, no gradient or glow you drew
  yourself (`grep -nE "gradient|drop-shadow|box-shadow: 0 0|text-shadow|blur\("` over your folder),
  no capsule, no numeral, no card grid, no paragraph that the visual already says.

---

Contents

Restyle v2 (supersedes conflicting rules below)
0. How to use this document
1. Concept: Blackout to Light
2. House rules (non-negotiable)
3. Visual system
4. Motion language
5. Interaction, accessibility, performance
6. The UI kit
7. Foundations: files, CSS, hooks, helpers
8. Data and honesty
9. The storyboard (chapters 00 to 12)
10. Art map
11. URL state and sharing
12. QA checklist and tooling
13. Open data requests and decisions

---

## 0. How to use this document

**You are building one chapter.** Its folder already exists as a stub: `src/sections/<Name>/index.tsx`
renders `<Section>` + `<SectionHeader>` + a `<BuildSlot>`. Keep the folder, the export name, the
`id` and the header (`num`, `eyebrow`, `title`) unless your chapter spec says otherwise. Delete the
`<BuildSlot>` and build.

**You own your folder and nothing else.** Put section-local components, hooks, CSS Modules and
helpers in `src/sections/<Name>/`. Do not edit `src/ui`, `src/styles`, `src/lib`, `src/data`,
`src/shell`, `src/App.tsx` or `chapters.ts`. If you truly need a kit or token change, make the smallest
additive edit (a new variant, a new optional prop, never a rename or a restyle of something that
exists), keep it backwards compatible and say so in your report. Do not reformat files you do not own.

**Order of work.** (1) Read your chapter spec twice. (2) Check the data you need exists in `src/data`
and `src/lib/live` (section 8): if it is empty, render the empty state and carry on. (3) Build the
static layout at 1440 and 390. (4) Add the signature interaction. (5) Add motion. (6) Run the QA
checklist (section 12) and fix what it finds. (7) Report: what you built, what is still missing,
what a neighbor must know.

**Never:** invent a number, a quote or a source. Add a dependency without a good reason. Draw a
gradient, glow or blob. Put a period in a headline, caption or label. Use an em dash or an emoji.

---

## 1. Concept: Blackout to Light

The page is one story told in four acts. The light on the page is the plot: it goes out, then it
comes back, and by the end it is a network.

| Act | Chapters | What the visitor feels | Light | Mood |
| --- | --- | --- | --- | --- |
| I The problem | 01 | The cloud is someone else's computer, and three companies own most of it | Cold steel, alarm red, dark | `data-mood="cold"` |
| II The idea | 02, 03, 04 | First light: a cloud with no center, built from ordinary nodes | Flux blue enters; hexagons, lattice, hairlines | default |
| III The proof | 05, 06, 07, 08, 09 | Break it yourself, meet the people who run it, check it against the rest | High contrast: blue against alarm, data everywhere | default |
| IV The network | 10, 11, 12 | It is already running, and you can join | Dawn: white-hot highlights, live numbers | default, `bg-dawn` |

**A sibling of Flux Academy and Flux Atlas.** Same language: dark glass, chamfered panels (the
top-right and bottom-left cut is the family silhouette), hairlines, tick rulers, corner crosshairs,
hex gauges, light as the material, Flux Blue Wave `#2B61D1` with `#4F7AD4` and `#86A1DA`, tier colors
Cumulus cyan, Nimbus violet, Stratus amber. Louder than they are: huge light-and-bold type, cinematic
entrances, a live 3D globe, simulations you can break.

**One idea per chapter, one memorable thing per chapter.** Each chapter has a single signature
interactive moment (section 9). Everything else in the chapter exists to set it up or to prove it.

**Rhythm.** Dense chapter, breath, dense chapter. The four `<Interlude>`s in `App.tsx` are the breaths
between acts. Inside an act, alternate the shape of consecutive chapters: a pinned story, then a
wall of cards, then a playground, then a data board.

**Voice.** Confident, plain, a little dry, never breathless. Short sentences. Second person. Verbs
over adjectives. Say what it does and show it. Numbers carry sources. The page is persuasive and
honest at once: when a competitor is genuinely better at something, say so (that is what makes the
rest believable). Spelling is US English in new copy (`center`, `decentralized`); strings that come
from `src/data` keep the researchers' spelling and are not rewritten in the UI (see section 13).

---

## 2. House rules (non-negotiable)

These apply to every pixel, every chapter, forever. They come from the user.

### 2.1 No gradient text, no decorative gradients (tightened by Restyle v2: also no glows, blobs or bloom)

- **Emphasis is weight, plus solid color.** The signature is mixed weights in one headline: light (300)
  for the line, bold (700) for the key words. In `SplitText` markup, `*word*` is weight 700 in the text
  color and `**word**` is weight 700 in the solid accent color (`--accent-strong`). In plain JSX use
  `<b>` (weight 700) or `<b className="t-emph">` (adds the solid accent color).
- **Never** `background-clip: text`, never a `linear-gradient`/`radial-gradient`/`conic-gradient` as the
  fill, border, ring or face of a button, chip, panel, card, meter, bar, chart series or divider.
- **Allowed:** solid color; hairlines; tick patterns; weight contrast; a mask that fades an art plate into
  black for legibility. **Not allowed any more (Restyle v2):** `box-shadow` and `filter` glow, blurred
  light blobs, bloom, radial hot spots, scroller-edge fades. The test: if you took the color away, would
  it still be a gradient or a glow you chose as a decoration? If so, remove it.
- **No cursor-following spotlight or hover glow on panels or cards.** Hover is calm: a hairline that
  lifts, a pointer cursor, press compression.
- Charts use solid fills and strokes. Bars are solid. Areas are a flat color at 12 to 24 percent.

### 2.2 No periods in a headline, tagline or label (tightened by Restyle v2: not even between sentences)

- No trailing period on: chapter titles, hero lines, `Interlude` lines and captions, CTAs and button
  labels, chip and badge text, stat labels and stat captions, figure captions, tab labels, tooltips that are
  one short line.
- A period **between** two sentences inside a headline is **not** fine any more (Restyle v2): split it into
  two lines ("Pick a fight" / "See the receipts"), use a comma, or rewrite.
- Running prose keeps normal punctuation: ledes, card bodies, paragraphs, tooltips that are full
  sentences, data strings.
- Question marks and exclamation marks are fine; do not use exclamation marks.

### 2.3 Voice mechanics

- No em dashes anywhere. Use a colon, a comma, parentheses or a new sentence. (Number ranges use
  "to": "5 to 10".)
- No emoji. Icons are `lucide-react`, 16 to 20 px, stroke 1.75, always `aria-hidden` when decorative.
- Sentence case for headings, buttons and labels. The uppercase mono look of labels is CSS
  (`text-transform`), write the source text in sentence case.
- Plain words: "node", not "server" (nodes share IPs); "operator", not "provider", for the people who run
  nodes; "app" or "deployment", not "workload", in prose.

### 2.4 Honesty rules

Persuasion is welcome; invented or inflated facts are not. The full list of claims to avoid is in
`research/flux.md` section 11 and `research/competitors.md` section 9. The ones that bite:

| Do not say | Say instead |
| --- | --- |
| Zero downtime, instant, no single point of failure | "Traffic fails over in seconds; the lost copy is rebuilt automatically" and "no single machine, provider or country your app depends on (with 2 or more copies)" |
| Every app runs on 3+ nodes | "Runs on as many independent nodes as you choose, up to 100" and "86% of running apps have two or more live copies" (live value) |
| Across continents by default | "Spread copies across countries and continents with one rule" |
| Thousands of operators; servers; machines | "Over a thousand operator identities"; "nodes" |
| Uncensorable | "No single provider can switch you off" (nodes honor a signed blocklist; the default load balancer is run by the Flux team) |
| Unhackable, zero-knowledge, trustless, military-grade, confidential computing, "nobody can see it" | "Sealed from the public and from node operators. Flux's own infrastructure and support can still access it" and exactly what the `operatorAccess` row says (chapter 07) |
| 90% cheaper | Only ratios computed from `src/data/compare.ts` |
| Mine FLUX, 2-minute blocks, supply caps, the FLUX price | Proof of Node, 30 s blocks; leave supply and price out entirely |
| Docker health checks, deploy in 30 seconds | "Health-checked every 3 seconds"; "minutes" |

**No hardcoded factual numbers in copy.** Every number on the page comes from `src/data/*` or
`src/lib/live`, formatted with `@/lib/format` or `@/lib/live` helpers, and sits next to a `<Sources>`
or `<FreshnessChip>`. Text that contains a count ("over a thousand operator identities") is built from the
value (`formatInt`, or a threshold phrase computed from it), never typed. Constants of the
simulations (3 s health check, 125 min location record) live in one commented `model.ts` per
simulation, each with its source link.

**Label what is not real.** A simulation says it is a simulation; an illustration says it is
illustrative (a `<Chip tone="warn">` or a figure caption). The one deliberate exception is the hero
globe's ambient failover: a quiet decorative loop with no controls and no claims (decision, section 13).

---

## 3. Visual system

All values below are tokens in `src/styles/tokens.css`. Components read **roles**, never raw colors.

### 3.1 Color

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Floor | `--void`, `--ink-0` to `--ink-5` | `#000`, `#06090f` to `#33373d` | Page, slabs, raised cards, hover, tracks. Elevation is lightness, never a drop shadow |
| Text | `--text-1` to `--text-4` | white, `#d8dde8`, `#a5adbd`, `#717171` | Headings and numbers; body; captions and labels; disabled only |
| Lines | `--line-1/2/3`, `--line-blue` | white at 6, 10, 18 percent; Blue Wave 2 at 24 | Hairlines, borders, structure |
| Accent (Flux) | `--accent`, `--accent-text`, `--accent-strong`, `--accent-solid`, `--accent-rgb` | `#4F7AD4`, `#86A1DA`, `#ABBEE4`, `#2B61D1` | Rings, active borders, links and numbers, bright hover, primary control fill |
| Hot | `--hot` | `#fff` | "This matters now": a lit edge, a focused marker |
| Tiers | `--cumulus`, `--nimbus`, `--stratus` | `#36D3FF`, `#C77DFF`, `#FFC857` | Only ever with the tier name or glyph. Set `data-tier="cumulus"` on an element to re-point the accent roles for its subtree |
| Status | `--status-ok/pending/warn/crit/off` | `#3FDC95`, `#86A1DA`, `#FF9A3D`, `#FF5470`, `#717171` | Fixed meaning, always icon plus word. `data-tone="ok|warn|crit"` re-points the accent roles |
| Alarm | `--alarm` | `#FF5470` | The counter-color of the story: outages, kills, blackouts, and "gets in" in chapter 07 |
| Steel | `--steel-100` to `--steel-900` | `#E1E6EF` to `#2A313E` | The cold web2 world. `data-mood="cold"` re-points the accent roles to steel for a subtree |
| Platform colors | `platform.color` from `compare.ts` | per platform | Small swatches and direct-labeled chart series only. Never a card face or a section accent (three hue pairs repeat across kinds, section 3.6) |

Rules: Flux blue is the only brand color; the symbol is only ever blue, white, black or gray. Tier,
status, mood and chart colors never touch the symbol. Color never carries meaning alone: pair it
with a word, a glyph or a position. All text on `--ink-0` meets AA (`--text-3` is 8.8:1).

### 3.2 Type

Montserrat (display, UI), Open Sans (body), IBM Plex Mono (labels, numbers, code), Lora italic (at most
**one** editorial line on the whole page: Chapter 01's closing line).

| Role | Class / token | Spec | Use |
| --- | --- | --- | --- |
| Mega | `.t-mega`, `--type-mega` | 300, `clamp(3rem, .9rem + 9.4vw, 10.5rem)`, lh .9, tracking -.055em | The hero headline only |
| Display | `.t-display` | 300, up to 7rem, tracking -.04em | Interlude statements, big pull lines |
| H2 | `.t-h2`, `SectionHeader` title | 600, `clamp(2.125rem, 1.2rem + 4vw, 4.25rem)`, tracking -.03em | Chapter titles (mixed weights inside) |
| H3, H4 | `.t-h3`, `.t-h4` | 600, 1.25 to 1.625rem; 1.0625rem | Card and panel titles |
| Lead | `.t-lead` | 400 Open Sans, 1.06 to 1.375rem, 58ch | One or two sentences under a title |
| Body | `.t-body` | 400 Open Sans, 1 to 1.06rem, lh 1.65 | Paragraphs |
| Label | `.t-label` | 500 Plex Mono, .75rem, uppercase, tracking .12em | Eyebrows, chips, axis labels, units |
| Stat | `.t-stat`, `CountUp`, `Stat` | 300 Montserrat, tabular numerals | Every big number |
| Editorial | `.t-accent` | Lora italic 400 | The single editorial line |
| Emphasis | `.t-emph` | 700, solid `--accent-strong` | Key words in a headline (no gradient, ever) |

Numbers are always tabular (`font-variant-numeric: tabular-nums`). Measure is 58 to 66 characters.
Headlines use `text-wrap: balance`, paragraphs `text-wrap: pretty`.

### 3.3 Layout and space

- Container 1240 px (`default`), 1520 px (`wide`), 760 px (`narrow`), fluid gutter `--gutter`
  (18 to 56 px). `<Section width="...">` picks it; `full` lets a stage bleed.
- Section padding `--section-y` (80 to 176 px); header to content `--section-gap`; grid gap `--grid-gap`.
- 4 px spacing scale: `--space-1` to `--space-24`.
- Breakpoints (write the number in media queries): phone below 720, tablet 720 to 1099, desktop 1100
  to 1679, wide 1680 and up. Prefer container queries (`Panel container`) for components.
- Grids: 12 columns on desktop, 6 on tablet, 4 on phone. Cards in a row share one height.
- Touch targets are 44 px minimum (`--touch-min`).
- No horizontal page scroll at any width. Wide content scrolls inside its own container with a visible
  edge fade and `scroll-snap` where it helps.

### 3.4 Materials and shape

- **Glass** (`Panel variant="glass"`): `--glass-bg` with backdrop blur and a faint hex lattice. For
  panels that sit over art or a canvas. **Slab** (`variant="slab"`): near-opaque, no blur: for long lists
  and stacked panels (backdrop-filter is expensive). **Ghost**: edge, ticks and pattern only.
- **Chamfers:** `--chamfer` 14 px (panels, buttons), `--chamfer-sm` 8 px (chips, inputs), `--chamfer-lg`
  22 px. The family silhouette is the top-right and bottom-left cut (`cut="tr-bl"`, the default).
- **Hexagon** is the unit: bullets (`HexBullet`), gauges (`HexGauge`), node glyphs, dots on the globe,
  matrix cells. `--hex-clip` (pointy-top) and `--hex-clip-flat`.
- **Tick rulers** (`Ruler`, `Panel ruler="top"`) are the instrument voice: edges of stages, chart axes,
  timelines. **Crosshair marks** at panel corners; a **reticle** (four corner brackets) marks a focused
  or targeted thing.
- **Light** is the material: glow is `box-shadow`/`filter` in the accent (never gray), edges catch light
  on one corner, active things get a white-hot rim. Film grain sits over everything at 5 percent.
- No drop shadows, no neumorphism, no pills (the nav and toggles only), no rounded-rectangle cards.

### 3.5 Iconography

`lucide-react` only. Pass icons to kit components as elements: `icon={<Play size={16} />}`. Tier,
status and platform logos are never used; platform names are text.

### 3.6 Data visualization

- Solid fills and strokes, flat color, hairline grids (`--line-1`), mono axis labels in `--text-3`,
  tabular numerals. No 3D, no pies, no dual axes, no truncated bars. Prefer bars, dots, ticks, small
  multiples.
- **Direct labels, not legends.** Every series is labeled at its end or its peak. Hover and keyboard
  focus show the exact value in a tooltip. Show at most 8 series at once.
- **Colors are unique within a kind, not across kinds.** Akash/Hetzner (red), Render/AWS (orange),
  Theta/Azure (teal) share hue families. Any chart that mixes DePIN and web2 labels series directly and
  uses `seriesStyle()` from `@/lib/compare` (web2: dashed stroke, square marker; DePIN: solid, round;
  Flux: solid, diamond). Never rely on hue alone.
- Flux is always `--accent`/Blue Wave; competitors are muted (their color at reduced saturation as a
  small swatch) until hovered or selected.
- Every chart has a text equivalent: a visually hidden table, or a caption that states the reading
  ("Flux scores 5 of 5 on replication; Akash scores 1").
- Tier colors appear only on tier data and always with the tier name.

---

## 4. Motion language

Motion explains cause and effect. It is never ambient noise: one thing moves with intent per beat,
and the page is calm between beats.

### 4.1 Timing and easing (tokens)

| Token | Value | Use |
| --- | --- | --- |
| `--dur-1` | 120 ms | Hover color, focus ring |
| `--dur-2` | 220 ms | Small UI transitions |
| `--dur-3` | 380 ms | Panels, tooltips, drawers |
| `--dur-4` | 700 ms | Reveals, count-ups, step changes |
| `--dur-5` | 1200 ms | Camera moves, hero beats |
| `--dur-cinema` | 1800 ms | The entrance and big set pieces |
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` | Default: things arriving |
| `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | Things travelling |
| `--ease-cinema` | `cubic-bezier(.22, 1, .36, 1)` | Entrances |
| `--ease-snap` | `cubic-bezier(.2, .9, .2, 1.15)` | Press and toggle overshoot |
| `--stagger` | 70 ms | Per item in a reveal |

### 4.2 Named motions

- **Reveal.** Rise 28 px, fade in, 700 ms, `ease-out`, stagger 70 ms. `<Reveal>` for blocks,
  `<SplitText>` for headline words. Triggered once on entering the viewport; content is never hidden
  without JS. Above the fold: `immediate` plus `hold` until fonts are ready.
- **Blackout.** Things going dark: 3 to 5 stepped flickers (`steps()` keyframes, 80 to 120 ms each),
  then a settle to `--alarm` at low opacity. Never smooth: a power loss is abrupt.
- **Heal.** The reverse: a clean wipe of Flux blue along the connection, then a single pulse ring.
- **Pulse ring.** A ring expands from a point and fades over 1.2 to 1.6 s. Used for events (a node
  claims work, a packet lands).
- **Beam.** A 1 px line of light travelling between two points over 400 to 900 ms. Used for requests,
  packets and attempts.
- **Count-up.** `<CountUp>`: 1.6 s, ease-out, on first entering the viewport; jumps under reduced motion.
- **Scrub.** Scroll-linked motion writes `--p` (0 to 1) with `useScrollProgress` and lets CSS read it
  (`translate: calc(var(--p) * 40px)`): no React re-renders per frame.
- **Press.** Controls compress to 98 percent (`--press-scale`).

### 4.3 Pinned stories

Pinned stories use `<ScrollStage>` (native scrolling, `position: sticky`; nothing is hijacked). Rules:
at most two on the page (03 Lifecycle and, if you have a strong case, 02); 0.5 to 0.9 viewport heights per
step; every step reachable by keyboard (the steps list is a real list with buttons that scroll to the
step); on phones no pinning: steps become stacked cards with `Reveal`.

### 4.4 Reduced motion contract

`useReducedMotion()` is true when the visitor chose reduced motion (footer toggle, mirrored to
`html[data-motion]`) or the OS asks for it. Under it:

- No travel, scale, parallax, springs, loops, flicker or autoplay. Opacity cross-fades of 160 to 240 ms
  remain. CSS: use `--motion-scale` (0 when reduced) and the shortened `--dur-*`.
- Simulations do not autoplay: they show their end state and wait for a press.
- Canvas and WebGL scenes render one still frame and re-render on interaction.
- Information is never lost: whatever an animation reveals is also in the DOM as text.

---

## 5. Interaction, accessibility, performance

### 5.1 Interaction principles

1. **Direct manipulation.** Click the thing, not a form. Drag, hover, scrub, press.
2. **Feedback within 100 ms.** Every press changes something visible at once; long effects start
   immediately and finish later.
3. **Reversible and resettable.** Every simulation has a Reset and starts from a sane state.
4. **Playful, not precious.** A wrong or silly input still produces a good result (Flux with 1 copy
   dies, and says so).
5. **Shareable.** If a state is worth sharing (a matchup, a scenario), it lives in the URL (section 11).
6. **One primary action per chapter** (the signature interaction); everything else is secondary.
7. **No dead ends.** Each chapter links forward ("See the full comparison") and every claim links to its
   source.

### 5.2 Accessibility

- Landmarks: one `<main id="main">`, each chapter a `<section aria-label>` via `<Section label>`;
  the chapter title is the section's `<h2>`; sub-parts use `<h3>`. One `<h1>` (the hero).
- Keyboard parity: everything you can do with a pointer you can do with the keyboard, in a sensible
  order, with a visible focus ring (`--focus-ring`, never removed). Roving `tabindex` and arrow keys for
  grids, ruler scrubbers and node fields; Enter or Space activates; Escape closes.
- Canvas and WebGL are `aria-hidden` decoration **plus a text twin**: a caption, a live region
  (`aria-live="polite"`, one short sentence per event, throttled) or a table that carries the same
  information. Simulations narrate their events in text.
- No information in hover only (tooltips are also reachable on focus; touch devices open on tap).
- Color contrast AA for text and 3:1 for UI. Status is never color-only.
- Targets 44 px; `touch-action` set on draggable surfaces (`pan-y` to leave vertical scrolling alone).
- Headlines are real headings; `SplitText` renders a plain-text `aria-label` so screen readers hear a
  sentence, not words.
- `prefers-reduced-motion`, `prefers-contrast: more` and `prefers-reduced-transparency` are honored by
  the tokens; do not fight them.
- Images: key art gets real `alt`; decorative plates are `aria-hidden` (`ArtPlate` does this).

### 5.3 Performance budget

- 60 fps on a mid-range laptop and a recent phone. The hero's frame-time governor shows the pattern:
  measure, then drop bloom, then DPR, then density.
- Everything that animates or simulates stops when offscreen or when the tab is hidden: gate every
  `requestAnimationFrame` loop and every `setInterval` on `useActive(ref)`.
- three.js and any chart or canvas engine over 30 KB is lazy-loaded (`import()`) after first paint and
  code-split. No heavy dependency for a chart: SVG and Canvas 2D by hand.
- Simulations use a fixed time step (`dt` accumulator, 20 to 30 Hz logic, render per frame) and never
  allocate in the hot loop.
- No layout shift: reserve aspect ratios (`ArtPlate mode="flow"` does), give charts a fixed `aspect-ratio`
  before data arrives, use skeletons that match the final size.
- `backdrop-filter` is for a handful of panels per screen; long lists use `variant="slab"`.
- Large art plates load lazily (`ArtPlate` uses `loading="lazy"` except the hero).
- Initial JS (excluding the lazy three chunk) stays under about 220 KB gzipped; check `npm run build`.
- Mobile first-view: nothing blocks; no fixed-height boxes that break at 390 px; fonts are self-hosted.

---

## 6. The UI kit

Import from `@/ui` only (`import { Panel, Reveal } from '@/ui'`). Every component is a CSS Module in
`@layer ui`, reads role tokens, honors reduced motion and is keyboard accessible. Icons are passed as
`lucide-react` elements.

### 6.1 Page structure

| Component | What it is | Key props and rules |
| --- | --- | --- |
| `Section` | The chapter wrapper: `<section id aria-label>`, vertical padding, optional plate and mood | `id` (the anchor, must match `chapters.ts`), `label`, `mood="cold"` (steel accent for the subtree), `plate="bg-blackout"` (an `ArtId`) with `plateProps`, `pad="default\|tight\|none"`, `width="default\|wide\|narrow\|full"`, `className`, `innerClassName` |
| `SectionHeader` | Light-and-bold title, optional quiet eyebrow, lede beside the title (Restyle v2: no numeral, no ruler) | `eyebrow` (optional), `title` (SplitText markup, no periods), `lede` (ReactNode, may interpolate data), `align="start\|center"`, `titleId`, `children` for a control under the lede. `num` and `ghost` are no-ops |
| `Interlude` | Typographic breath between acts (already placed in `App.tsx`; do not add more): a light setup line, a bold payoff | `lines` (no periods), `quiet`, `kicker` (prefer none), `caption`, `mood`. `outline` is an alias of `quiet` |
| `ScrollStage` | A pinned scroll story: tall wrapper, sticky stage, native scroll | `steps`, `perStep` (viewport heights), `stageHeight`, `top`, `children({ step, steps, progress, reduced })`; writes `--p` and `data-step` on the wrapper |
| `BuildSlot` | The placeholder in a stub. Delete it when you build | |
| `ArtPlate` | A generated art plate: backdrop (`fill`) or key art in flow (`flow`) | `src` (an `ArtId`), `opacity`, `fit`, `position`, `fade="y\|x\|all\|none"`, `parallax` (px), `blend`, `priority` (hero only), `mode`, `alt` (key art only). A missing file hides itself |

### 6.2 Type and reveal

| Component | What it is | Key props and rules |
| --- | --- | --- |
| `SplitText` | Word-by-word headline reveal with the mixed-weight markup | `text` (`*bold*`, `**bold accent**`), `as`, `delay`, `stagger`, `immediate`, `hold`, `breakBefore`. Pass the className of the role (`t-display`, `t-h2`). Renders an `aria-label` with the plain text |
| `Reveal` | Fade and rise on entering the viewport | `as`, `delay`, `from="up\|down\|left\|right\|none"`, `blur` (small things only), `scale` (key art), `immediate`, `hold`, `repeat`. Wrap blocks, not whole sections. Stagger siblings with `delay={i * 70}` |
| `Eyebrow` | The quiet sentence-case line above a headline | `live` (a breathing dot). `num` is a no-op |
| `CountUp` | An animated number written straight to the DOM | `value` (`null` shows a placeholder), `decimals`, `prefix`, `suffix`, `format="number\|compact"`, `duration`, `immediate`, `placeholder` |
| `Stat` | A number with its name, caption and provenance as plain text | `stat` (a `Stat` from `fluxStats`) or `label` + `value`; `status` + `fetchedAt` for live numbers (quiet live or snapshot text), `asOf` + `source` for static ones; `size="md\|lg\|xl"`; `caption` |

### 6.3 Surfaces and instruments

| Component | What it is | Key props and rules |
| --- | --- | --- |
| `Panel` | A quiet surface for an interactive instrument: one hairline, a flat tint, a small chamfer. Not a card | `as`, `variant="glass\|slab\|ghost"`, `size`, `cut`, `padding`, `tone` (status or tier), `marks` (opt-in crosshairs), `ruler="left\|right\|top\|bottom"` (opt-in), `interactive` (hairline firms up, pointer cursor, press; no spotlight), `tilt`, `clip`, `container` (a size container), `contentClassName`. `hot`, `pattern`, `halo`, `spot` are no-ops. Use `slab` in lists and under other panels |
| `Figure` | A bare, contained stage for a chart or diagram: no FIG label, no caption bar, no frame | `aside` (a legend, `Sources`), `frame` (one hairline, opt-in), `rulers` (opt-in), `stageClassName`, `caption` (only a real sentence of 56+ characters is printed). `fig` is a no-op |
| `HexGauge` | Hexagonal radial gauge | `value` 0 to 1, `size`, `tone`, `label`, `aria-label`, `children` (center) |
| `Meter` | A tick-marked horizontal bar | `value` 0 to 1, `label`, `reading`, `tone`, `ticks` |
| `Ruler` | A tick ruler: a rare accent | `orientation`, `length`, `step`, `side`. `fade` is a no-op |
| `HexBullet` | A hexagon bullet | `size`, `outline`, `pulse` |
| `Marquee` | A looping strip | `duration`, `reverse`, `pauseOnHover`, `aria-hidden` when decorative. `fade` is a no-op |
| `Kbd` | A keycap for keyboard hints | |

### 6.4 Controls

| Component | What it is | Key props and rules |
| --- | --- | --- |
| `Button`, `LinkButton`, `IconButton` | Chamfered controls | `variant="primary\|secondary\|ghost\|danger"`, `tone`, `size="sm\|md\|lg"`, `icon`, `iconEnd`, `magnetic`, `loading`, `fullWidth`. `LinkButton` takes `href` (external links open in a new tab). One `primary` per view. Labels in sentence case, no trailing period. `IconButton` needs `aria-label` |
| `Chip` | A status or tier as plain inline text (never a capsule) | `tone="neutral\|accent\|ok\|warn\|crit\|cumulus\|nimbus\|stratus"`, `bullet` (a small dot; `true` or `"pulse"`), `icon`, `size`, `muted` (only the dot carries the tone), `solid` (heavier weight). Prefer a plain sentence to a chip |
| `FreshnessChip` | The honest data-freshness label, as quiet text with a dot | `status` (`loading\|live\|snapshot`), `fetchedAt`. Put it next to every live number |
| `Segmented` | A segmented control (tabs, filters, toggles between views) | generic `options`, `value`, `onChange`, required `aria-label`, `size`, `fullWidth`. Roving arrow-key navigation built in |
| `Switch` | A labeled toggle | `checked`, `onChange`, `children` (label), `tone="ok\|warn\|crit"` |
| `Tooltip` | One-sentence hover and focus tip, in a portal | `content`, `placement`, `delay`; the child must be focusable |
| `Popover` | Click-to-open panel in a portal (a cell's detail, a source list) | `trigger`, `label`, `placement`, `className`, `panelClassName` |
| `Sources` | The provenance popover for a claim, triggered by a quiet "Sources" text link | `items` (`Source[]`), `label`, `title`. Renders nothing when empty. Put one by every sourced claim |
| `ShareBar` | Copy link, native share, X, Telegram, Reddit, LinkedIn | `text` (a quotable line), `section`, `params` (state to carry), `size` |
| `ToastProvider`, `useToast` | A polite one-line toast | `const { toast } = useToast(); toast('Link copied', 'ok')`. Mounted once in `App` |

### 6.5 Hooks (all from `@/ui`)

| Hook | Use |
| --- | --- |
| `useActive(ref, rootMargin?)` | True while the element is within a screen of the viewport and the tab is visible. Gate every canvas, rAF loop and timer on it |
| `useInView(ref, options?)` | Plain intersection |
| `useScrollProgress(ref, { mode: 'enter' \| 'sticky' })` | Writes `--p` (0 to 1) and `--pc` (-1 to 1) on the element, returns a ref with the latest numbers for canvas loops, no re-renders |
| `useReducedMotion()` | True when motion should be calm (footer toggle or OS) |
| `useElementSize(ref)` | Content-box size via ResizeObserver |
| `useMedia(query)`, `useIsPhone()`, `useIsDesktop()`, `usePointerFine()` | Responsive and input-aware branching (prefer CSS) |
| `usePageVisible()` | False while the tab is hidden |
| `useCountUp`, `useReveal`, `useSpotlight`, `useTilt`, `useMagnetic` | The primitives under the components; rarely needed directly. `useSpotlight` only writes the pointer position (`--pxp`, `--pyp`, `data-hover`); never draw a glow from it (section 2.1) |

### 6.6 A chapter skeleton

```tsx
import { useRef } from 'react';
import { Figure, Panel, Reveal, Section, SectionHeader, Sources, useActive } from '@/ui';
import { useFluxLive } from '@/lib/live';
import styles from './Example.module.css';

export function Example() {
  const live = useFluxLive();
  const stage = useRef<HTMLDivElement>(null);
  const active = useActive(stage);          // gate loops on this

  return (
    <Section id="example" label="Example chapter" width="wide">
      <SectionHeader title="A headline in **mixed** weights" lede={<>One or two short sentences.</>} />
      <Reveal>
        <Figure aside={<Sources items={[]} />}>
          <div ref={stage} className={styles.stage} />
        </Figure>
      </Reveal>
    </Section>
  );
}
```

```css
/* Example.module.css: every section rule lives in @layer section; read tokens, never raw colors */
@layer reset, tokens, base, ui, section, utility;
@layer section {
  .stage { position: relative; aspect-ratio: 16 / 9; color: var(--text-2); }
  @media (max-width: 719.98px) { .stage { aspect-ratio: 4 / 5; } }
}
```

### 6.7 The shell (already built; do not edit)

- `Nav` (`src/shell/Nav.tsx`): sticky bar with the logo, a row of chapter ticks with the current
  one named (no number), a page-progress hairline, a share button and the "Deploy on Flux" CTA
  (`LINKS.cloud`). Below 720 px it is a menu button and a sheet (chapters grouped by act, a focus trap,
  the close button stays above it). It reads `chapters.ts`, so a new chapter appears automatically.
- `Footer`: chapter list, outbound links (`LINKS`), `ShareBar`, the motion toggle (Auto, Reduced, Full).
- `ToastProvider`, the skip link and `<main id="main">` live in `App.tsx`.

---

## 7. Foundations: files, CSS, helpers

### 7.1 Tree

```
src/
  main.tsx, App.tsx            entry; page order + Interludes
  styles/                      tokens.css, base.css, utilities.css, fonts.css, index.css
  ui/                          the kit (section 6), one folder per component
  shell/                       Nav, Footer
  sections/
    chapters.ts                ids, numbers, nav labels, acts, LINKS (single source of truth)
    Hero/ FragileCloud/ FluxKubernetes/ Lifecycle/ DepinGap/ TakeItDown/
    Operators/ Sealed/ Arena/ Cost/ Ecosystem/ LiveProof/ Join/
  lib/
    live/                      the live network layer (owned by research): useFluxLive and friends
    globe/                     the three.js hero globe (engine, shaders, land mask, procedural sites)
    compare.ts                 lookups over compare.ts data (cellFor, headToHead, priceGroups, seriesStyle)
    geo.ts                     continentOf, continentShares
    format.ts, math.ts, rng.ts cn.ts, art.ts, motion.ts, scroll.ts, observer.ts, pointer.ts,
    urlState.ts, share.ts
  data/                        flux.ts, compare.ts, types.ts (owned by research)
public/ art/ brand/ data/      generated plates, Flux symbol SVGs, network snapshot
docs/ research/ tools/ scripts/
```

### 7.2 CSS conventions

- `@layer reset, tokens, base, ui, section, utility;` Kit modules are in `ui`, your modules in
  `section`, `.t-*` utilities in `utility`. Declare the layer list at the top of every module.
- One CSS Module per component, class names in camelCase, no global selectors except
  `:global(html[data-motion="reduced"])`. No `!important`. No inline colors: read tokens and
  `rgb(var(--accent-rgb) / .4)`.
- Re-point roles with data attributes, do not recolor by hand: `data-tier`, `data-tone`, `data-mood`,
  `data-status`.
- Use logical properties (`inline-size`, `margin-inline`, `inset-block-start`).
- `translate`, `scale`, `rotate` (individual transform properties) for motion; never animate layout
  properties. `will-change` only on the thing that moves, only while it moves.
- Responsive: container queries for components, media queries (`max-width: 719.98px`) for layout. Test
  at 390, 768, 1024, 1440, 1920.
- Z layers: the `--z-*` tokens. Plates sit below content at `z-index: 0`; do not invent new numbers.

### 7.3 Library helpers

| Import | What |
| --- | --- |
| `@/lib/live` | `useFluxLive()`, `liveStatValue(id, snapshot)`, `capacityTotals`, `countryName`, `countryFlag`, `countryCounts`, `tierShares`, `lockedCollateral`, `blockReward(height)`, `nextRewardReduction(height)`, `estimateHeight(snapshot)`, `formatStorageTb`, `TIER_COLLATERAL`, `TIER_IDS`, `CHAIN`, `LIVE_ENDPOINTS` |
| `@/lib/geo` | `continentOf(code)`, `continentShares(live.byCountry)`, `CONTINENT_NAME` (Europe's share, computed, never typed) |
| `@/lib/compare` | `platformById`, `dimensionById`, `cellFor`, `scoreFor`, `rivals()`, `DIMENSION_GROUPS`, `dimensionsInGroup`, `seriesStyle`, `headToHead(a, b)`, `fluxTrailsOn()`, `priceGroups()`, `timesFlux()` |
| `@/lib/format` | `formatInt`, `formatNumber`, `formatCompact`, `formatUsd`, `formatPercent`, `formatDuration(hours)`, `formatDate(iso)`, `yearsSince`, `formatAge`, `pad2`, `stripPeriod(s)` (data headlines are sentences: strip the trailing period before using one as a heading, label or button) |
| `@/lib/urlState` | `useUrlParam(key)`, `readParam`, `writeParam`, `shareUrl(section, params)`, `siteUrl()` |
| `@/lib/share` | `copyText`, `shareOrCopy`, `intents` |
| `@/lib/scroll` | `subscribeScroll`, `trackProgress`, `measureProgress` (one rAF-coalesced scroll loop for the whole page) |
| `@/lib/math`, `@/lib/rng` | `clamp`, `lerp`, `damp`, `smoothstep`, `easeOutCubic`, `DEG`, `mulberry32(seed)` (deterministic randomness: use it, so a shared scenario replays) |
| `@/lib/art` | `ArtId`, `ART`, `artUrl` |
| `@/lib/motion` | `readReducedMotion`, `setMotionOverride` (the footer uses these) |
| `@/lib/globe/*` | The hero engine; reusable: `createGlobe(opts)` (see its header comment), `landDots(n)` and `isLand(lat, lon)` from `landmask.ts` for any land-shaped drawing (the Operators map) |
| `@/sections/chapters` | `chapters`, `chapterById`, `ACTS`, `LINKS` (cloud, flux, docs, academy, atlas, github) |

---

## 8. Data and honesty

### 8.1 What exists (checked 2026-10-24)

`src/data/types.ts` is the contract. Every record carries `sources` (a `Source[]` with `label`, `url` and
`accessed`), and `Stat`/`Cell`/`PricePoint` carry `asOf`. Render provenance with `<Sources items=...>`.

| Export | Shape | Count | Notes |
| --- | --- | --- | --- |
| `fluxStats` (`@/data/flux`) | `Stat[]` | 12 | ids `nodes`, `countries`, `apps`, `redundancy`, `cores`, `ram`, `storage`, `collateral`, `operators`, `years`, `arcane`, `privateApps`. Fresh values: `liveStatValue(stat.id, live) ?? stat.value` (`arcane` and `privateApps` are static: use their `asOf` and `source`) |
| `nodeTiers` | `NodeTier[]` | 3 | `cumulus`, `nimbus`, `stratus`: collateral, cores, threads, ramGb, ssdGb, benchmark, pitch, sources |
| `features` | `Feature[]` | 14 | ids `self-scheduling`, `replicas`, `self-healing`, `crash-recovery`, `load-balancing`, `replicated-storage`, `geolocation`, `fault-domains`, `benchmarked`, `arcane-enterprise`, `chain-control-plane`, `rolling-images`, `permissionless`, `git-and-agents`. Each has `headline`, `body`, `analogy`, `icon` (a lucide name) |
| `lifecycle` | `LifecycleStep[]` | 10 | ids `spec`, `validate`, `sign`, `pay`, `volunteer`, `install`, `announce`, `route`, `heal`, `serve`; `actor` is `developer\|blockchain\|fluxos\|node\|network\|user` |
| `kubernetesMap` | `ConceptMapping[]` | 12 | `k8s`, `flux`, `note`, `sources` |
| `ecosystem` | `EcosystemItem[]` | 12 | ids `fluxcloud`, `fluxos`, `arcaneos`, `fluxnodes`, `orbit`, `marketplace`, `fluxedge`, `fluxai`, `mcp`, `wallets`, `fluxdrive`, `pnr-v2`; `status` is `live\|beta\|announced\|deprecated` (`pnr-v2` is `announced`) |
| `milestones` | `Milestone[]` | 14 | dated, ascending; the last (2026-10-26) is expected, not past; includes the Halborn audit (2025-11-18) and FluxOS 8.18.0 (2026-09-08) |
| `platforms` (`@/data/compare`) | `Platform[]` | 16 | Flux, 9 DePIN (`akash`, `ionet`, `aethir`, `icp`, `render`, `fluence`, `golem`, `theta`, `phala`), 6 web2 (`aws`, `azure`, `digitalocean`, `vercel`, `gcp`, `hetzner`); `kind`, `category`, `summary`, `fluxEdge`, `theirStrength`, `color`, `website` |
| `dimensions` | `Dimension[]` | 14 | in five groups: `decentralization`, `resilience`, `developer`, `economics`, `scale`; each has a `question` and a `why` |
| `cells` | `Cell[]` | 224 | 16 x 14, every cell sourced. `score` 0 to 5, `verdict` `yes\|partial\|no\|na`, `short` (60 characters or fewer, for the cell), `detail` (1 to 3 sentences, for a popover) |
| `incidents` | `Incident[]` | 16 | ids `aws-us-east-1-2025`, `aws-middle-east-2026`, `gcp-railway-2026`, `cloudflare-2025-11`, `cloudflare-2025-12`, `gcp-2025-06`, `crowdstrike-2024`, `azure-front-door-2025`, `azure-2026-02`, `gcp-london-2026`, `cloudflare-2026-02`, `aws-us-east-1-2021`, `fastly-2021`, `ovh-fire-2021`, `aws-parler-2021`, `hetzner-solana-2022`. `durationHours` is absent for multi-day or permanent events: read the timescale from `impact` |
| `prices` | `PricePoint[]` | 13 | two workloads (group with `priceGroups()`); Flux appears once in each; read the caveats in `note` |
| `cloudMarketShare` | `MarketShare[]` | 4 | AWS 28, Azure 20, Google 15, everyone else 37 (Synergy, Q2 2026); sums to 100 |
| `privacy` (`Feature[]`), `operatorAccess` (`OperatorAccessRow[]`) | 9 and 13 | 22 | What ArcaneOS is and what a node operator can reach (`research/privacy.md`). Chapter 07 reads them; read its spec before you build |

**The data is the script.** If a fact is not in `src/data` or `research/*.md`, it is not on the page.
If a fact you need is missing, add it to section 13's request list in your report, render the chapter
without it, and never type it in.

### 8.2 The live layer

`useFluxLive()` returns a snapshot at once (status `snapshot`, bundled counts), loads node points,
and switches to `live` when `api.runonflux.io` answers. It never throws or suspends. Fields: `status`,
`fetchedAt`, `totalNodes`, `tiers`, `countries`, `continents`, `operators`, `asns`, `arcaneNodes`,
`runningApps`, `runningInstances`, `multiInstanceApps`, `registeredApps`, `appMessages`,
`totalCores`, `totalRamTb`, `totalSsdTb`, `lockedCollateral`, `blockHeight`, `byCountry`, `points`
(0.5 degree cells with `weight`), `snapshotAt`. Several fields are snapshot-only (refreshed by
`scripts/snapshot.mjs`): show the `FreshnessChip` and never call a snapshot value "live".

Patterns:

- **Loading and empty:** every number renders a placeholder (a dash via `CountUp`) until its value
  exists; every list renders a skeleton of its final height. Never `0` for "unknown".
- **Freshness:** `<FreshnessChip status={live.status} fetchedAt={live.fetchedAt} />` beside any block of
  live numbers. Static facts carry `asOf` and `<Sources>`.
- **Derived claims:** compute them, then phrase them. `multiInstanceApps / runningApps` is the 86
  percent; `arcaneNodes / totalNodes` is the ArcaneOS share; `continentShares(byCountry)[0]` is Europe's.
  A threshold phrase is computed too: "over a thousand" appears only when `operators >= 1000`.

### 8.3 Facts you may state (with where they come from)

| Fact | Source in the code |
| --- | --- |
| 6,800+ nodes, 57 countries, 6 continents | `live.totalNodes`, `live.countries`, `live.continents` (say "nodes") |
| Over a thousand operator identities on 234 networks | `live.operators`, `live.asns` |
| 86% of running apps have 2+ live copies | `liveStatValue('redundancy', live)` |
| 1 to 100 instances; one copy per host IP | `features['replicas']` |
| Traffic fails over in seconds (check every 3 s, out after 2 failures) | `features['self-healing']`, `kubernetesMap` |
| A lost copy is rebuilt automatically: minutes after a clean shutdown, up to about two hours after a sudden death | `features['self-healing']` (two speeds, always together) |
| No central scheduler: each node picks up missing work at random | `features['self-scheduling']` |
| Spread across fault domains; geolocation rules; replicated volumes | `features[...]` |
| Proof of Node, 30 s blocks, no mining | `milestones` 2025-10-25, `CHAIN` |
| Three tiers, collateral 1,000 / 12,500 / 40,000 FLUX | `nodeTiers`, `TIER_COLLATERAL` |
| Every node is benchmarked | `features['benchmarked']` |
| 94% of nodes run ArcaneOS (a hardened OS: Secure Boot, signed read-only system, encrypted disks) | `live.arcaneNodes / live.totalNodes`, `fluxStats['arcane']`, `privacy` |
| On an ArcaneOS node the operator has no root and, since September 2026, no way into an app's files, logs or secrets | `operatorAccess`, `milestones` 2026-09-08 |
| Private app specs are encrypted; app data sits on encrypted disks | `features['arcane-enterprise']`, `privacy`, `fluxStats['privateApps']` |
| Orbit, the MCP server, Docker: three equal on-ramps | `ecosystem` (`orbit`, `mcp`, `fluxcloud`), `features['git-and-agents']` |
| On chain since 2018-01-26; apps since 2020-09-25 | `milestones`, `fluxStats['years']` |

### 8.4 Where Flux is weaker (SUPERSEDED: do not feature; see the copy and accuracy rules at the top)

From `research/competitors.md` section 8 and `research/flux.md` section 3.5. These appear on the page
(chapters 04, 06, 08) because they make everything else believable:

- GPU depth and managed-service ecosystem lag the big clouds and the GPU networks.
- Europe holds about 71% of nodes; about a quarter sit on one hosting company; 39 operator IDs run more
  than half the nodes. The network is open to anyone and still lumpy.
- The team publishes a signed blocklist that nodes honor, and runs the default load balancer (anyone can
  run their own).
- An app with a single copy is down until the network rebuilds it (up to about two hours).
- ICP's replicated state is stronger than Flux's file sync; Akash documents no network-wide blocklist.
- No contractual SLA is published in the docs we read.
- ArcaneOS is a locked door, not a hardware vault: no enclave (TEE), so someone who controls the hypervisor
  or the hardware could in principle read memory; default web traffic reaches the node as plain HTTP; Flux
  itself can decrypt private specs and its support IDs can reach inside apps; about 6 percent of nodes are
  legacy and can only host public apps (`research/privacy.md`).

---

## 9. The storyboard

The order of the page, with the act each chapter belongs to. Ids, numbers, nav labels and titles
live in `src/sections/chapters.ts` (the single source of truth); a new chapter appears in the nav and
the footer from there.

| # | Id | Folder (`src/sections/`) | Act | Signature moment | Status |
| --- | --- | --- | --- | --- | --- |
| 00 | `top` | `Hero` | intro | A live globe of the real nodes | Built |
| | | Interlude I | I | "The cloud is / someone else's computer" | Built (`App.tsx`) |
| 01 | `fragile` | `FragileCloud` | I | The blackout board: pick a real outage, watch the services go dark | Stub |
| | | Interlude II | II | "What if the cloud / had no center?" | Built |
| 02 | `kubernetes` | `FluxKubernetes` | II | A Rosetta stone of Kubernetes and Flux with a theater you can drive | Stub |
| 03 | `lifecycle` | `Lifecycle` | II | Three equal ways in, then a pinned story of a deployment | Stub |
| 04 | `depin` | `DepinGap` | II | The quadrant: who can host, against how many operators run one deployment | Stub |
| | | Interlude III | III | "Enough talking / Break something" | Built |
| 05 | `takedown` | `TakeItDown` | III | A simulation: try to take down three apps | Stub |
| 06 | `operators` | `Operators` | III | "Could your machine run a node?" and the honest map | Stub |
| 07 | `sealed` | `Sealed` | III | The operator's seat: try to get into the app on a legacy node and an ArcaneOS node, and see what is and is not blocked | Stub |
| 08 | `arena` | `Arena` | III | Matrix, head to head and shape, with a shareable matchup | Stub |
| 09 | `cost` | `Cost` | III | Run the meter for a month | Stub |
| | | Interlude IV | IV | "It's already / running" | Built |
| 10 | `ecosystem` | `Ecosystem` | IV | An orbit of the products, and a timeline | Stub |
| 11 | `proof` | `LiveProof` | IV | The live proof wall, with a "check it yourself" panel | Stub |
| 12 | `join` | `Join` | IV | Your move: three equal doors | Stub |

Each spec below uses the same fields: **Goal**, **Header**, **Layout** (desktop, then phone),
**Signature**, **Data** (exact exports), **Art**, **Motion**, **Honesty**, **States** and **Done when**.
Titles use the `SplitText` markup and never end with a period.

---

### 00 Hero (`#top`, `src/sections/Hero/`) Built

**Goal.** In four seconds: this is a cloud made of real nodes around the world, and it does not care
if one goes dark. Then one clear next step.

**What is built (Restyle v2).** A full-viewport stage. Layers, bottom to top: `hero-horizon` poster (first
paint and the no-WebGL fallback), the live globe canvas (`src/lib/globe`, three.js, lazy chunk), the copy
(H1 "Pull the plug" / "**It keeps running**" on two lines with no period, one lede, two CTAs: "Try to take it
down" to `#takedown`, "How it works" to `#kubernetes`), the empty "window" row the planet shows through,
and the number strip at the foot: four big light numbers (nodes online, countries, operator IDs, apps
running) with their names beneath, on a flat translucent black backing with one hairline on top, plus a
quiet `FreshnessChip` (a breathing dot and "Live just now") and a `Sources` text link. No eyebrow, no bokeh
plate, no scrim, no fade into black, no capsule. Entrance: fonts-ready hold, then words rise, then the
planet ignites outward from the north Atlantic.

**The globe.** Real node positions from `useFluxLive().points` (weighted, tier-colored), hex-dot land
from a baked Natural Earth mask, thin travelling arcs, a drag-to-spin planet with inertia, a hover label
(country, tier, node count), a slow drift, and an ambient failover loop: now and then a site goes dark
and the apps place a copy elsewhere. It is a **showcase, not the game**: nothing on it is clickable, it
carries no "simulation" tag and no instructions (a decision by the user, section 13); the playable
version is chapter 05. If real positions are unavailable it draws an illustrative network and says so
in a small note. Glow is an accent: bloom 0.14 and a thin atmosphere, so the surface, the hex dots and
the nodes read crisply on black.

**Controls for tuning** (`src/lib/globe/engine.ts` header documents everything): `?q=low|medium|high`
forces a quality tier, `?hide=atmo,dots,sites,arcs,grat,rings,pulses,bloom` hides layers for debugging.
`createGlobe({ playable, ambientFailover })` are the two switches; the hero passes `false` and `true`.

**Phone.** One column: H1, a shorter lede, two full-width buttons, then the planet in its own
window (`HeroGlobe` measures the window and passes `topPx` to the engine), then the four numbers
(2 by 2) below the fold.

**Do not rebuild.** If you need the globe elsewhere (a second instance is expensive: do not), read the
engine header first.

---

### 01 The fragile cloud (`#fragile`, `src/sections/FragileCloud/`)

**Act I, `mood="cold"`, plate `bg-blackout`.** The only chapter whose whole mood is cold: the accent is steel
and the alarm is the loud color.

**Goal.** Make the stakes physical: a few companies carry most of the cloud, and when one has a bad
day, real services go dark. Not fear: recognition.

**Header.** `num` 01, eyebrow "The fragile cloud", title "Three companies. *One bad day*". Lede
(interpolate, do not type the number): "Three companies take {top3}% of what the world spends on cloud
infrastructure. Here is what a bad day looks like at one of them, or at the networks in front of them."

**Layout.**
- *Beat A, the share (FIG 1.1).* A `Figure` whose stage is one wide bar of four segments (AWS, Azure,
  Google, Everyone else) scaled by `sharePct`, in steel tones (`--steel-300`, `-500`, `-700`, and `--ink-3`
  for the rest), with a hairline between segments. Above each segment a `CountUp` percent (`suffix="%"`)
  and the provider name; below, a `Ruler` 0 to 100 and a bracket over the first three reading
  "Three companies: {top3}%" (computed). The `monolith-trio` plate stands behind the bar at 40 percent
  (`ArtPlate`, `mode="flow"` on the left on desktop, a faded backdrop on phone). Caption: "Share of
  enterprise spending on cloud infrastructure services, Q2 2026" with `Sources` (Synergy) and the
  `asOf` date. The three big segments are buttons: choosing one filters Beat B to that company's
  incidents; a "Clear" chip resets. Say "share of spending", never "share of the internet".
- *Beat B, the blackout board (FIG 1.2), the signature.* A wide `Panel variant="slab"`:
  1. Top row: `Segmented` filter [All, Outages, Physical, Deplatforming] (the kind map below) and the
     provider chip from Beat A.
  2. Left two thirds, **the wall**: the `affected` services of the selected incident as hexagonal tiles
     (name only, no logos). On selection the tiles run the **Blackout** motion (stepped flicker) and end
     dark with an alarm outline. If `affected` is empty or a single entry, show that one large tile (or
     the provider's name) and nothing invented. A large readout over the wall: the duration
     (`formatDuration(hours)`) or, when `durationHours` is absent, a word read from `impact` ("Days",
     "Weeks", "Permanent").
  3. Right third, **the details**: date (`formatDate`), provider, title (`h3`), the `impact` paragraph,
     `Sources`.
  4. Bottom, **the ruler**: all 16 incidents placed by date on a `Ruler` from the oldest to the newest.
     Each is a hex marker sized by the square root of `durationHours` (a fixed medium size when absent);
     the selected one is white-hot; the others take the provider's steel tone. Roving focus
     (`role="radiogroup"`), Left and Right move, Home and End jump. A **Replay the bad years** button
     steps through them chronologically (2.4 s each); any interaction stops it; it does not exist under
     reduced motion (a "Next incident" button instead).
- *Beat C, the pivot.* One editorial line in Lora italic (`.t-accent`, the only one on the page): "One
  company, one region, one switch". Under it three short captions, each a button that sets the board's
  filter and scrolls to it: **One company** (the share bar), **One region** (Physical), **One switch**
  (Deplatforming).
- *Phone.* Beat A's bar stays horizontal (labels above, wrapped). The ruler becomes a horizontal
  scroller of 16 snapping hex chips under the filter; the wall, then the details stack.

**Signature.** Selecting an incident takes the services dark. Make the dark feel earned: tiles flicker,
the room dims (the `bg-blackout` plate drops to 25 percent for 600 ms and returns), a single mono line
types the cause ("A race condition in DynamoDB's DNS automation").

**Data.** `cloudMarketShare` (4 rows; each has `source`, `asOf`) and `incidents` (16; `id`, `date`,
`provider`, `title`, `impact`, `durationHours?`, `affected?`, `sources`). Do not total the hours
(they overlap and are not comparable).

*Kind map (UI-only, keep it in the section; ask for an `Incident.kind` field, section 13).*
Outages: `aws-us-east-1-2025`, `aws-us-east-1-2021`, `cloudflare-2025-11`, `cloudflare-2025-12`,
`cloudflare-2026-02`, `gcp-2025-06`, `azure-front-door-2025`, `azure-2026-02`, `fastly-2021`,
`crowdstrike-2024`. Physical: `aws-middle-east-2026`, `gcp-london-2026`, `ovh-fire-2021`.
Deplatforming: `gcp-railway-2026`, `aws-parler-2021`, `hetzner-solana-2022`. Provider filter for the big
three matches `provider` containing "AWS", "Microsoft Azure" or "Google Cloud".

**Art.** `bg-blackout` (section plate, opacity .55), `monolith-trio` (Beat A).

**Motion.** Blackout, Reveal, CountUp; the ruler markers pulse once when the filter changes. Reduced:
the wall changes state instantly, no flicker, no autoplay.

**Honesty.** This chapter does not claim Flux would have survived any of these. The Hetzner and Solana
entry is also a fact about Flux (about a quarter of nodes sit on Hetzner): chapter 06 says so. Use each
incident's own sources; keep the quotes from `impact` as given.

**States.** No data: hide the beat. Fewer than 16 incidents: the ruler adapts. Under 400 px the details
move above the wall.

**Done when.** Selecting any incident (mouse, touch, keyboard) updates the wall, details and ruler; the
board filter works from the bar and from the three captions; there is a text equivalent of the wall;
390 px works with no horizontal page scroll; no hardcoded numbers.

---

### 02 A decentralized Kubernetes (`#kubernetes`, `src/sections/FluxKubernetes/`)

**Act II.** First light: structure appears (lattice floor `bg-lattice-floor` at the very back, 30
percent).

**Goal.** A visitor who knows Kubernetes thinks "oh, that is a Kubernetes", and one who does not
understands what each part is for. Show the same ideas with nobody in charge.

**Header.** `num` 02, eyebrow "A decentralized Kubernetes", title "A cloud that **schedules itself**".
Lede: "Kubernetes keeps containers alive with a control plane. Flux keeps them alive with a blockchain and
nodes that pick up work on their own." (The stub's placeholder copy is replaced with this.)

**Layout.** *Desktop:* two columns in a `Panel variant="slab"` stage (`Figure` FIG 2.1).
- *Left (40 percent), the Rosetta stone:* the 12 `kubernetesMap` rows as a list of selectable rows:
  the Kubernetes term on the left in `--text-3`, an arrow glyph, the Flux term in `--text-1`. Selecting
  a row (click, arrow keys) highlights it with a hot edge, shows its `note` and `Sources` under the list,
  and plays that row's scene in the theater. Rows are `role="listbox"`/`option`.
- *Right (60 percent), the theater:* a 2D scene (SVG or Canvas 2D, 30 fps, `useActive`-gated) of about 28
  hex nodes in a loose field with a "registry" block on top that ticks as the chain. Illustrative: a
  `Chip tone="warn"` says "Illustrative: 28 nodes" and a caption "Time is compressed in the slow steps".
  The theater has four controls under it: **Publish an app** (a spec arrives in the registry and nodes
  volunteer), **Add a copy / Remove a copy** (instances stepper, 1 to 12 shown, "up to 100" in the label),
  **Lose a node** (a random hosting node goes dark), **Reset**.
- *Scenes.* P0 (must be animated): `kube-scheduler` (nodes volunteer at random, first claims win, "no
  scheduler: every node decides"), `ReplicaSet` (the stepper), `Node failure` (the two speeds: traffic
  reroutes in seconds, the lost copy is rebuilt after a time-compressed wait, with the real numbers in
  mono: 3 s checks, 2 failures; 7 minutes clean, up to about two hours sudden), `Service + Ingress`
  (requests flow user to load balancer to copies; "anyone can run their own"). P1 (a highlight and a
  one-line caption is enough): the other eight. `Secrets` links to `#sealed`, `Nodes + kubelet` links to
  `#operators`.
- *Where it differs.* A `Switch` "Show where the analogy breaks" reveals a short list under the stage:
  no namespaces or RBAC beyond owner keys, no autoscaling (you set `instances`), health checks are
  TCP or port checks, no service mesh between apps, and rebuilding after a sudden node loss is slower than
  Kubernetes' default eviction. Text from `research/flux.md` section 6 (last paragraph); keep it as given.
- *Phone:* the Rosetta list becomes a horizontally scrolling row of chips above the theater (the selected
  mapping's note below it); the theater is full width at 4:5 and controls wrap to two rows.

**Signature.** A theater you can drive: press **Publish an app**, watch 28 nodes decide for themselves,
press **Lose a node** and watch the two speeds. A visitor should say "so nobody is in charge of
placement".

**Data.** `kubernetesMap` (12; `k8s`, `flux`, `note`, `sources`), `features` for the one-liners of the
scenes (`self-scheduling`, `replicas`, `self-healing`, `crash-recovery`, `load-balancing`,
`replicated-storage`, `geolocation`, `fault-domains`, `chain-control-plane`), `ecosystem['fluxedge']`
for the note that FluxEdge literally runs Kubernetes.

**Art.** `bg-lattice-floor` (back, 30 percent). No other art: the theater is the picture.

**Motion.** Pulse rings when a node volunteers; Beam for requests; Blackout when a node dies; Heal when a
copy is rebuilt; rebuild progress as a `Meter` labeled "time compressed". Reduced: scenes jump to their end
state with the caption, no loops.

**Honesty.** This is a diagram with invented nodes, not a measurement. Say two speeds, always together.
Never say instant, zero downtime or "Kubernetes" as if Flux runs it (FluxEdge does; the core does not).

**States.** Empty `kubernetesMap`: show a note, not an empty box. The theater pauses offscreen.

**Done when.** All 12 rows selectable by keyboard; the four P0 scenes animate and have text twins (an
`aria-live` line per event); reduced motion shows static states; 390 px usable.

---

### 03 How a deployment works (`#lifecycle`, `src/sections/Lifecycle/`)

**Act II.** The one pinned story of the page (`ScrollStage`). Nothing here claims a duration shorter than
"minutes".

**Goal.** Show the whole path from "I have an app" to "it is running on several independent nodes and
survives failures", and show that there are **three equal ways in**. Not one main road plus two
afterthoughts: three doors of the same size, with the same weight, the same animation length and the same
amount of detail.

**Header.** `num` 03, eyebrow "How a deployment works", title "Ship it however you like. *Flux keeps it
alive*" (period dropped). Lede (as in the stub): "Bring a Docker image, point Orbit
at a Git repo, or let an AI agent deploy over MCP. Then follow your app to a live, replicated, self-healing
deployment."

**Layout.**
- *Part 1, three ways in.* A row of three `Panel interactive tilt` cards with identical anatomy, size and
  motion: a lucide icon (`Container`, `GitBranch`, `Bot`), an `h3` title, one line of lede, a small
  looping micro-scene (6 s, `useActive`-gated, labeled "Illustrative" with a `Chip tone="warn"` size sm),
  and `Sources`. Selecting a card (it is a `role="radio"` in a group; arrow keys move) sets the on-ramp
  used by the story below; the choice lives in `?on=docker|git|agent` (section 11). The default is none
  selected: the story opens on a neutral "describe the app" frame, and selecting one specializes step 1.
  1. **A Docker image.** Title "A Docker image". Text from `ecosystem['fluxcloud']` (the FluxCloud form or a
     full spec) and `lifecycle['spec']`. Micro-scene: a small form fills in (`image`, `instances`, `cpu`,
     `ram`, `hdd`) and a "Deploy" button lights.
  2. **Deploy with Git via Orbit.** Title "Deploy with Git". Text from `ecosystem['orbit']` (connect a
     GitHub, GitLab or Bitbucket repo; it detects the framework, builds a container, deploys it and
     redeploys on every push, rolling back if a build fails). Micro-scene: a terminal line `git push`
     then build lines.
  3. **An AI agent via the Flux Cloud MCP server.** Title "An AI agent". Text from `ecosystem['mcp']` (quote
     in dollars, deploy, pay in FLUX, watch it come up, read logs, update, cancel). Micro-scene: a prompt
     bubble and a row of tool-call chips (quote, deploy, pay, logs).
  Data headlines end with a period: pass them through `stripPeriod()` when used as a heading, or render
  them as prose.
- *Part 2, the pinned story.* `<ScrollStage steps={10} perStep={0.65} top="var(--nav-h)" stageHeight="calc(100svh - var(--nav-h))">`.
  The stage is a four-lane picture, left to right: **You**, **The chain**, **The nodes**, **Your users**.
  The **app** is the `container-crystal` plate used as a sprite (`<img>`, `mix-blend-mode: screen`, 96 px)
  that travels the lanes and multiplies. A "Who is in charge?" readout sits top right and changes per step, and it
  must stay true: steps 1 to 3 "You"; step 4 "The chain: every node reads the same block"; steps 5 to 7
  "Nobody: each node decides for itself"; step 8 "A load balancer: run by the Flux team by default, and
  anyone can run their own"; step 9 "Every node checks, and so does the load balancer"; step 10 "Nobody
  needed". A vertical **step rail** on the left lists the 10 titles
  (real buttons: clicking scrolls to the step; the current one is lit). Under the stage lane, a caption
  area shows `lifecycle[step].title`, `.body`, the `actor` as a `Chip`, and `Sources`.
  Steps (from `lifecycle`, in order) and what the stage does:
  1. `spec` (developer): the app appears at You, with the selected on-ramp's overlay (form, terminal or chat).
  2. `validate` (fluxos): a checklist ticks (image reachable, size limit, ports allowed, price in USD).
  3. `sign` (developer): a signature stamp with "Signed with your Flux ID".
  4. `pay` (blockchain): a payment packet travels to The chain; a 30 s block ring ticks
     (`CHAIN.blockSeconds`), labeled "time compressed".
  5. `volunteer` (node): nodes pulse; the first few claim (no scheduler).
  6. `install` (node): the claimants pull the image and sync (progress bars).
  7. `announce` (network): copies announce their location; the registry updates.
  8. `route` (network): a load-balancer line connects Your users to the copies; the app's domain appears.
  9. `heal` (fluxos): a node fails (Blackout); traffic reroutes in seconds; a replacement is claimed later
     (two speeds, with the real numbers).
  10. `serve` (user): "Users just see an app": a browser frame shows the app's URL.
- *Phone.* No pin. The three cards stack (equal heights). The story is ten stacked cards (`Reveal`), each with
  a small version of its lane picture and the same caption; the on-ramp `Segmented` is sticky at the top.

**Signature.** Scrolling is the deployment. At step 5 the visitor sees the thing that makes Flux different:
the nodes choose. Keep step 5 and step 9 the longest (1.2 viewport heights).

**Data.** `lifecycle` (10), `ecosystem` ids `fluxcloud`, `orbit`, `mcp`, `features['git-and-agents']`,
`features['chain-control-plane']`, `features['self-scheduling']`, `CHAIN.blockSeconds`.

**Art.** `container-crystal` (the app sprite, also the card icon backdrop), `bg-lattice-floor` (under the
nodes lane, 30 percent).

**Motion.** All step motion is scrubbed from `progress` (CSS custom properties), not time-based, so scrolling
back reverses it. Beam and Pulse ring for packets and volunteers, Blackout and Heal at step 9.

**Honesty.** "Minutes", never "30 seconds". Orbit's price and instance counts come from the data
(`ecosystem['orbit'].body`), not from memory. Say the lost copy is rebuilt automatically **and** that a
single-copy app is down until then. Do not call the chain "the cloud's brain": say "control plane" only
with the Kubernetes comparison from chapter 02.

**States.** No selected on-ramp: a neutral frame. `lifecycle` empty: skeleton rail. Reduced motion: each step
cross-fades to its end state; the rail still scrolls to steps.

**Done when.** The three cards are visually and behaviorally equal (same size, same loop, same copy
length, none marked recommended); the story works by wheel, touch, keyboard and rail buttons; the stage
never exceeds the viewport; 390 px shows ten readable cards; reduced motion works.

---

### 04 Decentralized is not the same as resilient (`#depin`, `src/sections/DepinGap/`)

**Act II.** The turn from "the idea" to "the proof": most "decentralized cloud" is a marketplace, and a
marketplace is not a cloud.

**Goal.** Give the visitor a mental model that survives the rest of the page: *who can host* and *how many
operators run one deployment* are separate questions, and Flux answers both. Stay fair: show where the
others are strong.

**Header.** `num` 04, eyebrow "Not all decentralized is equal", title "Decentralized is not the same as
**resilient**". Lede (as in the stub): "Many decentralized clouds are marketplaces: you rent a machine from one
provider, and if it goes down, so do you. Here is the difference."

**Layout.**
- *Beat A, the quadrant (FIG 4.1), the signature.* A square `Figure` (aspect 1:1 on desktop, 4:5 phone)
  with a hairline plot area and a `Ruler` on each axis. **X: "Who can host?"** is the
  `permissionless-operators` score (0 to 5); **Y: "How many operators run one deployment?"** is the
  `multi-operator-redundancy` score (0 to 5). Four quadrants named by corner text (mono, quiet): top right
  "Open and replicated", top left "Replicated, gated", bottom right "Open, one provider per deployment",
  bottom left "Gated and single". One marker per platform from `platforms` at its two scores, jittered
  deterministically (`mulberry32(hashString(id))`, 0.18 of a step) so ties do not overlap, **directly
  labeled** with the platform name (collision-avoid by nudging labels; at 390 px label only the hovered
  and Flux markers). Marker style from `seriesStyle()`: diamond for Flux, circle for DePIN, square with a
  dashed ring for web2. Flux is Blue Wave and slightly larger; every other marker is muted until
  hovered or focused. A `Segmented` above the plot filters All / DePIN / Web2.
  Hover or focus a marker: a card (`Panel`, sized sm) with `summary`, the two `cell.short` lines and the
  platform's `Sources`. Markers are a roving-tabindex group (arrow keys move between neighbors).
  **Show me why:** a `Button` that highlights the Flux-to-Akash gap (the clearest versus story): an arrow
  from Akash to Flux and three mini rows: replicated across operators, automatic failover, domains and TLS
  (`cellFor('flux'|'akash', ...)` scores and `short`s).
- *Beat B, what "one provider per lease" means (FIG 4.2).* Two lanes side by side, **A marketplace lease**
  and **Flux, three copies**, each with a tiny app, its machine(s) and a user dot. A single `Button`
  "Pull the plug on both" kills the machine on the left and one copy on the right. Left: the app stays dark
  until the visitor presses **Redeploy by hand** (the point is human effort). Right: traffic reroutes in
  seconds and a replacement appears after a compressed wait. A `Chip tone="warn"` says "Illustrative" and
  the caption cites the cells (`Sources`). The playable version is chapter 05: end with a `LinkButton`
  "Try it for real" to `#takedown`.
- *Beat C, where the others are strong.* A row of 4 cards (`Panel variant="slab"`) from
  `platforms[].theirStrength`: **ICP** (replicated state by consensus is stronger than file sync), **GPU
  networks** (Aethir, io.net, Render: depth of high-end GPUs), **Phala** (confidential computing in
  hardware enclaves), **Akash** (no network-wide blocklist). Each card has the platform name and a swatch
  (never a filled card), the strength as a sentence, and `Sources`. A closing line: "Where Flux is weaker,
  it says so" with a link to `#arena` (`?vs=` the card's platform).
- *Phone.* The plot is full width; the card appears under the plot instead of over it; Beat B lanes stack;
  Beat C cards are a snap scroller.

**Signature.** The plot. People will look for their favorite network on it. Make it fast and tactile.

**Data.** `platforms` (16), `dimensions` (the two axes: `dimensionById`), `cells` through
`cellFor`/`scoreFor` from `@/lib/compare`, `seriesStyle()`. Beat A's headline claim must be true on the data:
if the scores change, the quadrant changes, never the copy.

**Art.** None required. (Optionally `bg-orbit-rings` at 15 percent behind the plot.)

**Motion.** Markers drift in from the center to their positions (staggered by kind: web2, DePIN, Flux last,
Flux with a Pulse ring). Beat B uses Blackout and Heal. Reduced: markers are in place.

**Honesty.** Scores are the researchers' rubric (0 to 5, `research/competitors.md` section 1), not a
measurement: say "scored on a published rubric" in the caption with a link to the rubric. Flux's own weak
spots appear in Beat C and in the Arena. Never rank platforms with an average.

**States.** Missing cell: the marker is omitted and listed under the plot in a "No data" note.

**Done when.** All 16 markers are reachable and labeled (or labeled on focus on phones); the filter and the
"Show me why" work; the color pairs (Akash and Hetzner, Render and AWS, Theta and Azure) are never
distinguishable only by hue; Beat B ends with the link to chapter 05.

---

### 05 Try to take it down (`#takedown`, `src/sections/TakeItDown/`)

**Act III.** The playground. The longest build on the page and the one people will share.

**Goal.** Let the visitor *do* the thing the hero only shows: the same app hosted three ways, and a
ladder of real-world failures to throw at it. The lesson is a number: how many independent failures it
took. One for a single-region cloud app. One for a single-provider marketplace lease. As many as you set
copies for on Flux.

**Header.** `num` 05, eyebrow "The simulation", title "Go on. **Take it down**". Lede (as in the stub):
"Three apps, one button. Knock out a server, a region, a whole provider, and watch what survives." Directly
under it a `Chip tone="warn"` "Simulation".

**The failure ladder** (the weapons, small to large). Four buttons in a `role="radiogroup"` (keys 1 to 4):

| # | Weapon | Icon (`lucide`) | Meaning in each lane | Real-world echo (read from `incidents`, never typed) |
| --- | --- | --- | --- | --- |
| 1 | A machine | `Zap` | One server or node | a dead disk or host (no incident) |
| 2 | A data center | `Flame` | One facility or availability zone | `ovh-fire-2021`, `gcp-london-2026` |
| 3 | A country or region | `Globe` | A whole geography | `aws-middle-east-2026` |
| 4 | A company | `Ban` | The provider, hosting company or account | `gcp-railway-2026`, `hetzner-solana-2022` |

Each button shows its echo as "Like: {incident.title} ({year})" with a link to chapter 01's board.

**Layout (desktop).**
1. **The weapons rail** across the top: the four buttons above.
2. **Three lanes** (equal `Panel`s, each a `container`), left to right:
   - **A single-region cloud app** (`data-mood="cold"`): one instance in one zone of one region at one company.
     A `Switch` "Configure for resilience" (off by default) adds three zones and automatic repair inside the
     region. Name it generically ("one big cloud"), never a vendor.
   - **A single-provider marketplace lease**: one lease on one provider's machine. No automatic failover; the
     owner must redeploy by hand.
   - **Flux**: your copies on a field of 36 illustrative nodes. A slider **Copies** (1 to 12; "up to 100" in
     the label; default 3) and a `Segmented` **Placement**: "Where the nodes are" (the default: copies land
     where nodes are, which is mostly Europe) or "Spread across continents" (one geolocation rule).
   Each lane has: a header with a status `Chip` (Serving, Failing over, Down), a field (Canvas 2D, about 300
   px tall) showing hosts, data centers, countries and the app's copies, a `HexGauge` of uptime since the
   last reset, three counters (Served, Retried, Failed) fed by a stream of request dots, and the big
   readout **Failures it took: N** (distinct failure events that hit a facility hosting a copy).
3. **Controls under the lanes:** **Fire at random** (Space; fires the selected weapon at something that
   currently hosts the app in *every* lane at once, the quickest comparison), **Chaos mode** (`Switch`,
   `tone="crit"`: a random failure every 2.5 s), **Reset** (always visible). A collapsed
   "What this does not model" `Popover` (below).
4. **The result card** when all three lanes have been down at least once (or on Reset after Chaos): "A
   single-region app fell to {a}. A single-provider lease fell to {b}. Flux took {n}." with `ShareBar`
   (`section="takedown"`, `params={{ copies, place }}`), so the link reproduces the scenario.

**Interaction.** Pick a weapon, then click (or tap) a thing in a lane: the weapon applies at that scale to
that thing (hover previews the blast radius: the affected hosts are outlined in alarm). Keyboard: Tab into a
lane, arrow keys move over its targets, Enter fires, keys 1 to 4 change weapon from anywhere in the section,
Space fires at random. Every event is narrated in a polite `aria-live` line per lane ("Frankfurt data
center failed. Flux: two of three copies still serving. Traffic rerouted in 3 seconds").

**The model** (`src/sections/TakeItDown/sim/model.ts`, one file, every constant commented with its source).
Fixed time step 20 Hz, rendering per frame, deterministic `mulberry32(seed)` (seed from `?s=` so a shared
scenario replays), all state in plain arrays, no allocation in the loop.

| Parameter | Value | Where it comes from |
| --- | --- | --- |
| Health check | every 3 s; a copy is marked down after 2 failures, back after 2 successes | `features['self-healing']`, `research/flux.md` 5.3 (FDM) |
| Retries | 3 with redispatch: a request that hits a dead copy is retried on a live one (drawn amber, not red) | same |
| Detection gap | up to about 6 s from failure to "marked down"; requests in the gap are retried, not lost, if any copy lives | derived |
| Rebuild wait, sudden loss | the copy's record expires: up to 125 minutes | `features['self-healing']` (`locationTtlS 7500`) |
| Rebuild wait, clean shutdown | 7 minutes | same (`sigtermExpiryS 420`) |
| Rebuild, shown | compressed: 1 s of sim time is about 5 minutes; the lane shows a progress bar labeled "time compressed" | model |
| Install and sync | minutes (shown as 3 s) | `lifecycle['install']` |
| Placement | one copy per node; a hosting company takes at most `ceil(copies / companies)` copies | `features['fault-domains']` |
| Marketplace recovery | none: the owner must press **Redeploy**; a new lease takes 4 s | `platforms['akash'].fluxEdge`, `cellFor('akash','self-healing')` |
| Single-region cloud | default: 1 instance, 1 zone; configured: 3 zones and auto-repair after 10 s (compressed). A region or account failure kills all of it either way | `cellFor('aws','self-healing')`, `cellFor('aws','multi-operator-redundancy')` |
| Request rate | 8 per second per lane (visual) | model |

The Flux field: 36 nodes sampled from `useFluxLive().byCountry` by largest-remainder (so Europe's weight
is real), assigned to illustrative hosting companies (three per country, weights .55, .30, .15) and
named only "Host A, B, C" with the country. Say so in a caption: "Illustrative hosts, real country split".
Without live data, fall back to a fixed, labeled set of six countries.

**Signature.** Press Space. Three apps take the same disaster at once: two go dark and flicker red, the
third wobbles amber for a second and carries on. Then the visitor drags **Copies** to 1 and presses
Space again: it dies too, and says so ("A single copy is a single copy: down until the network rebuilds
it, up to about two hours in real life"). That honesty is the chapter's credibility.

**Data.** `useFluxLive().byCountry` (and `@/lib/geo.continentOf`), `incidents` (weapon echoes), `features['self-healing']`,
`features['fault-domains']`, `cells`/`platforms` for the web2 and marketplace captions.

**Art.** None. The lanes are drawn. (`bg-lattice-floor` at 20 percent under the Flux lane is optional.)

**Motion.** Blackout on every failed host, Heal on every recovery, Pulse ring when a copy is rebuilt,
request dots as Beams; the "Down" state dims its lane and shows the stopwatch of how long it has been
down. Reduced: no Chaos mode, no autoplay; failures apply at once with the text narration.

**Honesty.** Label the section a **Simulation** (a `Chip tone="warn"` in the header row) and the Flux field
**Illustrative hosts, real country split**. "What this does not model" lists: a bug in FluxOS itself; the
signed blocklist the team publishes and nodes honor; the default load balancer being run by the Flux team
(anyone can run their own); an attack on the chain; a single-copy app's real downtime. The result is a
property of independence: more independent hosts, more failures needed, not "unbreakable". Never say
"cannot be taken down".

**States.** Pause the loop offscreen (`useActive`). WebGL is not needed. If Canvas 2D fails, show the
counters and the narration only.

**Done when.** The three lanes behave as in the table; every weapon works on every lane by mouse, touch and
keyboard; Space and Chaos work; Copies and Placement change the outcome visibly; the share link replays the
scenario; reduced motion works; 390 px shows the lanes as stacked bands with the weapons rail fixed to the
bottom; sustained 60 fps on a mid laptop (profile it).

---

### 06 The people who run the network (`#operators`, `src/sections/Operators/`)

**Act III.** The human answer to "who is out there?" and the first honesty beat of the proof.

**Goal.** Make the network feel like people with machines, make "anyone can run one" tangible, and show
the real map, including that it is lumpy.

**Header.** `num` 06, eyebrow "Community node operators", title "The network is *people*". Lede (computed):
"{Over a thousand} operator identities run the hardware. Lock the collateral, run the software, pass the
benchmark, get paid by the protocol. Three tiers, one open door." "Over a thousand" is built from
`live.operators` (`>= 1000`), else the exact number.

**Layout.**
- *Beat A, three tiers.* Three equal `Panel interactive tilt` cards, each `data-tier` (re-points the
  accent). Top: the emblem (`emblem-cumulus|nimbus|stratus`, `ArtPlate mode="flow"`, 160 px, screen
  blend). Then the tier `Chip` with the name, **collateral** (`CountUp`, "FLUX locked", from
  `nodeTiers[].collateral`), a four-row spec sheet (cores and threads, RAM, SSD, benchmark; mono, with a
  `Ruler` between), the **live count** and **share** (`live.tiers[id]`, `tierShares(live)`), the `pitch`
  line, and `Sources`. Equal heights; the Stratus card is not "better", it is bigger.
- *Beat B, could your machine run one? (the signature).* A `Panel` with `node-hero` as a 40 percent
  backdrop on the right. A button **Check this device** reads `navigator.hardwareConcurrency` and
  `navigator.deviceMemory` (nothing leaves the browser; say so). Then three `Meter` rows, one per tier,
  "Your device reports {n} threads and {m}+ GB of memory": for each tier a threads meter (`n` of the tier's
  threads) and a RAM meter, each with a plain verdict (meets / short / "cannot tell"). Below, a fixed line
  of what a browser cannot read: SSD size and write speed, bandwidth, a public IP and about 97 percent
  uptime, plus the collateral. Memory is capped at 8 GB by browsers and missing in some: say "at least 8 GB"
  and "cannot tell". Never say "your laptop qualifies". Tone: curious and a little funny, not a sales
  pitch. Button label "Check this device", result heading "Your device, roughly".
- *Beat C, where they are (FIG 6.1).* A `Figure` with an equirectangular **hex-dot map** (Canvas 2D, fixed
  `aspect-ratio: 2 / 1`): land from a regular lat/lon grid tested with `isLand(lat, lon)` (`landmask.ts`,
  3 degree cells in offset hex rows, drawn once to an offscreen canvas), nodes from `live.points` as glowing
  discs sized by `log(weight)` in tier color (`screen` blend). A `Segmented` filters All / Cumulus /
  Nimbus / Stratus. Hover or focus a country row highlights its nodes on the map; hovering the map shows
  the nearest cluster in a tooltip (country, tier counts). Beside it, **continent bars**
  (`continentShares(live.byCountry)`: name, percent, count) and the **top ten countries**
  (`countryCounts(live, 10)`, `countryFlag`, `countryName`, a three-segment tier bar in tier colors with a
  one-line legend). Phone: the map goes full width above the lists; the lists become one column.
- *Beat D, the honest picture.* A band titled "Open to anyone. Not yet evenly spread" with up to three
  tiles (`Panel variant="slab"`, each a big number, one sentence, `Sources`): (1) **Europe's share** of
  nodes (computed from `continentShares`), (2) **the biggest hosting company's share** and (3) **how few
  operator IDs run half the nodes**. Tiles 2 and 3 need data that is not in `src/data` yet (section 13):
  render them only when it exists; until then show tile 1 plus the `asns` fact ("nodes sit on {asns}
  different networks"). Tell it plainly: this is where Flux still has work to do, and that is why copies can
  be pinned across countries (link to `#takedown` and `#kubernetes`).
- *Beat E, how a node gets paid.* Three payout cards for the current block from
  `blockReward(estimateHeight(live) ?? live.blockHeight)`: Cumulus, Nimbus, Stratus (FLUX per block, tier
  colors, no USD, no price, no yield). A block heartbeat: a `HexGauge` filling over `CHAIN.blockSeconds`
  and a field of small hexes in which one per tier lights each block (illustrative: "which node is paid is
  decided by the network"). Two facts underneath, from data: "Every {CHAIN.blockSeconds} seconds, one node in
  every tier is paid" and the next annual reduction from `nextRewardReduction(height)` ("in about {n}
  days", computed). One honest line: rewards come from new issuance today; sharing app revenue with
  operators is planned, not live (`ecosystem['pnr-v2']`, status `announced`: render it as "planned").
- *Closing CTA row.* `LinkButton` "Read the node docs" (the docs link in `nodeTiers[0].sources`) and "Stake
  with Titan" (`ecosystem['fluxnodes'].url` family).

**Signature.** Beat B. People will screenshot their device's "Cumulus: 4 of 4 threads" line.

**Data.** `nodeTiers` (3), `useFluxLive()` (`tiers`, `points`, `byCountry`, `operators`, `asns`, `blockHeight`),
`tierShares`, `countryCounts`, `countryName`, `countryFlag`, `blockReward`, `nextRewardReduction`,
`estimateHeight`, `CHAIN`, `continentShares`, `ecosystem['fluxnodes']`, `ecosystem['pnr-v2']`.

**Art.** `emblem-cumulus`, `emblem-nimbus`, `emblem-stratus`, `node-hero`.

**Motion.** Reveal for the cards, `CountUp` for collateral and counts, the map's nodes ignite outward from
the viewer's own continent (guess from `Intl.DateTimeFormat().resolvedOptions().timeZone`, or start at
Europe), the block heartbeat. Reduced: static map, no heartbeat motion.

**Honesty.** "Operator identities" (Flux IDs), not "operators" as people; "nodes", not "servers"; say
"collateral locked", never "invest" or "earn X"; no FLUX price; no yield; the map is IP geolocation (say so
in the caption); 48 percent of nodes sit on data-center IPs, so do not picture only home setups.

**States.** `points` empty: show the tier cards and lists, with the map as a skeleton. `deviceMemory`
undefined: "cannot tell".

**Done when.** Cards equal; the device check works and is honest in Chrome, Firefox and Safari; the map and
the lists agree and are keyboard reachable; the honest band renders with the data it has; no price or yield
claim anywhere; 390 px has no horizontal page scroll.

---

### 07 Your app, sealed (`#sealed`, `src/sections/Sealed/`)

**Act III, right after Operators.** It answers the obvious objection to "anyone can run a node": *so can
a stranger see my app?* Working title "Your app, sealed", nav label "Privacy".

**Goal.** Show, concretely and fairly, what a node operator can and cannot reach on a hardened ArcaneOS
node, side by side with a legacy node where the same attempt gets in. The visitor should leave with a
specific picture (an operator at a terminal, trying and failing) and three specific caveats: it is a locked
door, not a hardware vault; the traffic and memory rows are where ArcaneOS does not say no; and Flux
itself is the party you still trust. **The honest layers are the credibility of this chapter.**

**Header.** `num` 07, eyebrow "ArcaneOS and privacy", title "Your app, **sealed**". Lede: "Anyone can run a
node. So can a stranger look inside your app? Here is what a node operator can and cannot reach."

**Read first.** `research/privacy.md` (the verified findings, the threat model, section 13 "claims to
avoid" and section 14 "caveats the copy must respect") and the types in `src/data/types.ts`. Everything on
the page comes from the data below; the UI adds no capability, layer, verdict or claim of its own.

**Data.**
- `operatorAccess: OperatorAccessRow[]` (13 rows, `@/data/flux`). Shape (`types.ts`):
  `{ id?, capability, legacy: Verdict, arcane: Verdict, note, legacyNote?, arcaneNote?, layer?, sources }`.
  **Verdict direction:** the question is "Can a node operator ...?" so `yes` means the operator **can** (your
  app is exposed), `no` means they cannot, `partial` means only under the conditions in the notes, `na` does
  not apply. `capability` follows "Can a node operator ..." (for example "Open a shell inside your
  container"). `layer` is the short name of the ArcaneOS layer that decides it ("No root account", "No TEE").
  Map the verdicts once, in one function: `no` is Flux blue with a lock glyph and the word **Denied**,
  `partial` is orange and **Limited**, `yes` is alarm red and **Gets in**, `na` is a dash. Color is always
  paired with the word.
- `privacy: Feature[]` (9 items, `@/data/flux`): the mechanisms (Secure Boot, signed and read-only system,
  encrypted disks, private specs, the audit, and the honest limits). Cards in Beat B.
- `fluxStats` ids `arcane` (94 percent of nodes) and `privateApps` (56 percent of registered apps use
  encrypted specs; its `note` says 789 of 969 public specs publish their environment variables). Fresh
  share: `useFluxLive().arcaneNodes / totalNodes` (a snapshot field: show the `FreshnessChip`).
- `milestones` 2025-03-31 (ArcaneOS), 2025-06-24 (private specs), 2025-11-18 (the Halborn audit), 2026-09-08
  (FluxOS 8.18.0: operators lose every app-scoped verb), `ecosystem['arcaneos']`,
  `cellFor('flux', 'open-source')` (its `detail` says the attestation service is closed source).
- *Not in `src/data` yet (request, section 13):* the "who you still trust" facts (`research/privacy.md` section
  8), the Halborn counts and the short comparison with enclave platforms (section 11). Until they are in the
  data, write them from `research/privacy.md` with its wording and put the link to the page in a `Sources`
  entry.

**Layout.**
- *Beat A, the operator's seat (FIG 7.1), the signature.* A wide `Panel variant="glass"` in two halves.
  - *Left, the seat.* A mono terminal pane headed `operator@node ~ $` with the `node-hero` plate faded to 25
    percent behind it. A `Segmented` **Node**: "Legacy node" and "ArcaneOS node" (the data's own words; the
    caption under it says what each is: a legacy node is set up the traditional way and its operator is
    root; an ArcaneOS node is the hardened image that about 94 percent of the network runs). Under it a
    list of **attempts**: a heading "Can a node operator ...?" and one `Button size="sm" variant="secondary"`
    per `operatorAccess` row, labeled with `capability`. A **Run all** primary button. Each attempt prints
    an *illustrative* command line (neutral, never claiming real internals; keep a small `command` map
    keyed by row `id` with a generic fallback `$ try: {capability}`), then a result line: the verdict chip
    and the row's `legacyNote` or `arcaneNote` (fall back to `note`) for the selected node, then `Sources`.
  - *Right, the app.* The `container-crystal` plate (`ArtPlate mode="flow"`, about 340 px) in the middle of
    concentric SVG **rings**, one per distinct first part of `layer` (the text before ` + `, so
    `FluxOS API gate + encrypted disk` belongs to the `FluxOS API gate` ring), outermost first in the order the rows list them,
    skipping rows whose layer is not a defense (`By design`); at most eight thin rings 14 px apart, labeled on hover
    and focus and in a text list beside the figure. When an attempt runs a **Beam** leaves the terminal for
    the crystal and goes to the ring named by that row's `layer` (no `layer`: the outermost ring). **ArcaneOS,
    `no`:** the beam stops at its ring, which flares Flux blue, and the result says Denied. **`partial`:** the
    beam gets halfway and the ring turns orange. **`yes`:** the beam passes every ring and the crystal shows
    a red fracture, with chips naming what was reached ("traffic", "which apps run here"), never fake
    secret values. **Legacy node:** the rings are drawn dashed and open and the beam goes straight through
    for every `yes` row.
  - *Choreography and order.* Run in this order: rows whose ArcaneOS verdict is `no` first, then `partial`,
    then `yes` **last**, so the sequence ends on the honest ones (the traffic and memory rows are where
    ArcaneOS does not say no). First time the beat is 60 percent in view (and motion is allowed), play once:
    all attempts on the legacy node (they get in), flip to ArcaneOS, run them again (denied, denied, ...,
    limited, limited, **gets in**, **gets in**), then stop and hand control to the visitor. Never replay by
    itself. Under reduced motion show both result columns statically.
- *Beat B, what ArcaneOS is.* The `privacy` features as `Panel variant="slab"` cards (3 across): icon (map the
  `icon` name through a small local lucide map with `ShieldCheck` as the fallback), title,
  `stripPeriod(headline)`, `body`, the `analogy` chip, `Sources`. Above them three live figures with
  provenance: the ArcaneOS share of nodes (`FreshnessChip`), the private-app share (`fluxStats['privateApps']`),
  and "since September 2026" for the API lockout (from the 2026-09-08 milestone). The audit appears as a
  card: independent, no critical findings, and **not** "all fixed" (five findings were risk accepted).
- *Beat C, what sealed means (the ledger, mandatory).* Three columns built from `operatorAccess` by the ArcaneOS
  verdict: **Locked out** (`no`), **Limited** (`partial`), **Not covered** (`yes`). The third column is never
  empty and is as prominent as the first. Under the ledger, a fixed band **Who you still trust**: Flux
  itself decrypts private specs at its load balancers and its team and support IDs can reach inside apps on
  any node, and it signs every ArcaneOS update (`research/privacy.md` section 8). The line to write:
  "Sealed from the public and from node operators. Flux's own infrastructure and support can still access
  it." Then the practical tip: legacy nodes can only host public apps, so an app that must stay on hardened
  nodes is a private app (an encrypted spec). And the standing caveats: public apps publish their environment
  variables on chain; the attestation service is closed source (`cellFor('flux', 'open-source')`).
- *Beat D, a hardened OS, not a hardware enclave.* One `Panel` with two sentences and `Sources`: ArcaneOS
  locks the operator out; it does not hide memory from someone who controls the hypervisor or the hardware.
  Platforms built on hardware enclaves (Phala Cloud: `platforms['phala'].theirStrength`) go further there.
  This is the fair-play beat: keep it, keep it calm, link to `#arena` (`?vs=phala&view=h2h`).
- *Phone.* The app (rings, 280 px) sits above the seat; the Node toggle is sticky at the top of the beat; the
  attempts are a vertical list with results inline; the ledger columns stack.

**Signature.** The beam stopping at a ring is the picture; the **Gets in** results at the end and the
**Not covered** column are the credibility. Give both equal care.

**Art.** `container-crystal` (centerpiece), `node-hero` (seat backdrop), `bg-lattice-floor` (section plate,
25 percent). No new art is needed; do not block on any.

**Motion.** Beam (500 to 900 ms), a single Pulse ring in Flux blue for a denial, a stepped Blackout in alarm
for a leak, the fracture as a `clip-path` reveal of a red hairline. Reduced: results appear at once.

**Honesty (non-negotiable, this chapter is the easiest to overstate).** The wording rules, from
`research/privacy.md` sections 13 and 14:
- Never: unhackable, impenetrable, military-grade, bank-grade, zero-knowledge, trustless, "nobody can see it",
  "even Flux can't see it", "confidential computing", enclave, TEE (except to say ArcaneOS has none),
  "remote attestation" or "hardware-attested", "end-to-end encrypted", "every node is hardened", "operators
  have never been able to look inside", compliance claims (GDPR, HIPAA, SOC 2).
- Say: "On ArcaneOS nodes the operator is locked out: no root, no shell, no way into your files, logs or
  secrets." "Private app specs are encrypted, and app data sits on encrypted disks." "A hardened OS, not a
  hardware enclave." "94 percent of nodes (computed); make your app private to stay on them." "Since
  September 2026, hosting a node gives no access to the apps on it." "HTTPS to Flux's edge; terminate TLS
  in your app for end-to-end."
- A `partial` or `yes` ArcaneOS row is shown at the same size as a denial. Default web traffic reaches the
  node as plain HTTP across the operator's network, and a hypervisor owner can dump a VM's memory: both
  appear.
- The comparison is "legacy node" against "ArcaneOS node", not against a competitor (Beat D aside). If you
  mention enclave platforms, say they go further.
- The animation is an illustration of the table, labeled "Illustrative commands" in the figure caption; the
  ledger is the claim.

**States.** `operatorAccess` or `privacy` empty: render what exists (`ecosystem['arcaneos']`,
`features['arcane-enterprise']`) and in place of Beat A a `Panel` saying the operator's-view comparison is
being verified. Never invent rows.

**Done when.** Every attempt is a keyboard-operable button; results are announced (`aria-live="polite"`);
the ledger lists all rows and its third column is honest; the sequence ends on the rows ArcaneOS does not
block; the "who you still trust" band is present; no forbidden word appears (grep your folder for the list);
the chapter builds with the data empty and with the data full; 390 px works.

---

### 08 The comparison arena (`#arena`, `src/sections/Arena/`)

**Act III.** The "poke at it" chapter: a serious, fair, sourced comparison that is also fun to use.

**Goal.** Let a skeptic test the claims: every platform, every dimension, every answer with its receipt,
Flux's losses highlighted on purpose, a head to head that is shareable, and a way to say what matters to you.

**Header.** `num` 08, eyebrow "The arena", title "Pick a fight. **See the receipts**". Lede (as in the
stub): "Flux against other DePIN networks and the big clouds. Filter by what you care about, go head to head,
and open any cell for its source."

**Layout.** A control bar, then one stage with a fixed minimum height (no jump when the view changes).
- *Control bar:* `Segmented` **View** [Matrix, Head to head, Shape] (`?view=`); a **Priorities** button that
  opens the weights panel; on the right `ShareBar` for the current view.
- *View 1, Matrix (FIG 8.1).* A `role="grid"`: rows are the 16 platforms (Flux pinned first, then DePIN,
  then web2, each group with a quiet label row), columns are the 14 dimensions under 5 group headers
  (toggleable chips filter the groups). A cell is a hex glyph whose **fill level encodes the score** (0 to
  5) in the accent color, with `yes`, `partial` and `no` shapes distinct without color; the score digit
  shows on hover. Hover or focus draws a crosshair (row and column hairlines) and a `Tooltip` with the cell's
  `short`; click opens a `Popover` with `detail` and `Sources`. The first column and the header are sticky;
  column headers carry the dimension's `question` as a tooltip; click a header to sort rows within each
  kind by that column. A `Switch` **Show where Flux loses** rings the cells where some platform scores
  higher than Flux (`fluxTrailsOn()`) and dims the rest. Arrow keys move the cell focus; Enter opens the
  popover. Row headers show the name, kind `Chip` and a small color swatch (never a filled row).
- *View 2, Head to head (FIG 8.2).* An opponent chip row (all `rivals()`, grouped by kind, scrolls
  horizontally, default `akash`, the clearest versus story). Flux on the left, the opponent on the right,
  one row per dimension grouped by `group`: mirrored hex-pip bars (5 pips each side filled to the score)
  with the dimension label centered and each side's `short` underneath. Rows where Flux scores lower get an
  alarm tick and the words "Flux trails here". A summary line from `headToHead()`: "Flux is ahead on {wins},
  level on {ties}, behind on {losses}". Under it two cards: the platform's `fluxEdge` and `theirStrength`
  (`Panel variant="slab"`, with `Sources`). The opponent is stored in `?vs=` and the share text is built from
  the summary ("Flux vs {name}: ahead on {wins}, behind on {losses}. See the receipts").
- *View 3, Shape (FIG 8.3).* An SVG radar with 14 spokes in 5 sector bands labeled by group. Flux is
  always drawn (solid Blue Wave stroke, 18 percent flat fill); up to three more platforms picked from a
  chip row, drawn as strokes only with `seriesStyle()` (web2 dashed), each **directly labeled** at its
  strongest spoke. A `Segmented` switches Radar and Bars (five group bars per platform, small multiples,
  for precision and for screen readers). A visually hidden table carries every value.
- *Priorities panel ("What do you care about?").* Five rows (Decentralization, Resilience, Developer
  experience, Economics, Scale), each a `Segmented size="sm"` of Off, Some, Lots, Everything (weights 0 to
  3). Presets as chips: "No lock-in", "Keep it up", "I need GPUs", "Keep it cheap". It computes **fit** per
  platform (the weighted mean of scores over included dimensions; `na` and missing cells are excluded) and
  shows the top five plus Flux (always) as bars with percentages, headed "A personal weighting, not a
  ranking". For the GPU preset Flux is not first, and the panel shows it. Weights live in `?w=3,2,1,0,0`.
- *Phone.* Head to head is the default view; the matrix scrolls horizontally inside its container with the
  first column sticky and an edge fade; the radar is square with labels on tap.

**Signature.** A link that opens on a specific fight: `#arena` with `?vs=akash&view=h2h`. Make the head to
head fast, legible and a little theatrical (the bars grow from the center outward, Flux's in blue).

**Data.** `platforms`, `dimensions`, `cells` through `@/lib/compare` (`cellFor`, `scoreFor`, `headToHead`,
`fluxTrailsOn`, `rivals`, `seriesStyle`, `DIMENSION_GROUPS`, `dimensionsInGroup`). The rubric (0 to 5) is in
`research/competitors.md` section 1: show it in a `Popover` "How we scored" next to the caption.

**Art.** None required.

**Motion.** Matrix cells reveal on a diagonal (row and column index times 10 ms, capped at 600 ms); head to
head bars grow outward over 600 ms; the radar polygons tween (rAF) when the selection changes. Reduced:
instant.

**Honesty.**
- **No league table and no overall average.** The dimensions are not equally important to every buyer; the
  only aggregate is the visitor's own weighting.
- Show Flux's losses: GPU depth, ecosystem, deplatforming resistance (Akash 4 against Flux 3), replicated
  data (ICP 5 against Flux 4). Never hide a cell that hurts.
- Color pairs share a hue across kinds (Akash and Hetzner, Render and AWS, Theta and Azure): direct labels
  always, `seriesStyle()` always, never more than 8 series.
- The caption says the scores were checked on `asOf` 2026-10-24 and links the rubric; each `detail` quotes
  its source in double quotes, keep them as given.

**States.** Empty `cells`: show the platform list and a "data loading" note. Unknown `?vs=`: ignore and use
the default.

**Done when.** All three views work by mouse, touch and keyboard; the URL reproduces the view, opponent and
weights; every cell opens its receipts; "Show where Flux loses" works; the radar and the matrix each have a
text equivalent; no average or ranking is shown; 390 px works.

---

### 09 What it actually costs (`#cost`, `src/sections/Cost/`)

**Act III.** The wallet chapter: one chart, one meter, and honest footnotes.

**Goal.** Make the price difference felt, and make it credible by showing exactly what each number is.

**Header.** `num` 09, eyebrow "Cost", title "What it *actually* costs", lede (as in the stub): "The same
workload, priced across providers, with the line items the pricing pages bury."

**Layout.**
- *Controls.* A `Segmented` **Workload**: "One server" and "Three copies behind a load balancer"
  (`?bill=one|three`). Under it the full workload string from the data in mono ("2 vCPU / 4 GB RAM / 50 GB
  SSD ...") so nothing is implied.
- *The bars (FIG 9.1).* From `priceGroups()`: one horizontal bar per platform in the group, cheapest first
  (Flux first), **linear and to scale** (a log axis would hide the ratio; Flux's bar is a sliver, with a
  2 px minimum and its price label beside it). Per bar: the platform name with its color as a small swatch,
  the price (`formatUsd(n, 2)` per month), a `×` chip "19× Flux" from `timesFlux()` on every non-Flux bar,
  and a one-line sub label from the platform's `predictable-pricing` cell `short`. Flux's bar is Blue
  Wave; the others are solid steel. Clicking a bar opens a `Popover` with the data's `note` (what is and is
  not included), `asOf` and `Sources`. A `Ruler` in dollars runs under the bars.
- *The meter (the signature).* A large `Button` **Run a month** time-compresses 30 days into 4 seconds: a
  day counter runs 1 to 30 and every bar fills like a taxi meter while its number climbs (`formatUsd`,
  rAF, ease-out). At day 30 a line reads "{AWS}: ${n}. {Flux}: ${m}." with the multiple. A **Reset**
  appears. Reduced motion: jump to the end.
- *Footnotes (visible, never behind a toggle).* From the data's `note` fields and
  `research/competitors.md` section 5: the AWS, Azure and GCP machines are burstable or shared-core and a Flux
  instance's two cores are reserved on a benchmarked node but are not dedicated physical cores ("do not
  read this as performance parity"); a single Flux copy is down until the network rebuilds it; Hetzner is
  Europe-only and showed "currently unavailable" on the check date; the Akash figure uses the default
  provider price script (real leases ran from under $1 to over $14); Flux can be paid in FLUX at 5 percent
  off. Each is a short sentence with its `Sources`.
- *Link out.* "See the full comparison" to `#arena` with `?vs=aws&view=h2h`.
- *Phone.* Bars become stacked rows (label above the bar); the meter button is sticky at the bottom of the
  chart while it is on screen.

**Data.** `prices` (13) and `platforms` through `priceGroups()`, `timesFlux()`, `cellFor(id,
'predictable-pricing')`. Every number is read, none typed: the "19×" and "26.6×" are computed.

**Art.** None.

**Motion.** Bars grow from zero on entering; the meter; the ratio chips pop (`--ease-snap`).

**Honesty.** No "90 percent cheaper", no savings percentage, no claim beyond the table. Use the researchers'
numbers, not the FluxCloud page's ("$2.29 versus $79.92" is wrong against the live API). Say "two reference
workloads, priced on {asOf}". If a platform has no price for a workload, it is simply absent.

**States.** No prices: hide the chart and show the footnote about how the data is gathered.

**Done when.** Both workloads render to scale; the meter runs and resets; every bar opens its receipt; the
footnotes are visible; keyboard operable; 390 px works.

---

### 10 More than a cloud (`#ecosystem`, `src/sections/Ecosystem/`)

**Act IV, plate `bg-orbit-rings`.** The dawn begins: the network is also tools, products and a history.

**Goal.** Show that Flux is a family of things around one network, and that it has been running for years.
Keep it honest about what is live and what is planned.

**Header.** `num` 10, eyebrow "Ecosystem", title "More than a **cloud**", lede (stub): "The products, tools and
milestones growing around the network."

**Layout.**
- *Beat A, the orbit (FIG 10.1), the signature.* The Flux symbol (`/brand/Flux_symbol_blue-white.svg`) in the
  center of five concentric rings drawn as hairlines over the `bg-orbit-rings` plate. The 12 `ecosystem`
  items sit on the rings as hex nodes, grouped by a local map (ring: item ids): **Build** (`fluxcloud`,
  `orbit`, `mcp`, `marketplace`), **Run** (`fluxos`, `fluxedge`, `fluxai`, `fluxdrive`), **Operate**
  (`fluxnodes`, `pnr-v2`), **Secure** (`arcaneos`), **Pay** (`wallets`). The rings rotate very slowly
  (120 to 240 s per turn, paused on hover and focus, static under reduced motion). Selecting a node (click,
  tap or the list) fills a detail panel: name, a status `Chip` (`live`, `beta`, `announced`, `deprecated`),
  `stripPeriod(headline)`, `body`, a `LinkButton` "Open" to `url`, and `Sources`. `announced` items are drawn
  as a dashed hex with the word "Planned": never present them as live (`pnr-v2` is planned). The orbit is
  decorative to assistive tech; the **list** beside it (a real `<ul>` of buttons, grouped by ring name) is the
  accessible twin and the phone layout.
- *Beat B, the timeline (FIG 10.2).* The 12 `milestones` on a horizontal `Ruler` (years labeled), each a hex
  tick with date, title, body and `Sources`; scroll-snap, drag to scroll with the pointer, arrow keys, edge
  fades, never hijacking the wheel. The expected milestone (the first annual reward reduction) is hollow
  with an "Expected" chip and a live countdown computed with `nextRewardReduction(estimateHeight(live))`
  ("in about {n} days"); once the height has passed it, it renders as happened. Phone: a vertical timeline.
- *Closing line.* One sentence and a `LinkButton` to `#proof`.

**Data.** `ecosystem` (12), `milestones` (12), `useFluxLive()` (`blockHeight`), `estimateHeight`,
`nextRewardReduction`, the brand SVG in `public/brand/`.

**Art.** `bg-orbit-rings` (section plate), the symbol SVG.

**Motion.** Items fly out from the center to their rings on entering (stagger by ring); hovering a node
draws a Pulse ring and lifts its ring's hairline to `--accent`.

**Honesty.** Statuses mirror the data. FluxEdge is a GPU rental marketplace with partners, not the core
cloud. Wallets are third-party apps (Zelcore, SSP). Do not describe PNR as live. No token price anywhere.

**States.** If `ecosystem` is empty, show the plate and the timeline only.

**Done when.** Every item is selectable by keyboard through the list; planned items are visibly planned;
the timeline scrolls by touch, drag and keys; the countdown is computed; 390 px shows the list and the
vertical timeline.

---

### 11 Watch the network (`#proof`, `src/sections/LiveProof/`)

**Act IV.** The evidence chapter: big numbers, a heartbeat, and a way to verify them yourself.

**Goal.** Replace "trust us" with "check us". Every number is live or labeled as a snapshot, and the
visitor can reproduce it with one copied command.

**Header.** `num` 11, eyebrow "Live proof", title "Don't take our word. **Watch the network**", lede (stub):
"Live numbers, straight from the nodes."

**Layout.**
- *Beat A, the proof wall.* Eight `Stat size="xl"` figures from `fluxStats` with fresh values
  (`liveStatValue(stat.id, live) ?? stat.value`): nodes online, countries, apps running now, CPU cores, RAM,
  SSD storage (`formatStorageTb`), collateral locked, operator identities. Each shows a `FreshnessChip` and
  `Sources` and counts up on entering. Four across on desktop, two on phones.
- *Beat B, the heartbeat.* The chain height as a big number (`estimateHeight(live) ?? live.blockHeight`,
  labeled "Estimated" when it comes from the snapshot), a `HexGauge` that fills over `CHAIN.blockSeconds`
  and a new block ticking in, and the sentence from the data: nodes that host apps also produce the blocks
  (`milestones` 2025-10-25). Add "{yearsSince('2018-01-26')} years on chain" from the milestone.
- *Beat C, the shapes.* Three small plates: **tier shares** (`tierShares`, three solid segments in tier
  colors with names), **top countries** (`countryCounts(live, 8)`, flags, bars), and two `HexGauge`s: apps
  with two or more copies (`liveStatValue('redundancy', live)`) and nodes running ArcaneOS
  (`arcaneNodes / totalNodes`).
- *Beat D, check us (the signature).* A `Panel` with a terminal look. One row per live endpoint from
  `LIVE_ENDPOINTS` in `@/lib/live` (read `src/lib/live/store.ts`; never invent an endpoint): what it
  returns, a one-line `curl` command with a **Copy** button (`copyText` and a toast), an **Open** link, and a
  **Run it now** button that fetches it in the browser and prints the first lines of the response in the
  pane, with the number it returned set beside the number on the wall ("6,854 here, 6,854 there"). Failures
  print the error in plain words. This is the page's most shareable honesty move.
- *Phone.* Wall in two columns; Beat D's code wraps; the run button is full width.

**Data.** `fluxStats`, `useFluxLive()` (nearly everything), `liveStatValue`, `capacityTotals`,
`formatStorageTb`, `tierShares`, `countryCounts`, `estimateHeight`, `CHAIN`, `LIVE_ENDPOINTS`, `copyText`.

**Art.** None. (A faint `bg-lattice-floor` at 15 percent is fine.)

**Motion.** `CountUp` on entering; the heartbeat ring; rows of Beat D type in one at a time on run. Reduced:
no counting animation, no ring motion.

**Honesty.** A snapshot value is never called live; the chip says which it is. "Operator identities" are
Flux IDs. "Apps running" are distinct apps. Say "nodes", not "servers". If a fetch fails, the numbers stay
(snapshot) and the chip says so.

**States.** `loading`: dashes, then numbers. `snapshot`: chips say snapshot. Offline: Beat D explains why a
run failed instead of hiding.

**Done when.** All numbers match the endpoints; the chips are truthful in all three states; copy and run
work; the chapter is calm under reduced motion; 390 px works.

---

### 12 Your move (`#join`, `src/sections/Join/`)

**Act IV, plate `bg-dawn`.** The release: dawn, three doors, one share.

**Goal.** Send the visitor to the next step they actually want: deploy something, learn how it works, or see
the network. Equal doors; no pressure.

**Header.** `num` 12, eyebrow "Join", title "Your move", lede (stub): "Deploy something, run a node, learn how
it works, or just look around."

**Layout.**
- The `bg-dawn` plate rises behind the section as the visitor scrolls in (`--p` scrub, opacity 0 to 1) and
  a lens streak (`fx-lens-streaks`) crosses it once.
- *Three doors:* three equal `Panel interactive tilt` cards, each an `h3`, one line, an icon and a
  `LinkButton`: **Deploy an app** (`LINKS.cloud`, "Open FluxCloud", `primary`; one line "With Docker, Git or
  an AI agent"), **Learn how it works** (`LINKS.academy`, "Open Flux Academy", `secondary`), **See the network**
  (`LINKS.atlas`, "Open Flux Atlas", `secondary`). External links open in a new tab.
- A quieter row beneath: **Run a node** (the node docs link from `nodeTiers[0].sources`), **Read the code**
  (`LINKS.github`), **Back to the top** (`#top`).
- *The share:* a `ShareBar` with a quotable line ("Pull the plug, it keeps running"), and a last small
  `FreshnessChip` with the node count ("{nodes} nodes online right now").
- *Phone:* the doors stack at equal height.

**Signature.** The dawn: the first thing on the page that is warm-white rather than blue. Keep it calm and
confident; this is the exit, not another pitch.

**Data.** `LINKS`, `ecosystem['fluxcloud'].url`, `nodeTiers`, `useFluxLive().totalNodes`.

**Art.** `bg-dawn`, `fx-lens-streaks`, `fx-bokeh` (very light).

**Motion.** Plate scrub, one lens streak, Reveal on the doors (stagger 70 ms). Reduced: the plate is simply
present.

**Honesty.** No price, no "free", no promise of earnings. Orbit's starting price may appear only if read
from `ecosystem['orbit'].body`.

**Done when.** Three equal doors with correct `href`s and `rel`; the share works; the closing is the last
thing before the footer; 390 px works.

---

## 10. Art map

All plates are in `public/art/` (generated, PNG; WebP conversion is on the request list). The manifest is
`src/lib/art.ts`; the lossless masters are in `assets-src/art/`. Pure-black-floor plates composite with `screen`,
opaque plates with `normal`; `ArtPlate` reads this from the manifest.

| Plate | Where it is used |
| --- | --- |
| `hero-horizon` | 00 poster (first paint and the no-WebGL fallback); social previews |
| `og-backdrop` | The social card (`public/og.png`, see section 12) |
| `bg-blackout` | 01 section plate |
| `monolith-trio` | 01 Beat A (concentration) |
| `bg-lattice-floor` | 02 back plate; 03 under the nodes lane; 07 section plate; optional 05 and 11 |
| `container-crystal` | 03 the app sprite; 07 the sealed app |
| `emblem-cumulus`, `emblem-nimbus`, `emblem-stratus` | 06 tier cards |
| `node-hero` | 06 Beat B backdrop; 07 the operator's seat backdrop |
| `bg-orbit-rings` | 10 section plate; optional 04 behind the plot |
| `bg-dawn` | 12 section plate |
| `fx-lens-streaks` | 12 (one pass); Interludes (optional); no longer in the hero |
| `fx-bokeh` | 00 (light, masked off the planet); 12 (very light) |

Rules: never put a plate behind a dense data view without a dark scrim of at least 55 percent (legibility
fade into black is the one allowed gradient); keep plates at 25 to 60 percent opacity behind content;
parallax travel at most 70 px; `priority` only for the hero.

---

## 11. URL state and sharing

State worth sharing lives in the query string, read at first render (no flash) and written with
`useUrlParam` (`replaceState`, so the back button is for pages). Section links use the hash (`#arena`).
`shareUrl(section, params)` builds a link; `<ShareBar section params text>` offers copy, native share and
the intents. Unknown values are ignored and fall back to the default.

| Param | Chapter | Values | Meaning |
| --- | --- | --- | --- |
| `inc` | 01 | an incident id | The selected incident on the board |
| `kind` | 01 | `outage`, `physical`, `deplatforming` | The board's filter |
| `on` | 03 | `docker`, `git`, `agent` | The selected on-ramp |
| `copies`, `place`, `s` | 05 | `1` to `12`; `default` or `spread`; a seed | The Flux lane's copies and placement; the random seed that makes a scenario replay |
| `tier` | 06 | `cumulus`, `nimbus`, `stratus` | The map filter |
| `host` | 07 | `legacy`, `arcane` | The selected host |
| `view`, `vs`, `with`, `w` | 08 | `matrix`, `h2h`, `shape`; a platform id; up to three ids, comma separated; five weights `3,2,1,0,0` | The view, the opponent, the radar's extra platforms, the priorities |
| `bill` | 09 | `one`, `three` | The workload |
| `q` | 00 | `low`, `medium`, `high` | Forces the globe's quality (a debug and support switch) |

---

## 12. QA checklist and tooling

### 12.1 Every chapter, before you report

- [ ] `npm run typecheck` passes; no `any` you did not need; no unused exports left behind.
- [ ] The dev server (`http://127.0.0.1:5190`, already running; never start another) shows the chapter
      with a **clean console** (no errors, no warnings you caused).
- [ ] Looks right at **390, 768, 1440 and 1920** px; **no horizontal page scroll**; nothing clipped.
- [ ] **Keyboard only:** every control reachable in a sensible order with a visible focus ring; every
      pointer interaction has a key equivalent; Escape closes things; no focus traps.
- [ ] **Reduced motion** (footer toggle set to Reduced, or `--reduced` in the shot tool): no travel, loops
      or autoplay; end states visible; nothing is lost.
- [ ] **No data, loading data, live data:** placeholders, skeletons that match the final height, then values.
- [ ] Every number is **read from `src/data` or `src/lib/live`**, formatted with the helpers, next to
      `Sources` or a `FreshnessChip`. Search your files for digits in copy: there should be none.
- [ ] **House rules:** grep your folder for `gradient` (only mask fades and scrims allowed), for trailing
      periods on headings and buttons, for em dashes and for emoji. None.
- [ ] **Honesty:** nothing from the claims-to-avoid table; simulations and illustrations are labeled.
- [ ] **Performance:** no loop runs offscreen (`useActive`); a profile of the signature interaction holds
      60 fps on a mid-range laptop (or note the software-GL number); no layout shift as data arrives.
- [ ] `BuildSlot` removed; the stub's `id`, export name and folder kept; `chapters.ts` not edited.

### 12.2 Tools

- **Dev server:** `http://127.0.0.1:5190` (Vite, HMR). Leave it alone.
- **Typecheck:** `npm run typecheck`. **Build:** `npm run build` (watch the chunk sizes: the three.js chunk
  is lazy; initial JS should stay near 220 KB gzipped).
- **Screenshots:** `node /tmp/whyflux-tools/shot.mjs <url> <out.png> [options]` (headless Chromium with
  software GL; `playwright-core` is installed in that folder, so run it from there; a copy of the script is
  in `tools/shot.mjs` with setup notes).
  Options: `--w 1440 --h 900 --dpr 1`, `--mobile` (390 x 844, DPR 2, touch), `--wait 2500` (ms before the
  shot), `--scroll "#arena"` (scroll a selector to the top) or `--scroll 1200`, `--reduced`, `--full`,
  `--fps` (measure rAF rate for 3 s), `--eval "js"` (run JS after the wait and print the result),
  `--hover "css"`, `--click "css"`, `--clip x,y,w,h` (crop), `--steps '[{"scroll":1200,"wait":800,"out":"a.png"}]'`
  (a sequence with several shots). It prints console errors, failed requests and whether the page overflows
  horizontally. Example: `node shot.mjs "http://127.0.0.1:5190/?vs=akash&view=h2h" /tmp/a.png --scroll "#arena" --wait 3000`.
- **A WebGL note:** screenshots use SwiftShader (software), so frame rates are a floor, not a measurement.
- **The OG card:** `tools/og.html` is a self-contained 1200 x 630 page (the `og-backdrop` plate, the symbol
  and the headline, no numbers) and `public/og.png` is rendered from it through the dev server:
  `cd /tmp/whyflux-tools && node shot.mjs "http://127.0.0.1:5190/tools/og.html" /home/stache/.t3/projects/whyflux/public/og.png --w 1200 --h 630 --wait 1800`.
  Re-render it if the headline changes.

---

## 13. Open data requests and decisions

### 13.1 Data requests

None of these blocks a chapter: each chapter renders without them and says what it needs.

1. **`privacy` and `operatorAccess`** (in progress): chapter 07.
2. **Concentration facts as `Stat[]`** (`concentration` in `flux.ts`): Europe's share is derivable from
   `byCountry`, but the **biggest hosting company's share** (Hetzner AS24940, 1,733 nodes, about a quarter),
   **how few operator IDs run half the nodes** (39) and a third (14), the **largest operator's node count**
   (371) and **data-center IP share** (48 percent) are in `research/flux.md` only. Needed by 06 Beat D.
3. **Hosting-company distribution** (`hostingOrgs: { name; asn; nodes }[]`, the top 10 to 15): so the Flux lane
   in 05 can use real hosting companies instead of illustrative ones.
4. **`Incident.kind`** (`outage`, `physical`, `deplatforming`), additive and optional: replaces the UI-side
   map in 01.
5. **"Where it differs"** as an extra `ConceptMapping` (or a `Feature`) with sources, so 02 can show the
   analogy's limits with `Sources` chips (the text is `research/flux.md` section 6, last paragraph).
6. **Enterprise-app share as a `Stat`** (1,230 of 2,200 registered apps, snapshot-only): chapter 07.
7. **Egress prices per provider** (only if the Cost chapter should grow an egress slider).
8. **Spelling:** data strings use UK spellings in places (`centre`, `organisations`). The UI does not rewrite
   data; if a consistent US spelling is wanted, normalise at the source.
9. **Art:** export `public/art/*` as WebP or AVIF (15 MB of PNG today; roughly 85 percent smaller). The
   manifest (`ART_EXT`) switches in one line.

### 13.2 Decisions log

| Date | Decision | By |
| --- | --- | --- |
| 2026-10-24 | No gradient text; no decorative gradients in chrome; emphasis is weight plus solid color | User |
| 2026-10-24 | No trailing period on headlines, taglines, CTAs, captions | User |
| 2026-10-24 | Chapter 03 shows Docker, Git (Orbit) and an AI agent (MCP) as three equal on-ramps | User |
| 2026-10-24 | The hero globe is a showcase: no click to knock out, no "Simulation" tag, no instruction captions, glow turned down to an accent. The tooltip shows only location, tier and node count | User |
| 2026-10-24 | New chapter `sealed` (07, nav "Privacy", act III) after Operators; later chapters renumbered | User |
| 2026-10-24 | The hero keeps a quiet ambient failover loop (no controls, no claims); it is one switch (`ambientFailover`) if it should go. Where real positions are missing the globe says "Illustrative node positions" | Design |
| 2026-10-24 | The hero's four numbers are a bar at the foot of the planet, not a panel, so the globe is visible | Design |
| 2026-10-24 | Lora italic appears once on the page (chapter 01's closing line) | Design |
| 2026-10-24 | US English in new copy | Design |
| 2026-10-24 | No league table or overall average in the arena; the only aggregate is the visitor's own weighting | Design |
