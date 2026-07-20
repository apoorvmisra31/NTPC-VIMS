import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import PrivateRoute from './router/PrivateRoute'
import { Spin } from 'antd'
import './App.css'

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const VendorDashboard = lazy(() => import('./pages/vendor/Dashboard'))
const SubmitInvoice = lazy(() => import('./pages/vendor/SubmitInvoice'))
const InvoiceList = lazy(() => import('./pages/vendor/InvoiceList'))
const PurchaseOrders = lazy(() => import('./pages/vendor/PurchaseOrders'))
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'))
const VIMWorkplace = lazy(() => import('./pages/vim/Workplace'))
const DPDocumentView = lazy(() => import('./pages/vim/DPDocumentView'))
const InvoiceDetail = lazy(() => import('./pages/vim/InvoiceDetail'))
const Analytics = lazy(() => import('./pages/vim/Analytics'))
const HRDashboard = lazy(() => import('./pages/hr/HRDashboard'))
const PlantDashboard = lazy(() => import('./pages/plant/PlantDashboard'))
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'))

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Loading..." />
  </div>
)

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected routes */}
            <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Vendor Portal */}
              <Route path="/dashboard" element={<VendorDashboard />} />
              <Route path="/submit-invoice" element={<SubmitInvoice />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/profile" element={<VendorProfile />} />

              {/* VIM Workplace */}
              <Route path="/vim/workplace" element={<VIMWorkplace />} />
              <Route path="/vim/dp-document/:dpId" element={<DPDocumentView />} />
              <Route path="/vim/invoice/:id" element={<InvoiceDetail />} />

              {/* VIM Analytics */}
              <Route path="/analytics" element={<Analytics />} />

              {/* HR Portal */}
              <Route path="/hr" element={<HRDashboard />} />

              {/* Plant Monitoring */}
              <Route path="/plant" element={<PlantDashboard />} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Routes>
        </Suspense>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
