import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Pill } from '../../components/ui/Pill'
import {
  ShieldAlert,
  BrainCircuit,
  Scale,
  Flame,
  MailCheck,
  Sliders,
  ScanSearch,
  LayoutDashboard,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Zap,
} from 'lucide-react'

const featureCards = [
  {
    icon: BrainCircuit,
    title: 'Đánh giá nguy cơ thông minh (Threat Scoring)',
    text: 'Tổng hợp điểm số mô hình BiLSTM + Attention, phân loại nhãn và phân tích Threat Intelligence để chuyển hóa URL thành tín hiệu cảnh báo rõ ràng.',
    tag: 'Deep Learning',
  },
  {
    icon: Scale,
    title: 'Hỗ trợ ra quyết định (Decision Support)',
    text: 'Đưa ra khuyến nghị tự động Chặn (Block), Xem xét (Review) hoặc Cho phép (Allow) kèm theo lý do cụ thể và các bước xử lý tiếp theo cho SOC Analyst.',
    tag: 'Rule Engine',
  },
  {
    icon: Flame,
    title: 'Quy trình xử lý sự cố (Incident Response)',
    text: 'Tự động nâng cấp các mối đe dọa nghiêm trọng thành Incident để phân bổ điều tra, ghi nhận bằng chứng và giải quyết theo vòng đời chuẩn SOC.',
    tag: 'Case Management',
  },
  {
    icon: MailCheck,
    title: 'Phân tích Email Phishing chuyên sâu',
    text: 'Kiểm tra chữ ký SPF/DKIM/DMARC, bóc tách từ khóa lừa đảo, phát hiện thương hiệu giả mạo và trích xuất URL nhúng trong tệp ảnh hoặc PDF.',
    tag: 'Email Gateway',
  },
  {
    icon: Activity,
    title: 'Giải thích mô hình trực quan (Explainable AI)',
    text: 'Trực quan hóa trọng số Attention Heatmap lên từng ký tự của URL, giúp chuyên gia thấu hiểu chính xác lý do AI đưa ra kết luận.',
    tag: 'XAI Heatmap',
  },
  {
    icon: Sliders,
    title: 'Động cơ chính sách linh hoạt (Rule Engine)',
    text: 'Tùy biến ngưỡng Block/Review, kích hoạt cơ chế tự động tạo cảnh báo và ưu tiên phát hiện mã độc theo chính sách an ninh của tổ chức.',
    tag: 'Policy Control',
  },
]

const workflowSteps = [
  {
    step: '01',
    title: 'Thu thập & Trích xuất',
    desc: 'Tiếp nhận URL hoặc email từ người dùng, nhật ký mạng (Logs) hoặc cổng API Gateway.',
  },
  {
    step: '02',
    title: 'Phân tích & XAI',
    desc: 'Mô hình AI chấm điểm rủi ro, dự đoán loại tấn công và bóc tách heatmap các ký tự độc hại.',
  },
  {
    step: '03',
    title: 'Quyết định tự động',
    desc: 'Đối chiếu Rule Engine để đề xuất hành động Cho phép, Xem xét hoặc Chặn tức thì.',
  },
  {
    step: '04',
    title: 'Ứng phó & Phản hồi',
    desc: 'Kích hoạt cảnh báo thời gian thực qua SignalR, lưu trữ vào Incident và thu thập feedback nâng cao độ chính xác.',
  },
]

const previewRows = [
  { tag: 'Block', url: 'https://login-secure-pay.verify-center.net/update', risk: '96.4%', label: 'Phishing' },
  { tag: 'Review', url: 'https://fileshare-update.internal-check.org/auth', risk: '68.2%', label: 'Suspicious' },
  { tag: 'Allow', url: 'https://portal.hutech.edu.vn/sinh-vien', risk: '04.1%', label: 'Benign' },
]

