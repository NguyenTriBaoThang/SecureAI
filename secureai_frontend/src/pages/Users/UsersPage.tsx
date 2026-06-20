import { useEffect, useState } from 'react'
import { userApi, type UserDto, type CreateUserRequest } from '../../api/userApi'

const ROLES = ['Admin', 'Analyst', 'Viewer']

const roleColor: Record<string, { bg: string; color: string }> = {
  Admin:   { bg: '#fee2e2', color: '#991b1b' },
  Analyst: { bg: '#dbeafe', color: '#1e40af' },
  Viewer:  { bg: '#f3f4f6', color: '#374151' },
}

export function UsersPage() {
  const [users, setUsers]       = useState<UserDto[]>([])
  const [loading, setLoading]   = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]         = useState<CreateUserRequest>({ email: '', password: '', role: 'Analyst' })
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  const load = async () => {
    setLoading(true)
    try { setUsers(await userApi.getList()) }
    catch { setError('Không tải được danh sách users') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await userApi.create(form)
      setMsg('Tạo user thành công')
      setShowCreate(false)
      setForm({ email: '', password: '', role: 'Analyst' })
      load()
      setTimeout(() => setMsg(''), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi tạo user')
    } finally { setSaving(false) }
  }

  const toggleActive = async (u: UserDto) => {
    try {
      await userApi.update(u.id, { isActive: !u.isActive })
      load()
    } catch { setError('Lỗi cập nhật') }
  }

  const changeRole = async (u: UserDto, role: string) => {
    try {
      await userApi.update(u.id, { role })
      load()
    } catch { setError('Lỗi cập nhật role') }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', border: '1px solid #d1d5db',
    borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Quản lý Users</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{users.length} tài khoản</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Tạo user mới
        </button>
      </div>

      {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 16 }}>{msg}</div>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {/* Create form */}
      {showCreate && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#374151' }}>Tạo tài khoản mới</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 12 }}>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              type="email" placeholder="Email" required style={inputStyle} />
            <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              type="password" placeholder="Password" required style={inputStyle} />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{ background: saving ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Đang tạo...' : 'Tạo'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer', color: '#374151' }}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Email', 'Role', 'Trạng thái', 'Lần cuối đăng nhập', 'Ngày tạo', 'Hành động'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 14 }}>Đang tải...</td></tr>
            )}
            {!loading && users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select value={u.role} onChange={e => changeRole(u, e.target.value)} style={{ ...selectStyle, background: roleColor[u.role]?.bg ?? '#f3f4f6', color: roleColor[u.role]?.color ?? '#374151', fontWeight: 500, border: 'none' }}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: u.isActive ? '#d1fae5' : '#f3f4f6', color: u.isActive ? '#065f46' : '#6b7280' }}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => toggleActive(u)} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: u.isActive ? '#dc2626' : '#059669' }}>
                    {u.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
        {[
          { role: 'Admin',   desc: 'Toàn quyền: quản lý users, xóa threats, xem audit logs' },
          { role: 'Analyst', desc: 'Phân tích threats, gán nhãn, xác nhận false positive' },
          { role: 'Viewer',  desc: 'Chỉ xem dashboard, threats và alerts, không thao tác' },
        ].map(({ role, desc }) => (
          <div key={role} style={{ background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 14px' }}>
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: roleColor[role]?.bg, color: roleColor[role]?.color }}>{role}</span>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
