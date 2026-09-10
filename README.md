# That AI Consultancy — website

Astro static site, dark surface only, near-zero client JS. Deploys to Vercel automatically on push
to `main`, so **treat every push as a production deploy**.

```bash
npm install
npm run dev        # http://localhost:3000
npm run preview    # builds and serves the real dist/ on http://localhost:3001
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Build, then serve `dist/` on :3001 — what Vercel actually serves |
| `npm run check` | `astro check` (TypeScript + template types) |
| `npm run lint:tokens` | Fails on any colour literal outside `tokens.css` / `logo-geometry.ts` |
| `npm run leaktest` | Audits built `dist/` for unapproved values, forbidden terms and stale placeholders |
| `npm run shot:all` | Screenshots every route at 1440px |
| `npm run shot:mobile` | Screenshots every route at 375px |

---

## Flipping an approval

Client names, quotes and several claims are not cleared for publication. They live in
[`src/site.config.ts`](src/site.config.ts) and ship hidden. **Flip one boolean and everything moves
together.**

```ts
client_halcyon: {
  approved: false,      // ← change to true, once you have written sign-off
  default: 'A UK luxury golf travel operator',
  approvedValue: 'Halcyon Golf Travel',
},
```

### What changes, in the order a reader would notice it

| # | Surface | Before approval | After approval |
|---|---|---|---|
| 1 | **Prose** — the `<h1>` and every `{client}` token in the case-study copy | A UK luxury golf travel operator | Halcyon Golf Travel |
| 2 | **Page title** | Operations automation for a UK luxury golf travel operator | Operations automation for Halcyon Golf Travel |
| 3 | **Meta description** | How a UK luxury golf travel operator stopped… | How Halcyon Golf Travel stopped… |
| 4 | **Robots meta tag** | `<meta name="robots" content="noindex, nofollow">` | absent — the page becomes indexable |
| 5 | **Sitemap** | route excluded from `sitemap-0.xml` | route included |
| 6 | **robots.txt** | `Disallow: /work/halcyon` | line removed |
| 7 | **OG image** | regenerated from the same resolver | regenerated from the same resolver |

On 7: the OG images deliberately **never carry a client name in either state.** Their titles hold the
engagement hook ("Every trip quote was built twice"), which is confirmed and publishable regardless.
An image is the one surface a grep cannot read, so it holds nothing that could ever need retracting.
The image is still rebuilt on a flip, and its text is audited from a build manifest by `leaktest`.

### Lighthouse SEO reads ~63 on a gated route. That is correct. Do not "fix" it.

A gated case study scores **~63 on SEO** because Lighthouse flags "Page is blocked from indexing" —
which is exactly what we asked it to do. The same page scores ~99 on Performance and 100 on
Accessibility and Best Practices. **Once the client name is approved the SEO score rises to ~100 on
its own.** Nothing needs changing to make that happen, and anything done to raise it before approval
would defeat the gate.

### Verify a flip before deploying it

```bash
node scripts/flip-test.mjs client_halcyon
```

This builds three times — baseline, flipped, restored — and reports whether all six HTML/SEO surfaces
moved together. It also runs the **inverse leak test**: with the name approved, the anonymised
placeholder must appear nowhere in `dist/`, because a stale descriptor sitting beside an approved name
is as much a defect as a leak in the other direction. It always restores `src/site.config.ts`,
including on failure.

Then, with the flip actually committed:

```bash
npm run build && npm run leaktest
```

### The rules the build enforces for you

- `assertPublicSafe` / `assertNoForbidden` run over every page title and description, and over every
  OG image title. An unapproved value reaching page metadata **fails the build**.
- A key marked `hideWhenUnapproved` renders *nothing* when unapproved. The zod `superRefine` in
  [`src/content.config.ts`](src/content.config.ts) **rejects at build time** any attempt to use such a
  key inside a sentence, because it would silently render "We worked with  on their booking flow."
- `member_count_purepadel` is deliberately one of those: the brief forbids stating the member count,
  so there is no softened fallback — a vaguer figure would itself be an unapproved claim.

---

## Adding a third case study

1. **Create `src/content/work/<slug>.yaml`.** Copy an existing file; the zod schema in
   `src/content.config.ts` enforces the shape, including the brief's structural limits (max 4 "what
   we built" items, 2–3 principle lines, max 5 outcome bullets).
2. **Add the client's approval key** to `approvals` in `src/site.config.ts`, and add the route to
   `routeGates` so it is noindexed until the name clears:
   ```ts
   routeGates = { '/work/<slug>': 'client_<name>' }
   ```
3. **Write prose with `{client}` tokens**, never a literal name. Available forms: `{client}`,
   `{client:sentence}` (capitalises the first letter, for sentence-initial use) and `{client:lower}`
   (lowercases it for mid-sentence use — safely ignored for approved proper nouns).
   Declare any extra tokens under `tokens:` in the YAML.
4. **Pick the outcomes heading**: `Outcomes` when live results exist, `What the client has now` when
   the engagement delivered artefacts rather than metrics.
5. **Choose the visual**: `before-after` (two boxes, manual arrows vs the cyan bridge) or `flow` (two
   or three stages). Both come from the same `BridgeDiagram` component.
6. Run `npm run check && npm run build && npm run leaktest`.

The route, the card on `/` and `/work`, the sitemap entry and the OG image all appear automatically.

---

## Brand

[`brand/brand_guidelines.md`](brand/brand_guidelines.md) is the source of truth. Read
[`brand/brand_guidelines_v2.1_changes.md`](brand/brand_guidelines_v2.1_changes.md) alongside it —
three places where the prose disagrees with the approved artwork, with measurements.

The symbol is **rebuilt as inline SVG** from the §2.2 geometry in
[`src/lib/logo-geometry.ts`](src/lib/logo-geometry.ts), not loaded from the PNGs, because every Set 1
PNG has an opaque `#0A0A0A` background and cannot sit on the `--surface-2` ground. The reconstruction
was verified against the artwork: interiors pixel-identical, clearspace exact, wordmark width within
0.11%. **Official SVG sources are still outstanding.**

All colour, type and spacing comes from [`src/styles/tokens.css`](src/styles/tokens.css).
`npm run lint:tokens` fails the build on any hex outside that file and `logo-geometry.ts`.

---

## Outstanding before launch

- [ ] **Booking URL** — `contact.bookingUrl` is `null`, so the CTA falls back to `mailto:`.
- [ ] **Contact email, LinkedIn URL, company registration number** — placeholders in `site.config.ts`.
- [ ] **`site.url`** — currently `https://thataiconsultancy.com`. Drives canonicals, OG URLs and the
      sitemap, so it must be the real domain before launch.
- [ ] **Official SVG logo sources** (see Brand above).
- [ ] **`set2-light__that-ai-consultancy.png`** missing from the brand asset set (8 of 9 supplied).
- [ ] **Vercel framework preset** may still be set to static "Other" from the previous single-page
      site; the first Astro deploy may need it switched to Astro in the dashboard.
