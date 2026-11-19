// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARKDOWN_DRAFT_KEY } from '@/lib/tools/markdown-preview'
import { MarkdownPreview } from './markdown-preview'
import { AUTOSAVE_DELAY_MS } from './use-auto-save'

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

  it('どの表示でも、表示の切り替えを使え、保存ボタンはない', async () => {
    const user = userEvent.setup()
    render(<MarkdownPreview />)
    for (const name of ['入力のみ', 'プレビューのみ', '並べて表示']) {
      await user.click(screen.getByRole('radio', { name }))
      expect(screen.queryByRole('button', { name: '保存' })).toBeNull()
      expect(screen.getByRole('radiogroup', { name: '表示' })).toBeTruthy()
    }
  })

  describe('自動保存', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const saved = () => {
      const raw = localStorage.getItem(MARKDOWN_DRAFT_KEY)
      return raw === null ? null : JSON.parse(raw)
    }

    it('入力して待つと保存され、作り直すと復元される', () => {
      const { unmount } = render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: '# 自動で保存' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
      expect(saved()).toBe('# 自動で保存')

      unmount()
      render(<MarkdownPreview />)
      expect(input().value).toBe('# 自動で保存')
    })

    it('入力しただけで待たなければ、まだ保存しない', () => {
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: 'a' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1))
      expect(saved()).toBeNull()
    })

    it('保存できないときは文言を読み上げ用の領域に出し、そのまま使える。後で保存できたら消す', () => {
      const setItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('denied')
        })
      render(<MarkdownPreview />)
      fireEvent.change(input(), { target: { value: '**続ける**' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
      const message = screen.getByText(
        '自動保存できません。再読み込みすると入力が消えます。',
      )
      expect(message.getAttribute('aria-live')).toBe('polite')
      expect(message.className).not.toContain('sr-only')
      expect(preview().textContent).toContain('続ける')

      setItem.mockRestore()
      fireEvent.change(input(), { target: { value: '**続ける**!' } })
      act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS))
      expect(
        screen.queryByText(
          '自動保存できません。再読み込みすると入力が消えます。',
        ),
      ).toBeNull()
      expect(saved()).toBe('**続ける**!')
    })
  })
})
