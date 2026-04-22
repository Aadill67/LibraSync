import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Alert,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MenuBook,
  People,
  ReceiptLong,
  Warning,
  Add,
  TrendingUp,
  AccessTime,
  CalendarToday,
  ArrowForward,
  Star,
  AutoAwesome,
} from '@mui/icons-material';
import EventSeat from '@mui/icons-material/EventSeat';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';
import { getServerFileUrl } from '../api/config';
import { useAuth } from '../context/AuthContext';

const statCardData = [
  {
    key: 'totalBooks',
    label: 'Total Books',
    icon: <MenuBook />,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadow: 'rgba(102,126,234,0.4)',
  },
  {
    key: 'totalMembers',
    label: 'Total Members',
    icon: <People />,
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    shadow: 'rgba(17,153,142,0.4)',
  },
  {
    key: 'activeTransactions',
    label: 'Books Issued',
    icon: <ReceiptLong />,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    shadow: 'rgba(79,172,254,0.4)',
  },
  {
    key: 'overdueCount',
    label: 'Overdue Books',
    icon: <Warning />,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    shadow: 'rgba(245,87,108,0.4)',
  },
  {
    key: 'pendingReservations',
    label: 'Reservations',
    icon: <EventSeat />,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    shadow: 'rgba(245,158,11,0.4)',
  },
];

