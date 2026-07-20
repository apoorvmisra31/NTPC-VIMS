import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import api from '../../api/axios'
import dayjs from 'dayjs'

export default function PurchaseOrders() {
  const [pos, setPOs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPOs()
  }, [])

  const fetchPOs = async () => {
    try {
      const { data } = await api.get('/api/vendor/purchase-orders')
      setPOs(data.data)
    } catch (error) {
      console.error('Error fetching POs:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
    },
    {
      title: 'Type',
      dataIndex: 'poType',
      key: 'poType',
    },
    {
      title: 'Plant',
      dataIndex: 'plant',
      key: 'plant',
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
      render: (status) => {
        const color = status === 'Open' ? 'green' : status === 'Closed' ? 'red' : 'blue'
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: 'Validity Date',
      dataIndex: 'validityDate',
      key: 'validityDate',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => <Button type="link" icon={<EyeOutlined />} size="small">View Details</Button>,
    },
  ]

  return (
    <div>
      <h1 className="page-title">Purchase Orders</h1>
      <Card className="card-shadow">
        <Table
          columns={columns}
          dataSource={pos}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
