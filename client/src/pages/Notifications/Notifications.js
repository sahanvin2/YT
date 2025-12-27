import React, { useState, useEffect } from 'react';
import { FiBell, FiTrash2, FiCheckCircle, FiFilter } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      console.log('🔔 New notification on page:', data);
      // Add new notification to the top of the list
      setNotifications(prev => [data.notification, ...prev]);
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/system-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/system-notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const unreadNotifications = notifications.filter(n => !n.readBy?.includes(userId));
      
      await Promise.all(
        unreadNotifications.map(n => 
          axios.patch(`/api/system-notifications/${n._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/system-notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: '💡',
      warning: '⚠️',
      success: '✅',
      error: '❌',
      announcement: '📢',
      update: '🔄'
    };
    return icons[type] || '📬';
  };

  const formatDate = (date) => {
    const notifDate = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - notifDate) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return notifDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: notifDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const userId = localStorage.getItem('userId');
  const filteredNotifications = notifications.filter(notif => {
    // Filter by read status
    if (filter === 'unread' && notif.readBy?.includes(userId)) return false;
    if (filter === 'read' && !notif.readBy?.includes(userId)) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.readBy?.includes(userId)).length;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="notifications-title">
            <FiBell size={28} />
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>

          <div className="notifications-actions">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read-btn">
                <FiCheckCircle /> Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="notifications-filters">
          <div className="filter-group">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button 
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>

          <div className="type-filter">
            <FiFilter />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="type-select"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="announcement">Announcement</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="update">Update</option>
            </select>
          </div>
        </div>

        <div className="notifications-list">
          {loading ? (
            <div className="notifications-loading">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notifications-empty">
              <FiBell size={64} />
              <h2>No notifications</h2>
              <p>
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : typeFilter !== 'all'
                  ? `No ${typeFilter} notifications`
                  : "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isRead = notif.readBy?.includes(userId);
              return (
                <div
                  key={notif._id}
                  className={`notification-card ${isRead ? 'read' : 'unread'}`}
                >
                  <div 
                    className="notification-main"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notification-icon-large">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notification-body">
                      <div className="notification-header-row">
                        <h3 className="notification-card-title">{notif.title}</h3>
                        <div className="notification-badges">
                          {notif.priority === 'high' && (
                            <span className="priority-badge">High Priority</span>
                          )}
                          <span className={`type-badge ${notif.type}`}>
                            {notif.type}
                          </span>
                        </div>
                      </div>
                      <p className="notification-card-message">{notif.message}</p>
                      <div className="notification-meta">
                        <span className="notification-date">{formatDate(notif.createdAt)}</span>
                        {notif.expiresAt && (
                          <span className="notification-expires">
                            Expires: {new Date(notif.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="notification-card-actions">
                    {!isRead && (
                      <button 
                        onClick={() => markAsRead(notif._id)}
                        className="action-btn mark-read"
                        title="Mark as read"
                      >
                        <FiCheckCircle />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notif._id)}
                      className="action-btn delete"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
