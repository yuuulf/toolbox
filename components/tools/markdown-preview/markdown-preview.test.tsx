// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARKDOWN_DRAFT_KEY } from '@/lib/tools/markdown-preview'
import { MarkdownPreview } from './markdown-preview'

vi.mock('./mermaid-diagram', () => ({
  MermaidDiagram: ({ code }: { code: string }) => <div>{code}</div>,
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const input = () => screen.getByLabelText('Markdown') as HTMLTextAreaElement
const preview = () => screen.getByRole('region', { name: 'プレビュー' })

describe('MarkdownPreview', () => {
  it('入力と同時にプレビューを更新する', async () => {
    render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: '# タイトル' } })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'タイトル' }),
    ).toBeTruthy()
  })

  it('初期表示は並べて表示で、入力欄とプレビューの両方がある', () => {
    render(<MarkdownPreview />)
    expect(
      screen
        .getByRole('radio', { name: '並べて表示' })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(input()).toBeTruthy()
    expect(preview()).toBeTruthy()
  })

  it('プレビューのみ・入力のみに切り替えられ、入力は残る', async () => {
    const user = userEvent.setup()
    render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: '**残る**' } })

    await user.click(screen.getByRole('radio', { name: 'プレビューのみ' }))
    expect(screen.queryByLabelText('Markdown')).toBeNull()
    expect(preview().textContent).toContain('残る')

    await user.click(screen.getByRole('radio', { name: '入力のみ' }))
    expect(screen.queryByRole('region', { name: 'プレビュー' })).toBeNull()
    expect(input().value).toBe('**残る**')

    await user.click(screen.getByRole('radio', { name: '並べて表示' }))
    expect(input().value).toBe('**残る**')
    expect(preview()).toBeTruthy()
  })

  it('どの表示でも、保存ボタンと表示の切り替えを使える', async () => {
    const user = userEvent.setup()
    render(<MarkdownPreview />)
    for (const name of ['入力のみ', 'プレビューのみ', '並べて表示']) {
      await user.click(screen.getByRole('radio', { name }))
      expect(screen.getByRole('button', { name: '保存' })).toBeTruthy()
      expect(screen.getByRole('radiogroup', { name: '表示' })).toBeTruthy()
    }
  })

  it('入力しただけでは保存しない', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: 'a' } })
    expect(setItem).not.toHaveBeenCalled()
  })

  it('保存すると ✓ のアイコンと読み上げで伝え（画面に文字は出さない）、作り直すと復元される', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: '# 保存する' } })
    const saveButton = screen.getByRole('button', { name: '保存' })
    expect(saveButton.textContent).toBe('')
    await user.click(saveButton)
    expect(saveButton.querySelector('svg')?.dataset.icon).toBe('check')
    const live = screen.getByText('保存しました')
    expect(live.getAttribute('aria-live')).toBe('polite')
    expect(live.className).toContain('sr-only')
    expect(JSON.parse(localStorage.getItem(MARKDOWN_DRAFT_KEY)!)).toBe(
      '# 保存する',
    )

    unmount()
    render(<MarkdownPreview />)
    expect(input().value).toBe('# 保存する')
  })

  it('保存の後に入力を変えても、保存値は変わらない', async () => {
    const user = userEvent.setup()
    render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: '1回目' } })
    await user.click(screen.getByRole('button', { name: '保存' }))
    fireEvent.change(input(), { target: { value: '2回目' } })
    expect(JSON.parse(localStorage.getItem(MARKDOWN_DRAFT_KEY)!)).toBe('1回目')
  })

  it('保存できないときは × のアイコンと「保存できませんでした」の読み上げで伝え、そのまま使える', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const user = userEvent.setup()
    render(<MarkdownPreview />)
    fireEvent.change(input(), { target: { value: '**続ける**' } })
    const saveButton = screen.getByRole('button', { name: '保存' })
    await user.click(saveButton)
    expect(saveButton.querySelector('svg')?.dataset.icon).toBe('cross')
    expect(screen.getByText('保存できませんでした').className).toContain(
      'sr-only',
    )
    expect(preview().textContent).toContain('続ける')
  })
})
