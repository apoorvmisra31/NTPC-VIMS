import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import api from '../../api/axios'
import dayjs from 'dayjs'

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/api/invoices')
      setInvoices(data.data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Submitted': 'blue',
      'Approved': 'green',
      'Posted': 'cyan',
      'Paid': 'success',
      'Rejected': 'error',
      'Returned': 'warning',
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
    },
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'invoiceType',
    },
    {
      title: 'Amount (INR)',
      dataIndex: 'grossAmount',
      key: 'grossAmount',
      render: (amount) => `₹${amount?.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          {record.paymentAdvice && (
            <Button type="link" icon={<DownloadOutlined />} size="small">Payment Advice</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h1 className="page-title">My Invoices</h1>
      <Card className="card-shadow">
        <Table
          columns={columns}
          dataSource={invoices}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
