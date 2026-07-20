import { Steps } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons'

const STAGES = ['VPD', 'EIC L1', 'VPG L1', 'Finance', 'Completed']

const stageIcons = {
    completed: <CheckCircleOutlined />,
    processing: <LoadingOutlined />,
    waiting: <ClockCircleOutlined />,
    error: <CloseCircleOutlined />,
}

export default function TimelineTracker({ currentStage, status }) {
    const currentIndex = STAGES.indexOf(currentStage)
    const isObsolete = status === 'Obsolete' || status === 'Returned to Vendor'

    const items = STAGES.map((stage, idx) => {
        let stepStatus = 'wait'
        let icon = stageIcons.waiting
        if (isObsolete) {
            stepStatus = idx <= currentIndex ? 'error' : 'wait'
            icon = idx <= currentIndex ? stageIcons.error : stageIcons.waiting
        } else if (idx < currentIndex) {
            stepStatus = 'finish'
            icon = stageIcons.completed
        } else if (idx === currentIndex) {
            stepStatus = 'process'
            icon = stageIcons.processing
        }

        return { title: stage, status: stepStatus, icon }
    })

    return (
        <Steps
            size="small"
            items={items}
            style={{ padding: '12px 0' }}
        />
    )
}
