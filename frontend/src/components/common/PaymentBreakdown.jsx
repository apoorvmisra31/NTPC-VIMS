import { Descriptions, Divider, Typography } from 'antd'

const { Text, Title } = Typography

function formatCurrency(amount) {
  return `₹ ${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PaymentBreakdown({ invoice }) {
  if (!invoice) return null

  const gross = invoice.grossAmount || 0
  const tax = invoice.taxAmount || 0
  const retentionPct = invoice.retention_pct || 0
  const retentionAmt = gross * (retentionPct / 100)
  const advance = invoice.advance_adj || 0
  const penalty = invoice.penalty_deduction || 0
  const netPayable = invoice.net_payable || Math.max(0, gross - tax - retentionAmt - advance - penalty)

  return (
    <div style={{
      background: '#fafafa', borderRadius: 8, padding: 16, border: '1px solid #f0f0f0',
    }}>
      <Title level={5} style={{ marginBottom: 12 }}>💰 Payment Breakdown</Title>

      <div style={{ fontFamily: 'monospace', fontSize: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <Text>Gross Amount</Text>
          <Text strong>{formatCurrency(gross)}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#cf1322' }}>
          <Text type="danger">(-) Tax Amount</Text>
          <Text type="danger">{formatCurrency(tax)}</Text>
        </div>
        {retentionPct > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#cf1322' }}>
            <Text type="danger">(-) Retention ({retentionPct}%)</Text>
            <Text type="danger">{formatCurrency(retentionAmt)}</Text>
          </div>
        )}
        {advance > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#cf1322' }}>
            <Text type="danger">(-) Advance Adj</Text>
            <Text type="danger">{formatCurrency(advance)}</Text>
          </div>
        )}
        {penalty > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#cf1322' }}>
            <Text type="danger">(-) Penalty</Text>
            <Text type="danger">{formatCurrency(penalty)}</Text>
          </div>
        )}
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <Text strong style={{ fontSize: 16 }}>Net Payable</Text>
          <Text strong style={{ fontSize: 16, color: '#389e0d' }}>{formatCurrency(netPayable)}</Text>
        </div>
      </div>
    </div>
  )
}
