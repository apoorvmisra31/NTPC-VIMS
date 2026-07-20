import { Tag } from 'antd'

const STATUS_COLORS = {
    Draft: 'default',
    Submitted: 'processing',
    'Under Review': 'processing',
    'In Progress': 'processing',
    'Awaiting Approval': 'warning',
    Approved: 'success',
    Posted: 'success',
    Paid: 'green',
    Rejected: 'error',
    Returned: 'orange',
    Obsolete: 'default',
    'Returned to Vendor': 'orange',
    Normal: 'success',
    Warning: 'warning',
    Critical: 'error',
    Open: 'blue',
    Closed: 'default',
    'Partially Invoiced': 'processing',
    'Fully Invoiced': 'success',
}

export default function StatusBadge({ status, size = 'default' }) {
    return (
        <Tag color={STATUS_COLORS[status] || 'default'} style={size === 'small' ? { fontSize: 11 } : {}}>
            {status}
        </Tag>
    )
}
