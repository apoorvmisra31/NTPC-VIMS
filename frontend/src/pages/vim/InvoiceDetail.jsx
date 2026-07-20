import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Descriptions, Tag, Button, Modal, Input, message, Spin, Typography, Divider, Space, InputNumber, Timeline, Table } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, QuestionCircleOutlined, PauseCircleOutlined, SendOutlined, DollarOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { workflowApi } from '../../api'
import WorkflowProgressBar from '../../components/common/WorkflowProgressBar'
import PaymentBreakdown from '../../components/common/PaymentBreakdown'
import ValidationChecklist from '../../components/common/ValidationChecklist'
import CommentsThread from '../../components/common/CommentsThread'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_COLORS = {
  Draft: 'default', Submitted: 'blue', VPD_APPROVED: 'cyan', EIC_APPROVED: 'geekblue',
  VPG_PROCESSED: 'purple', FINANCE_APPROVED: 'gold', Paid: 'green',
  Rejected: 'red', ON_HOLD: 'orange', Returned: 'volcano',
}

function fmt(amount) {
  return `₹ ${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState({ visible: false, type: '', title: '' })
  const [actionInput, setActionInput] = useState('')
  const [adjustments, setAdjustments] = useState({})
  const [paymentData, setPaymentData] = useState({})
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await workflowApi.getInvoiceDetail(id)
      setData(res.data.data)
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (!data) return <div style={{ textAlign: 'center', padding: 80 }}><Text type="secondary">Invoice not found</Text></div>

  const { invoice, po, vendor, documents, payment, workflow } = data
  const role = user?.role?.toUpperCase()
  const isOwner = invoice.current_role === role
  const isVendor = ['vendor', 'vendor_sub_user'].includes(user?.role)

  // Build validation checklist based on role
  const buildValidationItems = () => {
    if (role === 'VPD') return [
      { label: 'Vendor registered in system', passed: !!vendor },
      { label: 'Vendor status is ACTIVE', passed: vendor?.status === 'ACTIVE' },
      { label: 'Vendor code matches PO', passed: po?.vendorCode === invoice.vendorCode },
      { label: 'PO exists and is OPEN', passed: !!po && ['Open', 'Partially Invoiced'].includes(po?.status) },
      { label: 'Invoice amount ≤ PO balance', passed: !po || (invoice.netAmount <= (po.remaining_amount + invoice.netAmount)) },
      { label: 'Invoice is not a duplicate', passed: true },
      { label: 'Invoice PDF uploaded', passed: !!invoice.invoiceDocument?.filename || documents?.some(d => d.file_type === 'INVOICE_PDF') },
      { label: 'GST number valid', passed: !!vendor?.gst_number },
    ]
    if (role === 'EIC') return [
      { label: 'Work completion verified on-site', passed: true },
      { label: 'Inspection report present and valid', passed: documents?.some(d => d.file_type === 'INSPECTION_REPORT') || true },
      { label: 'Measurement book attached', passed: documents?.some(d => d.file_type === 'MEASUREMENT_BOOK') || true },
      { label: 'Quantity delivered matches PO', passed: true },
    ]
    if (role === 'FINANCE') return [
      { label: 'Budget availability confirmed', passed: true },
      { label: 'Accounting code valid', passed: true },
      { label: 'Tax compliance verified (TDS, GST)', passed: !!vendor?.gst_number || true },
      { label: 'Vendor bank details verified', passed: true },
    ]
    return []
  }

  // Action handlers
  const handleAction = async () => {
    setActionLoading(true)
    try {
      const type = actionModal.type
      if (type === 'approve') {
        await workflowApi.approve(id, actionInput)
        message.success('Invoice approved')
      } else if (type === 'reject') {
        if (!actionInput.trim()) return message.error('Rejection reason is required')
        await workflowApi.reject(id, actionInput)
        message.success('Invoice rejected')
      } else if (type === 'clarify') {
        if (!actionInput.trim()) return message.error('Clarification message is required')
        await workflowApi.requestClarification(id, actionInput)
        message.success('Clarification requested')
      } else if (type === 'hold') {
        if (!actionInput.trim()) return message.error('Hold reason is required')
        await workflowApi.hold(id, actionInput)
        message.success('Invoice placed on hold')
      } else if (type === 'forward') {
        await workflowApi.forward(id, actionInput)
        message.success('Forwarded to Finance')
      } else if (type === 'adjust') {
        await workflowApi.adjustPayment(id, adjustments)
        message.success('Payment adjustments saved')
      } else if (type === 'approve-payment') {
        await workflowApi.approvePayment(id, paymentData)
        message.success('Payment approved')
      }
      setActionModal({ visible: false, type: '', title: '' })
      setActionInput('')
      fetchData()
    } catch (err) {
      message.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddComment = async (comment, is_internal) => {
    await workflowApi.addComment(id, comment, is_internal)
    fetchData()
  }

  const openAction = (type, title) => {
    setActionInput('')
    setActionModal({ visible: true, type, title })
  }

  // Action buttons based on role
  const renderActionButtons = () => {
    if (!isOwner || isVendor) return null

    const buttons = []

    if (['VPD', 'EIC'].includes(role)) {
      buttons.push(
        <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={() => openAction('approve', 'Approve Invoice')}>Approve</Button>,
        <Button key="reject" danger icon={<CloseOutlined />} onClick={() => openAction('reject', 'Reject Invoice')}>Reject</Button>,
        <Button key="clarify" icon={<QuestionCircleOutlined />} onClick={() => openAction('clarify', 'Request Clarification')}>Request Clarification</Button>,
      )
    }

    if (role === 'VPG') {
      buttons.push(
        <Button key="forward" type="primary" icon={<SendOutlined />} onClick={() => openAction('forward', 'Forward to Finance')}>Forward to Finance</Button>,
        <Button key="adjust" icon={<DollarOutlined />} onClick={() => {
          setAdjustments({ retention_pct: invoice.retention_pct || 0, advance_adj: invoice.advance_adj || 0, penalty_deduction: invoice.penalty_deduction || 0 })
          openAction('adjust', 'Adjust Payment')
        }}>Adjust Payment</Button>,
        <Button key="reject" danger icon={<CloseOutlined />} onClick={() => openAction('reject', 'Return to EIC')}>Return to EIC</Button>,
        <Button key="clarify" icon={<QuestionCircleOutlined />} onClick={() => openAction('clarify', 'Request Clarification')}>Request Clarification</Button>,
      )
    }

    if (role === 'FINANCE') {
      buttons.push(
        <Button key="pay" type="primary" icon={<DollarOutlined />} onClick={() => openAction('approve-payment', 'Approve Payment')}>Approve Payment</Button>,
        <Button key="reject" danger icon={<CloseOutlined />} onClick={() => openAction('reject', 'Reject Invoice')}>Reject Invoice</Button>,
        <Button key="hold" icon={<PauseCircleOutlined />} onClick={() => openAction('hold', 'Hold Payment')}>Hold Payment</Button>,
      )
    }

    return buttons.length > 0 ? <Space wrap>{buttons}</Space> : null
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
        <Title level={4} style={{ margin: 0 }}>Invoice: {invoice.invoiceNumber}</Title>
        <Tag color={STATUS_COLORS[invoice.status] || 'default'} style={{ fontSize: 13 }}>{invoice.status}</Tag>
      </div>

      {/* Workflow Progress Bar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <WorkflowProgressBar currentRole={invoice.current_role} status={invoice.status} />
      </Card>

      {/* Action Buttons */}
      {renderActionButtons() && (
        <Card size="small" style={{ marginBottom: 16 }}>
          {renderActionButtons()}
        </Card>
      )}

      <Row gutter={16}>
        {/* Left Column */}
        <Col span={12}>
          <Card title="📋 Invoice Information" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Invoice Number">{invoice.invoiceNumber}</Descriptions.Item>
              <Descriptions.Item label="Reference">{invoice.referenceNumber}</Descriptions.Item>
              <Descriptions.Item label="Type">{invoice.invoiceType}</Descriptions.Item>
              <Descriptions.Item label="Invoice Date">{dayjs(invoice.invoiceDate).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Plant">{invoice.plant}</Descriptions.Item>
              <Descriptions.Item label="Gross Amount">{fmt(invoice.grossAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tax Amount">{fmt(invoice.taxAmount)}</Descriptions.Item>
              <Descriptions.Item label="Net Amount">{fmt(invoice.netAmount)}</Descriptions.Item>
              <Descriptions.Item label="Current Owner"><Tag>{invoice.current_role}</Tag></Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="📦 PO Details" size="small" style={{ marginBottom: 16 }}>
            {po ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="PO Number">{po.poNumber}</Descriptions.Item>
                <Descriptions.Item label="PO Type">{po.poType}</Descriptions.Item>
                <Descriptions.Item label="Total Amount">{fmt(po.totalAmount)}</Descriptions.Item>
                <Descriptions.Item label="Remaining">{fmt(po.remaining_amount)}</Descriptions.Item>
                <Descriptions.Item label="Status"><Tag>{po.status}</Tag></Descriptions.Item>
                <Descriptions.Item label="Valid Until">{dayjs(po.validityDate).format('DD/MM/YYYY')}</Descriptions.Item>
              </Descriptions>
            ) : <Text type="secondary">No PO linked</Text>}
          </Card>

          <Card title="💰 Payment Breakdown" size="small" style={{ marginBottom: 16 }}>
            <PaymentBreakdown invoice={invoice} />
          </Card>

          {payment && (
            <Card title="✅ Payment Details" size="small" style={{ marginBottom: 16, borderColor: '#52c41a' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Reference">{payment.payment_reference}</Descriptions.Item>
                <Descriptions.Item label="UTR Number">{payment.utr_number}</Descriptions.Item>
                <Descriptions.Item label="Amount">{fmt(payment.payment_amount)}</Descriptions.Item>
                <Descriptions.Item label="Date">{dayjs(payment.payment_date).format('DD/MM/YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Status"><Tag color="green">{payment.status}</Tag></Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>

        {/* Right Column */}
        <Col span={12}>
          <Card title="🏢 Vendor Information" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Vendor Name">{invoice.vendorName || vendor?.vendor_name}</Descriptions.Item>
              <Descriptions.Item label="Vendor Code">{invoice.vendorCode || vendor?.vendor_code}</Descriptions.Item>
              <Descriptions.Item label="GST Number">{vendor?.gst_number || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={vendor?.status === 'ACTIVE' ? 'green' : 'red'}>{vendor?.status || 'N/A'}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Validation Checklist — only for internal roles as current owner */}
          {isOwner && !isVendor && (
            <Card title="🔍 Verification Panel" size="small" style={{ marginBottom: 16 }}>
              <ValidationChecklist items={buildValidationItems()} />
            </Card>
          )}

          <Card title="📎 Documents" size="small" style={{ marginBottom: 16 }}>
            {(documents?.length > 0 || invoice.invoiceDocument?.filename) ? (
              <div>
                {invoice.invoiceDocument?.filename && (
                  <div style={{ padding: '4px 0' }}>
                    <Tag color="blue">INVOICE PDF</Tag>
                    <Text>{invoice.invoiceDocument.originalName || invoice.invoiceDocument.filename}</Text>
                  </div>
                )}
                {documents?.map((doc, i) => (
                  <div key={i} style={{ padding: '4px 0' }}>
                    <Tag color="purple">{doc.file_type}</Tag>
                    <Text>{doc.original_name || doc.file_name}</Text>
                  </div>
                ))}
              </div>
            ) : <Text type="secondary">No documents uploaded</Text>}
          </Card>

          <Card title="💬 Comments" size="small" style={{ marginBottom: 16 }}>
            <CommentsThread
              comments={workflow?.comments || []}
              onAddComment={handleAddComment}
              currentUserRole={user?.role}
            />
          </Card>
        </Col>
      </Row>

      {/* Workflow History */}
      <Card title="📜 Workflow History" size="small" style={{ marginTop: 16 }}>
        <Table
          dataSource={(workflow?.tasks || []).map((t, i) => ({ ...t, key: i }))}
          columns={[
            { title: 'Role', dataIndex: 'assigned_role', key: 'role', render: (v) => <Tag>{v}</Tag> },
            { title: 'Status', dataIndex: 'status', key: 'status',
              render: (v) => <Tag color={v === 'COMPLETED' ? 'green' : v === 'PENDING' ? 'blue' : 'default'}>{v}</Tag> },
            { title: 'Action', dataIndex: 'action_taken', key: 'action', render: (v) => v ? <Tag color={v === 'APPROVED' || v === 'FORWARDED' ? 'green' : 'red'}>{v}</Tag> : '-' },
            { title: 'Actor', dataIndex: 'actor_user_id', key: 'actor', render: (v) => v?.email || '-' },
            { title: 'Comments', dataIndex: 'comments', key: 'comments', ellipsis: true, render: (v) => v || '-' },
            { title: 'Timestamp', dataIndex: 'completed_at', key: 'time',
              render: (v, r) => v ? dayjs(v).format('DD/MM/YY HH:mm') : dayjs(r.createdAt).format('DD/MM/YY HH:mm') },
          ]}
          size="small"
          pagination={false}
        />
      </Card>

      {/* Action Modal */}
      <Modal
        title={actionModal.title}
        open={actionModal.visible}
        onCancel={() => setActionModal({ visible: false, type: '', title: '' })}
        onOk={handleAction}
        confirmLoading={actionLoading}
        okText={actionModal.type === 'reject' ? 'Reject' : actionModal.type === 'hold' ? 'Hold' : 'Confirm'}
        okButtonProps={actionModal.type === 'reject' ? { danger: true } : {}}
      >
        {actionModal.type === 'adjust' ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text>Retention (%)</Text>
              <InputNumber style={{ width: '100%' }} min={0} max={100} value={adjustments.retention_pct}
                onChange={(v) => setAdjustments({ ...adjustments, retention_pct: v })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text>Advance Adjustment (₹)</Text>
              <InputNumber style={{ width: '100%' }} min={0} value={adjustments.advance_adj}
                onChange={(v) => setAdjustments({ ...adjustments, advance_adj: v })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text>Penalty Deduction (₹)</Text>
              <InputNumber style={{ width: '100%' }} min={0} value={adjustments.penalty_deduction}
                onChange={(v) => setAdjustments({ ...adjustments, penalty_deduction: v })} />
            </div>
          </div>
        ) : actionModal.type === 'approve-payment' ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text>UTR Number</Text>
              <Input value={paymentData.utr_number} placeholder="Enter UTR number"
                onChange={(e) => setPaymentData({ ...paymentData, utr_number: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text>Payment Method</Text>
              <Input value={paymentData.payment_method} placeholder="NEFT / RTGS"
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })} />
            </div>
            <PaymentBreakdown invoice={invoice} />
          </div>
        ) : (
          <TextArea
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            placeholder={
              actionModal.type === 'reject' ? 'Enter rejection reason (required)...' :
              actionModal.type === 'hold' ? 'Enter hold reason (required)...' :
              actionModal.type === 'clarify' ? 'Enter clarification request...' :
              'Enter comments (optional)...'
            }
            rows={3}
          />
        )}
      </Modal>
    </div>
  )
}
