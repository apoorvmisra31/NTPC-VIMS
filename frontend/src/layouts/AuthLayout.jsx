import { Outlet } from 'react-router-dom'
import { Layout, Card } from 'antd'

export default function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A6B3C 0%, #0D2137 100%)' }}>
      <Layout.Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px' }}>
        <Card style={{ width: '100%', maxWidth: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ color: '#1A6B3C', fontSize: 28, fontWeight: 'bold', margin: 0 }}>
              NTPC VIMS
            </h1>
            <p style={{ color: '#666', marginTop: 8 }}>Vendor Invoice Management System</p>
          </div>
          <Outlet />
        </Card>
      </Layout.Content>
    </Layout>
  )
}
