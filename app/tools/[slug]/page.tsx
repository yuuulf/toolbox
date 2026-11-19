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
    // 幅 1024px 以上では、ツールの領域を画面の下端まで広げる（各ツールはその高さを使って欄を広げる）。
    // min-h なので、中身が画面より高いときは main が伸びてページがスクロールする
    <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:flex lg:min-h-dvh lg:flex-col">
      <h1 className="text-2xl font-bold">{tool.name}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {tool.description}
      </p>
      <div className="mt-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <Tool />
      </div>
    </main>
  )
}