const CHART_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isStaff = user?.role === 'admin' || user?.role === 'librarian';
  const profilePhotoUrl = getServerFileUrl(user?.photo);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          API.get('/transactions/all-transactions'),
          API.get('/books/recommendations').catch(() => ({ data: [] })),
        ];
        if (isStaff) {
          requests.unshift(API.get('/transactions/stats'));
          requests.push(API.get('/transactions/overdue'));
        }

        const results = await Promise.all(requests);

        if (isStaff) {
          setStats(results[0].data);
          setRecentTransactions(results[1].data.slice(0, 7));
          setRecommendations(results[2].data || []);
          setOverdueList(results[3].data.slice(0, 5));
        } else {
          setRecentTransactions(results[0].data.slice(0, 7));
          setRecommendations(results[1].data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isStaff]);

  const monthlyData = (stats?.monthlyTransactions || []).map((item) => ({
    month: monthNames[item._id.month] || item._id.month,
    count: item.count,
  }));

  const popularData = (stats?.popularBooks || []).map((item) => ({
    name: item._id.length > 18 ? item._id.substring(0, 18) + '…' : item._id,
    value: item.count,
  }));

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (error) {
    return (
      <AnimatedPage>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box>
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative circle */}
            <Box
              sx={{
                position: 'absolute',
                right: -30,
                top: -30,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.08)',
                display: { xs: 'none', md: 'block' },
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar
                  src={profilePhotoUrl}
                  sx={{
                    width: 52,
                    height: 52,
                    background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                  }}
                >
                  {!profilePhotoUrl && (user?.userFullName?.charAt(0)?.toUpperCase() || 'U')}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {greeting}, {user?.userFullName?.split(' ')[0] || 'User'}! 👋
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                    <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {today}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Quick Actions */}
              {isStaff && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => navigate('/books')}
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                    }}
                  >
                    Add Book
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ReceiptLong />}
                    onClick={() => navigate('/transactions')}
                    sx={{
                      borderColor: 'rgba(99,102,241,0.4)',
                      color: '#818cf8',
                      '&:hover': { borderColor: '#6366f1' },
                    }}
                  >
                    Issue Book
                  </Button>
                  {stats?.overdueCount > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Warning />}
                      onClick={() => navigate('/transactions')}
                      sx={{
                        borderColor: 'rgba(239,68,68,0.4)',
                        color: '#f87171',
                        '&:hover': { borderColor: '#ef4444' },
                      }}
                    >
                      {stats.overdueCount} Overdue
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Card>
        </motion.div>

        {/* Stat Cards */}
        {isStaff && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCardData.map((card, index) => (
              <Grid size={{ xs: 6, sm: 6, lg: 3 }} key={card.key}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                >
                  <Card
                    sx={{
                      p: { xs: 2, md: 3 },
                      background: card.gradient,
                      border: 'none',
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${card.shadow}`,
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, mb: 1, fontSize: { xs: '0.7rem', md: '0.85rem' } }}
                        >
                          {card.label}
                        </Typography>
                        {loading ? (
                          <Skeleton width={60} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                        ) : (
                          <Typography
                            variant="h3"
                            sx={{ color: '#fff', fontWeight: 800, lineHeight: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}
                          >
                            {stats?.[card.key] ?? 0}
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{
                          width: { xs: 36, md: 48 },
                          height: { xs: 36, md: 48 },
                          borderRadius: 2,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {card.icon}
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Charts */}
        {isStaff && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Monthly Transactions */}
            <Grid size={{ xs: 12, md: 7 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Card sx={{ p: 3, height: 380 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Monthly Transactions
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Last 6 months overview
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ color: '#6366f1', fontSize: 20 }} />
                  </Box>
                  {loading ? (
                    <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                  ) : monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={275}>
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: 8,
                            color: '#f1f5f9',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'text.secondary' }}>
                      <Typography>No transaction data yet. Issue some books to see stats!</Typography>
                    </Box>
                  )}
                </Card>
              </motion.div>
            </Grid>

            {/* Popular Books */}
            <Grid size={{ xs: 12, md: 5 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Card sx={{ p: 3, height: 380 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Most Popular Books
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                  ) : popularData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={290}>
                      <PieChart>
                        <Pie
                          data={popularData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {popularData.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: 8,
                            color: '#f1f5f9',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'text.secondary' }}>
                      <Typography>No book data yet</Typography>
                    </Box>
                  )}
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {/* Overdue Alert Cards */}
        {isStaff && overdueList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <Card sx={{ p: 3, mb: 4, border: '1px solid rgba(239,68,68,0.2)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning sx={{ color: '#f87171' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Overdue Alerts
                  </Typography>
                </Box>
                <Chip
                  label={`${overdueList.length} overdue`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    color: '#f87171',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Grid container spacing={2}>
                {overdueList.map((t, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t._id}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(239,68,68,0.05)',
                          border: '1px solid rgba(239,68,68,0.12)',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {t.bookName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Borrower: {t.borrowerName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                          <AccessTime sx={{ fontSize: 14, color: '#f87171' }} />
                          <Typography variant="caption" sx={{ color: '#f87171', fontWeight: 600 }}>
                            Due: {new Date(t.toDate).toLocaleDateString()}
                          </Typography>
                          {t.calculatedFine > 0 && (
                            <Chip
                              label={`₹${t.calculatedFine}`}
                              size="small"
                              sx={{
                                ml: 'auto',
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(239,68,68,0.2)',
                                color: '#f87171',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </motion.div>
        )}

        {/* Recent Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Transactions
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                onClick={() => navigate(isStaff ? '/transactions' : '/my-borrows')}
                sx={{ color: '#818cf8' }}
              >
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Book Name</TableCell>
                    <TableCell>Borrower</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(5)].map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : recentTransactions.length > 0 ? (
                    recentTransactions.map((t) => (
                      <TableRow
                        key={t._id}
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' },
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{t.bookName}</TableCell>
                        <TableCell>{t.borrowerName}</TableCell>
                        <TableCell>
                          <Chip
                            label={t.transactionType}
                            size="small"
                            sx={{
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              backgroundColor:
                                t.transactionType === 'issued'
                                  ? 'rgba(99,102,241,0.15)'
                                  : t.transactionType === 'returned'
                                  ? 'rgba(16,185,129,0.15)'
                                  : 'rgba(245,158,11,0.15)',
                              color:
                                t.transactionType === 'issued'
                                  ? '#818cf8'
                                  : t.transactionType === 'returned'
                                  ? '#34d399'
                                  : '#fbbf24',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {t.toDate ? new Date(t.toDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.transactionStatus}
                            size="small"
                            sx={{
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              backgroundColor:
                                t.transactionStatus === 'active'
                                  ? 'rgba(99,102,241,0.15)'
                                  : t.transactionStatus === 'completed'
                                  ? 'rgba(16,185,129,0.15)'
                                  : 'rgba(239,68,68,0.15)',
                              color:
                                t.transactionStatus === 'active'
                                  ? '#818cf8'
                                  : t.transactionStatus === 'completed'
                                  ? '#34d399'
                                  : '#f87171',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        No transactions yet. Start by issuing a book!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>

        {/* ─── Recommended For You ─── */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recommended For You
                  </Typography>
                </Box>
                <Button
                  size="small" endIcon={<ArrowForward />}
                  onClick={() => navigate('/books')}
                  sx={{ color: '#818cf8' }}
                >
                  View All
                </Button>
              </Box>
              <Box
                sx={{
                  display: 'flex', gap: 2, overflowX: 'auto', pb: 1,
                  scrollSnapType: 'x mandatory',
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(99,102,241,0.3)', borderRadius: 2 },
                }}
              >
                {recommendations.slice(0, 10).map((book, i) => (
                  <motion.div
                    key={book._id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                  >
                    <Card
                      onClick={() => navigate(`/book/${book._id}`)}
                      sx={{
                        width: 160, cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          boxShadow: '0 16px 40px rgba(99,102,241,0.25)',
                          borderColor: 'rgba(99,102,241,0.4)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          height: 180, overflow: 'hidden',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.1))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {book.isbn ? (
                          <Box
                            component="img"
                            src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
                            alt={book.bookName}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#6366f1" opacity="0.3"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg></div>';
                            }}
                          />
                        ) : (
                          <MenuBook sx={{ fontSize: 40, color: '#6366f1', opacity: 0.3 }} />
                        )}
                      </Box>
                      <Box sx={{ p: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, mb: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {book.bookName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {book.author}
                        </Typography>
                        {book.avgRating > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <Star sx={{ fontSize: 14, color: '#fbbf24' }} />
                            <Typography sx={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 600 }}>
                              {book.avgRating.toFixed(1)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Card>
          </motion.div>
        )}
      </Box>
    </AnimatedPage>
  );
};

export default Dashboard;
