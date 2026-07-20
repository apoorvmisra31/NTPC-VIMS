import { Steps } from 'antd'
import { CheckCircleFilled, ClockCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'

const STAGES = [
  { key: 'VENDOR', title: 'Vendor', description: 'Submitted' },
  { key: 'VPD', title: 'VPD', description: 'Verification' },
  { key: 'EIC', title: 'EIC', description: 'Technical Review' },
  { key: 'VPG', title: 'VPG', description: 'Payment Processing' },
  { key: 'FINANCE', title: 'Finance', description: 'Approval' },
  { key: 'SYSTEM', title: 'Paid', description: 'Completed' },
]

const STATUS_MAP = {
  'Draft': -1, 'Submitted': 1, 'VPD_APPROVED': 2, 'EIC_APPROVED': 3,
  'VPG_PROCESSED': 4, 'FINANCE_APPROVED': 5, 'Paid': 5,
  'Rejected': -2, 'ON_HOLD': -3,
}

export default function WorkflowProgressBar({ currentRole, status }) {
  const currentIdx = STAGES.findIndex(s => s.key === currentRole)
  const isRejected = status === 'Rejected'
  const isOnHold = status === 'ON_HOLD'
  const isPaid = status === 'Paid' || currentRole === 'SYSTEM'

  return (
    <div style={{ padding: '16px 0' }}>
      <Steps
        current={isPaid ? 5 : currentIdx}
        status={isRejected ? 'error' : isOnHold ? 'wait' : 'process'}
        size="small"
        items={STAGES.map((stage, idx) => {
          let stageStatus = 'wait'
          if (isPaid) {
            stageStatus = 'finish'
          } else if (isRejected && idx === currentIdx) {
            stageStatus = 'error'
          } else if (idx < currentIdx) {
            stageStatus = 'finish'
          } else if (idx === currentIdx) {
            stageStatus = isOnHold ? 'wait' : 'process'
          }

          return {
            title: stage.title,
            description: stage.description,
            status: stageStatus,
            icon: stageStatus === 'finish' ? <CheckCircleFilled style={{ color: '#52c41a' }} /> :
                  stageStatus === 'error' ? <ExclamationCircleFilled style={{ color: '#ff4d4f' }} /> :
                  stageStatus === 'process' ? <ClockCircleFilled style={{ color: '#1890ff' }} /> : undefined,
          }
        })}
      />
    </div>
  )
}
