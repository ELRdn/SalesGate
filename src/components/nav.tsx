import Link from "next/link";

const links = [
  { href: "/", label: "ダッシュボード" },
  { href: "/approvals", label: "承認キュー" },
  { href: "/leads", label: "リード" },
  { href: "/tasks", label: "タスク" },
  { href: "/settings", label: "設定" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-emerald-400">
          <span className="text-lg">🚦</span>
          <span>SalesGate</span>
          <span className="hidden text-xs font-normal text-zinc-500 sm:inline">
            Approval-first AI SDR Hub
          </span>
        </Link>
        <nav className="flex gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
