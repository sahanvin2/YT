import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api';
import { Link } from 'react-router-dom';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.videoId) {
      return `/watch/${notification.videoId._id || notification.videoId}`;
    }
    if (notification.creatorId) {
      return `/channel/${notification.creatorId._id || notification.creatorId}`;
    }
    return '#';
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel" ref={panelRef}>
      <div className="notification-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read-btn">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="notification-loading">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(notification => (
            <Link
              key={notification._id}
              to={getNotificationLink(notification)}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => {
                if (!notification.read) markAsRead(notification._id);
                onClose();
              }}
            >
              {notification.thumbnailUrl && (
                <img 
                  src={notification.thumbnailUrl} 
                  alt="" 
                  className="notification-thumbnail"
                />
              )}
              {notification.creatorId?.avatarUrl && !notification.thumbnailUrl && (
                <img 
                  src={notification.creatorId.avatarUrl} 
                  alt="" 
                  className="notification-avatar"
                />
              )}
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
              </div>
              {!notification.read && <div className="unread-indicator"></div>}
              <button
                className="notification-delete"
                onClick={(e) => deleteNotification(notification._id, e)}
                title="Delete notification"
              >
                ×
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
