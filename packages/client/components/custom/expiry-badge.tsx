"use client"

import { Clock } from "lucide-react"
import { useCountdown } from "@/lib/text-api"
import { cn } from "@/lib/utils"

export default function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const remaining = useCountdown(expiresAt)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs",
        remaining ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"
      )}
    >
      <Clock className="size-3.5" />
      {remaining ? `Expires in ${remaining}` : "Expired"}
    </span>
  )
}
