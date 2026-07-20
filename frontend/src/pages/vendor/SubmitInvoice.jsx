import { useState } from 'react'
import { Card, Tabs, Form, Input, DatePicker, Upload, Button, message, InputNumber } from 'antd'
import { UploadOutlined, SaveOutlined } from '@ant-design/icons'
import { invoiceApi } from '../../api'

const { TextArea } = Input

// ─── Form configs per invoice type ────────────────────────────────────────────
const INVOICE_TABS = [
  { key: 'PO Invoice', label: 'PO Invoice' },
  { key: 'Advance Payment', label: 'Advance Payment' },
  { key: 'Credit Memo', label: 'Credit Memo' },
  { key: 'Retention Release', label: 'Retention Release' },
  { key: 'Subsequent Debit', label: 'Subsequent Debit' },
  { key: 'Dispatch Payment', label: 'Dispatch Payment' },
  { key: 'Custom Duty', label: 'Custom Duty' },
]

// Map invoice type → API method
const SUBMIT_API = {
  'PO Invoice': invoiceApi.submitPO,
  'Advance Payment': invoiceApi.submitAdvance,
  'Credit Memo': invoiceApi.submitCreditMemo,
  'Retention Release': invoiceApi.submitRetentionRelease,
  'Subsequent Debit': invoiceApi.submitSubsequentDebit,
  'Dispatch Payment': invoiceApi.submitDispatch,
  'Custom Duty': invoiceApi.submitCustomDuty,
}

// ─── Per-type form field renderers ────────────────────────────────────────────
function POInvoiceFields() {
  return (
    <>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Basic Information</h3>
        <Form.Item name="invoiceNumber" label="Invoice Number" rules={[{ required: true }]}>
          <Input placeholder="Enter invoice number" />
        </Form.Item>
        <Form.Item name="poNumber" label="PO Number" rules={[{ required: true }]}>
          <Input placeholder="Enter PO number" />
        </Form.Item>
        <Form.Item name="invoiceDate" label="Invoice Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Amount Details</h3>
        <Form.Item name="grossAmount" label="Gross Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="taxAmount" label="Tax Amount (INR)">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="netAmount" label="Net Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Document Upload</h3>
        <Form.Item name="invoiceDocument" label="Invoice Document (PDF)"
          rules={[{ required: true, message: 'Please upload invoice document' }]}>
          <Upload beforeUpload={() => false} maxCount={1}>
            <Button icon={<UploadOutlined />}>Upload Invoice PDF</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="supportingDocuments" label="Supporting Documents">
          <Upload beforeUpload={() => false} multiple maxCount={10}>
            <Button icon={<UploadOutlined />}>Upload Supporting Documents</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  )
}

function AdvancePaymentFields() {
  return (
    <>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Advance Details</h3>
        <Form.Item name="invoiceNumber" label="Advance Reference Number" rules={[{ required: true }]}>
          <Input placeholder="Enter advance reference number" />
        </Form.Item>
        <Form.Item name="poNumber" label="PO Number" rules={[{ required: true }]}>
          <Input placeholder="Enter PO number" />
        </Form.Item>
        <Form.Item name="invoiceDate" label="Advance Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="grossAmount" label="Advance Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="adjustmentDetails" label="Adjustment Details">
          <TextArea rows={3} placeholder="Enter adjustment details" />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Document Upload</h3>
        <Form.Item name="invoiceDocument" label="Upload Document">
          <Upload beforeUpload={() => false} maxCount={1}>
            <Button icon={<UploadOutlined />}>Upload Document</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  )
}

function CreditMemoFields() {
  return (
    <>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Credit Memo Details</h3>
        <Form.Item name="invoiceNumber" label="Credit Memo Number" rules={[{ required: true }]}>
          <Input placeholder="Enter credit memo number" />
        </Form.Item>
        <Form.Item name="poNumber" label="Reference Invoice Number" rules={[{ required: true }]}>
          <Input placeholder="Enter reference invoice number" />
        </Form.Item>
        <Form.Item name="remarks" label="Reason for Credit" rules={[{ required: true }]}>
          <TextArea rows={3} placeholder="Enter reason for credit" />
        </Form.Item>
        <Form.Item name="grossAmount" label="Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Document Upload</h3>
        <Form.Item name="invoiceDocument" label="Upload Document">
          <Upload beforeUpload={() => false} maxCount={1}>
            <Button icon={<UploadOutlined />}>Upload Document</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  )
}

function RetentionReleaseFields() {
  return (
    <>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Retention Release Details</h3>
        <Form.Item name="invoiceNumber" label="Retention Reference Number" rules={[{ required: true }]}>
          <Input placeholder="Enter retention reference number" />
        </Form.Item>
        <Form.Item name="poNumber" label="PO Number" rules={[{ required: true }]}>
          <Input placeholder="Enter PO number" />
        </Form.Item>
        <Form.Item name="grossAmount" label="Retention Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="invoiceDate" label="Release Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Document Upload</h3>
        <Form.Item name="supportingDocuments" label="Supporting Documents">
          <Upload beforeUpload={() => false} multiple maxCount={10}>
            <Button icon={<UploadOutlined />}>Upload Supporting Documents</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  )
}

