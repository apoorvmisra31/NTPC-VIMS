import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function Register() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await api.post('/api/auth/register', values)
      message.success('Registration successful! Please login.')
      navigate('/login')
    } catch (error) {
      message.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="email"
        rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Email" />
      </Form.Item>
      
      <Form.Item
        name="password"
        rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      
      <Form.Item
        name="vendorCode"
        rules={[{ required: true, message: 'Please enter vendor code' }]}
      >
        <Input prefix={<BankOutlined />} placeholder="Vendor Code" />
      </Form.Item>
      
      <Form.Item
        name="vendorName"
        rules={[{ required: true, message: 'Please enter vendor name' }]}
      >
        <Input placeholder="Vendor Name" />
      </Form.Item>
      
      <Form.Item
        name="companyName"
        rules={[{ required: true, message: 'Please enter company name' }]}
      >
        <Input placeholder="Company Name" />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Register
        </Button>
      </Form.Item>
      
      <div style={{ textAlign: 'center' }}>
        Already have an account? <Link to="/login" style={{ color: '#1A6B3C', fontWeight: 600 }}>Login here</Link>
      </div>
    </Form>
  )
}
