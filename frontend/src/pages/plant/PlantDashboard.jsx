import { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Select, Tag, Table, Statistic } from 'antd'
import { useSocket } from '../../context/SocketContext'

const STATUS_COLORS = { Normal: '#52c41a', Warning: '#faad14', Critical: '#ff4d4f' }
const UNITS = ['Unit-1', 'Unit-2', 'Unit-3', 'Unit-4', 'Unit-5']

export default function PlantDashboard() {
    const [selectedUnit, setSelectedUnit] = useState('Unit-1')
    const [parameters, setParameters] = useState({})
    const [history, setHistory] = useState([])
    const [alerts, setAlerts] = useState([])
    const { socket } = useSocket()
    const historyRef = useRef([])

    useEffect(() => {
        if (!socket) return

        socket.emit('subscribe-plant', selectedUnit)

        const handler = (data) => {
            if (data.unit === selectedUnit) {
                setParameters(data.parameters)
                // Keep rolling 30 data points
                historyRef.current = [...historyRef.current.slice(-29), { time: new Date(data.timestamp).toLocaleTimeString(), ...Object.fromEntries(Object.entries(data.parameters).map(([k, v]) => [k, v.value])) }]
                setHistory([...historyRef.current])

                // Track alerts
                Object.entries(data.parameters).forEach(([k, v]) => {
                    if (v.status === 'Critical') {
                        setAlerts(prev => [{ param: k, value: v.value, unit: v.unit, time: data.timestamp, status: v.status }, ...prev.slice(0, 49)])
                    }
                })
            }
        }

        socket.on('plant-data', handler)
        return () => {
            socket.off('plant-data', handler)
            socket.emit('unsubscribe-plant', selectedUnit)
        }
    }, [socket, selectedUnit])

    const paramCards = Object.entries(parameters).map(([key, param]) => (
        <Col span={4} key={key} style={{ minWidth: 200 }}>
            <Card size="small" style={{
                background: param.status === 'Critical' ? '#fff1f0' : param.status === 'Warning' ? '#fffbe6' : '#f6ffed',
                borderLeft: `4px solid ${STATUS_COLORS[param.status]}`,
            }}>
                <Statistic
                    title={<span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{key}</span>}
                    value={param.value}
                    suffix={param.unit}
                    valueStyle={{ color: STATUS_COLORS[param.status], fontSize: 24 }}
                />
                <Tag color={STATUS_COLORS[param.status]} style={{ marginTop: 4 }}>{param.status}</Tag>
            </Card>
        </Col>
    ))

    const alertColumns = [
        { title: 'Time', dataIndex: 'time', width: 180, render: v => new Date(v).toLocaleString('en-IN') },
        { title: 'Parameter', dataIndex: 'param', width: 120, render: v => <span style={{ textTransform: 'capitalize' }}>{v}</span> },
        { title: 'Value', dataIndex: 'value', width: 100, render: (v, r) => `${v} ${r.unit}` },
        { title: 'Status', dataIndex: 'status', width: 80, render: v => <Tag color="red">{v}</Tag> },
    ]

    // Simple SVG-based rolling chart
    const chartWidth = 800, chartHeight = 180
    const renderChart = (paramKey, color) => {
        const values = history.map(h => h[paramKey]).filter(v => v != null)
        if (values.length < 2) return null
        const min = Math.min(...values) * 0.95
        const max = Math.max(...values) * 1.05
        const range = max - min || 1
        const stepX = chartWidth / (values.length - 1)
        const points = values.map((v, i) => `${i * stepX},${chartHeight - ((v - min) / range) * chartHeight}`).join(' ')

        return (
            <Card size="small" title={<span style={{ textTransform: 'capitalize' }}>{paramKey} ({parameters[paramKey]?.unit || ''})</span>} key={paramKey} style={{ marginBottom: 8 }}>
                <svg width={chartWidth} height={chartHeight} style={{ width: '100%', height: chartHeight }}>
                    <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
                    {values.length > 0 && (
                        <>
                            <text x="0" y="12" fontSize="10" fill="#999">{max.toFixed(1)}</text>
                            <text x="0" y={chartHeight - 2} fontSize="10" fill="#999">{min.toFixed(1)}</text>
                        </>
                    )}
                </svg>
            </Card>
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: '#0D2137' }}>🏭 Plant Monitoring Dashboard</h2>
                <Select value={selectedUnit} onChange={v => { historyRef.current = []; setHistory([]); setSelectedUnit(v) }} style={{ width: 150 }}
                    options={UNITS.map(u => ({ value: u, label: u }))} />
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>{paramCards}</Row>

            <Row gutter={16}>
                <Col span={16}>
                    <h3 style={{ color: '#0D2137' }}>Rolling Charts (60s Window)</h3>
                    {renderChart('load', '#1A6B3C')}
                    {renderChart('temperature', '#D32F2F')}
                    {renderChart('pressure', '#1565C0')}
                    {renderChart('efficiency', '#7B1FA2')}
                </Col>
                <Col span={8}>
                    <Card title="⚠️ Alert History" size="small" style={{ maxHeight: 600, overflow: 'auto' }}>
                        <Table dataSource={alerts} columns={alertColumns} rowKey={(_, i) => i} size="small" pagination={false} />
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
