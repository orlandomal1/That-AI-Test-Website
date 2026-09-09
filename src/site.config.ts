/**
 * Single source of truth for everything that is not yet cleared for publication.
 *
 * Nothing in `approvedValue` reaches rendered output while `approved` is false. Flip one boolean
 * here and the prose, page title, meta description, OG image, robots meta, sitemap and robots.txt
 * all change together — see src/lib/approvals.ts and src/lib/seo.ts.
 *
 * Do not invent values. Every default and approvedValue below comes verbatim from the brief.
 */

export type ApprovalKey =
  | 'client_halcyon'
  | 'client_purepadel'
  | 'quote_wetravel'
  | 'quote_halcyon'
  | 'quote_purepadel'
  | 'screenshots_purepadel'
  | 'member_count_purepadel';

export interface ApprovalEntry {
  /** Flip to true only on written client approval. */
  approved: boolean;
  /** Anonymised, always-publishable fallback. Rendered while `approved` is false. */
  default: string;
  /** The real value. NEVER rendered while `approved` is false. */
  approvedValue: string;
  /**
   * true  → renders nothing at all while unapproved. Block-level only: a key with this set can
   *         never be used mid-sentence, because an empty string would break the prose. The zod
   *         superRefine in src/content.config.ts enforces that.
   * false → renders `default`.
   */
  hideWhenUnapproved?: boolean;
  /** Shown on the dev-only /approvals dashboard. */
  note?: string;
}

export const approvals = {
  client_halcyon: {
    approved: false,
    default: 'A UK luxury golf travel operator',
    approvedValue: 'Halcyon Golf Travel',
    note: 'Pending. Gates noindex on /work/halcyon.',
  },
  client_purepadel: {
    approved: false,
    default: 'A UK padel club chain',
    approvedValue: 'Pure Padel',
    note: 'Pending. Gates noindex on /work/purepadel.',
  },
  quote_wetravel: {
    approved: false,
    default: '',
    approvedValue: '',
    hideWhenUnapproved: true,
    note: 'WeTravel engineering, verbatim email. Requires WeTravel’s permission, not the client’s.',
  },
  quote_halcyon: {
    approved: false,
    default: '',
    approvedValue: '',
    hideWhenUnapproved: true,
    note: 'None yet.',
  },
  quote_purepadel: {
    approved: false,
    default: '',
    approvedValue: '',
    hideWhenUnapproved: true,
    note: 'None yet — everything on file is paraphrased, so nothing is quotable.',
  },
  screenshots_purepadel: {
    approved: false,
    default: '',
    approvedValue: '',
    hideWhenUnapproved: true,
    note: 'Falls back to the bridge diagram via the <Approved> pending slot. Needs written client approval.',
  },
  member_count_purepadel: {
    approved: false,
    default: '',
    approvedValue: 'tens of thousands of members',
    hideWhenUnapproved: true,
    note: 'Brief: “Do not state the member count.” No prose fallback — any softer figure would itself be an unapproved claim.',
  },
} as const satisfies Record<ApprovalKey, ApprovalEntry>;

/**
 * Case-study routes and the approval key that gates them. Drives noindex, the sitemap filter and
 * robots.txt from one place. Brief §6: both case studies carry noindex until at least the
 * client-name variable is approved.
 */
export const routeGates: Record<string, ApprovalKey> = {
  '/work/halcyon': 'client_halcyon',
  '/work/purepadel': 'client_purepadel',
};

/**
 * Terms that must never appear in rendered output, but which are not approval variables and so are
 * invisible to assertPublicSafe(). From the brief's "Never on this page" lists.
 * Checked against the built dist/ by `npm run leaktest`.
 */
export const forbiddenStrings: readonly string[] = [
  // Halcyon — pricing, identifiers, commercial arrangements
  '83,000',
  '£550',
  'referral',
  'IP arrangement',
  // Pure Padel — fee, relationship, member count, economy internals
  'friendship',
  'points economy',
  'Playtomic API write',
  // Both — figures the brief forbids anywhere on the site
  'hours saved',
  'ROI',
];

export const site = {
  name: 'That AI Consultancy',
  shortName: 'That AI',
  tagline: 'Intelligence, bridged.',
  url: 'https://thataiconsultancy.com',
} as const;

/**
 * TODO — placeholders. Supply real values before launch.
 * The CTA falls back to `mailto:` while bookingUrl is null.
 */
export const contact = {
  bookingUrl: null as string | null,
  email: 'hello@thataiconsultancy.com',
  linkedin: 'https://www.linkedin.com/company/that-ai-consultancy',
  companyReg: 'That AI Consultancy Ltd — registered in England & Wales, company no. TODO',
} as const;

/** Where the primary CTA points. Booking link if we have one, email if we don't. */
export const ctaHref = (): string =>
  contact.bookingUrl ?? `mailto:${contact.email}?subject=${encodeURIComponent('First call')}`;
