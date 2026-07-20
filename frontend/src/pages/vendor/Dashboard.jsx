import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Button, Skeleton, Tag, Typography } from 'antd'
import {
  TeamOutlined, ShoppingCartOutlined, FileTextOutlined, DollarOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  InboxOutlined, SendOutlined, BarChartOutlined, AuditOutlined,
  RollbackOutlined, FieldTimeOutlined, SafetyCertificateOutlined,
  FundOutlined, BankOutlined, StopOutlined, ReloadOutlined
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { workflowApi } from '../../api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Text } = Typography

// ─── ROLE CONFIG ────────────────────────────────────────────────────
const ROLE_CONFIG = {
  system_admin: {
    title: 'Admin Dashboard',
    cards: (m) => [
      { title: 'Total Active Vendors', value: m.activeVendors ?? '—', icon: <TeamOutlined />, color: '#1890ff', path: '/admin?tab=users' },
      { title: 'Open Purchase Orders', value: m.openPOs ?? '—', icon: <ShoppingCartOutlined />, color: '#52c41a', path: '/admin?tab=purchase-orders' },
      { title: 'Invoices In Pipeline', value: m.inPipeline ?? '—', icon: <FileTextOutlined />, color: '#faad14', path: '/vim/workplace?tab=pending' },
      { title: 'Payments Released (MTD)', value: m.paymentsMTD ?? 0, icon: <DollarOutlined />, color: '#52c41a', path: '/vim/workplace?tab=completed', isCurrency: true },
    ],
    actions: [
      { label: 'Create Purchase Order', path: '/admin?tab=purchase-orders&create=true', primary: true, icon: <ShoppingCartOutlined /> },
      { label: 'Manage Vendors', path: '/admin?tab=users', icon: <TeamOutlined /> },
      { label: 'View Full Audit Log', path: '/admin?tab=audit', icon: <AuditOutlined /> },
      { label: 'Download Reports', path: '/admin?tab=reports', icon: <BarChartOutlined /> },
    ],
  },
  vendor: {
    title: 'Vendor Dashboard',
    cards: (m) => [
      { title: 'Open Purchase Orders', value: m.openPOs ?? '—', icon: <ShoppingCartOutlined />, color: '#52c41a', path: '/purchase-orders' },
      { title: 'Invoices In Progress', value: m.inProgress ?? '—', icon: <ClockCircleOutlined />, color: '#faad14', path: '/invoices' },
      { title: 'Paid Invoices', value: m.paid ?? '—', icon: <CheckCircleOutlined />, color: '#1890ff', path: '/invoices' },
      { title: 'Rejected / Returned', value: m.rejected ?? '—', icon: <ExclamationCircleOutlined />, color: '#ff4d4f', path: '/invoices' },
    ],
    actions: [
      { label: 'Submit New Invoice', path: '/submit-invoice', primary: true, icon: <SendOutlined /> },
      { label: 'View Purchase Orders', path: '/purchase-orders', icon: <ShoppingCartOutlined /> },
      { label: 'Track Invoice Status', path: '/invoices', icon: <FileTextOutlined /> },
    ],
  },
  vendor_sub_user: null, // same as vendor, handled below
  vpd: {
    title: 'VPD Dashboard',
    cards: (m) => [
      { title: 'Pending Verification', value: m.pending ?? '—', icon: <ClockCircleOutlined />, color: '#faad14', path: '/vim/workplace?tab=pending' },
      { title: 'Approved This Month', value: m.approvedMTD ?? '—', icon: <CheckCircleOutlined />, color: '#52c41a', path: '/vim/workplace?tab=completed' },
      { title: 'Returned to Vendor', value: m.returnedMTD ?? '—', icon: <RollbackOutlined />, color: '#fa8c16', path: '/vim/workplace?tab=exceptions' },
    ],
    actions: [
      { label: 'Open My Inbox', path: '/vim/workplace?tab=inbox', primary: true, icon: <InboxOutlined /> },
      { label: 'View Exception Queue', path: '/vim/workplace?tab=exceptions', icon: <ExclamationCircleOutlined /> },
      { label: 'Download Reports', path: '/analytics', icon: <BarChartOutlined /> },
    ],
  },
  eic: {
    title: 'EIC Dashboard',
    cards: (m) => [
      { title: 'Awaiting Technical Approval', value: m.awaiting ?? '—', icon: <ClockCircleOutlined />, color: '#faad14', path: '/vim/workplace?tab=pending' },
      { title: 'Certified This Month', value: m.certifiedMTD ?? '—', icon: <SafetyCertificateOutlined />, color: '#52c41a', path: '/vim/workplace?tab=completed' },
      { title: 'Rejected / Returned', value: m.rejectedMTD ?? '—', icon: <StopOutlined />, color: '#ff4d4f', path: '/vim/workplace?tab=exceptions' },
      { title: 'Avg. Approval Time', value: m.avgApprovalHours ?? '—', icon: <FieldTimeOutlined />, color: '#1890ff', suffix: ' hrs', nonClickable: true },
    ],
    actions: [
      { label: 'Open My Inbox', path: '/vim/workplace?tab=inbox', primary: true, icon: <InboxOutlined /> },
      { label: 'View Completed Certifications', path: '/vim/workplace?tab=completed', icon: <CheckCircleOutlined /> },
      { label: 'View Analytics', path: '/analytics', icon: <BarChartOutlined /> },
    ],
  },
  vpg: {
    title: 'VPG Dashboard',
    cards: (m) => [
      { title: 'Pending Payment Processing', value: m.pending ?? '—', icon: <ClockCircleOutlined />, color: '#faad14', path: '/vim/workplace?tab=pending' },
      { title: 'Forwarded to Finance (MTD)', value: m.forwardedMTD ?? '—', icon: <SendOutlined />, color: '#52c41a', path: '/vim/workplace?tab=completed' },
      { title: 'Retention Adjustments', value: m.retentionAdj ?? '—', icon: <FundOutlined />, color: '#1890ff', path: '/vim/workplace?tab=exceptions' },
      { title: 'Total Net Payable (MTD)', value: m.netPayableMTD ?? 0, icon: <DollarOutlined />, color: '#52c41a', isCurrency: true, nonClickable: true },
    ],
    actions: [
      { label: 'Open My Inbox', path: '/vim/workplace?tab=inbox', primary: true, icon: <InboxOutlined /> },
      { label: 'View Processed Invoices', path: '/vim/workplace?tab=completed', icon: <CheckCircleOutlined /> },
      { label: 'View Analytics', path: '/analytics', icon: <BarChartOutlined /> },
    ],
  },
  finance: {
    title: 'Finance Dashboard',
    cards: (m) => [
      { title: 'Pending Finance Approval', value: m.pending ?? '—', icon: <ClockCircleOutlined />, color: '#faad14', path: '/vim/workplace?tab=pending' },
      { title: 'Payments Approved (MTD)', value: m.approvedMTD ?? '—', icon: <CheckCircleOutlined />, color: '#52c41a', path: '/vim/workplace?tab=completed' },
      { title: 'Payments Released', value: m.released ?? '—', icon: <BankOutlined />, color: '#1890ff', path: '/vim/workplace?tab=completed' },
      { title: 'Total Payment Value (MTD)', value: m.totalMTD ?? 0, icon: <DollarOutlined />, color: '#52c41a', isCurrency: true, nonClickable: true },
    ],
    actions: [
      { label: 'Open My Inbox', path: '/vim/workplace?tab=inbox', primary: true, icon: <InboxOutlined /> },
      { label: 'View Released Payments', path: '/vim/workplace?tab=completed', icon: <BankOutlined /> },
      { label: 'View Analytics', path: '/analytics', icon: <BarChartOutlined /> },
    ],
  },
}

// ─── STATUS COLORS ──────────────────────────────────────────────────
const ACTION_COLORS = {
  APPROVED: '#52c41a', FORWARDED: '#52c41a', INVOICE_SUBMITTED: '#1890ff',
  REJECTED: '#ff4d4f', INVOICE_REJECTED: '#ff4d4f', HELD: '#fa8c16',
  PAYMENT_APPROVED: '#52c41a', Paid: '#52c41a', PO_CREATED: '#1890ff',
}
const ROLE_TAG_COLORS = {
  vendor: '#2db7f5', vpd: '#87d068', eic: '#f50', vpg: '#108ee9', finance: '#722ed1', system_admin: '#faad14',
}

function fmt(v) {
  return `₹ ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ─── METRIC CARD ────────────────────────────────────────────────────
function MetricCard({ title, value, icon, color, loading, error, onClick, isCurrency, suffix, nonClickable }) {
  return (
    <Card
      hoverable={!nonClickable}
      onClick={nonClickable ? undefined : onClick}
      style={{ cursor: nonClickable ? 'default' : 'pointer', borderTop: `3px solid ${color}`, height: '100%' }}
      bodyStyle={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}
    >
      {loading ? (
        <Skeleton.Button active style={{ width: 80, height: 40 }} />
      ) : (
        <>
          <div style={{ fontSize: 36, color, marginBottom: 4 }}>{icon}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.2, textAlign: 'center' }}>
            {error ? (
              <span style={{ fontSize: 20, color: '#999' }}>— <ReloadOutlined style={{ fontSize: 14 }} /></span>
            ) : isCurrency ? (
              fmt(value)
            ) : (
              <>{value}{suffix || ''}</>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' }}>{title}</div>
        </>
      )}
    </Card>
  )
}

// ─── RECENT ACTIVITY ROW ────────────────────────────────────────────
function ActivityRow({ item, role, onClick }) {
  const isAdmin = role === 'system_admin'
  const isVendor = ['vendor', 'vendor_sub_user'].includes(role)
  const action = item.action || ''
  const accentColor = ACTION_COLORS[action] || ACTION_COLORS[item.status] || '#1890ff'

  return (
    <div onClick={onClick} style={{
      padding: '10px 0', borderBottom: '1px solid #f0f0f0',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      cursor: 'pointer',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13 }}>
          {item.invoiceNumber || item.resourceId || '-'}
        </Text>
        {isAdmin && item.actorRole && (
          <Tag color={ROLE_TAG_COLORS[item.actorRole] || 'default'} style={{ fontSize: 10, marginLeft: 6 }}>
            {item.actorRole.toUpperCase()}
          </Tag>
        )}
        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
          {action.replace(/_/g, ' ')}
          {item.vendorName && <span> — {item.vendorName}</span>}
          {item.netAmount && !isVendor && <span> — {fmt(item.netAmount)}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4,
          background: `${accentColor}15`, color: accentColor, fontWeight: 500,
        }}>
          {item.status || action}
        </span>
        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
          {item.timestamp ? dayjs(item.timestamp).fromNow() : ''}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [metrics, setMetrics] = useState({})
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const userRole = user?.role || 'vendor'
  const config = ROLE_CONFIG[userRole] || ROLE_CONFIG.vendor
  const displayConfig = config || ROLE_CONFIG.vendor

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      setLoading(true)
      setError(false)
      try {
        const [statsRes, activityRes] = await Promise.all([
          workflowApi.getDashboardStats(),
          workflowApi.getRecentActivity(),
        ])
        if (!cancelled) {
          setMetrics(statsRes.data.data || {})
          setActivity(activityRes.data.data || [])
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [userRole])

  const cards = displayConfig.cards(metrics)
  const actions = displayConfig.actions

  return (
    <div>
      <h1 className="page-title">{displayConfig.title || 'Dashboard'}</h1>

      {/* ─── Metric Cards ─── */}
      <Row gutter={[24, 24]}>
        {cards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <MetricCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              loading={loading}
              error={error}
              isCurrency={card.isCurrency}
              suffix={card.suffix}
              nonClickable={card.nonClickable}
              onClick={() => card.path && navigate(card.path)}
            />
          </Col>
        ))}
      </Row>

      {/* ─── Quick Actions + Recent Activity ─── */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" className="card-shadow">
            {actions.map((action, i) => (
              <Button
                key={i}
                type={action.primary ? 'primary' : 'default'}
                block
                size="large"
                icon={action.icon}
                style={{
                  marginBottom: i < actions.length - 1 ? 12 : 0,
                  ...(action.primary
                    ? { background: '#1B5E20', borderColor: '#1B5E20' }
                    : { background: '#fff', borderColor: '#E0E0E0', color: '#333' }
                  ),
                }}
                onClick={() => navigate(action.path)}
              >
                {action.label}
              </Button>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recent Activity" className="card-shadow" bodyStyle={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 16 }}>
                {[1,2,3,4,5].map(i => <Skeleton key={i} active paragraph={{ rows: 1 }} style={{ marginBottom: 8 }} />)}
              </div>
            ) : activity.length > 0 ? (
              <div>
                {activity.map((item, idx) => (
                  <ActivityRow key={item.id || idx} item={item} role={userRole} onClick={() => {
                    if (item.invoiceNumber && item.invoiceNumber !== '-') navigate('/invoices')
                  }} />
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
                No recent activity to display
              </p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
