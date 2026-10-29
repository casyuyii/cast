export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="rise mb-8">
      <p className="text-primary mb-2 font-mono text-xs tracking-widest uppercase">{eyebrow}</p>
      <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {children && <p className="text-muted-foreground mt-3 max-w-prose">{children}</p>}
    </div>
  )
}
