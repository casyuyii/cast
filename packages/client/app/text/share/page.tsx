"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Check, Copy, PopcornIcon } from "lucide-react"

const SHARE_TEXT_API = process.env.NEXT_PUBLIC_BACK_END_API_URL + "/api/text"
const SHARE_TEXT_URL = process.env.NEXT_PUBLIC_FRONT_END_URL + "/text/get?code="

export default function ShareText() {
  const [text, setText] = useState("")
  const [showAlter, setShowAlter] = useState(false)
  const [alterText, setAlterText] = useState("")
  const [copied, setCopied] = useState(false)

  const ShareText = () => {
    fetch(SHARE_TEXT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.code) {
          setText(data.code)
          setShowAlter(true)
          setAlterText(SHARE_TEXT_URL + data.code)
        } else {
          console.error("Failed to share text: ", data)
        }
      })
      .catch((err) => {
        console.error("Failed to share text(unknown error): ", err)
      })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(alterText)
      setCopied(true)

      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="relative flex w-full">
        <Textarea
          className="h-32"
          placeholder="Enter text to share"
          onChange={(e) => setText(e.target.value)}
        />
        <div className="absolute right-1 bottom-1">
          <Button type="submit" variant="outline" onClick={ShareText}>
            Submit
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2" hidden={!showAlter}>
        <Alert>
          <PopcornIcon />
          <AlertTitle>{alterText}</AlertTitle>
        </Alert>

        <Button onClick={copyToClipboard}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  )
}
