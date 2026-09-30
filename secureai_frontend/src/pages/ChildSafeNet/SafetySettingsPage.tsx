import { useEffect, useMemo, useState } from 'react'
import { childSafeNetApi, type ChildSettings, type ProtectionMode } from '../../api/childSafeNetApi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Pill } from '../../components/ui/Pill'

const defaultSettings: ChildSettings = {
  childAge: 10,
  mode: 'Balanced',
  whitelist: [],
  blacklist: [],
  blockAdult: true,
  blockGambling: true,
  blockPhishing: true,
  warnSuspicious: true,
}

function parseDomains(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function toText(items: string[]) {
  return items.join('\n')
}

export function SafetySettingsPage() {
  const [settings, setSettings] = useState<ChildSettings>(defaultSettings)
  const [whitelist, setWhitelist] = useState('')
  const [blacklist, setBlacklist] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const wlCount = useMemo(() => parseDomains(whitelist).length, [whitelist])
  const blCount = useMemo(() => parseDomains(blacklist).length, [blacklist])

  const load = async () => {
    setLoading(true)
    setMessage('')
    try {
      const data = await childSafeNetApi.getSettings()
      setSettings({ ...defaultSettings, ...data })
      setWhitelist(toText(data.whitelist ?? []))
      setBlacklist(toText(data.blacklist ?? []))
    } catch (err) {
      setMessage(readError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const payload: ChildSettings = {
        ...settings,
        childAge: Math.max(1, Math.min(18, Number(settings.childAge) || 10)),
        whitelist: parseDomains(whitelist),
        blacklist: parseDomains(blacklist),
      }
      const data = await childSafeNetApi.updateSettings(payload)
      setSettings({ ...defaultSettings, ...data })
      setWhitelist(toText(data.whitelist ?? []))
      setBlacklist(toText(data.blacklist ?? []))
      setMessage('Settings saved.')
    } catch (err) {
      setMessage(readError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="saiPage">
      <div className="saiSectionHeader">
        <div>
          <h2>Safety Settings</h2>
          <p>Ported from ChildSafeNet. These settings control allow/block lists and scan decisions in `/api/scan`.</p>
        </div>
        <div className="saiInlineActions">
          <Button variant="secondary" onClick={load} disabled={loading || saving}>{loading ? 'Loading...' : 'Refresh'}</Button>
          <Button onClick={save} disabled={saving || loading}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>

      {message && <div className="saiMutedBox" style={{ marginBottom: 16 }}>{message}</div>}

      <div className="saiGrid2">
        <Card>
          <div className="saiCardHeader">
            <div>
              <h3 className="saiCardTitle">Mode and thresholds</h3>
              <p className="saiCardText">Keep the ChildSafeNet protection modes, mapped to SecureAI scan decisions.</p>
            </div>
            <Pill kind="info">{settings.mode}</Pill>
          </div>

          <label className="saiFormLabel">Profile age</label>
          <input className="saiInput" type="number" min={1} max={18} value={settings.childAge} onChange={(event) => setSettings({ ...settings, childAge: Number(event.target.value) })} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
            {(['Strict', 'Balanced', 'Relaxed'] as ProtectionMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`saiButton ${settings.mode === mode ? 'saiButtonPrimary' : 'saiButtonSecondary'}`}
                onClick={() => setSettings({ ...settings, mode })}
              >
                {mode}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            <Toggle label="Block adult" checked={settings.blockAdult} onChange={(value) => setSettings({ ...settings, blockAdult: value })} />
            <Toggle label="Block gambling" checked={settings.blockGambling} onChange={(value) => setSettings({ ...settings, blockGambling: value })} />
            <Toggle label="Block phishing/malware" checked={settings.blockPhishing} onChange={(value) => setSettings({ ...settings, blockPhishing: value })} />
            <Toggle label="Warn suspicious" checked={settings.warnSuspicious} onChange={(value) => setSettings({ ...settings, warnSuspicious: value })} />
          </div>
        </Card>

        <Card>
          <div className="saiCardHeader">
            <div>
              <h3 className="saiCardTitle">Decision lists</h3>
              <p className="saiCardText">One domain per line. Blacklist wins before model inference; whitelist allows directly.</p>
            </div>
            <div className="saiInlineActions">
              <Pill kind="success">{wlCount} allow</Pill>
              <Pill kind="danger">{blCount} block</Pill>
            </div>
          </div>

          <label className="saiFormLabel">Always allow</label>
          <textarea className="saiTextarea" value={whitelist} onChange={(event) => setWhitelist(event.target.value)} placeholder="hutech.edu.vn\nwikipedia.org" />

          <label className="saiFormLabel" style={{ marginTop: 14 }}>Always block</label>
          <textarea className="saiTextarea" value={blacklist} onChange={(event) => setBlacklist(event.target.value)} placeholder="evil-login.net\nmalware-demo.test" />
        </Card>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span style={{ fontWeight: 800, fontSize: 13 }}>{label}</span>
    </label>
  )
}

function readError(err: unknown) {
  const maybe = err as { response?: { data?: { message?: string } }; message?: string }
  return maybe.response?.data?.message ?? maybe.message ?? 'Request failed.'
}