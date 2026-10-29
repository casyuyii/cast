import { Suspense } from "react"

export default function GetTextLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
      {children}
    </Suspense>
  )
}
