"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Check, Copy, Loader2 } from "lucide-react"
import PageHeader from "@/components/custom/page-header"
import ExpiryBadge from "@/components/custom/expiry-badge"
import { CODE_LENGTH, getText, normalizeCode } from "@/lib/text-api"

export default function GetText() {
  const searchParams = useSearchParams()
  const initialCode = normalizeCode(searchParams.get("code") ?? "")
  const [code, setCode] = useState(initialCode)
  const [result, setResult] = useState<{ text: string; expiresAt: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const fetchText = useCallback(async (codeToFetch: string) => {
    if (codeToFetch.length !== CODE_LENGTH) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      setResult(await getText(codeToFetch))
    } catch (err) {
      console.error("Failed to get text: ", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialCode) {
      fetchText(initialCode)
    }
  }, [initialCode, fetchText])

  const onCodeChange = (value: string) => {
    const next = normalizeCode(value).slice(0, CODE_LENGTH)
    setCode(next)
    // Load as soon as a full code is typed or a share link is pasted
    if (next.length === CODE_LENGTH && next !== code) fetchText(next)
  }

  const copyText = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Text / Get" title="Retrieve a snippet.">
        Enter the 6-character code you were given, or paste the share link.
      </PageHeader>

      <form
        className="rise flex max-w-md gap-2"
        style={{ "--d": "100ms" } as React.CSSProperties}
        onSubmit={(e) => {
          e.preventDefault()
          fetchText(code)
        }}
      >
        <Input
          className="bg-card h-11 font-mono text-lg tracking-[0.3em] uppercase placeholder:text-sm placeholder:tracking-normal placeholder:normal-case"
          placeholder="e.g. 7KQ4MZ"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          autoFocus={!initialCode}
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          type="submit"
          className="h-11 px-5"
          disabled={loading || code.length !== CODE_LENGTH}
        >
          {loading && <Loader2 className="animate-spin" />}
          Get
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {error}
        </p>
      )}

      {result && (
        <div className="rise bg-card mt-8 rounded-xl border shadow-xs">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-2.5">
            <ExpiryBadge expiresAt={result.expiresAt} />
            <Button variant="ghost" size="sm" onClick={copyText}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="p-5 font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">
            {result.text}
          </pre>
        </div>
      )}
    </>
  )
}
