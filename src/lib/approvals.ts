import {
  approvals,
  forbiddenStrings,
  type ApprovalEntry,
  type ApprovalKey,
} from '../site.config';

/**
 * `as const satisfies` in site.config.ts gives literal types and exhaustiveness checking, but it
 * also narrows each entry to exactly the keys it declares — so entries that omit the optional
 * `hideWhenUnapproved` do not carry the property at all. Read through this widening accessor.
 */
export const entryOf = (name: ApprovalKey): ApprovalEntry => approvals[name];

export const isApproved = (name: ApprovalKey): boolean => entryOf(name).approved;

/** Should this entry produce any output at all? */
export const isVisible = (name: ApprovalKey): boolean =>
  entryOf(name).approved || entryOf(name).hideWhenUnapproved !== true;

/** Block-level only — can never be interpolated into a sentence. */
export const isBlockOnly = (name: ApprovalKey): boolean =>
  entryOf(name).hideWhenUnapproved === true;

export interface ResolveOptions {
  /** Capitalise the first letter, for sentence-initial or title position. */
  case?: 'sentence' | 'lower';
}

/**
 * The single source of every rendered string. Returns '' for a hidden entry.
 *
 * The defaults are written sentence-initial ("A UK luxury golf travel operator") because that is
 * how they most often appear. `case: 'lower'` is for mid-sentence use — but note it lowercases only
 * the first character, so it must never be applied to an approved proper noun. resolve() guards
 * that below.
 */
export function resolve(name: ApprovalKey, opts: ResolveOptions = {}): string {
  const entry = entryOf(name);
  if (!isVisible(name)) return '';

  const value = entry.approved ? entry.approvedValue : entry.default;
  if (!value) return '';

  if (opts.case === 'sentence') return value.charAt(0).toUpperCase() + value.slice(1);
  // Never lowercase an approved value — "Halcyon Golf Travel" must not become "halcyon…".
  if (opts.case === 'lower' && !entry.approved) return value.charAt(0).toLowerCase() + value.slice(1);
  return value;
}

/** Token context: the token name used in prose → the approval key it resolves to. */
export type TokenContext = Record<string, ApprovalKey>;

const TOKEN = /\{(\w+)(?::(sentence|lower))?\}/g;

/**
 * Interpolates `{client}` / `{client:lower}` / `{client:sentence}` in prose held in content files.
 * Throws on an undeclared token rather than silently rendering a literal brace.
 */
export function interpolate(text: string, ctx: TokenContext): string {
  return text.replace(TOKEN, (_match, token: string, mode?: 'sentence' | 'lower') => {
    const key = ctx[token];
    if (!key) {
      throw new Error(`[approvals] Unknown token {${token}} in: "${text.slice(0, 80)}…"`);
    }
    return resolve(key, mode ? { case: mode } : {});
  });
}

/**
 * Build-time leak guard. Throws if an unapproved real value has reached a string on its way to
 * output. This is the belt to the braces of never hard-coding a name in the first place.
 *
 * Note this can only catch approval variables. Terms on the brief's "never on this page" lists are
 * not variables and are checked separately — see assertNoForbidden and scripts/leak-test.mjs.
 */
export function assertPublicSafe(text: string, where: string): void {
  for (const key of Object.keys(approvals) as ApprovalKey[]) {
    const entry = entryOf(key);
    if (entry.approved) continue;

    const secret = entry.approvedValue;
    if (secret.length > 2 && text.toLowerCase().includes(secret.toLowerCase())) {
      throw new Error(
        `[approvals] Unapproved value "${secret}" (${key}) leaked into ${where}. ` +
          `Use <Var name="${key}" /> or a {token}, never the literal string.`,
      );
    }
  }
}

/** Same guard for the non-variable forbidden terms. */
export function assertNoForbidden(text: string, where: string): void {
  const haystack = text.toLowerCase();
  for (const term of forbiddenStrings) {
    if (haystack.includes(term.toLowerCase())) {
      throw new Error(`[approvals] Forbidden term "${term}" appears in ${where}.`);
    }
  }
}

export const pendingKeys = (): ApprovalKey[] =>
  (Object.keys(approvals) as ApprovalKey[]).filter((k) => !isApproved(k));

export const allKeys = (): ApprovalKey[] => Object.keys(approvals) as ApprovalKey[];
