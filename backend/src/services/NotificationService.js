const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create a notification for a user
   */
  static async send({ recipientId, title, message, type = 'info', link = '' }) {
    try {
      if (!recipientId) return;
      const notification = await Notification.create({
        recipientId,
        title,
        message,
        type,
        link,
        isRead: false,
      });
      return notification;
    } catch (err) {
      console.error('Failed to create notification:', err.message);
    }
  }

  /**
   * Create notifications in bulk (e.g. for multiple users)
   */
  static async sendBulk({ recipientIds = [], title, message, type = 'info', link = '' }) {
    try {
      if (!recipientIds.length) return;
      const docs = recipientIds.map((id) => ({
        recipientId: id,
        title,
        message,
        type,
        link,
        isRead: false,
      }));
      await Notification.insertMany(docs);
    } catch (err) {
      console.error('Failed to create bulk notifications:', err.message);
    }
  }
}

module.exports = NotificationService;
