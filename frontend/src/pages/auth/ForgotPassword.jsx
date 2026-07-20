import { useState } from 'react'
import { Form, Input, Button, message, Result } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

export default function ForgotPassword() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', values)
      setSent(true)
      message.success('Password reset email sent!')
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Result
        status="success"
        title="Email Sent!"
        subTitle="Please check your email for password reset instructions."
        extra={<Link to="/login"><Button type="primary">Back to Login</Button></Link>}
      />
    )
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <p style={{ marginBottom: 24, color: '#666' }}>
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      <Form.Item
        name="email"
        rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Send Reset Link
        </Button>
      </Form.Item>
      
      <div style={{ textAlign: 'center' }}>
        <Link to="/login" style={{ color: '#1A6B3C' }}>Back to Login</Link>
      </div>
    </Form>
  )
}
