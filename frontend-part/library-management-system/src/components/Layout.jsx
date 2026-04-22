import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MenuBook,
  People,
  ReceiptLong,
  Person,
  Logout,
  Menu as MenuIcon,
  LocalLibrary,
  Category,
  NotificationsNone,
  LibraryBooks,
  DarkMode,
  LightMode,
  Assessment,
  CalendarMonth,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import API from '../api/axios';
import { getServerFileUrl } from '../api/config';

const DRAWER_WIDTH = 270;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Books', icon: <MenuBook />, path: '/books' },
  { text: 'Categories', icon: <Category />, path: '/categories' },
  { text: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
  { text: 'My Borrows', icon: <LibraryBooks />, path: '/my-borrows', memberOnly: true },
  { text: 'Members', icon: <People />, path: '/members', staffOnly: true },
  { text: 'Transactions', icon: <ReceiptLong />, path: '/transactions', staffOnly: true },
  { text: 'Reports', icon: <Assessment />, path: '/reports', staffOnly: true },
  { text: 'Audit Log', icon: <Assessment />, path: '/audit', staffOnly: true },
  { text: 'Notifications', icon: <NotificationsNone />, path: '/notifications' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
  { text: 'Admin Settings', icon: <AdminPanelSettings />, path: '/admin/settings', adminOnly: true },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Build profile photo URL
  const profilePhotoUrl = getServerFileUrl(user?.photo);

  // Fetch unread notification count
  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await API.get('/notifications?unreadOnly=true&limit=1');
      setUnreadCount(data.unreadCount || 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LocalLibrary sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
            LibraSync
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Library Management
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.1 }} />

      {/* Navigation */}
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          // Role-based visibility
          if (item.staffOnly && user?.role === 'member') return null;
          if (item.memberOnly && user?.role !== 'member') return null;
          if (item.adminOnly && user?.role !== 'admin') return null;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.1) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(236,72,153,0.15) 100%)'
                      : 'rgba(99,102,241,0.08)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#818cf8' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                    color: isActive ? 'text.primary' : 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User info at bottom */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
            <Avatar
              src={profilePhotoUrl}
              sx={{
                width: 36,
                height: 36,
                background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {!profilePhotoUrl && (user?.userFullName?.charAt(0)?.toUpperCase() || 'U')}
            </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {user?.userFullName || 'User'}
            </Typography>
            <Chip
              label={user?.role || 'member'}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: 'rgba(99,102,241,0.2)',
                color: '#818cf8',
              }}
            />
          </Box>
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: '#94a3b8',
                '&:hover': { color: '#f87171', backgroundColor: 'rgba(239,68,68,0.1)' },
              }}
            >
              <Logout sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: mode === 'dark' ? '#0f172a' : '#f8fafc',
            borderRight: `1px solid ${mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)'}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)'}`,
            color: mode === 'dark' ? '#f1f5f9' : '#0f172a',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* Notification bell */}
              <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No new notifications'}>
                <IconButton
                  onClick={() => navigate('/notifications')}
                  sx={{ color: unreadCount > 0 ? '#f87171' : 'text.secondary' }}
                >
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.65rem',
                        minWidth: 18,
                        height: 18,
                      },
                    }}
                  >
                    <NotificationsNone sx={{ fontSize: 22 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Theme toggle */}
              <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                  {mode === 'dark' ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
                </IconButton>
              </Tooltip>

              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                src={profilePhotoUrl}
                sx={{
                  width: 34,
                  height: 34,
                  background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {!profilePhotoUrl && (user?.userFullName?.charAt(0)?.toUpperCase() || 'U')}
              </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    mt: 1,
                    backgroundColor: 'background.paper',
                    border: `1px solid ${mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.08)'}`,
                    minWidth: 180,
                  },
                }}
              >
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                  <Person sx={{ mr: 1, fontSize: 20 }} /> Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                  <Logout sx={{ mr: 1, fontSize: 20 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
