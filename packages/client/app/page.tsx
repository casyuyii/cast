import Link from "next/link"
import { ArrowRight, ClipboardPaste, Send } from "lucide-react"

const tools = [
  {
    href: "/text/share",
    icon: Send,
    title: "Share text",
    body: "Paste anything, get a short code and a link to send.",
  },
  {
    href: "/text/get",
    icon: ClipboardPaste,
    title: "Get text",
    body: "Have a code? Enter it to pull the text back out.",
  },
]

export default function Home() {
  return (
    <>
      <section className="rise py-8 sm:py-12">
        <p className="text-primary mb-3 font-mono text-xs tracking-widest uppercase">
          A personal project
        </p>
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          Small tools,
          <br />
          <em className="text-primary">quietly</em> made.
        </h1>
        <p className="text-muted-foreground mt-5 max-w-md">
          Cast is a playground for building and shipping little things — starting with a simple way
          to move text between devices.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map(({ href, icon: Icon, title, body }, i) => (
          <Link
            key={href}
            href={href}
            style={{ "--d": `${120 + i * 80}ms` } as React.CSSProperties}
            className="rise group bg-card hover:border-primary/40 rounded-xl border p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="bg-accent text-accent-foreground mb-4 inline-flex size-10 items-center justify-center rounded-lg">
              <Icon className="size-5" />
            </div>
            <h2 className="flex items-center gap-2 font-medium">
              {title}
              <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-1" />
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">{body}</p>
          </Link>
        ))}
      </section>
    </>
  )
}
