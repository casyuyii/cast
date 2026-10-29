"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Check, Copy, Loader2, RotateCcw } from "lucide-react"
import PageHeader from "@/components/custom/page-header"
import ExpiryBadge from "@/components/custom/expiry-badge"
import { MAX_TEXT_BYTES, shareText as shareTextApi } from "@/lib/text-api"
import { cn } from "@/lib/utils"

const SHARE_TEXT_URL = process.env.NEXT_PUBLIC_FRONT_END_URL + "/text/get?code="

export default function ShareText() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ code: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState<"code" | "link" | null>(null)

  const bytes = new TextEncoder().encode(text).length
  const tooLong = bytes > MAX_TEXT_BYTES
  const shareUrl = result ? SHARE_TEXT_URL + result.code : ""

  const shareText = async () => {
    if (!text.trim() || tooLong || loading) return
    setLoading(true)
    setError("")
    try {
      setResult(await shareTextApi(text))
    } catch (err) {
      console.error("Failed to share text: ", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const copy = async (value: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied(null), 3000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const reset = () => {
    setText("")
    setResult(null)
    setError("")
  }

  return (
    <>
      <PageHeader eyebrow="Text / Share" title="Share a snippet.">
        Paste your text below. You&apos;ll get a short code and a link anyone can open. Snippets
        disappear after 5 minutes.
      </PageHeader>

      <div
        className="rise bg-card rounded-xl border shadow-xs"
        style={{ "--d": "100ms" } as React.CSSProperties}
      >
        {result ? (
          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">Your code</p>
              <ExpiryBadge expiresAt={result.expiresAt} />
            </div>
            <button
              type="button"
              title="Copy code"
              onClick={() => copy(result.code, "code")}
              className="font-display text-primary mt-1 text-5xl tracking-[0.2em] transition-opacity hover:opacity-70 sm:text-6xl"
            >
              {result.code}
            </button>
            <p className="text-muted-foreground h-4 text-xs">
              {copied === "code" ? "Code copied" : "Click the code to copy it"}
            </p>

            <div className="bg-muted mt-5 flex items-center gap-2 rounded-lg border p-1.5 pl-3">
              <span className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-sm">
                {shareUrl}
              </span>
              <Button size="sm" onClick={() => copy(shareUrl, "link")}>
                {copied === "link" ? <Check /> : <Copy />}
                {copied === "link" ? "Copied" : "Copy link"}
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="mt-4 -ml-2" onClick={reset}>
              <RotateCcw />
              Share something else
            </Button>
          </div>
        ) : (
          <>
            <Textarea
              className="min-h-48 resize-y rounded-b-none border-0 p-5 shadow-none focus-visible:ring-0"
              placeholder="Type or paste text to share…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) shareText()
              }}
            />
            <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
              <span
                className={cn(
                  "font-mono text-xs",
                  tooLong ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {(bytes / 1024).toFixed(1)} / {MAX_TEXT_BYTES / 1024} KB
              </span>
              <Button onClick={shareText} disabled={loading || !text.trim() || tooLong}>
                {loading && <Loader2 className="animate-spin" />}
                {loading ? "Sharing…" : "Share"}
                {!loading && <kbd className="font-mono text-[10px] opacity-60">⌘↵</kbd>}
              </Button>
            </div>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {error}
        </p>
      )}
    </>
  )
}
