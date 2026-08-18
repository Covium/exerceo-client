/**
 * Latin UI terms.
 *
 * Fluent id: `latin-<id>`
 *   value   — Latin, identical in every locale file
 *   .gloss  — translation in the user's language
 *
 * Display via `useLatinTerm` / `LatinTerm`. When
 * `preferences.useLocalizedTerms` is true, label and tooltip swap.
 */
export const LATIN_TERMS = [
  'app-name',
  'hodie',
  'haec-hebdomas',
  'exercitio',
  'gradus',
  'caloriae',
  'pondus',
  'adeps',
  'cohors',
  'mensurae',
  'historia',
  'configuratio',
] as const;

export type LatinTermId = (typeof LATIN_TERMS)[number];

export function latinMessageId(id: LatinTermId): string {
  return `latin-${id}`;
}
