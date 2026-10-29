"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/text/share", label: "Share" },
  { href: "/text/get", label: "Get" },
  {
    href: "https://www.notion.so/Blogs-266ca97f62d0804894b6c8c1e3bfbbc4",
    label: "About",
    external: true,
  },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-5">
        <Link href="/" className="font-display text-2xl tracking-tight">
          cast<span className="text-primary">.</span>
        </Link>

        <ul className="flex items-center gap-1 text-sm">
          {links.map(({ href, label, external }) => {
            const active = !external && pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  target={external ? "_blank" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {external && <span aria-hidden> ↗</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
