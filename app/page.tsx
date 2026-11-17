import { ToolCard } from '@/components/tool-card'
import { tools } from '@/components/tools/registry'

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ツール一覧</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        入力した内容はブラウザの外に送信されません。
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard
              slug={tool.slug}
              name={tool.name}
              description={tool.description}
            />
          </li>
        ))}
      </ul>
    </main>
  )
}
