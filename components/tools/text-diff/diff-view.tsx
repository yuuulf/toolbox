import type { DiffRow, Segment, Side } from '@/lib/tools/text-diff'

type LineKind = 'equal' | 'removed' | 'added'

type Props = {
  rows: DiffRow[]
}

const LINE_STYLES: Record<LineKind, string> = {
  equal: '',
  removed: 'bg-red-50 dark:bg-red-950/50',
  added: 'bg-green-50 dark:bg-green-950/50',
}

const MARKERS: Record<LineKind, { symbol: string; label: string }> = {
  equal: { symbol: ' ', label: '' },
  removed: { symbol: '-', label: '削除' },
  added: { symbol: '+', label: '追加' },
}

export function DiffView({ rows }: Props) {
  return (
    <div className="font-mono text-sm">
      {/* 左右表示。行ごとに2列のグリッドにして、左右の高さをそろえる */}
      <div className="hidden sm:block">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-2">
            {'before' in row ? (
              <Line side={row.before} kind={beforeKind(row)} />
            ) : (
              <EmptyLine />
            )}
            {'after' in row ? (
              <Line side={row.after} kind={afterKind(row)} />
            ) : (
              <EmptyLine />
            )}
          </div>
        ))}
      </div>
      {/* 狭い画面では1列にまとめる。共通の行は1回、変更された行は削除の後に追加 */}
      <div className="sm:hidden">
        {rows.flatMap((row, i) => {
          if (row.kind === 'equal') {
            return [<Line key={i} side={row.after} kind="equal" />]
          }
          const lines = []
          if ('before' in row) {
            lines.push(<Line key={`${i}-b`} side={row.before} kind="removed" />)
          }
          if ('after' in row) {
            lines.push(<Line key={`${i}-a`} side={row.after} kind="added" />)
          }
          return lines
        })}
      </div>
    </div>
  )
}

function beforeKind(row: DiffRow): LineKind {
  return row.kind === 'equal' ? 'equal' : 'removed'
}

function afterKind(row: DiffRow): LineKind {
  return row.kind === 'equal' ? 'equal' : 'added'
}

function Line({ side, kind }: { side: Side; kind: LineKind }) {
  const marker = MARKERS[kind]
  return (
    <div className={`flex min-h-5 min-w-0 gap-1 ${LINE_STYLES[kind]}`}>
      {/* 行番号と記号は見た目の手がかり。読み上げでは「追加」「削除」と内容だけにする */}
      <span
        aria-hidden="true"
        className="w-10 shrink-0 pr-1 text-right text-zinc-500 tabular-nums select-none dark:text-zinc-400"
      >
        {side.lineNumber}
      </span>
      <span aria-hidden="true" className="w-3 shrink-0 select-none">
        {marker.symbol}
      </span>
      {marker.label && <span className="sr-only">{marker.label}</span>}
      <span className="min-w-0 flex-1 break-all whitespace-pre-wrap">
        {side.segments.map((segment, i) => (
          <SegmentText key={i} segment={segment} kind={kind} />
        ))}
      </span>
    </div>
  )
}

function SegmentText({ segment, kind }: { segment: Segment; kind: LineKind }) {
  if (!segment.changed) return segment.text
  // 変わった文字は色に加えて、消えた文字は取り消し線、加わった文字は下線で示す
  return kind === 'removed' ? (
    <del className="bg-red-200 line-through dark:bg-red-800">
      {segment.text}
    </del>
  ) : (
    <ins className="bg-green-200 underline dark:bg-green-800">
      {segment.text}
    </ins>
  )
}

function EmptyLine() {
  return <div className="min-h-5 bg-zinc-50 dark:bg-zinc-900" />
}
