import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tabs, Descriptions, Table, Tag, Button, Space, Modal, Input, Select, Form, message, Spin, Alert } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, SendOutlined, RollbackOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { dpApi } from '../../api'
import StatusBadge from '../../components/common/StatusBadge'
import TimelineTracker from '../../components/common/TimelineTracker'

export default function DPDocumentView() {
    const { dpId } = useParams()
    const navigate = useNavigate()
    const [dp, setDp] = useState(null)
    const [loading, setLoading] = useState(true)
    const [referModal, setReferModal] = useState(false)
    const [rtvModal, setRtvModal] = useState(false)
    const [referForm] = Form.useForm()
    const [rtvForm] = Form.useForm()

    const fetchDP = async () => {
        setLoading(true)
        try {
            const { data } = await dpApi.getDPDocument(dpId)
            setDp(data.data)
        } catch { message.error('Failed to load DP Document') }
        setLoading(false)
    }
    useEffect(() => { fetchDP() }, [dpId])

    const handleApprove = async () => {
        try {
            await dpApi.approve(dpId, 'Approved')
            message.success('Document approved')
            fetchDP()
        } catch (err) { message.error(err.response?.data?.message || 'Approval failed') }
    }

    const handlePost = async () => {
        try {
            await dpApi.post(dpId)
            message.success('Invoice posted and payment processed')
            fetchDP()
        } catch (err) { message.error(err.response?.data?.message || 'Posting failed') }
    }

    const handleRefer = async (values) => {
        try {
            await dpApi.refer(dpId, values)
            message.success('Document referred')
            setReferModal(false)
            referForm.resetFields()
            fetchDP()
        } catch (err) { message.error(err.response?.data?.message || 'Refer failed') }
    }

    const handleRTV = async (values) => {
        try {
            await dpApi.returnToVendor(dpId, values)
            message.success('Returned to vendor')
            setRtvModal(false)
            rtvForm.resetFields()
            fetchDP()
        } catch (err) { message.error(err.response?.data?.message || 'RTV failed') }
    }

    const handleResolveException = async (ruleCode) => {
        try {
            await dpApi.resolveException(dpId, ruleCode)
            message.success('Exception resolved')
            fetchDP()
        } catch (err) { message.error(err.response?.data?.message || 'Failed') }
    }

    if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />
    if (!dp) return <Alert type="error" message="DP Document not found" showIcon />

    const exceptionColumns = [
        { title: 'Code', dataIndex: 'ruleCode', width: 80 },
        { title: 'Rule', dataIndex: 'ruleName', width: 200 },
        { title: 'Severity', dataIndex: 'severity', width: 80, render: v => <Tag color={v === 'Red' ? 'red' : v === 'Yellow' ? 'orange' : 'green'}>{v}</Tag> },
        { title: 'Proc Type', dataIndex: 'procType', width: 90 },
        { title: 'Message', dataIndex: 'message', ellipsis: true },
        { title: 'Status', dataIndex: 'isResolved', width: 100, render: v => <StatusBadge status={v ? 'Approved' : 'Critical'} /> },
        {
            title: 'Action', width: 100,
            render: (_, r) => !r.isResolved && (
                <Button size="small" type="link" onClick={() => handleResolveException(r.ruleCode)}>Resolve</Button>
            ),
        },
    ]

    const historyColumns = [
        { title: 'Stage', dataIndex: 'stage', width: 100 },
        { title: 'Action', dataIndex: 'action', width: 100, render: v => <StatusBadge status={v} /> },
        { title: 'User', dataIndex: 'userName', width: 200 },
        { title: 'Time', dataIndex: 'timestamp', width: 180, render: v => new Date(v).toLocaleString('en-IN') },
        { title: 'Comments', dataIndex: 'comments', ellipsis: true },
    ]

    const tabItems = [
        {
            key: 'basic', label: 'Basic Data',
            children: (
                <Descriptions bordered size="small" column={2}>
                    <Descriptions.Item label="Vendor Code">{dp.basicData?.vendorCode}</Descriptions.Item>
                    <Descriptions.Item label="Vendor Name">{dp.basicData?.vendorName}</Descriptions.Item>
                    <Descriptions.Item label="PO Number">{dp.basicData?.poNumber}</Descriptions.Item>
                    <Descriptions.Item label="Company Code">{dp.basicData?.companyCode}</Descriptions.Item>
                    <Descriptions.Item label="GSTIN">{dp.basicData?.gstin || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Gross Amount">₹ {(dp.basicData?.grossAmount || 0).toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Currency">{dp.basicData?.currency || 'INR'}</Descriptions.Item>
                    <Descriptions.Item label="Partner Bank">{dp.basicData?.partnerBank || 'N/A'}</Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'lineItems', label: 'Line Items',
            children: (
                <Table size="small" dataSource={dp.lineItems?.poReference || []} rowKey="lineNumber" pagination={false}
                    columns={[
                        { title: 'Line', dataIndex: 'lineNumber', width: 60 },
                        { title: 'Description', dataIndex: 'description' },
                        { title: 'Qty', dataIndex: 'quantity', width: 80 },
                        { title: 'Rate', dataIndex: 'rate', width: 100, render: v => `₹${(v || 0).toLocaleString()}` },
                        { title: 'Amount', dataIndex: 'amount', width: 120, render: v => `₹${(v || 0).toLocaleString()}` },
                    ]}
                />
            ),
        },
        {
            key: 'accounting', label: 'Accounting',
            children: (
                <Descriptions bordered size="small" column={2}>
                    <Descriptions.Item label="Baseline Date">{dp.accounting?.baselineDate ? new Date(dp.accounting.baselineDate).toLocaleDateString() : 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">{dp.accounting?.paymentTerms || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Business Area">{dp.accounting?.businessArea || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Payment Method">{dp.accounting?.paymentMethod || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Business Place">{dp.accounting?.businessPlace || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Section Code">{dp.accounting?.sectionCode || 'N/A'}</Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'tax', label: 'Tax',
            children: (
                <Descriptions bordered size="small" column={2}>
                    <Descriptions.Item label="CGST">₹ {dp.taxData?.cgst || 0}</Descriptions.Item>
                    <Descriptions.Item label="SGST">₹ {dp.taxData?.sgst || 0}</Descriptions.Item>
                    <Descriptions.Item label="IGST">₹ {dp.taxData?.igst || 0}</Descriptions.Item>
                    <Descriptions.Item label="Cess">₹ {dp.taxData?.cessAmount || 0}</Descriptions.Item>
                    <Descriptions.Item label="Withholding Tax">₹ {dp.taxData?.withholdingTax || 0}</Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'process', label: 'Process',
            children: (
                <div>
                    <h4 style={{ marginBottom: 12 }}>Exception Flags ({dp.exceptionFlags?.length || 0})</h4>
                    <Table size="small" dataSource={dp.exceptionFlags || []} columns={exceptionColumns} rowKey="ruleCode"
                        pagination={false}
                        rowClassName={r => r.severity === 'Red' && !r.isResolved ? 'exception-red-row' : ''}
                    />
                </div>
            ),
        },
        {
            key: 'otherData', label: 'Other Data',
            children: (
                <Descriptions bordered size="small" column={2}>
                    <Descriptions.Item label="Payment Group">{dp.otherData?.paymentGroup || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Payment Type">{dp.otherData?.paymentType || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="GeM PO">{dp.otherData?.gemPoIndicator ? 'Yes' : 'No'}</Descriptions.Item>
                    <Descriptions.Item label="Cover Invoice">{dp.otherData?.coverInvoice ? 'Yes' : 'No'}</Descriptions.Item>
                    <Descriptions.Item label="TReDS/LSC">{dp.otherData?.tredsLsc || 'None'}</Descriptions.Item>
                    <Descriptions.Item label="EIC Certification">{dp.otherData?.certificationByEIC ? 'Certified' : 'Pending'}</Descriptions.Item>
                    <Descriptions.Item label="ECM Approval">{dp.otherData?.ecmApprovalNumber || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="DOP Clause">{dp.otherData?.dopClause || 'N/A'}</Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'cumulative', label: 'Cumulative Pay Order',
            children: (
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="Gross Amount">₹ {(dp.cumulativePayOrder?.cumulativeGrossAmount || 0).toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Retention Amount">₹ {(dp.cumulativePayOrder?.cumulativeRetentionAmount || 0).toLocaleString('en-IN')}</Descriptions.Item>
                    <Descriptions.Item label="Deduction Amount">₹ {(dp.cumulativePayOrder?.cumulativeDeductionAmount || 0).toLocaleString('en-IN')}</Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: 'history', label: 'History',
            children: <Table size="small" dataSource={dp.workflow?.history || []} columns={historyColumns} rowKey={(r, i) => i} pagination={false} />,
        },
    ]

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/vim/workplace')}>Back</Button>
            </Space>

            <Card title={<span>DP Document: <strong>{dp.dpId}</strong></span>}
                extra={<Space>
                    <StatusBadge status={dp.status} />
                    <Tag color="blue">{dp.workflow?.currentStage}</Tag>
                </Space>}
            >
                <TimelineTracker currentStage={dp.workflow?.currentStage} status={dp.status} />

                <Space style={{ margin: '16px 0' }}>
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove}
                        disabled={dp.status === 'Posted' || dp.status === 'Obsolete'}>Approve</Button>
                    <Button icon={<SendOutlined />} onClick={() => setReferModal(true)}
                        disabled={dp.status === 'Posted' || dp.status === 'Obsolete'}>Refer</Button>
                    <Button danger icon={<RollbackOutlined />} onClick={() => setRtvModal(true)}
                        disabled={dp.status === 'Posted' || dp.status === 'Obsolete'}>Return to Vendor</Button>
                    <Button style={{ background: '#1A6B3C', color: '#fff' }} onClick={handlePost}
                        disabled={dp.status === 'Posted' || dp.workflow?.currentStage !== 'Finance'}>Post Invoice</Button>
                </Space>

                <Tabs items={tabItems} size="small" />
            </Card>

            {/* Refer Modal */}
            <Modal title="Refer Document" open={referModal} onCancel={() => setReferModal(false)}
                footer={null}>
                <Form form={referForm} onFinish={handleRefer} layout="vertical">
                    <Form.Item name="referTo" label="Refer To" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'vpd', label: 'VIM Processing Desk' },
                            { value: 'eic', label: 'EIC L1' },
                            { value: 'vpg', label: 'VPG L1' },
                            { value: 'finance', label: 'Finance' },
                            { value: 'hr_admin', label: 'HR Department' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>Submit Referral</Button>
                </Form>
            </Modal>

            {/* RTV Modal */}
            <Modal title="Return to Vendor" open={rtvModal} onCancel={() => setRtvModal(false)}
                footer={null}>
                <Form form={rtvForm} onFinish={handleRTV} layout="vertical">
                    <Form.Item name="reasonCode" label="Reason Code" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'RTV01', label: 'Incorrect Invoice Amount' },
                            { value: 'RTV02', label: 'Missing Documents' },
                            { value: 'RTV03', label: 'PO Mismatch' },
                            { value: 'RTV04', label: 'Quality Issue' },
                            { value: 'RTV05', label: 'Other' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="reason" label="Detailed Reason" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Button type="primary" danger htmlType="submit" block>Confirm Return to Vendor</Button>
                </Form>
            </Modal>
        </div>
    )
}
