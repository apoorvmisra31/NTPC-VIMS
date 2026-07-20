import { List, Typography, Tag } from 'antd'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'

const { Text } = Typography

export default function ValidationChecklist({ items }) {
  if (!items || items.length === 0) return null

  return (
    <div style={{
      background: '#fafafa', borderRadius: 8, padding: 16, border: '1px solid #f0f0f0',
    }}>
      <Text strong style={{ fontSize: 14, marginBottom: 8, display: 'block' }}>🔍 Validation Checks</Text>
      <List
        size="small"
        dataSource={items}
        renderItem={(item) => (
          <List.Item style={{ padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {item.passed ? (
                <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
              ) : (
                <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
              )}
              <Text style={{ flex: 1 }}>{item.label}</Text>
              <Tag color={item.passed ? 'green' : 'red'} style={{ fontSize: 11 }}>
                {item.passed ? 'PASS' : 'FAIL'}
              </Tag>
            </div>
          </List.Item>
        )}
      />
    </div>
  )
}
