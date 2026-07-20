import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Tabs, Table, Button, Modal, Form, Input, Select, Tag, Space, Descriptions, message, Spin, InputNumber, DatePicker } from 'antd'
import { UserOutlined, SettingOutlined, FileTextOutlined, AuditOutlined, BarChartOutlined, ShoppingCartOutlined, PlusOutlined } from '@ant-design/icons'
import { adminApi } from '../../api'
import dayjs from 'dayjs'

export default function AdminPanel() {
    const [searchParams] = useSearchParams()
    const urlTab = searchParams.get('tab')
    const shouldCreatePO = searchParams.get('create') === 'true'

    const [users, setUsers] = useState([])
    const [auditLogs, setAuditLogs] = useState([])
    const [workflowConfig, setWorkflowConfig] = useState({})
    const [checklistConfig, setChecklistConfig] = useState({})
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [roleModal, setRoleModal] = useState(null)
    const [selectedRole, setSelectedRole] = useState('')
    const [roleUpdateLoading, setRoleUpdateLoading] = useState(false)
    const [poModalOpen, setPOModalOpen] = useState(false)
    const [poForm] = Form.useForm()
    const [poLoading, setPOLoading] = useState(false)
    const [activeTab, setActiveTab] = useState(urlTab || 'users')

    // Read tab from URL
    useEffect(() => {
        if (urlTab && urlTab !== activeTab) {
            setActiveTab(urlTab)
        }
        if (shouldCreatePO) {
            setActiveTab('purchase-orders')
            setPOModalOpen(true)
        }
    }, [urlTab, shouldCreatePO])

    const fetchUsers = async () => {
        try { const { data } = await adminApi.getUsers(); setUsers(data.data) } catch { /* silent */ }
    }

    const fetchAuditLogs = async () => {
        try { const { data } = await adminApi.getAuditLogs({ limit: 100 }); setAuditLogs(data.data) } catch { /* silent */ }
    }

    const fetchConfigs = async () => {
        try {
            const [wf, cl] = await Promise.all([adminApi.getWorkflowConfig(), adminApi.getChecklistConfig()])
            setWorkflowConfig(wf.data.data || {}); setChecklistConfig(cl.data.data || {})
        } catch { /* silent */ }
    }

    const fetchPOs = async () => {
        try { const { data } = await adminApi.getPurchaseOrders(); setPurchaseOrders(data.data || []) } catch { /* silent */ }
    }

    useEffect(() => {
        Promise.all([fetchUsers(), fetchAuditLogs(), fetchConfigs(), fetchPOs()]).finally(() => setLoading(false))
    }, [])

    const handleRoleUpdate = async () => {
        if (!roleModal || !selectedRole) {
            message.warning('Please select a role')
            return
        }
        setRoleUpdateLoading(true)
        try {
            const response = await adminApi.updateUserRole(roleModal._id, selectedRole)
            message.success(response.data.message || 'Role updated successfully')
            setRoleModal(null)
            fetchUsers()
        } catch (err) {
            console.error('Role update error:', err)
            message.error(err.response?.data?.message || 'Failed to update role')
        } finally {
            setRoleUpdateLoading(false)
        }
    }

    const handleExport = async (format) => {
        try {
            const { data } = await adminApi.generateReport({ reportType: 'invoices', format })
            message.success(`Report generated: ${data.data?.filename || 'done'}`)
        } catch { message.error('Export failed') }
    }

    const handleCreatePO = async (values) => {
        setPOLoading(true)
        try {
            const payload = {
                ...values,
                startDate: values.startDate?.toISOString(),
                endDate: values.endDate?.toISOString(),
            }
            // vendorCode is no longer sent — POs are created without vendor association
            await adminApi.createPO(payload)
            message.success('Purchase Order created successfully')
            setPOModalOpen(false); poForm.resetFields(); fetchPOs()
        } catch (err) { message.error(err.response?.data?.message || 'Failed to create PO') }
        finally { setPOLoading(false) }
    }

    const handlePOStatusChange = async (id, status) => {
        try {
            await adminApi.changePOStatus(id, status)
            message.success(`PO ${status}`); fetchPOs()
        } catch (err) { message.error(err.response?.data?.message || 'Failed') }
    }

    const userColumns = [
        { title: 'Email', dataIndex: 'email', width: 250 },
        { title: 'Role', dataIndex: 'role', width: 120, render: v => <Tag color="blue">{v}</Tag> },
        { title: 'Code', dataIndex: 'vendorCode', width: 100 },
        { title: 'Plant', dataIndex: 'plant', width: 100, render: v => v || '—' },
        { title: 'Active', dataIndex: 'isActive', width: 80, render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> },
        { title: 'Last Login', dataIndex: 'lastLogin', width: 160, render: v => v ? new Date(v).toLocaleString('en-IN') : 'Never' },
        {
            title: 'Actions', width: 120,
            render: (_, r) => <Button size="small" onClick={() => { setRoleModal(r); setSelectedRole(r.role) }}>Change Role</Button>,
        },
    ]

    const poColumns = [
        { title: 'PO Number', dataIndex: 'poNumber', width: 140 },
        { title: 'Vendor', dataIndex: 'vendorName', width: 180, ellipsis: true, render: v => v || 'NA' },
        { title: 'Vendor Code', dataIndex: 'vendorCode', width: 100, render: v => v || 'NA' },
        { title: 'Plant', dataIndex: 'plant', width: 100 },
        { title: 'Type', dataIndex: 'poType', width: 100, render: v => <Tag>{v}</Tag> },
        { title: 'Total Amount', dataIndex: 'totalAmount', width: 140, render: v => `₹ ${(v||0).toLocaleString('en-IN')}`, align: 'right' },
        { title: 'Remaining', dataIndex: 'remaining_amount', width: 140, render: v => `₹ ${(v||0).toLocaleString('en-IN')}`, align: 'right' },
        { title: 'Status', dataIndex: 'status', width: 120,
            render: v => <Tag color={v === 'Open' ? 'green' : v === 'Closed' ? 'default' : v === 'Cancelled' ? 'red' : 'blue'}>{v}</Tag> },
        { title: 'Valid Until', dataIndex: 'validityDate', width: 110, render: v => v ? dayjs(v).format('DD/MM/YY') : '-' },
        {
            title: 'Actions', width: 160,
            render: (_, r) => (
                <Space size={4}>
                    {r.status === 'Open' && <Button size="small" onClick={() => handlePOStatusChange(r._id, 'Closed')}>Close</Button>}
                    {['Open','Partially Invoiced'].includes(r.status) && <Button size="small" danger onClick={() => handlePOStatusChange(r._id, 'Cancelled')}>Cancel</Button>}
                </Space>
            ),
        },
    ]

    const auditColumns = [
        { title: 'Time', dataIndex: 'timestamp', width: 160, render: v => dayjs(v).format('DD/MM/YY HH:mm') },
        { title: 'User', dataIndex: 'userEmail', width: 200 },
        { title: 'Role', dataIndex: 'userRole', width: 100, render: v => <Tag>{v}</Tag> },
        { title: 'Action', dataIndex: 'action', width: 180 },
        { title: 'Resource', dataIndex: 'resource', width: 120 },
        { title: 'Details', dataIndex: 'details', width: 200, ellipsis: true, render: v => v ? JSON.stringify(v).substring(0, 60) : '-' },
    ]

    return (
        <div>
            <h2 style={{ marginBottom: 16, color: '#0D2137' }}>⚙️ System Administration</h2>

            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: 'users', label: <span><UserOutlined /> User Management</span>,
                    children: (
                        <Table dataSource={users} columns={userColumns} rowKey="_id" size="small" loading={loading}
                            pagination={{ pageSize: 15, showTotal: t => `${t} users` }}
                        />
                    ),
                },
                {
                    key: 'purchase-orders', label: <span><ShoppingCartOutlined /> Purchase Orders</span>,
                    children: (
                        <div>
                            <div style={{ marginBottom: 16 }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setPOModalOpen(true)}>Create Purchase Order</Button>
                            </div>
                            <Table dataSource={purchaseOrders} columns={poColumns} rowKey="_id" size="small" loading={loading}
                                pagination={{ pageSize: 15, showTotal: t => `${t} POs` }}
                            />
                        </div>
                    ),
                },
                {
                    key: 'workflow', label: <span><SettingOutlined /> Workflow Config</span>,
                    children: (
                        <Card size="small">
                            {Object.entries(workflowConfig).map(([type, stages]) => (
                                <Descriptions key={type} size="small" bordered style={{ marginBottom: 12 }}>
                                    <Descriptions.Item label={type} span={3}>
                                        <Space>{(Array.isArray(stages) ? stages : []).map((s, i) => <Tag key={i} color="processing">{s}</Tag>)}</Space>
                                    </Descriptions.Item>
                                </Descriptions>
                            ))}
                        </Card>
                    ),
                },
                {
                    key: 'audit', label: <span><AuditOutlined /> Audit Logs</span>,
                    children: (
                        <Table dataSource={auditLogs} columns={auditColumns} rowKey="_id" size="small" loading={loading}
                            pagination={{ pageSize: 20 }}
                        />
                    ),
                },
                {
                    key: 'reports', label: <span><BarChartOutlined /> Reports</span>,
                    children: (
                        <Card size="small">
                            <Space>
                                <Button type="primary" onClick={() => handleExport('xlsx')}>Export Invoices (Excel)</Button>
                                <Button onClick={() => handleExport('pdf')}>Export Invoices (PDF)</Button>
                            </Space>
                        </Card>
                    ),
                },
            ]} />

            {/* Role Modal */}
            <Modal title={`Change Role: ${roleModal?.email}`} open={!!roleModal} onCancel={() => setRoleModal(null)}
                onOk={handleRoleUpdate} okText="Update Role" confirmLoading={roleUpdateLoading}>
                <Select value={selectedRole} onChange={setSelectedRole} style={{ width: '100%' }}
                    options={['vendor', 'vpd', 'eic', 'vpg', 'finance', 'hr_admin', 'system_admin'].map(r => ({ value: r, label: r.toUpperCase() }))}
                />
            </Modal>

            {/* Create PO Modal — no Vendor Code field */}
            <Modal title="Create Purchase Order" open={poModalOpen} onCancel={() => setPOModalOpen(false)}
                footer={null} width={600}>
                <Form form={poForm} layout="vertical" onFinish={handleCreatePO}>
                    <Form.Item name="poNumber" label="PO Number" rules={[{ required: true }]}>
                        <Input placeholder="e.g. PO-2026-004" />
                    </Form.Item>
                    <Form.Item name="plant" label="Plant" rules={[{ required: true }]}>
                        <Input placeholder="e.g. PLANT-01" />
                    </Form.Item>
                    <Form.Item name="poType" label="PO Type" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'Standard', label: 'Standard' },
                            { value: 'Subcontracting', label: 'Subcontracting' },
                            { value: 'Service', label: 'Service' },
                            { value: 'Consignment', label: 'Consignment' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="totalAmount" label="Total Amount (₹)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                    <Form.Item name="currency" label="Currency" initialValue="INR">
                        <Select options={[{ value: 'INR', label: 'INR' }, { value: 'USD', label: 'USD' }]} />
                    </Form.Item>
                    <Space style={{ width: '100%' }} size={12}>
                        <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Space>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={poLoading} block>Create Purchase Order</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
