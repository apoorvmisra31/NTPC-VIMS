import { useState, useEffect } from 'react'
import { Card, Tabs, Table, Button, Modal, Form, Input, DatePicker, Select, Tag, Space, Row, Col, Statistic, message, Descriptions } from 'antd'
import { PlusOutlined, CalendarOutlined, CarOutlined, EditOutlined } from '@ant-design/icons'
import { hrApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/common/StatusBadge'
import dayjs from 'dayjs'

export default function HRDashboard() {
    const { user } = useAuth()
    const [leaves, setLeaves] = useState([])
    const [travelClaims, setTravelClaims] = useState([])
    const [balance, setBalance] = useState({})
    const [loading, setLoading] = useState(true)
    const [leaveModal, setLeaveModal] = useState(false)
    const [travelModal, setTravelModal] = useState(false)
    const [leaveForm] = Form.useForm()
    const [travelForm] = Form.useForm()

    // Detail/edit modals
    const [leaveDetailModal, setLeaveDetailModal] = useState(null)
    const [travelDetailModal, setTravelDetailModal] = useState(null)
    const [editLeaveForm] = Form.useForm()
    const [editTravelForm] = Form.useForm()

    const fetchData = async () => {
        setLoading(true)
        try {
            const [lRes, tRes, bRes] = await Promise.all([
                hrApi.getLeaves(),
                hrApi.getTravelClaims(),
                hrApi.getLeaveBalance(),
            ])
            setLeaves(lRes.data.data)
            setTravelClaims(tRes.data.data)
            setBalance(bRes.data.data)
        } catch { /* silent */ }
        setLoading(false)
    }
    useEffect(() => { fetchData() }, [])

    const handleSubmitLeave = async (values) => {
        try {
            await hrApi.submitLeave({
                leaveType: values.leaveType,
                startDate: values.dates[0].format('YYYY-MM-DD'),
                endDate: values.dates[1].format('YYYY-MM-DD'),
                reason: values.reason,
                employeeName: values.employeeName,
                employeeCode: values.employeeCode,
                plant: values.plant,
            })
            message.success('Leave request submitted')
            setLeaveModal(false)
            leaveForm.resetFields()
            fetchData()
        } catch (err) { message.error(err.response?.data?.message || 'Failed') }
    }

    const handleSubmitTravel = async (values) => {
        try {
            await hrApi.submitTravelClaim({
                startDate: values.dates[0].format('YYYY-MM-DD'),
                endDate: values.dates[1].format('YYYY-MM-DD'),
                destination: values.destination,
                purpose: values.purpose,
                modeOfTravel: values.modeOfTravel,
                employeeName: values.employeeName,
                employeeCode: values.employeeCode,
                plant: values.plant,
                expenses: [
                    { category: 'Transport', amount: Number(values.transportAmount || 0) },
                    { category: 'Lodging', amount: Number(values.lodgingAmount || 0) },
                    { category: 'Meals', amount: Number(values.mealAmount || 0) },
                ],
            })
            message.success('Travel claim submitted')
            setTravelModal(false)
            travelForm.resetFields()
            fetchData()
        } catch (err) { message.error(err.response?.data?.message || 'Failed') }
    }

    const handleUpdateLeave = async (values) => {
        try {
            await hrApi.updateLeave(leaveDetailModal._id, {
                leaveType: values.leaveType,
                startDate: values.dates?.[0]?.format('YYYY-MM-DD'),
                endDate: values.dates?.[1]?.format('YYYY-MM-DD'),
                reason: values.reason,
                employeeName: values.employeeName,
                employeeCode: values.employeeCode,
                plant: values.plant,
            })
            message.success('Leave updated')
            setLeaveDetailModal(null)
            fetchData()
        } catch (err) { message.error(err.response?.data?.message || 'Failed to update') }
    }

    const handleUpdateTravel = async (values) => {
        try {
            await hrApi.updateTravelClaim(travelDetailModal._id, {
                destination: values.destination,
                purpose: values.purpose,
                modeOfTravel: values.modeOfTravel,
                employeeName: values.employeeName,
                employeeCode: values.employeeCode,
                plant: values.plant,
                expenses: [
                    { category: 'Transport', amount: Number(values.transportAmount || 0) },
                    { category: 'Lodging', amount: Number(values.lodgingAmount || 0) },
                    { category: 'Meals', amount: Number(values.mealAmount || 0) },
                ],
            })
            message.success('Travel claim updated')
            setTravelDetailModal(null)
            fetchData()
        } catch (err) { message.error(err.response?.data?.message || 'Failed to update') }
    }

    const openLeaveDetail = (record) => {
        setLeaveDetailModal(record)
        editLeaveForm.setFieldsValue({
            leaveType: record.leaveType,
            dates: record.startDate && record.endDate ? [dayjs(record.startDate), dayjs(record.endDate)] : undefined,
            reason: record.reason,
            employeeName: record.employeeName || '',
            employeeCode: record.employeeCode || '',
            plant: record.plant || '',
        })
    }

    const openTravelDetail = (record) => {
        setTravelDetailModal(record)
        const transport = record.expenses?.find(e => e.category === 'Transport')
        const lodging = record.expenses?.find(e => e.category === 'Lodging')
        const meals = record.expenses?.find(e => e.category === 'Meals')
        editTravelForm.setFieldsValue({
            destination: record.destination,
            purpose: record.purpose,
            modeOfTravel: record.modeOfTravel,
            employeeName: record.employeeName || '',
            employeeCode: record.employeeCode || '',
            plant: record.plant || '',
            transportAmount: transport?.amount || 0,
            lodgingAmount: lodging?.amount || 0,
            mealAmount: meals?.amount || 0,
        })
    }

    const leaveColumns = [
        { title: 'Employee Name', dataIndex: 'employeeName', width: 140, render: (v, r) => v || r.employee?.vendorName || '—' },
        { title: 'Type', dataIndex: 'leaveType', width: 140, render: v => <Tag color="blue">{v}</Tag> },
        { title: 'From', dataIndex: 'startDate', width: 120, render: v => dayjs(v).format('DD/MM/YYYY') },
        { title: 'To', dataIndex: 'endDate', width: 120, render: v => dayjs(v).format('DD/MM/YYYY') },
        { title: 'Days', dataIndex: 'numberOfDays', width: 60 },
        { title: 'Reason', dataIndex: 'reason', ellipsis: true },
        { title: 'Status', dataIndex: 'status', width: 100, render: v => <StatusBadge status={v} /> },
    ]

    const travelColumns = [
        { title: 'Employee Name', dataIndex: 'employeeName', width: 140, render: (v, r) => v || r.employee?.vendorName || '—' },
        { title: 'Destination', dataIndex: 'destination', width: 150 },
        { title: 'Purpose', dataIndex: 'purpose', width: 200, ellipsis: true },
        { title: 'Mode', dataIndex: 'modeOfTravel', width: 80 },
        {
            title: 'Amount', dataIndex: 'totalAmount', width: 100,
            render: (v, record) => {
                // Compute sum from expenses to fix concatenation bug
                const computed = (record.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0)
                const displayVal = computed > 0 ? computed : Number(v || 0)
                return `₹${displayVal.toLocaleString()}`
            }
        },
        { title: 'Status', dataIndex: 'status', width: 140, render: v => <StatusBadge status={v} /> },
    ]

    const canEditLeave = (record) => record.status === 'Submitted' || record.status === 'Draft'
    const canEditTravel = (record) => record.status === 'Submitted' || record.status === 'Draft'

    return (
        <div>
            <h2 style={{ marginBottom: 16, color: '#0D2137' }}>👤 HR Portal</h2>

            {/* Leave Balance Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                {Object.entries(balance).map(([type, days]) => (
                    <Col span={6} key={type}>
                        <Card size="small" style={{ borderLeft: '4px solid #1A6B3C' }}>
                            <Statistic title={type} value={days} suffix="days" />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Tabs defaultActiveKey="leaves" items={[
                {
                    key: 'leaves', label: <span><CalendarOutlined /> Leave Management</span>,
                    children: (
                        <>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setLeaveModal(true)} style={{ marginBottom: 16 }}>
                                Apply Leave
                            </Button>
                            <Table
                                dataSource={leaves}
                                columns={leaveColumns}
                                rowKey="_id"
                                size="small"
                                loading={loading}
                                onRow={(record) => ({
                                    onClick: () => openLeaveDetail(record),
                                    style: { cursor: 'pointer' },
                                })}
                            />
                        </>
                    ),
                },
                {
                    key: 'travel', label: <span><CarOutlined /> Travel & Reimbursement</span>,
                    children: (
                        <>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTravelModal(true)} style={{ marginBottom: 16 }}>
                                New Travel Claim
                            </Button>
                            <Table
                                dataSource={travelClaims}
                                columns={travelColumns}
                                rowKey="_id"
                                size="small"
                                loading={loading}
                                onRow={(record) => ({
                                    onClick: () => openTravelDetail(record),
                                    style: { cursor: 'pointer' },
                                })}
                            />
                        </>
                    ),
                },
            ]} />

            {/* Apply Leave Modal */}
            <Modal title="Apply for Leave" open={leaveModal} onCancel={() => setLeaveModal(false)} footer={null}>
                <Form form={leaveForm} onFinish={handleSubmitLeave} layout="vertical"
                    initialValues={{ employeeName: user?.vendorName || '', employeeCode: user?.vendorCode || '', plant: user?.plant || '' }}>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="employeeName" label="Employee Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="plant" label="Plant" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                    <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'Earned Leave', label: 'Earned Leave' },
                            { value: 'Casual Leave', label: 'Casual Leave' },
                            { value: 'Medical Leave', label: 'Medical Leave' },
                            { value: 'Compensatory Off', label: 'Compensatory Off' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="dates" label="Date Range" rules={[{ required: true }]}>
                        <DatePicker.RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason"><Input.TextArea rows={2} /></Form.Item>
                    <Button type="primary" htmlType="submit" block>Submit</Button>
                </Form>
            </Modal>

            {/* Travel Claim Modal */}
            <Modal title="Submit Travel Claim" open={travelModal} onCancel={() => setTravelModal(false)} footer={null} width={600}>
                <Form form={travelForm} onFinish={handleSubmitTravel} layout="vertical"
                    initialValues={{ employeeName: user?.vendorName || '', employeeCode: user?.vendorCode || '', plant: user?.plant || '' }}>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="employeeName" label="Employee Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="plant" label="Plant" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="destination" label="Destination" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="modeOfTravel" label="Mode" rules={[{ required: true }]}>
                            <Select options={['Air', 'Rail', 'Road', 'Other'].map(m => ({ value: m, label: m }))} />
                        </Form.Item></Col>
                    </Row>
                    <Form.Item name="dates" label="Travel Dates" rules={[{ required: true }]}><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="purpose" label="Purpose"><Input.TextArea rows={2} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="transportAmount" label="Transport (₹)"><Input type="number" /></Form.Item></Col>
                        <Col span={8}><Form.Item name="lodgingAmount" label="Lodging (₹)"><Input type="number" /></Form.Item></Col>
                        <Col span={8}><Form.Item name="mealAmount" label="Meals (₹)"><Input type="number" /></Form.Item></Col>
                    </Row>
                    <Button type="primary" htmlType="submit" block>Submit Claim</Button>
                </Form>
            </Modal>

            {/* Leave Detail/Edit Modal */}
            <Modal
                title={canEditLeave(leaveDetailModal || {}) ? 'Edit Leave Request' : 'Leave Details'}
                open={!!leaveDetailModal}
                onCancel={() => setLeaveDetailModal(null)}
                footer={null}
            >
                {leaveDetailModal && !canEditLeave(leaveDetailModal) ? (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Employee Name">{leaveDetailModal.employeeName || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Employee Code">{leaveDetailModal.employeeCode || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Plant">{leaveDetailModal.plant || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Leave Type">{leaveDetailModal.leaveType}</Descriptions.Item>
                        <Descriptions.Item label="From">{dayjs(leaveDetailModal.startDate).format('DD/MM/YYYY')}</Descriptions.Item>
                        <Descriptions.Item label="To">{dayjs(leaveDetailModal.endDate).format('DD/MM/YYYY')}</Descriptions.Item>
                        <Descriptions.Item label="Days">{leaveDetailModal.numberOfDays}</Descriptions.Item>
                        <Descriptions.Item label="Reason">{leaveDetailModal.reason || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Status"><StatusBadge status={leaveDetailModal.status} /></Descriptions.Item>
                    </Descriptions>
                ) : leaveDetailModal ? (
                    <Form form={editLeaveForm} onFinish={handleUpdateLeave} layout="vertical">
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="employeeName" label="Employee Name"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="employeeCode" label="Employee Code"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="plant" label="Plant"><Input /></Form.Item></Col>
                        </Row>
                        <Form.Item name="leaveType" label="Leave Type">
                            <Select options={[
                                { value: 'Earned Leave', label: 'Earned Leave' },
                                { value: 'Casual Leave', label: 'Casual Leave' },
                                { value: 'Medical Leave', label: 'Medical Leave' },
                                { value: 'Compensatory Off', label: 'Compensatory Off' },
                            ]} />
                        </Form.Item>
                        <Form.Item name="dates" label="Date Range"><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="reason" label="Reason"><Input.TextArea rows={2} /></Form.Item>
                        <Button type="primary" htmlType="submit" block icon={<EditOutlined />}>Update Leave</Button>
                    </Form>
                ) : null}
            </Modal>

            {/* Travel Detail/Edit Modal */}
            <Modal
                title={canEditTravel(travelDetailModal || {}) ? 'Edit Travel Claim' : 'Travel Claim Details'}
                open={!!travelDetailModal}
                onCancel={() => setTravelDetailModal(null)}
                footer={null}
                width={600}
            >
                {travelDetailModal && !canEditTravel(travelDetailModal) ? (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Employee Name">{travelDetailModal.employeeName || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Employee Code">{travelDetailModal.employeeCode || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Plant">{travelDetailModal.plant || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Destination">{travelDetailModal.destination}</Descriptions.Item>
                        <Descriptions.Item label="Purpose">{travelDetailModal.purpose || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Mode">{travelDetailModal.modeOfTravel}</Descriptions.Item>
                        <Descriptions.Item label="Amount">₹{Number(travelDetailModal.totalAmount || 0).toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="Status"><StatusBadge status={travelDetailModal.status} /></Descriptions.Item>
                    </Descriptions>
                ) : travelDetailModal ? (
                    <Form form={editTravelForm} onFinish={handleUpdateTravel} layout="vertical">
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="employeeName" label="Employee Name"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="employeeCode" label="Employee Code"><Input /></Form.Item></Col>
                            <Col span={8}><Form.Item name="plant" label="Plant"><Input /></Form.Item></Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item name="destination" label="Destination"><Input /></Form.Item></Col>
                            <Col span={12}><Form.Item name="modeOfTravel" label="Mode">
                                <Select options={['Air', 'Rail', 'Road', 'Other'].map(m => ({ value: m, label: m }))} />
                            </Form.Item></Col>
                        </Row>
                        <Form.Item name="purpose" label="Purpose"><Input.TextArea rows={2} /></Form.Item>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="transportAmount" label="Transport (₹)"><Input type="number" /></Form.Item></Col>
                            <Col span={8}><Form.Item name="lodgingAmount" label="Lodging (₹)"><Input type="number" /></Form.Item></Col>
                            <Col span={8}><Form.Item name="mealAmount" label="Meals (₹)"><Input type="number" /></Form.Item></Col>
                        </Row>
                        <Button type="primary" htmlType="submit" block icon={<EditOutlined />}>Update Claim</Button>
                    </Form>
                ) : null}
            </Modal>
        </div>
    )
}
