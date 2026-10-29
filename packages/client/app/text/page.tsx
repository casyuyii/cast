import Link from "next/link"
import PageHeader from "@/components/custom/page-header"
import { Button } from "@/components/ui/button"

export default function Text() {
  return (
    <>
      <PageHeader eyebrow="Text" title="Move text between devices.">
        Share a snippet to get a short code, or enter a code to retrieve one.
      </PageHeader>
      <div className="rise flex gap-2" style={{ "--d": "100ms" } as React.CSSProperties}>
        <Button asChild>
          <Link href="/text/share">Share text</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/text/get">Get text</Link>
        </Button>
      </div>
    </>
  )
}
