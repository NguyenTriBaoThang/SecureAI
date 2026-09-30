import { useEffect, useMemo, useState } from 'react'
import { childSafeNetApi, type DatasetItem } from '../../api/childSafeNetApi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Pill } from '../../components/ui/Pill'

function actionKind(action: string) {
  if (action === 'BLOCK') return 'danger'
  if (action === 'WARN') return 'warning'
  if (action === 'ALLOW') return 'success'
  return 'neutral'
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `secureai_dataset_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function DatasetReviewPage() {
  const [items, setItems] = useState<DatasetItem[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected])
  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase()
    if (!key) return items
    return items.filter((item) => `${item.url} ${item.host} ${item.predictedLabel} ${item.action} ${item.source}`.toLowerCase().includes(key))
  }, [items, query])

  const load = async () => {
    setLoading(true)
    setMessage('')
    try {
      setItems(await childSafeNetApi.getPendingDataset(200))
      setSelected({})
    } catch (err) {
      const maybe = err as { message?: string }
      setMessage(maybe.message ?? 'Cannot load dataset.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const bulk = async (kind: 'approve' | 'reject') => {
    if (selectedIds.length === 0) {
      setMessage('Select at least one dataset row.')
      return
    }
    setMessage('')
    try {
      const res = kind === 'approve'
        ? await childSafeNetApi.approveDataset(selectedIds)
        : await childSafeNetApi.rejectDataset(selectedIds)
      setMessage(`${kind} completed for ${res.count} rows.`)
      await load()
    } catch (err) {
      const maybe = err as { message?: string }
      setMessage(maybe.message ?? `${kind} failed.`)
    }
  }

  const exportCsv = async () => {
    try {
      download(await childSafeNetApi.exportDataset())
    } catch (err) {
      const maybe = err as { message?: string }
      setMessage(maybe.message ?? 'Export failed.')
    }
  }

  return (
    <div className="saiPage">
      <div className="saiSectionHeader">
        <div>
          <h2>Dataset Review</h2>
          <p>Pending URLs collected from ChildSafeNet-compatible scan flow. Admin can approve, reject and export verified rows.</p>
        </div>
        <div className="saiInlineActions">
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
          <Button disabled={selectedIds.length === 0} onClick={() => bulk('approve')}>Approve</Button>
          <Button variant="danger" disabled={selectedIds.length === 0} onClick={() => bulk('reject')}>Reject</Button>
        </div>
      </div>

      {message && <div className="saiMutedBox" style={{ marginBottom: 16 }}>{message}</div>}

      <Card>
        <div className="saiInlineActions" style={{ marginBottom: 14 }}>
          <input className="saiInput" style={{ maxWidth: 420 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search URL, host, label, action" />
          <Pill kind="info">{filtered.length} pending</Pill>
          <Pill kind="warning">{selectedIds.length} selected</Pill>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                <th style={th}></th>
                <th style={th}>URL</th>
                <th style={th}>Action</th>
                <th style={th}>Label</th>
                <th style={th}>Score</th>
                <th style={th}>Seen</th>
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={td}><input type="checkbox" checked={!!selected[item.id]} onChange={(event) => setSelected((prev) => ({ ...prev, [item.id]: event.target.checked }))} /></td>
                  <td style={{ ...td, maxWidth: 430, wordBreak: 'break-all' }}><strong>{item.host || '-'}</strong><br />{item.url}</td>
                  <td style={td}><Pill kind={actionKind(item.action)}>{item.action}</Pill></td>
                  <td style={td}>{item.predictedLabel}</td>
                  <td style={td}>{(item.predictedScore * 100).toFixed(1)}%</td>
                  <td style={td}>{item.seenCount}</td>
                  <td style={td}>{item.source}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td style={td} colSpan={7}>No pending dataset rows.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }
const td: React.CSSProperties = { padding: '12px 8px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }