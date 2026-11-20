// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'toolbox:color-tool:favorites'

// お気に入りのストアはモジュール内に状態を持つため、テストごとに読み込み直して初期化する
async function setup() {
  vi.resetModules()
  const { ColorTool } = await import('./color-tool')
  const user = userEvent.setup()
  const view = render(<ColorTool />)
  return { user, view }
}

const colorInput = () => screen.getByLabelText('色')
const favoriteButton = () => screen.getByRole('button', { name: 'お気に入り' })
const favoriteList = () =>
  within(
    screen
      .getByRole('heading', { name: 'お気に入り' })
      .closest('section') as HTMLElement,
  )
const listedHexes = () =>
  favoriteList()
    .queryAllByRole('listitem')
    .map((item) => item.textContent)

async function typeColor(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  await user.clear(colorInput())
  await user.type(colorInput(), value)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ColorTool', () => {
  it('3つのセクションを見出し付きで表示する', async () => {
    await setup()
    for (const name of ['カラー変換', 'お気に入り', 'コントラスト比']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
  })

  it('星のボタンで登録すると一覧の末尾に加わり、押された状態になる', async () => {
    const { user } = await setup()
    await typeColor(user, '#336699')
    await user.click(favoriteButton())
    await typeColor(user, 'rgb(255, 0, 0)')
    await user.click(favoriteButton())

    expect(listedHexes()).toEqual(['#336699', '#ff0000'])
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('押された状態のボタンをもう一度押すと登録が外れる', async () => {
    const { user } = await setup()
    await typeColor(user, '#ff0000')
    await user.click(favoriteButton())
    await user.click(favoriteButton())

    expect(listedHexes()).toEqual([])
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('登録済みの色を別の書き方で入力しても押された状態になる', async () => {
    const { user } = await setup()
    await typeColor(user, '#ff0000')
    await user.click(favoriteButton())
    await typeColor(user, '#F00')
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('変換しただけでは登録されない', async () => {
    const { user } = await setup()
    await typeColor(user, '#336699')
    await typeColor(user, '#ff0000')
    expect(listedHexes()).toEqual([])
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('一覧の色を選ぶと変換欄に読み込まれ、ボタンが押された状態になる', async () => {
    localStorage.setItem(KEY, JSON.stringify(['#336699']))
    const { user } = await setup()
    await user.click(favoriteList().getByRole('button', { name: '#336699' }))
    expect(colorInput()).toHaveValue('#336699')
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('一覧の色のコピーボタンを押すと HEX をコピーし、変換欄は変わらない', async () => {
    localStorage.setItem(KEY, JSON.stringify(['#336699']))
    const { user } = await setup()
    await typeColor(user, '#ff0000')
    await user.click(
      favoriteList().getByRole('button', { name: '#336699 をコピー' }),
    )
    expect(await navigator.clipboard.readText()).toBe('#336699')
    expect(colorInput()).toHaveValue('#ff0000')
  })

  it('上限のとき、未登録の色では星ボタンが押せず、件数が説明になる', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => `#00000${i}`)
    localStorage.setItem(KEY, JSON.stringify(ten))
    const { user } = await setup()
    await typeColor(user, '#ff0000')
    expect(favoriteButton()).toBeDisabled()
    expect(favoriteButton()).toHaveAccessibleDescription('10件中10件')
    expect(screen.getByText('10/10')).toBeInTheDocument()
    expect(screen.queryByText(/不要な色/)).not.toBeInTheDocument()
  })

  it('一覧の色を選んで星のボタンを押すと、一覧と保存から外れる', async () => {
    localStorage.setItem(KEY, JSON.stringify(['#ff0000', '#336699']))
    const { user } = await setup()
    await user.click(favoriteList().getByRole('button', { name: '#336699' }))
    await user.click(favoriteButton())
    expect(listedHexes()).toEqual(['#ff0000'])
    expect(JSON.parse(localStorage.getItem(KEY) ?? '')).toEqual(['#ff0000'])
  })

  it('再読み込みすると、お気に入りは同じ順序で復元され、変換欄は空になる', async () => {
    const first = await setup()
    await typeColor(first.user, '#ff0000')
    await first.user.click(favoriteButton())
    await typeColor(first.user, '#336699')
    await first.user.click(favoriteButton())
    first.view.unmount()

    await setup()
    expect(listedHexes()).toEqual(['#ff0000', '#336699'])
    expect(colorInput()).toHaveValue('')
  })

  it('保存値が壊れていても空の一覧として表示する', async () => {
    localStorage.setItem(KEY, '{broken')
    await setup()
    expect(screen.getByText(/お気に入りはまだありません/)).toBeInTheDocument()
  })

  it('localStorage が例外を投げても、このページ内では登録できる', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const { user } = await setup()
    await typeColor(user, '#ff0000')
    await user.click(favoriteButton())
    expect(listedHexes()).toEqual(['#ff0000'])
  })

  it('変換中の色とコントラストの2色は保存しない', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { user } = await setup()
    await typeColor(user, '#123456')
    await user.clear(screen.getByLabelText('文字色'))
    await user.type(screen.getByLabelText('文字色'), '#654321')
    expect(setItem).not.toHaveBeenCalled()
  })
})
