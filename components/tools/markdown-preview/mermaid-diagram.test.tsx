// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import mermaid from 'mermaid'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MermaidDiagram } from './mermaid-diagram'

// jsdom では SVG のレイアウトを計算できないため、mermaid は差し替えて呼び出し方を確かめる
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn(),
    render: vi.fn(),
  },
}))

const initialize = vi.mocked(mermaid.initialize)
const parse = vi.mocked(mermaid.parse)
const renderDiagram = vi.mocked(mermaid.render)

function setDarkMode(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => {
  setDarkMode(false)
  parse.mockResolvedValue({ diagramType: 'flowchart', config: {} })
  renderDiagram.mockImplementation(async (id: string, code: string) => ({
    svg: `<svg id="${id}" data-code="${code.length}"><text>図</text></svg>`,
    diagramType: 'flowchart',
  }))
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('MermaidDiagram', () => {
  it('描いた SVG を表示する', async () => {
    const { container } = render(<MermaidDiagram code="graph TD; A-->B" />)
    expect(screen.getByText('図を描いています…')).toBeTruthy()
    await screen.findByText('図')
    expect(container.querySelector('svg')).not.toBeNull()
    expect(renderDiagram).toHaveBeenCalledWith(
      expect.stringMatching(/^mermaid-[a-zA-Z0-9-]+$/),
      'graph TD; A-->B',
      // 描画中の一時的な要素でページが伸びないよう、fixed の作業用の要素の中で描かせる
      expect.objectContaining({ className: expect.stringContaining('fixed') }),
    )
  })

  it('strict で、ライトモードでは default のテーマで描く', async () => {
    render(<MermaidDiagram code="graph TD; A-->B" />)
    await screen.findByText('図')
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'default',
      }),
    )
  })

  it('ラベルの HTML を解釈せず、図の中の設定でそれを変えられないようにする', async () => {
    render(<MermaidDiagram code="graph TD; A-->B" />)
    await screen.findByText('図')
    const config = initialize.mock.calls[0][0]
    expect(config.htmlLabels).toBe(false)
    expect(config.secure).toEqual(
      expect.arrayContaining(['securityLevel', 'htmlLabels', 'themeCSS']),
    )
  })

  it('ダークモードでは dark のテーマで描く', async () => {
    setDarkMode(true)
    render(<MermaidDiagram code="graph TD; A-->B" />)
    await screen.findByText('図')
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ securityLevel: 'strict', theme: 'dark' }),
    )
  })

  it('構文に誤りがあると、エラーの内容と元のコードを表示する', async () => {
    parse.mockRejectedValue(new Error('Parse error on line 2'))
    render(<MermaidDiagram code={'graph TD\n  A -->'} />)
    expect(await screen.findByText('図を描けませんでした。')).toBeTruthy()
    expect(screen.getByText('Parse error on line 2')).toBeTruthy()
    expect(screen.getByText(/A -->/)).toBeTruthy()
    expect(renderDiagram).not.toHaveBeenCalled()
  })

  it('同じコードのまま描き直されても、もう一度は描かない', async () => {
    const { rerender } = render(<MermaidDiagram code="graph TD; A-->B" />)
    await screen.findByText('図')
    rerender(<MermaidDiagram code="graph TD; A-->B" />)
    await screen.findByText('図')
    expect(renderDiagram).toHaveBeenCalledTimes(1)
  })

  it('コードが変わったら描き直す', async () => {
    const { rerender } = render(<MermaidDiagram code="graph TD; A-->B" />)
    await screen.findByText('図')
    rerender(<MermaidDiagram code="graph TD; A-->C" />)
    await vi.waitFor(() => expect(renderDiagram).toHaveBeenCalledTimes(2))
  })
})
