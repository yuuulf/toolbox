// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarkdownView } from './markdown-view'

// 図そのものは mermaid-diagram.test.tsx で確かめる。ここでは渡されるコードだけを見る
vi.mock('./mermaid-diagram', () => ({
  MermaidDiagram: ({ code }: { code: string }) => (
    <div data-testid="mermaid">{code}</div>
  ),
}))

describe('MarkdownView', () => {
  it('入力が空なら案内を出す', () => {
    render(<MarkdownView markdown="  " />)
    expect(
      screen.getByText('Markdown を入力するとここに表示されます。'),
    ).toBeTruthy()
  })

  it('見出しと強調を表示する', () => {
    render(<MarkdownView markdown={'# タイトル\n\n**太字**'} />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'タイトル' }),
    ).toBeTruthy()
    expect(screen.getByText('太字').tagName).toBe('STRONG')
  })

  it('GFM の表・タスクリスト・取り消し線・自動リンクを表示する', () => {
    render(
      <MarkdownView
        markdown={
          '| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] 済み\n- [ ] 未完了\n\n~~消す~~ https://example.com'
        }
      />,
    )
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(boxes.map((box) => box.checked)).toEqual([true, false])
    expect(boxes.every((box) => box.disabled)).toBe(true)
    expect(screen.getByText('消す').tagName).toBe('DEL')
    expect(
      screen.getByRole('link', { name: 'https://example.com' }),
    ).toBeTruthy()
  })

  it('HTML は解釈せず文字のまま表示する', () => {
    const { container } = render(<MarkdownView markdown="<b>太字?</b>" />)
    expect(container.querySelector('b')).toBeNull()
    expect(screen.getByText('<b>太字?</b>')).toBeTruthy()
  })

  it('画像は読み込まず、代替テキストと URL を表示する', () => {
    const { container } = render(
      <MarkdownView markdown="![ロゴ](https://example.com/logo.png)" />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(
      screen.getByText('画像: ロゴ（https://example.com/logo.png）'),
    ).toBeTruthy()
  })

  it('リンクは新しいタブで開く', () => {
    render(<MarkdownView markdown="[例](https://example.com)" />)
    const link = screen.getByRole('link', { name: '例' })
    expect(link.getAttribute('href')).toBe('https://example.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('javascript: のリンクはリンクにしない', () => {
    render(<MarkdownView markdown="[押す](javascript:alert(1))" />)
    expect(screen.getByText('押す')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('mermaid のコードブロックを図に渡し、ほかのコードブロックはそのまま表示する', () => {
    render(
      <MarkdownView
        markdown={
          '```mermaid\ngraph TD\n  A --> B\n```\n\n```js\nconst a = 1\n```'
        }
      />,
    )
    expect(screen.getByTestId('mermaid').textContent).toBe(
      'graph TD\n  A --> B\n',
    )
    expect(screen.getByText('const a = 1').closest('pre')).not.toBeNull()
  })
})
