import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { approvals, type ApprovalEntry, type ApprovalKey } from './site.config';

/** Widening read — `as const satisfies` drops optional keys from the narrowed entry types. */
const entryOf = (key: ApprovalKey): ApprovalEntry => approvals[key];

const approvalKeys = Object.keys(approvals) as [ApprovalKey, ...ApprovalKey[]];
const approvalKey = z.enum(approvalKeys);

/** A string that may carry {token} / {token:sentence} / {token:lower}. */
const prose = z.string().min(1);
const paras = z.array(prose).min(1);

/**
 * The visual that sits between "The problem" and "What we built" (brief §4).
 * Diagrams only until screenshots are approved.
 */
const visual = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('before-after'),
    before: z.object({
      eyebrow: z.string(),
      nodes: z.array(z.string()).length(2),
      ariaLabel: z.string(),
    }),
    after: z.object({
      eyebrow: z.string(),
      nodes: z.array(z.string()).length(2),
      flowRight: z.string(),
      flowLeft: z.string(),
      ariaLabel: z.string(),
    }),
  }),
  z.object({
    kind: z.literal('flow'),
    nodes: z.array(z.string()).min(2).max(3),
    /** Which node to emphasise, 0-indexed. */
    accentIndex: z.number().int().min(0).optional(),
    ariaLabel: z.string(),
    caption: z.string().optional(),
    /** When approved, this key swaps the diagram for screenshots. */
    screenshotGate: approvalKey.optional(),
  }),
]);

const work = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/work' }),
  schema: z
    .object({
      order: z.number().int(),
      /** Gates this study's client name, and is the target of the {client} token. */
      clientKey: approvalKey,
      /** Any further tokens this study's prose may use, e.g. members: member_count_purepadel. */
      tokens: z.record(z.string(), approvalKey).default({}),

      // ── Header (brief §4) ───────────────────────────────────────────
      /** The client descriptor is the page heading (brief §4). Normally the {client} token. */
      h1: prose,
      meta: z.array(z.object({ label: z.string(), value: prose })).min(2).max(5),
      stack: z.array(z.string()).min(1).max(8),

      // ── Card summary, used on / and /work ───────────────────────────
      card: z.object({ problem: prose, result: prose }),

      // ── Metadata. Same tokens, same resolver as the prose. ──────────
      seo: z.object({ title: prose, description: prose, ogTitle: prose }),

      // ── Body, in render order. The layout fixes the order, not this. ─
      problem: z.object({ heading: z.string().default('The problem'), body: paras }),
      visual,
      built: z.object({
        heading: z.string().default('What we built'),
        // Brief §4: four items maximum.
        items: z
          // `replaced` is optional: the brief gives a "Replaced:" line for most items but not all.
          .array(z.object({ name: z.string(), body: prose, replaced: prose.optional() }))
          .min(1)
          .max(4),
        /** Brief §4: a closing sentence on how we build — not a fifth deliverable. */
        closing: prose,
      }),
      howItRan: z.object({ heading: z.string().default('How it ran'), body: paras }),
      outcomes: z.object({
        /** "Outcomes" when live results exist, "What the client has now" when they don't. */
        heading: z.string(),
        // Brief §4: five bullets maximum.
        items: z.array(prose).min(1).max(5),
        /** Optional italic line, e.g. "Updated as results land." */
        footnote: prose.optional(),
      }),
      // Brief §4: two or three of our own lines, set large. A design element, not a quote block.
      principles: z.object({ lines: z.array(prose).min(2).max(3) }),
      whoThisSuits: z.object({
        heading: z.string().default('Who this suits'),
        items: z.array(prose).min(2).max(4),
      }),
      cta: z.object({ heading: prose, label: z.string().default('Book a call') }),
      /** Hidden testimonial slot. Markup exists; renders nothing until approved. */
      testimonials: z.array(approvalKey).default([]),
    })
    .superRefine((data, ctx) => {
      const known: Record<string, ApprovalKey> = { client: data.clientKey, ...data.tokens };

      const walk = (value: unknown): string[] => {
        if (typeof value === 'string') return [value];
        if (Array.isArray(value)) return value.flatMap(walk);
        if (value && typeof value === 'object') return Object.values(value).flatMap(walk);
        return [];
      };

      for (const text of walk(data)) {
        for (const match of text.matchAll(/\{(\w+)(?::(?:sentence|lower))?\}/g)) {
          const token = match[1];
          const key = known[token];

          if (!key) {
            ctx.addIssue({
              code: 'custom',
              message: `Unknown token {${token}}. Declare it under "tokens:" or use {client}.`,
            });
            continue;
          }

          // The guarantee that keeps prose grammatical: a key that renders as nothing when
          // unapproved can never sit inside a sentence.
          if (entryOf(key).hideWhenUnapproved) {
            ctx.addIssue({
              code: 'custom',
              message:
                `{${token}} resolves to "${key}", which is hidden until approved and would ` +
                `render as an empty string mid-sentence. Use a block-level <Approved> instead.`,
            });
          }
        }
      }
    }),
});

export const collections = { work };