function SubsequentDebitFields() {
  return (
    <>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Subsequent Debit Details</h3>
        <Form.Item name="invoiceNumber" label="Debit Reference" rules={[{ required: true }]}>
          <Input placeholder="Enter debit reference" />
        </Form.Item>
        <Form.Item name="poNumber" label="PO Number" rules={[{ required: true }]}>
          <Input placeholder="Enter PO number" />
        </Form.Item>
        <Form.Item name="grossAmount" label="Debit Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="reasonCode" label="Reason" rules={[{ required: true }]}>
          <TextArea rows={3} placeholder="Enter reason for debit" />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Document Upload</h3>
        <Form.Item name="supportingDocuments" label="Supporting Documents">
          <Upload beforeUpload={() => false} multiple maxCount={10}>
            <Button icon={<UploadOutlined />}>Upload Supporting Documents</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  )
}

function DispatchPaymentFields() {
  return (
    <>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Dispatch Payment Details</h3>
        <Form.Item name="invoiceNumber" label="Dispatch Reference Number" rules={[{ required: true }]}>
          <Input placeholder="Enter dispatch reference number" />
        </Form.Item>
        <Form.Item name="remarks" label="Transport Details">
          <TextArea rows={3} placeholder="Enter transport details" />
        </Form.Item>
        <Form.Item name="invoiceDate" label="Dispatch Date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="grossAmount" label="Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Document Upload</h3>
        <Form.Item name="supportingDocuments" label="Supporting Documents">
          <Upload beforeUpload={() => false} multiple maxCount={10}>
            <Button icon={<UploadOutlined />}>Upload Supporting Documents</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  )
}

function CustomDutyFields() {
  return (
    <>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Custom Duty Details</h3>
        <Form.Item name="invoiceNumber" label="Bill of Entry Number" rules={[{ required: true }]}>
          <Input placeholder="Enter bill of entry number" />
        </Form.Item>
        <Form.Item name="poNumber" label="Customs Ref" rules={[{ required: true }]}>
          <Input placeholder="Enter customs reference" />
        </Form.Item>
        <Form.Item name="grossAmount" label="Duty Amount (INR)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      </div>
      <div className="invoice-form-section">
        <h3 className="invoice-form-section-title">Document Upload</h3>
        <Form.Item name="invoiceDocument" label="Upload Documents">
          <Upload beforeUpload={() => false} multiple maxCount={10}>
            <Button icon={<UploadOutlined />}>Upload Documents</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  )
}

const FORM_FIELDS = {
  'PO Invoice': POInvoiceFields,
  'Advance Payment': AdvancePaymentFields,
  'Credit Memo': CreditMemoFields,
  'Retention Release': RetentionReleaseFields,
  'Subsequent Debit': SubsequentDebitFields,
  'Dispatch Payment': DispatchPaymentFields,
  'Custom Duty': CustomDutyFields,
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function SubmitInvoice() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [invoiceType, setInvoiceType] = useState('PO Invoice')

  const handleTabChange = (key) => {
    form.resetFields()
    setInvoiceType(key)
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const formData = new FormData()

      // Append regular fields
      Object.keys(values).forEach(key => {
        if (key === 'invoiceDocument' || key === 'supportingDocuments') return
        if (values[key] === undefined || values[key] === null) return
        // DatePicker returns a dayjs object
        if (values[key]?.$d) {
          formData.append(key, values[key].toISOString())
        } else {
          formData.append(key, values[key])
        }
      })

      // Append file uploads
      if (values.invoiceDocument?.fileList) {
        values.invoiceDocument.fileList.forEach(file => {
          formData.append('invoiceDocument', file.originFileObj)
        })
      }
      if (values.supportingDocuments?.fileList) {
        values.supportingDocuments.fileList.forEach(file => {
          formData.append('supportingDocuments', file.originFileObj)
        })
      }

      const submitFn = SUBMIT_API[invoiceType]
      await submitFn(formData)

      message.success(`${invoiceType} submitted successfully!`)
      form.resetFields()
    } catch (error) {
      message.error(error.response?.data?.message || `Failed to submit ${invoiceType}`)
    } finally {
      setLoading(false)
    }
  }

  const FieldsComponent = FORM_FIELDS[invoiceType]

  const tabItems = INVOICE_TABS.map(t => ({
    key: t.key,
    label: t.label,
  }))

  return (
    <div>
      <h1 className="page-title">Submit Invoice</h1>

      <Card className="card-shadow">
        <Tabs activeKey={invoiceType} onChange={handleTabChange} items={tabItems} />

        <Form form={form} onFinish={onFinish} layout="vertical" style={{ marginTop: 24 }}>
          <FieldsComponent />

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" loading={loading}>
              Submit {invoiceType}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
