import { useEffect, useMemo, useState } from 'react'
import { childSafeNetApi, type TrainJob } from '../../api/childSafeNetApi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Pill } from '../../components/ui/Pill'

function statusKind(status?: string) {
  const value = (status ?? '').toUpperCase()
  if (['ACTIVE', 'COMPLETED', 'SUCCESS', 'DONE'].includes(value)) return 'success'
  if (['FAILED', 'ERROR', 'CANCELLED'].includes(value)) return 'danger'
  return 'warning'
}

function fmt(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function TrainJobsPage() {
  const [items, setItems] = useState<TrainJob[]>([])
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [message, setMessage] = useState('')

  const stats = useMemo(() => ({ total: items.length, active: items.filter((x) => (x.status ?? '').toUpperCase() === 'ACTIVE').length }), [items])

  const load = async () => {
    setLoading(true)
    setMessage('')
    try {
      setItems(await childSafeNetApi.getTrainJobs())
    } catch (err) {
      const maybe = err as { message?: string }
      setMessage(maybe.message ?? 'Cannot load train jobs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const trigger = async () => {
    setTriggering(true)
    setMessage('')
    try {
      const res = await childSafeNetApi.triggerTrain()
      setMessage(`${res.status}: ${res.jobId}. ${res.message ?? ''}`)
      await load()
    } catch (err) {
      const maybe = err as { message?: string }
      setMessage(maybe.message ?? 'Cannot trigger training.')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="saiPage">
      <div className="saiSectionHeader">
        <div>
          <h2>Train Jobs</h2>
          <p>ChildSafeNet-compatible training control. In SecureAI this is a demo scheduler hook for offline retraining.</p>
        </div>
        <div className="saiInlineActions">
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          <Button onClick={trigger} disabled={triggering}>{triggering ? 'Queueing...' : 'Trigger Train'}</Button>
        </div>
      </div>

      {message && <div className="saiMutedBox" style={{ marginBottom: 16 }}>{message}</div>}

      <div className="saiGrid3" style={{ marginBottom: 16 }}>
        <Card><p className="saiCardText">Total jobs/models</p><div className="saiRiskNumber">{stats.total}</div></Card>
        <Card><p className="saiCardText">Active registry</p><div className="saiRiskNumber">{stats.active}</div></Card>
        <Card><p className="saiCardText">Mode</p><div className="saiRiskNumber" style={{ fontSize: 26 }}>Offline</div></Card>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                <th style={th}>Name</th>
                <th style={th}>Version</th>
                <th style={th}>Status</th>
                <th style={th}>Accuracy</th>
                <th style={th}>F1 weighted</th>
                <th style={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id ?? index}>
                  <td style={td}>{item.name ?? item.modelVersion ?? '-'}</td>
                  <td style={td}>{item.version ?? '-'}</td>
                  <td style={td}><Pill kind={statusKind(item.status)}>{item.status ?? 'UNKNOWN'}</Pill></td>
                  <td style={td}>{typeof item.accuracy === 'number' ? item.accuracy.toFixed(4) : '-'}</td>
                  <td style={td}>{typeof item.f1Weighted === 'number' ? item.f1Weighted.toFixed(4) : '-'}</td>
                  <td style={td}>{fmt(item.createdAt)}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td style={td} colSpan={6}>No model registry rows yet. Trigger Train returns a queued demo job.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }
const td: React.CSSProperties = { padding: '12px 8px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }