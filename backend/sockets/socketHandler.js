/**
 * Socket.IO Event Handlers
 * - Plant monitoring: simulated parameter data
 * - Notifications: push to user rooms
 * - Per-socket subscription tracking to prevent counter drift
 */

// Plant monitoring simulation data
const PLANT_UNITS = ['Unit-1', 'Unit-2', 'Unit-3', 'Unit-4', 'Unit-5'];
const PARAMETERS = {
    load: { min: 200, max: 500, unit: 'MW', warningLow: 250, warningHigh: 480, criticalHigh: 495 },
    rpm: { min: 2900, max: 3100, unit: 'RPM', warningLow: 2950, warningHigh: 3050, criticalHigh: 3080 },
    temperature: { min: 400, max: 600, unit: '°C', warningLow: 420, warningHigh: 560, criticalHigh: 580 },
    pressure: { min: 100, max: 250, unit: 'Bar', warningLow: 120, warningHigh: 230, criticalHigh: 245 },
    efficiency: { min: 30, max: 42, unit: '%', warningLow: 33, warningHigh: 40, criticalHigh: 41 },
};

function getStatus(value, param) {
    if (value >= param.criticalHigh || value <= param.min) return 'Critical';
    if (value >= param.warningHigh || value <= param.warningLow) return 'Warning';
    return 'Normal';
}

function generateParameterData(unit) {
    const data = { unit, timestamp: new Date().toISOString(), parameters: {} };
    for (const [key, param] of Object.entries(PARAMETERS)) {
        // Random walk with slight jitter
        const range = param.max - param.min;
        const value = param.min + Math.random() * range;
        const rounded = Math.round(value * 100) / 100;
        data.parameters[key] = {
            value: rounded,
            unit: param.unit,
            status: getStatus(rounded, param),
        };
    }
    return data;
}

module.exports = function setupSocketHandlers(io) {
    // Plant monitoring interval — push data every 2 seconds
    let plantMonitoringInterval = null;
    // Track subscriptions per socket to avoid counter drift
    const socketSubscriptions = new Map();

    function getSubscribedCount() {
        let count = 0;
        for (const subs of socketSubscriptions.values()) {
            if (subs.size > 0) count++;
        }
        return count;
    }

    function startMonitoringIfNeeded() {
        if (!plantMonitoringInterval && getSubscribedCount() > 0) {
            plantMonitoringInterval = setInterval(() => {
                PLANT_UNITS.forEach(u => {
                    const data = generateParameterData(u);
                    io.to(`plant-${u}`).emit('plant-data', data);
                });
            }, 2000);
        }
    }

    function stopMonitoringIfEmpty() {
        if (plantMonitoringInterval && getSubscribedCount() <= 0) {
            clearInterval(plantMonitoringInterval);
            plantMonitoringInterval = null;
        }
    }

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socketSubscriptions.set(socket.id, new Set());

        // Join user room for notifications
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined notification room`);
        });

        // Plant monitoring subscription
        socket.on('subscribe-plant', (unit) => {
            const unitName = unit || 'Unit-1';
            socket.join(`plant-${unitName}`);
            const subs = socketSubscriptions.get(socket.id);
            if (subs) subs.add(unitName);
            startMonitoringIfNeeded();
        });

        socket.on('unsubscribe-plant', (unit) => {
            const unitName = unit || 'Unit-1';
            socket.leave(`plant-${unitName}`);
            const subs = socketSubscriptions.get(socket.id);
            if (subs) subs.delete(unitName);
            stopMonitoringIfEmpty();
        });

        // Messaging
        socket.on('send-message', (data) => {
            // Broadcast to invoice room
            io.to(`invoice-${data.invoiceId}`).emit('new-message', data);
        });

        socket.on('join-invoice', (invoiceId) => {
            socket.join(`invoice-${invoiceId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            socketSubscriptions.delete(socket.id);
            stopMonitoringIfEmpty();
        });
    });
};
