import { useEffect, useState } from 'react'
import { childSafeNetApi, type ScanLogItem } from '../../api/childSafeNetApi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Pill } from '../../components/ui/Pill'

function pillKind(action: string) {
  if (action === 'BLOCK') return 'danger'
  if (action === 'WARN') return 'warning'
  if (action === 'ALLOW') return 'success'
  return 'neutral'
}

function fmt(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function ScanLogsPage() {
  const [items, setItems] = useState<ScanLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [action, setAction] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await childSafeNetApi.getLogs({ page, pageSize, action: action || undefined, label: label || undefined })
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      const maybe = err as { message?: string }
      setError(maybe.message ?? 'Cannot load scan logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, action, label])

  return (
    <div className="saiPage">
      <div className="saiSectionHeader">
        <div>
          <h2>Scan Logs</h2>
          <p>ChildSafeNet-compatible scan history stored by `/api/scan`.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
      </div>

      <Card>
        <div className="saiInlineActions" style={{ marginBottom: 14 }}>
          <select className="saiInput" style={{ maxWidth: 180 }} value={action} onChange={(event) => { setPage(1); setAction(event.target.value) }}>
            <option value="">All actions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="WARN">WARN</option>
            <option value="BLOCK">BLOCK</option>
          </select>
          <input className="saiInput" style={{ maxWidth: 220 }} value={label} onChange={(event) => { setPage(1); setLabel(event.target.value) }} placeholder="Filter label" />
          <Pill kind="info">{total} logs</Pill>
        </div>

        {error && <div className="saiError" style={{ marginBottom: 12 }}>{error}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                <th style={th}>Time</th>
                <th style={th}>URL</th>
                <th style={th}>Action</th>
                <th style={th}>Risk</th>
                <th style={th}>Label</th>
                <th style={th}>Score</th>
                <th style={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={td}>{fmt(item.createdAt)}</td>
                  <td style={{ ...td, maxWidth: 380, wordBreak: 'break-all' }}>{item.url}</td>
                  <td style={td}><Pill kind={pillKind(item.action)}>{item.action}</Pill></td>
                  <td style={td}>{item.riskLevel}</td>
                  <td style={td}>{item.label}</td>
                  <td style={td}>{(item.score * 100).toFixed(1)}%</td>
                  <td style={td}>{item.source}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td style={td} colSpan={7}>No scan logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="saiInlineActions" style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <span className="saiCardText">Page {page}</span>
          <div className="saiInlineActions">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }
const td: React.CSSProperties = { padding: '12px 8px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }