import { Table, Input, Select, DatePicker, Tag, Button, Space, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import StatusBadge from './StatusBadge'

export default function AuditLogTable({ logs = [], loading, onRefresh, onExport }) {
    const [searchText, setSearchText] = useState('')

    const filtered = logs.filter(log =>
        !searchText ||
        log.action?.toLowerCase().includes(searchText.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
        log.resource?.toLowerCase().includes(searchText.toLowerCase())
    )

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            render: v => new Date(v).toLocaleString('en-IN'),
            sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
        },
        { title: 'User', dataIndex: 'userEmail', key: 'userEmail', width: 200 },
        { title: 'Role', dataIndex: 'userRole', key: 'userRole', width: 100, render: v => <Tag>{v}</Tag> },
        { title: 'Action', dataIndex: 'action', key: 'action', width: 200 },
        { title: 'Resource', dataIndex: 'resource', key: 'resource', width: 120 },
        { title: 'Resource ID', dataIndex: 'resourceId', key: 'resourceId', width: 140, ellipsis: true },
        {
            title: 'Details',
            dataIndex: 'details',
            key: 'details',
            width: 200,
            ellipsis: true,
            render: v => v ? <Tooltip title={JSON.stringify(v, null, 2)}><span>{JSON.stringify(v).slice(0, 50)}...</span></Tooltip> : '-',
        },
    ]

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Search logs..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 250 }}
                />
                {onRefresh && <Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button>}
                {onExport && <Button icon={<DownloadOutlined />} onClick={onExport}>Export</Button>}
            </Space>
            <Table
                columns={columns}
                dataSource={filtered}
                rowKey={r => r._id}
                loading={loading}
                size="small"
                scroll={{ x: 1200 }}
                pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `${t} records` }}
            />
        </div>
    )
}
