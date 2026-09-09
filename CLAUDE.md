# CLAUDE.md — That AI Consultancy website

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- Read `brand/brand_guidelines.md` (v2.0) before touching anything visual. It is the source of truth
  for the symbol, lockups, colour and spacing.
- Read `brand/brand_guidelines_v2.1_changes.md` — three places where the guidelines prose disagrees
  with the approved artwork, and which one wins.

## Stack
Astro 7 (`output: 'static'`), plain CSS with design tokens, near-zero client JS.
**No Tailwind.** **No light mode, no theme toggle.** Dark surface only.

```
src/site.config.ts      approval variables, route gates, forbidden strings, contact details
src/content/work/*.yaml case study copy (zod-validated)
src/lib/                approvals, logo-geometry, seo, og
src/styles/tokens.css   every design token — see "Tokens" below
brand/                  guidelines + reference PNGs (not shipped)
```

## Tokens — the hard rule
Every colour, type size, space and radius comes from `src/styles/tokens.css` as a CSS custom
property. **No hex literal, and no raw px for type or spacing, anywhere else in `src/`.**
The only exempt files are `tokens.css` itself and `src/lib/logo-geometry.ts`.

`npm run lint:tokens` enforces this. Run it before every commit.

Brand palette (guidelines §3): `--surface #0A0A0A` · `--surface-2 #1A1A1A` · `--accent #00E5FF` ·
`--accent-deep #00B8CC` · `--ink #FFFFFF` · `--ink-muted #888888`.

Cyan is for links, the primary CTA, the bridge bar and active states **only**. Never a background
fill. Never body text.

## Approval variables — read this before writing any case-study copy
Client names, client quotes and several factual claims are **not approved for publication**.
They live in `src/site.config.ts` and ship hidden.

- Never hard-code a client name. Use `<Var name="client_halcyon" />` or a `{client}` token in YAML.
- Never wrap prose around a `hideWhenUnapproved` key — it renders as nothing and breaks the
  sentence. The zod `superRefine` in `src/content.config.ts` rejects this at build time.
- `<title>`, meta descriptions and OG text go through the **same** `interpolate()` as the prose.
  Never write metadata by hand.
- Both case-study routes carry `noindex` until their client-name variable is approved. This is
  derived from `routeGates`, not set per-page.

If you are unsure whether a claim is publishable, it is not. Check the brief's "Confirmed" lists.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- `npm run dev` → `http://localhost:3000` (port pinned in `astro.config.mjs`).
- `npm run preview` → builds and serves the real `dist/` on `http://localhost:3001` via `serve.mjs`.
  Use this for the pre-push check: it exercises the actual static output Vercel serves and catches
  clean-URL and asset-path mistakes that `astro dev` hides.
- If a server is already running, do not start a second instance.

## Deploy Workflow — IMPORTANT
- **All changes must be built and verified locally first.** Never push directly to GitHub without
  completing a local review.
- Workflow: edit → serve locally → screenshot → review → fix → re-screenshot → confirm → then and
  only then push to GitHub.
- Do not `git push` unless the user explicitly says to after reviewing the local version.
- The live site (Vercel) deploys automatically on push to `main` — treat every push as a production deploy.

## Screenshot Workflow
- Puppeteer is installed locally in `node_modules/`. Use system Chrome at
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` as `executablePath` — do not rely
  on the bundled Chromium.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Flags: `--all` (every route), `--mobile` (375×812 @3x), `--full` (full page).
- Screenshots save to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label`
- After screenshotting, read the PNG with the Read tool — Claude can see and analyse it directly.
- **Check 375px first**, then 768 / 1280 / 1440. Mobile is the primary target: the audience reads
  on a phone.
- When comparing, be specific: "heading is 32px but should be ~24px", "card gap is 16px, should be 24px".
- Check: spacing/padding, font size/weight/line-height, colours (exact hex), alignment, radius.

## Content rules
- **Do not paraphrase the case study copy into marketing language.** Where the brief gives copy, use
  it as written, byte-for-byte. YAML literal block scalars (`|`) preserve it.
- If a sentence could appear on any AI consultancy's website, cut it.
- No adjectives doing the work of numbers.
- Tone: direct not blunt, intelligent not academic, confident not arrogant, human not casual,
  precise not cold.

## Anti-Generic Guardrails
- **Typography:** DM Sans (display + wordmark), Inter (body), IBM Plex Mono (labels, meta, stack
  tags). No fourth typeface. Tight tracking on large headings, `1.6` line-height on body.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`.
- **Interactive states:** Every clickable element needs hover, focus-visible and active states.
- **Spacing:** Use the token scale. Never a random value.
- **Depth:** Layer surfaces (`--surface` → `--surface-2`), don't leave everything on one z-plane.

## Hard Rules — from the brief §9
- No light mode, no theme toggle.
- No second accent colour, **no gradients on the cyan, no glow effects on the symbol.**
- No stock photography, no abstract "AI" imagery, no neural-network illustrations.
- No hours-saved percentages, ROI figures, or "up to X%" claims anywhere.
- No client logos until approved; even then, monochrome and small.
- No blog, newsletter capture, chatbot widget, or cookie banner beyond what's legally required.
- No `transition-all`.
- Do not add sections, features or content not in the brief.
