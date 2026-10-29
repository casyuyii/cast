import { useEffect, useState } from "react"

const API_BASE = process.env.NEXT_PUBLIC_BACK_END_API_URL
const TEXT_API = API_BASE + "/api/text"

export const CODE_LENGTH = 6
export const MAX_TEXT_BYTES = 50 * 1024

export class TextApiError extends Error {}

type Operation = "share" | "get"

const UNREACHABLE = "Couldn't reach the text service. Check your connection and try again."

// Only statuses that mean something for each operation; anything else falls back to the
// server's own message or a generic one.
const STATUS_MESSAGES: Record<Operation, Record<number, string>> = {
  share: {
    400: "There's nothing to share. Enter some text first.",
    413: "Text is too long (max 50 KB).",
    429: "You're sharing too fast. Please wait a minute and try again.",
    503: "Sharing is temporarily unavailable: the database is offline. Please try again later.",
  },
  get: {
    400: "That doesn't look like a valid code. Codes are 6 letters and numbers.",
    404: "No text found for that code. It may have expired.",
    429: "Too many lookups. Please wait a minute and try again.",
    503: "Retrieving text is temporarily unavailable: the database is offline. Please try again later.",
  },
}

async function request<T>(op: Operation, input: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    // Build-time env var missing: fail loudly instead of fetching "undefined/api/text"
    console.error("NEXT_PUBLIC_BACK_END_API_URL is not set")
    throw new TextApiError("The text service isn't configured for this site.")
  }

  let res: Response
  try {
    res = await fetch(input, init)
  } catch {
    throw new TextApiError(UNREACHABLE)
  }

  // A non-JSON response (proxy error page, wrong URL) didn't come from our API, so its
  // status code says nothing about the text or code the user entered.
  const isJson = res.headers.get("content-type")?.includes("application/json")
  const body = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    if (!body) {
      throw new TextApiError(
        res.status >= 502 && res.status <= 504
          ? UNREACHABLE
          : `The text service returned an unexpected response (HTTP ${res.status}).`
      )
    }
    const serverMessage = typeof body.message === "string" ? body.message : null
    throw new TextApiError(
      STATUS_MESSAGES[op][res.status] ??
        serverMessage ??
        "Something went wrong on our side. Please try again."
    )
  }
  if (!body) {
    throw new TextApiError(`The text service returned an unexpected response.`)
  }
  return body as T
}

export function shareText(text: string) {
  return request<{ code: string; expiresAt: string }>("share", TEXT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
}

export function getText(code: string) {
  return request<{ text: string; expiresAt: string }>(
    "get",
    TEXT_API + "?code=" + encodeURIComponent(code)
  )
}

// Mirrors the server: strip spaces/dashes, uppercase. Also accepts a pasted share link.
export function normalizeCode(input: string) {
  const fromLink = input.match(/[?&]code=([^&#\s]+)/)?.[1]
  return (fromLink ? decodeURIComponent(fromLink) : input).replace(/[\s-]/g, "").toUpperCase()
}

// Returns "4:32" style remaining time, or null once expired / when no deadline
export function useCountdown(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - now
  if (ms <= 0) return null
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}
