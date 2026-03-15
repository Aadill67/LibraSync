import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Chip, Avatar, TextField,
  MenuItem, Skeleton, Tooltip, IconButton, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
} from '@mui/material';
import {
  Assessment, FilterList, Refresh, Login, PersonAdd,
  MenuBook, AssignmentReturn, BookmarkAdd, BookmarkRemove,
  Add, Edit, Delete, Upload, Download, Backup, Restore,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import API from '../api/axios';

const actionConfig = {
  login: { icon: <Login />, color: '#3b82f6', label: 'Login' },
  register: { icon: <PersonAdd />, color: '#8b5cf6', label: 'Register' },
  issue_book: { icon: <MenuBook />, color: '#6366f1', label: 'Issue' },
  return_book: { icon: <AssignmentReturn />, color: '#10b981', label: 'Return' },
  reserve_book: { icon: <BookmarkAdd />, color: '#f59e0b', label: 'Reserve' },
  cancel_reservation: { icon: <BookmarkRemove />, color: '#ef4444', label: 'Cancel' },
  add_book: { icon: <Add />, color: '#10b981', label: 'Add Book' },
  edit_book: { icon: <Edit />, color: '#3b82f6', label: 'Edit Book' },
  delete_book: { icon: <Delete />, color: '#ef4444', label: 'Delete Book' },
  import_books: { icon: <Upload />, color: '#8b5cf6', label: 'Import' },
  export_books: { icon: <Download />, color: '#6366f1', label: 'Export' },
  upload_photo: { icon: <Upload />, color: '#f59e0b', label: 'Photo' },
  backup: { icon: <Backup />, color: '#10b981', label: 'Backup' },
  restore: { icon: <Restore />, color: '#ef4444', label: 'Restore' },
  generate_card: { icon: <Download />, color: '#3b82f6', label: 'Card' },
};

const AuditDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ stats: [], todayCount: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (actionFilter) params.action = actionFilter;
      const [logsRes, statsRes] = await Promise.all([
        API.get('/activity-log', { params }),
        API.get('/activity-log/stats'),
      ]);
      setLogs(logsRes.data.logs || []);
      setTotal(logsRes.data.total || 0);
      setStats(statsRes.data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, rowsPerPage, actionFilter]);

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Audit Dashboard</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Activity log & system audit trail</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            select size="small" label="Filter Action" value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            <MenuItem value="">All Actions</MenuItem>
            {Object.entries(actionConfig).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
            ))}
          </TextField>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLogs}><Refresh /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ p: 2.5, textAlign: 'center', borderRadius: 2.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>{total}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Activities</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ p: 2.5, textAlign: 'center', borderRadius: 2.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>{stats.todayCount}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Today</Typography>
          </Card>
        </Grid>
        {stats.stats?.slice(0, 2).map((s) => {
          const cfg = actionConfig[s._id] || { label: s._id, color: '#6366f1' };
          return (
            <Grid size={{ xs: 6, md: 3 }} key={s._id}>
              <Card sx={{ p: 2.5, textAlign: 'center', borderRadius: 2.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: cfg.color }}>{s.count}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{cfg.label}</Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Activity Table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={56} sx={{ m: 0.3 }} />
          ))
        ) : logs.length === 0 ? (
          <Alert severity="info" sx={{ m: 2, borderRadius: 2 }}>No activity logs found</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, i) => {
                    const cfg = actionConfig[log.action] || { icon: <Assessment />, color: '#6366f1', label: log.action };
                    return (
                      <TableRow key={log._id} component={motion.tr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: `${cfg.color}15`, color: cfg.color }}>
                              {cfg.icon}
                            </Avatar>
                            <Chip label={cfg.label} size="small" sx={{ bgcolor: `${cfg.color}15`, color: cfg.color, fontSize: '0.75rem' }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.userName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={new Date(log.createdAt).toLocaleString()}>
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {timeAgo(log.createdAt)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={total} page={page} rowsPerPage={rowsPerPage}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>
    </Box>
  );
};

export default AuditDashboard;
