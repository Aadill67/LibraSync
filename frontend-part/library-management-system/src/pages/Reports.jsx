import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Skeleton,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalanceWallet,
  CalendarMonth,
  Speed,
  Autorenew,
  FileDownload,
  BarChart as BarChartIcon,
  PictureAsPdf,
  Print,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#f87171', '#34d399', '#fbbf24', '#818cf8'];
const STATUS_COLORS = { active: '#6366f1', completed: '#10b981', reserved: '#f59e0b', overdue: '#ef4444' };
const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 2,
        p: 1.5,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Typography key={i} variant="body2" sx={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </Typography>
      ))}
    </Box>
  );
};

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await API.get('/transactions/reports');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const monthlyData = (data?.monthlyTransactions || []).map((item) => ({
    month: `${monthNames[item._id.month]} ${String(item._id.year).slice(-2)}`,
    transactions: item.count,
  }));

  const topBooksData = (data?.topBooks || []).map((item) => ({
    name: item._id.length > 20 ? item._id.substring(0, 20) + '…' : item._id,
    fullName: item._id,
    borrows: item.count,
  }));

  const categoryData = (data?.categoryDistribution || []).map((item) => ({
    name: item.name,
    value: item.count,
  }));

  const statusData = (() => {
    const raw = (data?.statusBreakdown || []).map((s) => ({
      name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      value: s.count,
      color: STATUS_COLORS[s._id] || '#64748b',
    }));
    if (data?.overdueCount > 0) {
      // Find active and subtract overdue from it
      const activeItem = raw.find((r) => r.name === 'Active');
      if (activeItem) activeItem.value = Math.max(activeItem.value - data.overdueCount, 0);
      raw.push({ name: 'Overdue', value: data.overdueCount, color: STATUS_COLORS.overdue });
    }
    return raw;
  })();

  const memberData = (data?.memberGrowth || []).map((item) => ({
    month: `${monthNames[item._id.month]}`,
    members: item.count,
  }));

  const s = data?.summary || {};
  const f = data?.fineStats || {};

  const statCards = [
    {
      label: 'Total Fines Collected',
      value: `₹${f.totalFinesCollected || 0}`,
      sub: `${f.count || 0} transactions with fines`,
      icon: <AccountBalanceWallet />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadow: 'rgba(245,87,108,0.35)',
    },
    {
      label: 'Busiest Month',
      value: s.busiestMonth || 'N/A',
      sub: `Out of ${(data?.monthlyTransactions || []).length} months tracked`,
      icon: <CalendarMonth />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      shadow: 'rgba(79,172,254,0.35)',
    },
    {
      label: 'Return Rate',
      value: `${s.returnRate || 0}%`,
      sub: `${s.completedTransactions || 0} of ${s.totalTransactions || 0} returned`,
      icon: <Autorenew />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadow: 'rgba(17,153,142,0.35)',
    },
    {
      label: 'Avg Books / Member',
      value: s.totalMembers > 0 ? (s.totalTransactions / s.totalMembers).toFixed(1) : '0',
      sub: `${s.totalMembers || 0} registered members`,
      icon: <Speed />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: 'rgba(102,126,234,0.35)',
    },
  ];

  const exportReport = () => {
    if (!data) return;
    const lines = [
      'LibraSync — Reports Summary',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Total Books: ${s.totalBooks}`,
      `Total Members: ${s.totalMembers}`,
      `Total Transactions: ${s.totalTransactions}`,
      `Active Transactions: ${s.activeTransactions}`,
      `Completed: ${s.completedTransactions}`,
      `Return Rate: ${s.returnRate}%`,
      `Busiest Month: ${s.busiestMonth || 'N/A'}`,
      '',
      `Total Fines Collected: ₹${f.totalFinesCollected || 0}`,
      `Average Fine: ₹${Math.round(f.avgFine || 0)}`,
      `Highest Fine: ₹${f.maxFine || 0}`,
      '',
      '--- Top Borrowed Books ---',
      ...(data.topBooks || []).map((b, i) => `${i + 1}. ${b._id} (${b.count} borrows)`),
      '',
      '--- Category Distribution ---',
      ...(data.categoryDistribution || []).map((c) => `${c.name}: ${c.count} books`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `librasync_report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const content = document.getElementById('reports-content');
      if (!content) return;
      const canvas = await html2canvas(content, { scale: 1.5, backgroundColor: '#0f172a', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let yPos = 10;
      if (imgH <= pageH - 20) {
        pdf.addImage(imgData, 'PNG', 10, yPos, imgW, imgH);
      } else {
        // Multi-page
        let remaining = imgH;
        let srcY = 0;
        while (remaining > 0) {
          const sliceH = Math.min(remaining, pageH - 20);
          pdf.addImage(imgData, 'PNG', 10, yPos, imgW, imgH, undefined, 'FAST', 0);
          remaining -= sliceH;
          srcY += sliceH;
          if (remaining > 0) pdf.addPage();
        }
      }
      pdf.save(`LibraSync_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch {
      // silent fail
    } finally {
      setExportingPdf(false);
    }
  };

  if (error) {
    return (
      <AnimatedPage>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box id="reports-content">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Reports & Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
              Comprehensive insights into your library operations
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => window.print()}
                disabled={loading}
                sx={{
                  borderColor: 'rgba(148,163,184,0.3)', color: '#94a3b8',
                  '&:hover': { borderColor: '#818cf8', color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.08)' },
                }}
              >
                Print
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outlined"
                startIcon={exportingPdf ? null : <PictureAsPdf />}
                onClick={exportPdf}
                disabled={loading || exportingPdf}
                sx={{
                  borderColor: 'rgba(239,68,68,0.4)', color: '#f87171',
                  '&:hover': { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' },
                }}
              >
                {exportingPdf ? 'Generating...' : 'PDF'}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="contained"
                startIcon={<FileDownload />}
                onClick={exportReport}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                }}
              >
                Export
              </Button>
            </motion.div>
          </Box>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {statCards.map((card, i) => (
            <Grid size={{ xs: 6, sm: 6, lg: 3 }} key={card.label}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.03, y: -3 }}
              >
                <Card
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    background: card.gradient,
                    border: 'none',
                    borderRadius: 3,
                    boxShadow: `0 8px 28px ${card.shadow}`,
                    height: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, display: 'block', mb: 0.5 }}>
                        {card.label}
                      </Typography>
                      {loading ? (
                        <Skeleton width={80} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                      ) : (
                        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '1.3rem', md: '1.6rem' } }}>
                          {card.value}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mt: 0.5, fontSize: '0.68rem' }}>
                        {card.sub}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
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

        {/* Charts Row 1: Monthly Trend + Status Breakdown */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Monthly Transaction Trend
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Last 12 months
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ color: '#6366f1', fontSize: 20 }} />
                </Box>
                {loading ? (
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                ) : monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="transactions"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="url(#reportGrad)"
                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'text.secondary' }}>
                    <Typography>No transaction data available</Typography>
                  </Box>
                )}
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Transaction Status
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Current breakdown
                </Typography>
                {loading ? (
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mt: 1 }} />
                ) : statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                        formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'text.secondary' }}>
                    <Typography>No data</Typography>
                  </Box>
                )}
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Charts Row 2: Top Books + Category Distribution */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <Card sx={{ p: 3, height: 420 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Top Borrowed Books
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Most popular titles
                    </Typography>
                  </Box>
                  <BarChartIcon sx={{ color: '#ec4899', fontSize: 20 }} />
                </Box>
                {loading ? (
                  <Skeleton variant="rectangular" height={330} sx={{ borderRadius: 2 }} />
                ) : topBooksData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={330}>
                    <BarChart data={topBooksData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                      <YAxis type="category" dataKey="name" width={140} stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} />
                      <Tooltip
                        content={<CustomTooltip />}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      />
                      <Bar
                        dataKey="borrows"
                        radius={[0, 6, 6, 0]}
                        barSize={22}
                      >
                        {topBooksData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 330, color: 'text.secondary' }}>
                    <Typography>No borrow data yet</Typography>
                  </Box>
                )}
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <Card sx={{ p: 3, height: 420 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Category Distribution
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Books per genre
                </Typography>
                {loading ? (
                  <Skeleton variant="rectangular" height={330} sx={{ borderRadius: 2, mt: 1 }} />
                ) : categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={{ stroke: '#64748b' }}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 330, color: 'text.secondary' }}>
                    <Typography>No category data</Typography>
                  </Box>
                )}
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Charts Row 3: Member Growth + Fine Summary */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
              <Card sx={{ p: 3, height: 350 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Member Growth
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      New registrations (last 6 months)
                    </Typography>
                  </Box>
                </Box>
                {loading ? (
                  <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
                ) : memberData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={memberData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="members" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35}>
                        {memberData.map((_, index) => (
                          <Cell key={index} fill={index === memberData.length - 1 ? '#10b981' : '#065f46'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250, color: 'text.secondary' }}>
                    <Typography>No recent member registrations</Typography>
                  </Box>
                )}
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
              <Card sx={{ p: 3, height: 350 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Fine Collection Summary
                </Typography>
                {loading ? (
                  <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
                ) : (
                  <Grid container spacing={2}>
                    {[
                      {
                        label: 'Total Collected',
                        value: `₹${f.totalFinesCollected || 0}`,
                        color: '#f87171',
                        bg: 'rgba(239,68,68,0.1)',
                        border: 'rgba(239,68,68,0.2)',
                      },
                      {
                        label: 'Average Fine',
                        value: `₹${Math.round(f.avgFine || 0)}`,
                        color: '#fbbf24',
                        bg: 'rgba(245,158,11,0.1)',
                        border: 'rgba(245,158,11,0.2)',
                      },
                      {
                        label: 'Highest Fine',
                        value: `₹${f.maxFine || 0}`,
                        color: '#ec4899',
                        bg: 'rgba(236,72,153,0.1)',
                        border: 'rgba(236,72,153,0.2)',
                      },
                      {
                        label: 'Fined Transactions',
                        value: f.count || 0,
                        color: '#818cf8',
                        bg: 'rgba(99,102,241,0.1)',
                        border: 'rgba(99,102,241,0.2)',
                      },
                    ].map((item, i) => (
                      <Grid size={6} key={item.label}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 + i * 0.08 }}
                        >
                          <Box
                            sx={{
                              p: 2.5,
                              borderRadius: 2.5,
                              backgroundColor: item.bg,
                              border: `1px solid ${item.border}`,
                              textAlign: 'center',
                            }}
                          >
                            <Typography
                              variant="h4"
                              sx={{ fontWeight: 800, color: item.color, mb: 0.5, fontSize: { xs: '1.3rem', md: '1.6rem' } }}
                            >
                              {item.value}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              {item.label}
                            </Typography>
                          </Box>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </AnimatedPage>
  );
};

export default Reports;