export function HomePage() {
  return (
    <div className="saiPage">
      {/* 3D Cyber Hero Command Center */}
      <section className="saiHero">
        <div className="saiHeroMain">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Pill kind="info">SECUREAI COMMAND CENTER</Pill>
              <span style={{ fontSize: 12, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} /> AI-Powered SOC Platform
              </span>
            </div>

            <h1 className="saiHeroTitle">
              Trung tâm Giám sát & Ra quyết định An ninh mạng
            </h1>

            <p className="saiHeroLead">
              Hệ thống phòng thủ chuyên sâu ứng dụng Trí tuệ nhân tạo (BiLSTM & XAI Attention), hỗ trợ tự động hóa phát hiện URL độc hại, chống lừa đảo trực tuyến và tối ưu hóa năng suất cho đội ngũ SOC Analyst.
            </p>

            <div className="saiHeroActions">
              <Link to="/scan" className="saiButton saiButtonPrimary">
                <ScanSearch size={16} />
                <span>Quét URL Nhanh</span>
              </Link>
              <Link to="/dashboard" className="saiButton saiButtonSecondary">
                <LayoutDashboard size={16} />
                <span>Mở SOC Dashboard</span>
              </Link>
              <Link to="/incidents" className="saiButton saiButtonGhost">
                <Flame size={16} />
                <span>Xử lý Sự cố (Incidents)</span>
              </Link>
            </div>
          </div>

          <div className="saiHeroStats">
            <div className="saiHeroStat">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', marginBottom: 4 }}>
                <ShieldAlert size={16} />
                <strong style={{ fontSize: 16 }}>Chặn (Block)</strong>
              </div>
              <span>Ngăn chặn tức thì khi điểm rủi ro vượt ngưỡng an toàn.</span>
            </div>
            <div className="saiHeroStat">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', marginBottom: 4 }}>
                <AlertTriangle size={16} />
                <strong style={{ fontSize: 16 }}>Xem xét (Review)</strong>
              </div>
              <span>Đưa vào hàng đợi xác minh chuyên sâu cho Analyst.</span>
            </div>
            <div className="saiHeroStat">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', marginBottom: 4 }}>
                <ShieldCheck size={16} />
                <strong style={{ fontSize: 16 }}>Cho phép (Allow)</strong>
              </div>
              <span>Ghi nhận URL an toàn và giải phóng truy cập.</span>
            </div>
          </div>
        </div>

        {/* 3D Holographic Live Preview */}
        <Card padded={false} className="saiPreviewShell">
          <div className="saiPreviewTop">
            <div className="saiWindowDots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Pill kind="success">HỆ THỐNG TRỰC TUYẾN (LIVE SOC)</Pill>
          </div>

          <div className="saiPreviewGrid">
            <div className="saiPreviewMetric">
              <span>Sự cố đang mở</span>
              <strong>12</strong>
            </div>
            <div className="saiPreviewMetric">
              <span>Đang điều tra</span>
              <strong>05</strong>
            </div>
            <div className="saiPreviewMetric">
              <span>Cảnh báo nguy cấp</span>
              <strong style={{ color: '#f87171' }}>03</strong>
            </div>
            <div className="saiPreviewMetric">
              <span>Hàng đợi Review</span>
              <strong style={{ color: '#fbbf24' }}>18</strong>
            </div>
          </div>

          <div className="saiPreviewList">
            {previewRows.map((row) => (
              <div className="saiPreviewRow" key={row.url}>
                <Pill kind={row.tag === 'Block' ? 'danger' : row.tag === 'Review' ? 'warning' : 'success'}>
                  {row.tag}
                </Pill>
                <strong title={row.url}>{row.url}</strong>
                <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                  {row.risk}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Feature Capabilities Grid */}
      <section style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Năng lực Cốt lõi của Hệ thống
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, maxWidth: 700 }}>
              Cung cấp giải pháp toàn diện từ phát hiện sớm, giải thích trực quan, ra quyết định tự động đến phản hồi và huấn luyện liên tục.
            </p>
          </div>
          <Link to="/rules" className="saiButton saiButtonSecondary">
            <Sliders size={15} />
            <span>Cấu hình Rule Engine</span>
          </Link>
        </div>

        <div className="saiGrid3">
          {featureCards.map((card) => {
            const Icon = card.icon
            return (
              <Card className="saiFeatureCard" key={card.title}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="saiFeatureIcon">
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    {card.tag}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                    {card.text}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* 4-Step SOC Workflow */}
      <section style={{ marginTop: 40, marginBottom: 40 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
            Quy trình Phản ứng An ninh mạng 4 Bước
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
            Chu trình khép kín giúp tối ưu hóa thời gian xử lý trung bình (MTTR) cho trung tâm vận hành an ninh SOC.
          </p>
        </div>

        <div className="saiGrid4">
          {workflowSteps.map((step) => (
            <div
              key={step.step}
              className="saiCard"
              style={{
                padding: '22px 20px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  width: 'fit-content',
                  marginBottom: 14,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
                }}
              >
                BƯỚC {step.step}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
