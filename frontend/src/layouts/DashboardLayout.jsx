import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Tag, Switch, Tooltip } from 'antd'
import {
  DashboardOutlined, FileTextOutlined, ShoppingCartOutlined, UploadOutlined,
  BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined,
  BarChartOutlined, TeamOutlined, ThunderboltOutlined, ToolOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, WifiOutlined, DisconnectOutlined,
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import NotificationDrawer from '../components/common/NotificationDrawer'

const { Header, Sider, Content } = Layout

const ROLE_MENUS = {
  vendor: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/submit-invoice', icon: <UploadOutlined />, label: 'Submit Invoice' },
    { key: '/invoices', icon: <FileTextOutlined />, label: 'My Invoices' },
    { key: '/purchase-orders', icon: <ShoppingCartOutlined />, label: 'Purchase Orders' },
  ],
  vendor_sub_user: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/submit-invoice', icon: <UploadOutlined />, label: 'Submit Invoice' },
    { key: '/invoices', icon: <FileTextOutlined />, label: 'My Invoices' },
    { key: '/purchase-orders', icon: <ShoppingCartOutlined />, label: 'Purchase Orders' },
  ],
  vpd: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/vim/workplace', icon: <ToolOutlined />, label: 'VIM Workspace' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
  ],
  eic: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/vim/workplace', icon: <ToolOutlined />, label: 'VIM Workspace' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
  ],
  vpg: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/vim/workplace', icon: <ToolOutlined />, label: 'VIM Workspace' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
  ],
  finance: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/vim/workplace', icon: <ToolOutlined />, label: 'VIM Workspace' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
  ],
  hr_admin: [
    { key: '/hr', icon: <TeamOutlined />, label: 'HR Portal' },
  ],
  system_admin: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/vim/workplace', icon: <ToolOutlined />, label: 'VIM Workspace' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
    { key: '/hr', icon: <TeamOutlined />, label: 'HR Portal' },
    { key: '/plant', icon: <ThunderboltOutlined />, label: 'Plant Monitoring' },
    { key: '/admin', icon: <SettingOutlined />, label: 'Administration' },
  ],
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { notifications, isConnected } = useSocket()
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Use exact role menus — no catchall additions
  const menuItems = ROLE_MENUS[user?.role] || ROLE_MENUS.vendor

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/profile') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
    ],
  }

  const siderBg = darkMode ? '#0D2137' : '#001529'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220}
        style={{ background: siderBg }}
        trigger={null}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'start',
          padding: collapsed ? 0 : '0 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1A6B3C' }}>🏭</span>
          {!collapsed && <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 700, color: '#fff' }}>NTPC VIMS+</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 'none' }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: darkMode ? '#141414' : '#fff', padding: '0 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', height: 56, lineHeight: '56px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)} />
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, color: darkMode ? '#fff' : '#0D2137' }}>
                {user?.vendorName || user?.email}
              </span>
              <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>
                {user?.role?.toUpperCase()}
              </Tag>
              {user?.vendorCode && <Tag style={{ fontSize: 11 }}>{user.vendorCode}</Tag>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
              {isConnected
                ? <WifiOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                : <DisconnectOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
              }
            </Tooltip>
            <Switch checkedChildren="🌙" unCheckedChildren="☀️" checked={darkMode} onChange={setDarkMode} size="small" />
            <NotificationDrawer notifications={notifications} />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', backgroundColor: '#1A6B3C' }} />
            </Dropdown>
          </div>
        </Header>

        <Content style={{
          margin: 16, padding: 20, background: darkMode ? '#1f1f1f' : '#fff',
          borderRadius: 8, minHeight: 'calc(100vh - 88px)', overflow: 'auto',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
