import { randomInt } from 'node:crypto'

/** No 0/O/1/I so references are easy to read aloud and type. Matches REFERENCE_RE in shared/validation. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function newReference(prefix: 'SPC' | 'SPP'): string {
  let out = ''
  for (let i = 0; i < 10; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return `${prefix}-${out}`
}
