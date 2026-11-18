// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ColorConverter } from './color-converter'

type FavoriteProps = {
  isFavorite?: boolean
  canAddFavorite?: boolean
  onToggleFavorite?: () => void
}

function Controlled({
  initial = '',
  isFavorite = false,
  canAddFavorite = true,
  onToggleFavorite = () => {},
}: { initial?: string } & FavoriteProps) {
  const [value, setValue] = useState(initial)
  return (
    <ColorConverter
      value={value}
      onChange={setValue}
      isFavorite={isFavorite}
      canAddFavorite={canAddFavorite}
      onToggleFavorite={onToggleFavorite}
      favoritesCountId="count"
    />
  )
}

// dt（形式名）に対応する dd（値）を返す
function valueOf(name: string) {
  const term = screen.getByText(name, { selector: 'dt' })
  return term.nextElementSibling?.textContent
}

const favoriteButton = () => screen.getByRole('button', { name: 'お気に入り' })

describe('ColorConverter の変換', () => {
  it('HEX を入力すると3形式とプレビューを表示する', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.type(screen.getByLabelText('色'), '#ff8000')

    expect(valueOf('HEX')).toBe('#ff8000')
    expect(valueOf('RGB')).toBe('rgb(255, 128, 0)')
    expect(valueOf('HSL')).toBe('hsl(30, 100%, 50%)')
    expect(
      screen.getByRole('img', { name: '#ff8000 のプレビュー' }),
    ).toHaveStyle({ backgroundColor: '#ff8000' })
  })

  it('HSL から HEX と RGB に変換する', () => {
    render(<Controlled initial="hsl(120, 100%, 25%)" />)
    expect(valueOf('HEX')).toBe('#008000')
    expect(valueOf('RGB')).toBe('rgb(0, 128, 0)')
  })

  it('空入力では表示が空で、入力を促す案内をプレビューの枠の中に出す（エラー扱いしない）', () => {
    render(<Controlled />)
    expect(valueOf('HEX')).toBe('')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const guide = screen.getByText(
      'HEX・RGB・HSL のどれかで色を入力してください。',
    )
    // 案内専用の行ではなく、プレビューの位置（星ボタンと同じ行）に出す
    expect(guide.parentElement).toContainElement(favoriteButton())
    expect(screen.queryByText(/エラー/)).not.toBeInTheDocument()
  })

  it('色を入れると入力を促す案内は消える', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.type(screen.getByLabelText('色'), '#336699')
    expect(
      screen.queryByText('HEX・RGB・HSL のどれかで色を入力してください。'),
    ).not.toBeInTheDocument()
  })

  it('解釈できない入力では、入力中は表示とプレビューを空にしてエラーは出さない', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.type(screen.getByLabelText('色'), 'rgb(')
    expect(valueOf('RGB')).toBe('')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText(/エラー/)).not.toBeInTheDocument()
  })

  it('解釈できない入力のままフォーカスが外れると、形式を示すエラーを出す', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.type(screen.getByLabelText('色'), 'abc-xyz')
    await user.tab()
    expect(
      screen.getByText(/エラー: 色として解釈できません/),
    ).toHaveTextContent('rgb(255, 0, 0)')
  })

  it('空のままフォーカスが外れてもエラーは出さず、案内だけを出す', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    await user.click(screen.getByLabelText('色'))
    await user.tab()
    expect(screen.queryByText(/エラー/)).not.toBeInTheDocument()
    expect(
      screen.getByText('HEX・RGB・HSL のどれかで色を入力してください。'),
    ).toBeInTheDocument()
  })

  it('ピッカーで選ぶと入力欄と表示がその色になる', () => {
    render(<Controlled />)
    fireEvent.input(screen.getByLabelText('色をカラーピッカーで選ぶ'), {
      target: { value: '#336699' },
    })
    expect(screen.getByLabelText('色')).toHaveValue('#336699')
    expect(valueOf('RGB')).toBe('rgb(51, 102, 153)')
  })
})

describe('ColorConverter のコピー', () => {
  it('RGB をコピーすると表示文字列が書き込まれ、読み上げられる', async () => {
    const user = userEvent.setup()
    render(<Controlled initial="#ff0000" />)
    await user.click(screen.getByRole('button', { name: 'RGB をコピー' }))
    expect(await navigator.clipboard.readText()).toBe('rgb(255, 0, 0)')
    expect(screen.getByText('コピーしました')).toBeInTheDocument()
  })

  it('変換結果がないとき3つのコピーボタンは押せない', () => {
    render(<Controlled initial="abc-xyz" />)
    for (const name of ['HEX をコピー', 'RGB をコピー', 'HSL をコピー']) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }
  })
})

describe('ColorConverter のお気に入りボタン', () => {
  it('未登録の色では押されていない状態（線の星）で表示する', () => {
    render(<Controlled initial="#ff0000" />)
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'false')
    expect(favoriteButton().querySelector('svg')).toHaveAttribute(
      'data-icon',
      'star',
    )
  })

  it('登録済みの色では押された状態（塗りの星）で表示する', () => {
    render(<Controlled initial="#F00" isFavorite />)
    expect(favoriteButton()).toHaveAttribute('aria-pressed', 'true')
    expect(favoriteButton().querySelector('svg')).toHaveAttribute(
      'data-icon',
      'star-filled',
    )
  })

  it('押すと onToggleFavorite が呼ばれる', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<Controlled initial="#ff0000" onToggleFavorite={onToggleFavorite} />)
    await user.click(favoriteButton())
    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it('変換結果がないときは押せない', () => {
    render(<Controlled initial="" />)
    expect(favoriteButton()).toBeDisabled()
  })

  it('上限で未登録の色のときは押せず、お気に入りの件数を説明として結びつける', () => {
    render(
      <>
        <Controlled initial="#ff0000" canAddFavorite={false} />
        <span id="count">10件中10件</span>
      </>,
    )
    expect(favoriteButton()).toBeDisabled()
    expect(favoriteButton()).toHaveAccessibleDescription('10件中10件')
  })

  it('変換欄には上限の案内の行を出さない', () => {
    render(<Controlled initial="#ff0000" canAddFavorite={false} />)
    expect(screen.queryByText(/不要な色を削除/)).not.toBeInTheDocument()
    expect(screen.queryByText(/10件まで/)).not.toBeInTheDocument()
  })

  it('上限でも登録済みの色なら押せる（外せる）', () => {
    render(<Controlled initial="#ff0000" isFavorite canAddFavorite={false} />)
    expect(favoriteButton()).toBeEnabled()
    expect(favoriteButton()).not.toHaveAttribute('aria-describedby')
  })
})
