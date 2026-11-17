import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto w-full max-w-5xl px-4 py-3">
        <Link href="/" className="text-lg font-bold hover:underline">
          toolbox
        </Link>
      </div>
    </header>
  )
}
