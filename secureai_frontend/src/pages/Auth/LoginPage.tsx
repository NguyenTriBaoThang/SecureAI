import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Shield, Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('admin@secureai.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Email hoặc mật khẩu không chính xác. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const fillQuickAccount = (e: string, p: string) => {
    setEmail(e)
    setPassword(p)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.15), transparent), radial-gradient(circle at 50% 50%, #0c1427 0%, #060913 100%)',
      }}
    >
      {/* 3D Floating Glow Sphere in Background */}
      <div
        style={{
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* 3D Glass Portal Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 20,
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
          padding: '44px 38px',
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Shield & Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              marginBottom: 16,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Shield size={32} strokeWidth={2.4} />
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
              background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SecureAI Portal
          </h1>

          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Hệ thống An ninh mạng & Điều tra đe dọa trực tuyến
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="saiFormLabel" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} color="#38bdf8" />
              <span>Email quản trị</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="saiInput"
                placeholder="name@organization.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="saiFormLabel" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} color="#38bdf8" />
              <span>Mật khẩu</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="saiInput"
                placeholder="••••••••••••"
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="saiButton saiButtonPrimary"
            style={{
              padding: '12px',
              fontSize: 14,
              fontWeight: 700,
              marginTop: 6,
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45)',
            }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Đang xác thực hệ thống...' : 'Đăng nhập vào SOC'}</span>
          </button>
        </form>

        {/* Demo Quick Accounts */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, textAlign: 'center' }}>
            Tài khoản mẫu thử nghiệm
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fillQuickAccount('admin@secureai.local', 'Admin@123')}
              className="saiButton saiButtonSecondary"
              style={{ fontSize: 11, padding: '5px 10px', minHeight: 28 }}
            >
              <Sparkles size={12} color="#38bdf8" />
              <span>Admin (Admin@123)</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('analyst@secureai.local', 'Analyst@123')}
              className="saiButton saiButtonSecondary"
              style={{ fontSize: 11, padding: '5px 10px', minHeight: 28 }}
            >
              <Sparkles size={12} color="#a855f7" />
              <span>Analyst (Analyst@123)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
