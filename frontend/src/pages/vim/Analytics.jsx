import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Select, DatePicker, Button, Space, Spin } from 'antd'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { analyticsApi } from '../../api'

const COLORS = ['#1A6B3C', '#1565C0', '#FF8C00', '#D32F2F', '#7B1FA2', '#00897B', '#FBC02D', '#455A64']

export default function Analytics() {
    const [summary, setSummary] = useState(null)
    const [trends, setTrends] = useState([])
    const [exceptions, setExceptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({})

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const filterParams = {}
            if (filters.plant) filterParams.plant = filters.plant
            if (filters.startDate) filterParams.startDate = filters.startDate
            if (filters.endDate) filterParams.endDate = filters.endDate

            const [sumRes, trendRes, excRes] = await Promise.all([
                analyticsApi.getVIMSummary(filterParams),
                analyticsApi.getInvoiceTrends(filterParams),
                analyticsApi.getExceptionReport(filterParams),
            ])
            setSummary(sumRes.data.data)
            setTrends((trendRes.data.data || []).map(t => ({
                month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
                count: t.count,
                totalAmount: t.totalAmount,
                paidCount: t.paidCount,
            })))
            setExceptions(excRes.data.data || [])
        } catch (err) {
            console.error('Analytics fetch error:', err)
        }
        setLoading(false)
    }, [filters])

    useEffect(() => { fetchData() }, [])

    const handleApply = () => {
        fetchData()
    }

    if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />

    const statusData = (summary?.byStatus || []).map(s => ({ name: s._id, value: s.count }))
    const plantData = (summary?.byPlant || []).map(s => ({ name: s._id || 'Unknown', count: s.count, amount: s.totalAmount }))

    return (
        <div>
            <h2 style={{ marginBottom: 16, color: '#0D2137' }}>📊 VIM Analytics Dashboard</h2>

            <Space style={{ marginBottom: 16 }}>
                <Select placeholder="Plant" style={{ width: 150 }} allowClear
                    value={filters.plant || undefined}
                    onChange={v => setFilters(f => ({ ...f, plant: v || undefined }))}
                    options={['Dadri', 'Rihand', 'Singrauli', 'Korba'].map(p => ({ value: p, label: p }))} />
                <DatePicker.RangePicker onChange={(dates, ds) => {
                    if (dates) {
                        setFilters(f => ({ ...f, startDate: ds[0], endDate: ds[1] }))
                    } else {
                        setFilters(f => {
                            const next = { ...f }
                            delete next.startDate
                            delete next.endDate
                            return next
                        })
                    }
                }} />
                <Button type="primary" onClick={handleApply}>Apply</Button>
            </Space>

            {/* Summary Cards — display only, not clickable */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #1A6B3C, #2E8B57)', color: '#fff', cursor: 'default' }}>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{summary?.summary?.total || 0}</div>
                        <div>Total Invoices</div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #1565C0, #42A5F5)', color: '#fff', cursor: 'default' }}>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>₹{((summary?.summary?.totalAmount || 0) / 100000).toFixed(1)}L</div>
                        <div>Total Amount</div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #FF8C00, #FFB74D)', color: '#fff', cursor: 'default' }}>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{exceptions.reduce((s, e) => s + (e.unresolvedCount || 0), 0)}</div>
                        <div>Open Exceptions</div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #7B1FA2, #AB47BC)', color: '#fff', cursor: 'default' }}>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{(summary?.byPlant || []).length}</div>
                        <div>Active Plants</div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={16}>
                {/* Status Pie */}
                <Col span={12}>
                    <Card title="Invoice Status Distribution" size="small">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Invoice Trends */}
                <Col span={12}>
                    <Card title="Invoice Trends Over Time" size="small">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#1A6B3C" name="Total" strokeWidth={2} />
                                <Line type="monotone" dataKey="paidCount" stroke="#1565C0" name="Paid" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Plant Volume */}
                <Col span={12} style={{ marginTop: 16 }}>
                    <Card title="Plant-wise Invoice Volume" size="small">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={plantData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#1A6B3C" name="Invoices" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Exception Rate */}
                <Col span={12} style={{ marginTop: 16 }}>
                    <Card title="Exception Frequency by Rule" size="small">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={exceptions}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#D32F2F" fill="#FFCDD2" name="Total" />
                                <Area type="monotone" dataKey="unresolvedCount" stroke="#FF8C00" fill="#FFE0B2" name="Unresolved" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}
