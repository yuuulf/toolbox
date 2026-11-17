import Link from 'next/link'

type Props = {
  slug: string
  name: string
  description: string
}

export function ToolCard({ slug, name, description }: Props) {
  return (
    <Link
      href={`/tools/${slug}`}
      className="block h-full rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
    >
      <h2 className="font-semibold">{name}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </Link>
  )
}
