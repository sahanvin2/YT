import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      console.log('🔔 New notification received:', data);
      // Play sound or show browser notification
      if (Notification.permission === 'granted') {
        new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/logo192.png',
          badge: '/logo192.png'
        });
      }
      
      // Update unread count
      fetchUnreadCount();
      
      // If dropdown is open, refresh notifications
      if (showDropdown) {
        fetchNotifications();
      }
      
      // Show toast notification (optional)
      showToast(data.notification.title);
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket, showDropdown]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showToast = (message) => {
    // Simple toast - you can use a library like react-toastify
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#007bff;color:white;padding:12px 20px;border-radius:8px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await axios.get('/api/system-notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/system-notifications?limit=5', {
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
      fetchUnreadCount();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
    }
    setShowDropdown(false);
  };

  const viewAllNotifications = () => {
    setShowDropdown(false);
    navigate('/notifications');
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
    const now = new Date();
    const notifDate = new Date(date);
    const diff = Math.floor((now - notifDate) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className="unread-count-text">{unreadCount} unread</span>
            )}
          </div>

          <div className="notification-dropdown-body">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <FiBell size={40} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${notif.readBy?.includes(localStorage.getItem('userId')) ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">{formatDate(notif.createdAt)}</div>
                  </div>
                  {notif.priority === 'high' && (
                    <div className="notification-priority">!</div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button onClick={viewAllNotifications} className="view-all-btn">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
