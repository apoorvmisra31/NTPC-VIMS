import { useState, useRef } from 'react'
import { Card, Descriptions, Button, Modal, message, Spin, Tag, Input } from 'antd'
import { DeleteOutlined, UserOutlined, ExclamationCircleOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { profileApi } from '../../api'
import api from '../../api/axios'

// Role-specific labels
const ROLE_LABELS = {
    vendor: { title: 'Vendor Profile', nameLabel: 'Vendor Name', codeLabel: 'Vendor Code' },
    vendor_sub_user: { title: 'Vendor Profile', nameLabel: 'Vendor Name', codeLabel: 'Vendor Code' },
    system_admin: { title: 'Admin Profile', nameLabel: 'Admin Name', codeLabel: 'Employee Code' },
    vpd: { title: 'VPD Profile', nameLabel: 'VPD Name', codeLabel: 'Employee Code' },
    eic: { title: 'EIC Profile', nameLabel: 'EIC Name', codeLabel: 'Employee Code' },
    vpg: { title: 'VPG Profile', nameLabel: 'VPG Name', codeLabel: 'Employee Code' },
    finance: { title: 'Finance Profile', nameLabel: 'Finance Name', codeLabel: 'Employee Code' },
    hr_admin: { title: 'HR Profile', nameLabel: 'HR Name', codeLabel: 'Employee Code' },
}

export default function VendorProfile() {
    const { user, logout, refreshUser } = useAuth()
    const navigate = useNavigate()
    const [deleting, setDeleting] = useState(false)

    // Inline editing state
    const [editingName, setEditingName] = useState(false)
    const [editingCode, setEditingCode] = useState(false)
    const [nameValue, setNameValue] = useState('')
    const [codeValue, setCodeValue] = useState('')
    const [saving, setSaving] = useState(false)

    if (!user) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

    const labels = ROLE_LABELS[user.role] || ROLE_LABELS.vendor

    const handleDeleteAccount = () => {
        Modal.confirm({
            title: 'Delete Account',
            icon: <ExclamationCircleOutlined />,
            content: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                setDeleting(true)
                try {
                    await api.delete('/api/auth/delete-account')
                    message.success('Account deleted successfully')
                    logout()
                } catch (error) {
                    message.error(error.response?.data?.message || 'Failed to delete account')
                } finally {
                    setDeleting(false)
                }
            },
        })
    }

    const handleSaveName = async () => {
        if (!nameValue.trim()) {
            message.warning('Name cannot be empty')
            return
        }
        setSaving(true)
        try {
            await profileApi.updateProfile({ vendorName: nameValue.trim() })
            message.success('Name updated successfully')
            setEditingName(false)
            if (refreshUser) await refreshUser()
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to update name')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveCode = async () => {
        if (!codeValue.trim()) {
            message.warning('Code cannot be empty')
            return
        }
        setSaving(true)
        try {
            await profileApi.updateProfile({ vendorCode: codeValue.trim() })
            message.success('Code updated successfully')
            setEditingCode(false)
            if (refreshUser) await refreshUser()
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to update code')
        } finally {
            setSaving(false)
        }
    }

    const registeredDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
        })
        : 'N/A'

    return (
        <div>
            <h1 className="page-title">{labels.title}</h1>

            <Card className="card-shadow" style={{ maxWidth: 700 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', background: '#1A6B3C',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                    }}>
                        <UserOutlined style={{ fontSize: 36, color: '#fff' }} />
                    </div>
                    <h2 style={{ margin: 0 }}>{user.vendorName || user.email}</h2>
                    <Tag color="green" style={{ marginTop: 8 }}>{user.role?.toUpperCase()}</Tag>
                </div>

                <Descriptions bordered column={1} size="middle">
                    <Descriptions.Item label={labels.nameLabel}>
                        {editingName ? (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Input
                                    value={nameValue}
                                    onChange={e => setNameValue(e.target.value)}
                                    onPressEnter={handleSaveName}
                                    autoFocus
                                    style={{ flex: 1 }}
                                />
                                <Button type="primary" size="small" icon={<CheckOutlined />} loading={saving} onClick={handleSaveName} />
                                <Button size="small" onClick={() => setEditingName(false)}>Cancel</Button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{user.vendorName || '—'}</span>
                                <Button type="link" size="small" icon={<EditOutlined />}
                                    onClick={() => { setNameValue(user.vendorName || ''); setEditingName(true) }}>
                                    Edit
                                </Button>
                            </div>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    <Descriptions.Item label={labels.codeLabel}>
                        {editingCode ? (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Input
                                    value={codeValue}
                                    onChange={e => setCodeValue(e.target.value)}
                                    onPressEnter={handleSaveCode}
                                    autoFocus
                                    style={{ flex: 1 }}
                                />
                                <Button type="primary" size="small" icon={<CheckOutlined />} loading={saving} onClick={handleSaveCode} />
                                <Button size="small" onClick={() => setEditingCode(false)}>Cancel</Button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{user.vendorCode || '—'}</span>
                                <Button type="link" size="small" icon={<EditOutlined />}
                                    onClick={() => { setCodeValue(user.vendorCode || ''); setEditingCode(true) }}>
                                    Edit
                                </Button>
                            </div>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Registered Date">{registeredDate}</Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 32, textAlign: 'center' }}>
                    <Button
                        danger
                        type="primary"
                        icon={<DeleteOutlined />}
                        size="large"
                        loading={deleting}
                        onClick={handleDeleteAccount}
                    >
                        Delete Account
                    </Button>
                </div>
            </Card>
        </div>
    )
}
