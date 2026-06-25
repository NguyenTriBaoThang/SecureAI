import { useEffect, useState } from 'react'
import { userApi, type UserDto, type CreateUserRequest } from '../../api/userApi'

const ROLES = ['Admin', 'Analyst', 'Viewer']

const roleColor: Record<string, { bg: string; color: string }> = {
  Admin: { bg: '#fee2e2', color: '#991b1b' },
  Analyst: { bg: '#dbeafe', color: '#1e40af' },
  Viewer: { bg: '#f3f4f6', color: '#374151' },
}

export function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateUserRequest>({ email: '', password: '', role: 'Analyst' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try { setUsers(await userApi.getList()) }
    catch { setError('Không tải được danh sách người dùng.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await userApi.create(form)
      setMsg('Đã tạo tài khoản mới.')
      setShowCreate(false)
      setForm({ email: '', password: '', role: 'Analyst' })
      load()
      setTimeout(() => setMsg(''), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không tạo được user.')
    } finally { setSaving(false) }
  }

  const toggleActive = async (u: UserDto) => {
    try {
      await userApi.update(u.id, { isActive: !u.isActive })
      setMsg(u.isActive ? 'Đã khóa tài khoản.' : 'Đã mở tài khoản.')
      load()
      setTimeout(() => setMsg(''), 2500)
    } catch { setError('Không cập nhật được trạng thái tài khoản.') }
  }

  const changeRole = async (u: UserDto, role: string) => {
    try {
      await userApi.update(u.id, { role })
      setMsg('Đã cập nhật role.')
      load()
      setTimeout(() => setMsg(''), 2500)
    } catch { setError('Không cập nhật được role.') }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Quản lý người dùng</h1>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{users.length} tài khoản trong hệ thống</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          Tạo user mới
        </button>
      </div>

      {msg && <Notice color="#166534" bg="#f0fdf4" border="#bbf7d0" text={msg} />}
      {error && <Notice color="#b91c1c" bg="#fef2f2" border="#fecaca" text={error} />}

      {showCreate && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', color: '#374151' }}>Tạo tài khoản</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 12 }}>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="Email" required style={inputStyle} />
            <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="password" placeholder="Mật khẩu" required minLength={6} style={inputStyle} />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{ background: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Đang tạo...' : 'Tạo'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer', color: '#374151' }}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Email', 'Role', 'Trạng thái', 'Đăng nhập cuối', 'Ngày tạo', 'Hành động'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 14 }}>Đang tải...</td></tr>}
            {!loading && users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select value={u.role} onChange={e => changeRole(u, e.target.value)} style={{ ...selectStyle, background: roleColor[u.role]?.bg ?? '#f3f4f6', color: roleColor[u.role]?.color ?? '#374151', fontWeight: 800, border: 'none' }}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: u.isActive ? '#d1fae5' : '#f3f4f6', color: u.isActive ? '#065f46' : '#6b7280' }}>
                    {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => toggleActive(u)} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: u.isActive ? '#dc2626' : '#059669', fontWeight: 700 }}>
                    {u.isActive ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
        {[
          { role: 'Admin', desc: 'Toàn quyền quản trị user, rule engine và dữ liệu threat.' },
          { role: 'Analyst', desc: 'Phân tích threat, xử lý alert, gán nhãn và ghi chú.' },
          { role: 'Viewer', desc: 'Xem dashboard, threat, alert và report.' },
        ].map(({ role, desc }) => (
          <div key={role} style={{ background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', padding: '12px 14px' }}>
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800, background: roleColor[role]?.bg, color: roleColor[role]?.color }}>{role}</span>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 13,
  background: '#fff',
  cursor: 'pointer',
}

function Notice({ text, color, bg, border }: { text: string; color: string; bg: string; border: string }) {
  return <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color, marginBottom: 16 }}>{text}</div>
}
