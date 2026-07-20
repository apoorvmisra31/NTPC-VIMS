const { Notification } = require('../models');

/**
 * Create a notification and push via Socket.IO if available
 */
exports.createNotification = async (recipientId, type, title, message, link, io) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            recipientRef: recipientId.toString(),
            type,
            title,
            message,
            link,
        });

        // Push via Socket.IO if available
        if (io) {
            io.to(recipientId.toString()).emit('notification', {
                id: notification._id,
                type,
                title,
                message,
                link,
                createdAt: notification.createdAt,
            });
        }

        return notification;
    } catch (error) {
        console.error('Notification creation error:', error);
        return null;
    }
};

/**
 * Create notifications for multiple recipients
 */
exports.createBulkNotifications = async (recipientIds, type, title, message, link, io) => {
    const results = [];
    for (const recipientId of recipientIds) {
        const notification = await exports.createNotification(recipientId, type, title, message, link, io);
        if (notification) results.push(notification);
    }
    return results;
};

/**
 * Get unread notification count for a user
 */
exports.getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Mark notifications as read
 */
exports.markAsRead = async (notificationIds, userId) => {
    return await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: userId },
        { $set: { isRead: true, readAt: new Date() } }
    );
};

/**
 * Get user notifications with pagination
 */
exports.getUserNotifications = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await Notification.countDocuments({ recipient: userId });
    return { notifications, total, page, limit };
};
