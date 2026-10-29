import { randomInt } from "crypto"

// No 0/O, 1/I/L: easy to read aloud and type on a phone
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
export const CODE_LENGTH = 6

const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`)

export function generateCode(): string {
  let code = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return code
}

// Accepts user-typed input ("abc 234", "ABC-234"); returns null if it can't be a code
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null
  const code = input.replace(/[\s-]/g, "").toUpperCase()
  return CODE_PATTERN.test(code) ? code : null
}
