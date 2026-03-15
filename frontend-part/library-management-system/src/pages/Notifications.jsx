import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, IconButton, Chip, Badge, Tooltip,
  Button, Skeleton, Divider, Alert, Tab, Tabs, Avatar,
} from '@mui/material';
import {
  NotificationsActive, MarkEmailRead, Delete, Circle,
  MenuBook, Warning, Info, LocalOffer, CheckCircle, Refresh,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';

const typeConfig = {
  overdue: { icon: <Warning />, color: '#ef4444', label: 'Overdue' },
  fine: { icon: <LocalOffer />, color: '#f59e0b', label: 'Fine' },
  issue: { icon: <MenuBook />, color: '#6366f1', label: 'Issued' },
  return: { icon: <CheckCircle />, color: '#10b981', label: 'Returned' },
  reservation: { icon: <MenuBook />, color: '#8b5cf6', label: 'Reservation' },
  info: { icon: <Info />, color: '#3b82f6', label: 'Info' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState(0); // 0=all, 1=unread

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/notifications?unreadOnly=${tab === 1}`);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    await API.put(`/notifications/read/${id}`);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await API.put('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id) => {
    await API.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchNotifications}><Refresh /></IconButton>
          </Tooltip>
          {unreadCount > 0 && (
            <Button
              startIcon={<MarkEmailRead />}
              onClick={markAllRead}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Mark All Read
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`All (${notifications.length})`} />
        <Tab label={`Unread (${unreadCount})`} />
      </Tabs>

      {/* List */}
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 1.5 }} />
        ))
      ) : notifications.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {tab === 1 ? 'No unread notifications' : 'No notifications yet'}
        </Alert>
      ) : (
        <AnimatePresence>
          {notifications.map((n, i) => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  sx={{
                    mb: 1.5, p: 2, display: 'flex', alignItems: 'center', gap: 2,
                    border: n.read ? '1px solid transparent' : `1px solid ${cfg.color}30`,
                    background: n.read ? undefined : `${cfg.color}08`,
                    cursor: n.link ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateX(4px)' },
                  }}
                  onClick={() => n.link && (window.location.href = n.link)}
                >
                  <Avatar sx={{ bgcolor: `${cfg.color}20`, color: cfg.color, width: 44, height: 44 }}>
                    {cfg.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {n.title}
                      </Typography>
                      <Chip label={cfg.label} size="small" sx={{ bgcolor: `${cfg.color}15`, color: cfg.color, height: 20, fontSize: '0.7rem' }} />
                      {!n.read && <Circle sx={{ fontSize: 8, color: cfg.color }} />}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                      {timeAgo(n.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {!n.read && (
                      <Tooltip title="Mark as read">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); markRead(n._id); }}>
                          <MarkEmailRead fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </Box>
  );
};

export default Notifications;
