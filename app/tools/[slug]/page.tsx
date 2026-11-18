import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTool, tools } from '@/components/tools/registry'

// static export では登録済みの slug のページだけを書き出す。
// 未登録の slug はファイルがないため、公開先（GitHub Pages）が 404.html を 404 ステータスで返す
export const dynamicParams = false

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/tools/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const tool = getTool(slug)
  if (!tool) notFound()
  return { title: tool.name, description: tool.description }
}

export default async function ToolPage({ params }: PageProps<'/tools/[slug]'>) {
  const { slug } = await params
  const tool = getTool(slug)
  if (!tool) notFound()

  const Tool = tool.component
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">{tool.name}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {tool.description}
      </p>
      <div className="mt-6">
        <Tool />
      </div>
    </main>
  )
}
