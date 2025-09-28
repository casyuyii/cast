import { Suspense } from "react"

export default function GetTextLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
}
