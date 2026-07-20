import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, Table, Tag, Card, Row, Col, Statistic, Space, Input, Select, Spin, message, Typography, Badge, Button, Modal } from 'antd'
import { InboxOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { workflowApi, hrApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input

const STATUS_COLORS = {
  Draft: 'default', Submitted: 'blue', VPD_APPROVED: 'cyan', EIC_APPROVED: 'geekblue',
  VPG_PROCESSED: 'purple', FINANCE_APPROVED: 'gold', Paid: 'green',
  Rejected: 'red', ON_HOLD: 'orange', 'Under Review': 'processing',
  'Manager Approved': 'cyan', 'Finance Processed': 'gold',
}

function fmt(v) { return `₹ ${(v || 0).toLocaleString('en-IN')}` }

export default function Workplace() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState(urlTab || 'inbox')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState({})
  const [search, setSearch] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState({})

  const isAdmin = user?.role === 'system_admin'
  const isFinance = user?.role === 'finance'
  const role = user?.role?.toUpperCase()

  // Read tab from URL on mount
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [urlTab])

  const fetchInvoices = async (tab) => {
    setLoading(true)
    try {
      let res
      if (isFinance) {
        res = await workflowApi.getFinanceInbox({ tab, limit: 100 })
      } else {
        res = await workflowApi.getInbox({ tab, limit: 100 })
      }
      setInvoices(res.data.data || [])
    } catch (err) {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const res = await workflowApi.getDashboardStats()
      setMetrics(res.data.data)
    } catch {
      setMetrics({})
    }
  }

  useEffect(() => {
    fetchInvoices(activeTab)
    fetchMetrics()
  }, [activeTab])

  // ── Actions ──
  const handleAccept = async (record) => {
    const id = record._id
    setActionLoading(prev => ({ ...prev, [id]: 'accept' }))
    try {
      if (isFinance && record.itemType === 'travel_claim') {
        await hrApi.processTravelClaim(id, { action: 'accept' })
        message.success('Travel claim accepted — status set to Paid')
      } else {
        await workflowApi.approve(id, 'Approved')
        message.success('Invoice approved')
      }
      // Refresh after action
      fetchInvoices(activeTab)
      fetchMetrics()
    } catch (err) {
      message.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    const id = rejectModal._id
    setActionLoading(prev => ({ ...prev, [id]: 'reject' }))
    try {
      if (isFinance && rejectModal.itemType === 'travel_claim') {
        await hrApi.processTravelClaim(id, { action: 'reject', comments: rejectReason })
        message.success('Travel claim rejected')
      } else {
        await workflowApi.reject(id, rejectReason)
        message.success('Invoice rejected')
      }
      setRejectModal(null)
      setRejectReason('')
      fetchInvoices(activeTab)
      fetchMetrics()
    } catch (err) {
      message.error(err.response?.data?.message || 'Rejection failed')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  // ── Columns ──
  const getColumns = () => {
    if (isFinance) {
      // Finance inbox: From, Type, Name, Code, Plant, Amount, Action
      const cols = [
        { title: 'From', dataIndex: 'from', key: 'from', width: 80, render: v => <Tag color={v === 'HR' ? 'purple' : 'blue'}>{v}</Tag> },
        { title: 'Type', dataIndex: 'type', key: 'type', width: 180, render: v => <Tag>{v}</Tag> },
        { title: 'Name', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
        { title: 'Code', dataIndex: 'code', key: 'code', width: 100 },
        { title: 'Plant', dataIndex: 'plant', key: 'plant', width: 100 },
        { title: 'Amount', dataIndex: 'amount', key: 'amt', width: 140, render: fmt, align: 'right' },
      ]

      if (activeTab === 'inbox') {
        cols.push({
          title: 'Action', key: 'action', width: 180,
          render: (_, record) => (
            <Space>
              <Button type="primary" size="small" icon={<CheckOutlined />}
                loading={actionLoading[record._id] === 'accept'}
                onClick={(e) => { e.stopPropagation(); handleAccept(record) }}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >Accept</Button>
              <Button danger size="small" icon={<CloseOutlined />}
                loading={actionLoading[record._id] === 'reject'}
                onClick={(e) => { e.stopPropagation(); setRejectModal(record); }}
              >Reject</Button>
            </Space>
          ),
        })
      } else {
        cols.push({
          title: 'Status', dataIndex: 'status', key: 'status', width: 140,
          render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
        })
      }
      return cols
    }

    // Standard columns for VPD/EIC/VPG/Admin
    const cols = [
      {
        title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'num', width: 160,
        render: (v, r) => <a onClick={(e) => { e.stopPropagation(); navigate(`/vim/invoice/${r._id}`) }}>{v || r.referenceNumber}</a>,
      },
      { title: 'Type', dataIndex: 'invoiceType', key: 'type', width: 140, render: (v) => <Tag>{v}</Tag> },
      { title: 'Vendor', dataIndex: 'vendorName', key: 'vendor', width: 180, ellipsis: true },
      { title: 'Vendor Code', dataIndex: 'vendorCode', key: 'vc', width: 100 },
      { title: 'Plant', dataIndex: 'plant', key: 'plant', width: 100 },
      { title: 'Amount', dataIndex: 'grossAmount', key: 'amt', width: 140, render: fmt, align: 'right' },
      { title: 'Date', dataIndex: 'submittedAt', key: 'date', width: 100,
        render: (v) => v ? dayjs(v).format('DD/MM/YY') : '-' },
    ]

    // For inbox tab: show Accept/Reject instead of Status
    if (activeTab === 'inbox' && !isAdmin) {
      cols.push({
        title: 'Status', key: 'action', width: 180,
        render: (_, record) => (
          <Space>
            <Button type="primary" size="small" icon={<CheckOutlined />}
              loading={actionLoading[record._id] === 'accept'}
              onClick={(e) => { e.stopPropagation(); handleAccept(record) }}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >Accept</Button>
            <Button danger size="small" icon={<CloseOutlined />}
              loading={actionLoading[record._id] === 'reject'}
              onClick={(e) => { e.stopPropagation(); setRejectModal(record); }}
            >Reject</Button>
          </Space>
        ),
      })
    } else {
      cols.push(
        { title: 'Status', dataIndex: 'status', key: 'status', width: 120,
          render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag> },
        { title: 'Owner', dataIndex: 'current_role', key: 'role', width: 90, render: (v) => <Tag color="blue">{v}</Tag> },
      )
    }

    return cols
  }

  // ── Search filter (client-side) ──
  const filteredInvoices = useMemo(() => {
    if (!search) return invoices
    const term = search.toLowerCase()
    return invoices.filter(inv =>
      (inv.invoiceNumber || '').toLowerCase().includes(term) ||
      (inv.name || '').toLowerCase().includes(term) ||
      (inv.vendorName || '').toLowerCase().includes(term)
    )
  }, [invoices, search])

  // ── Tab labels ──
  const pendingLabel = isAdmin ? 'Pending Invoices' : 'My Pending'
  const completedLabel = isAdmin ? 'Completed Invoices' : 'My Completed'

  // Role-specific metrics cards
  const renderMetrics = () => {
    if (role === 'VPD') return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Received Today" value={metrics.receivedToday || 0} prefix={<InboxOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending Verification" value={metrics.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Received This Month" value={metrics.receivedMonth || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Exceptions" value={metrics.exceptions || 0} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>
    )
    if (role === 'EIC') return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Awaiting Approval" value={metrics.awaiting || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Work Orders Certified" value={metrics.certified || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Rejected" value={metrics.rejected || 0} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Avg Time (hrs)" value={metrics.avgApprovalTimeHours || 0} suffix="h" valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>
    )
    if (role === 'VPG') return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Pending Processing" value={metrics.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Retention Adjustments" value={metrics.retentionAdj || 0} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Advance Adjustments" value={metrics.advanceAdj || 0} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Forwarded to Finance" value={metrics.forwarded || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
    )
    if (role === 'FINANCE') return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Pending Approval" value={metrics.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Approved Payments" value={metrics.approvedCount || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Payments Released" value={metrics.released || 0} valueStyle={{ color: '#389e0d' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Month Value" value={metrics.totalMonthValue || 0} prefix="₹" valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>
    )
    return null
  }

  return (
    <div>
      <Title level={4}>VIM Workspace</Title>

      {renderMetrics()}

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setSearch('') }}
          items={[
            {
              key: 'inbox',
              label: <span><Badge count={invoices.length} size="small" offset={[8, -2]}><InboxOutlined /> My Inbox</Badge></span>,
            },
            { key: 'pending', label: <span><ClockCircleOutlined /> {pendingLabel}</span> },
            { key: 'completed', label: <span><CheckCircleOutlined /> {completedLabel}</span> },
            { key: 'exceptions', label: <span><ExclamationCircleOutlined /> Exceptions</span> },
          ]}
        />

        <Table
          dataSource={filteredInvoices}
          columns={getColumns()}
          rowKey="_id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total ${t} items` }}
          onRow={(record) => ({
            onClick: () => {
              if (record.itemType !== 'travel_claim') {
                navigate(`/vim/invoice/${record._id}`)
              }
            },
            style: { cursor: record.itemType === 'travel_claim' ? 'default' : 'pointer' },
          })}
        />
      </Card>

      {/* Reject Reason Modal */}
      <Modal
        title="Rejection Reason"
        open={!!rejectModal}
        onCancel={() => { setRejectModal(null); setRejectReason('') }}
        onOk={handleReject}
        okText="Reject"
        okButtonProps={{ danger: true, loading: actionLoading[rejectModal?._id] === 'reject' }}
      >
        <p>Please provide a reason for rejection:</p>
        <TextArea
          rows={3}
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
        />
      </Modal>
    </div>
  )
}
