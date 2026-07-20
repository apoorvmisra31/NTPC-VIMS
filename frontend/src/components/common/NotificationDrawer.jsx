import { Badge, Drawer, List, Button, Empty, Typography } from 'antd'
import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import { useState } from 'react'

const { Text } = Typography

export default function NotificationDrawer({ notifications = [], onMarkRead, onClear }) {
    const [visible, setVisible] = useState(false)
    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <>
            <Badge count={unreadCount} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} onClick={() => setVisible(true)} />
            </Badge>
            <Drawer
                title="Notifications"
                placement="right"
                width={380}
                open={visible}
                onClose={() => setVisible(false)}
                extra={
                    unreadCount > 0 && (
                        <Button size="small" icon={<CheckOutlined />} onClick={onMarkRead}>
                            Mark All Read
                        </Button>
                    )
                }
            >
                {notifications.length === 0 ? (
                    <Empty description="No notifications" />
                ) : (
                    <List
                        size="small"
                        dataSource={notifications}
                        renderItem={item => (
                            <List.Item style={{ background: item.isRead ? 'transparent' : '#f0f7ff', padding: '8px 12px', borderRadius: 6, marginBottom: 4 }}>
                                <List.Item.Meta
                                    title={<Text strong={!item.isRead} style={{ fontSize: 13 }}>{item.title}</Text>}
                                    description={
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {new Date(item.createdAt).toLocaleString('en-IN')}
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Drawer>
        </>
    )
}
