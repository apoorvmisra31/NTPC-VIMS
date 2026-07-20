import { useState } from "react"
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [form] = Form.useForm()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await login(values.email, values.password)
      message.success('Login successful!')
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical" size="large">
      <Form.Item
        name="email"
        rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Email" />
      </Form.Item>
      
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please enter your password' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      
      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Link to="/forgot-password" style={{ color: '#1A6B3C' }}>Forgot password?</Link>
        </div>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Login
        </Button>
      </Form.Item>
      
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        New vendor? <Link to="/register" style={{ color: '#1A6B3C', fontWeight: 600 }}>Register here</Link>
      </div>
    </Form>
  )
}
