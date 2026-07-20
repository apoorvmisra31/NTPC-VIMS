import { useState } from 'react'
import { List, Input, Button, Avatar, Typography, Tag, Space, Empty } from 'antd'
import { UserOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { TextArea } = Input
const { Text } = Typography

const ROLE_COLORS = {
  vendor: '#2db7f5', vpd: '#87d068', eic: '#f50', vpg: '#108ee9', finance: '#722ed1', system_admin: '#faad14',
}

export default function CommentsThread({ comments = [], onAddComment, loading, currentUserRole }) {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await onAddComment(newComment, isInternal)
      setNewComment('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>💬 Comments</Text>

      {comments.length === 0 ? (
        <Empty description="No comments yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={comments}
          renderItem={(item) => {
            const user = item.user_id || {}
            const isSystem = item.is_system
            return (
              <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'flex-start' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      style={{ backgroundColor: isSystem ? '#999' : (ROLE_COLORS[item.role] || '#1890ff') }}
                    />
                  }
                  title={
                    <Space size={4}>
                      <Text strong style={{ fontSize: 12 }}>{user.email || item.role || 'System'}</Text>
                      <Tag color={ROLE_COLORS[item.role] || 'default'} style={{ fontSize: 10 }}>
                        {(item.role || 'system').toUpperCase()}
                      </Tag>
                      {item.is_internal && <Tag color="orange" style={{ fontSize: 10 }}>INTERNAL</Tag>}
                      {isSystem && <Tag color="default" style={{ fontSize: 10 }}>SYSTEM</Tag>}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(item.createdAt).fromNow()}
                      </Text>
                    </Space>
                  }
                  description={
                    <Text style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{item.comment}</Text>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}

      {onAddComment && (
        <div style={{ marginTop: 12 }}>
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              size="small"
              type={isInternal ? 'primary' : 'default'}
              ghost={isInternal}
              onClick={() => setIsInternal(!isInternal)}
            >
              {isInternal ? '🔒 Internal Only' : '🌐 Visible to All'}
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
