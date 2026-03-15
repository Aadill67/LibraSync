import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Skeleton,
  Alert,
  Autocomplete,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import { Add, AssignmentReturn, Search, FileDownload, MonetizationOn } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Issue book dialog
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueData, setIssueData] = useState({
    bookId: '',
    borrowerId: '',
    bookName: '',
    borrowerName: '',
    toDate: '',
  });
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');

  const isStaff = user?.role === 'admin' || user?.role === 'librarian';

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, booksRes] = await Promise.all([
        API.get('/transactions/all-transactions'),
        API.get('/books/allbooks?limit=100'),
      ]);
      setTransactions(transRes.data);
      setBooks(booksRes.data.books || []);

      if (isStaff) {
        const membersRes = await API.get('/users/allmembers');
        setMembers(membersRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueBook = async () => {
    if (!issueData.bookId || !issueData.borrowerId || !issueData.toDate) {
      setIssueError('Please fill in all required fields');
      return;
    }
    setIssueLoading(true);
    setIssueError('');
    try {
      await API.post('/transactions/add-transaction', {
        ...issueData,
        fromDate: new Date().toISOString(),
        transactionType: 'issued',
      });
      setIssueOpen(false);
      setIssueData({ bookId: '', borrowerId: '', bookName: '', borrowerName: '', toDate: '' });
      setSuccess('Book issued successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setIssueError(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleReturnBook = async (transactionId) => {
    try {
      const res = await API.put(`/transactions/return/${transactionId}`);
      setSuccess(
        res.data.fineAmount > 0
          ? `Book returned. Fine: ₹${res.data.fineAmount}`
          : 'Book returned successfully!'
      );
      setTimeout(() => setSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return book');
    }
  };

  const handleCollectFine = async (transactionId) => {
    try {
      await API.put(`/transactions/pay-fine/${transactionId}`);
      setSuccess('Fine collected successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to collect fine');
    }
  };

  const isOverdue = (toDate, status) => {
    return status === 'active' && new Date(toDate) < new Date();
  };

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    const matchSearch =
      !search ||
      t.bookName?.toLowerCase().includes(search.toLowerCase()) ||
      t.borrowerName?.toLowerCase().includes(search.toLowerCase());
    const overdue = isOverdue(t.toDate, t.transactionStatus);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'overdue' && overdue) ||
      (statusFilter === 'active' && t.transactionStatus === 'active' && !overdue) ||
      (statusFilter === 'completed' && t.transactionStatus === 'completed');
    return matchSearch && matchStatus;
  });

  const paginatedTxns = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const exportCSV = () => {
    const headers = ['Book', 'Borrower', 'Type', 'Issued', 'Due Date', 'Status', 'Fine'];
    const rows = filtered.map((t) => [
      t.bookName,
      t.borrowerName,
      t.transactionType,
      new Date(t.fromDate).toLocaleDateString(),
      new Date(t.toDate).toLocaleDateString(),
      isOverdue(t.toDate, t.transactionStatus) ? 'Overdue' : t.transactionStatus,
      t.calculatedFine || t.fineAmount || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatedPage>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Transactions
          </Typography>
          {isStaff && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => { setIssueError(''); setIssueOpen(true); }}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                }}
              >
                Issue Book
              </Button>
            </motion.div>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {success}
            </Alert>
          </motion.div>
        )}

        {/* Filters bar */}
        <Card sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search by book or borrower..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {['all', 'active', 'overdue', 'completed'].map((s) => (
                <Chip
                  key={s}
                  label={s.charAt(0).toUpperCase() + s.slice(1)}
                  onClick={() => { setStatusFilter(s); setPage(0); }}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    backgroundColor: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: statusFilter === s ? '#818cf8' : 'text.secondary',
                    border: `1px solid ${statusFilter === s ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.15)'}`,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
            {isStaff && (
              <Button
                size="small"
                startIcon={<FileDownload sx={{ fontSize: 16 }} />}
                onClick={exportCSV}
                sx={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}
              >
                Export CSV
              </Button>
            )}
          </Box>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Issued</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Fine</TableCell>
                  {isStaff && <TableCell align="center">Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(isStaff ? 8 : 7)].map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  paginatedTxns.map((t, index) => {
                    const overdue = isOverdue(t.toDate, t.transactionStatus);
                    return (
                      <motion.tr
                        key={t._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        style={{
                          display: 'table-row',
                          backgroundColor: overdue ? 'rgba(239,68,68,0.04)' : undefined,
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
                        <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                          {new Date(t.fromDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: '0.85rem',
                            color: overdue ? '#f87171' : 'text.secondary',
                            fontWeight: overdue ? 600 : 400,
                          }}
                        >
                          {new Date(t.toDate).toLocaleDateString()}
                          {overdue && ' ⚠️'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={overdue ? 'overdue' : t.transactionStatus}
                            size="small"
                            sx={{
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              backgroundColor: overdue
                                ? 'rgba(239,68,68,0.15)'
                                : t.transactionStatus === 'active'
                                ? 'rgba(99,102,241,0.15)'
                                : 'rgba(16,185,129,0.15)',
                              color: overdue
                                ? '#f87171'
                                : t.transactionStatus === 'active'
                                ? '#818cf8'
                                : '#34d399',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const fine = t.calculatedFine || t.fineAmount || 0;
                            return fine > 0 ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>
                                  ₹{fine}
                                </Typography>
                                {t.finePaid && (
                                  <Chip
                                    label="Paid"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.6rem',
                                      fontWeight: 700,
                                      backgroundColor: 'rgba(16,185,129,0.15)',
                                      color: '#34d399',
                                    }}
                                  />
                                )}
                              </Box>
                            ) : (
                              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                —
                              </Typography>
                            );
                          })()}
                        </TableCell>
                        {isStaff && (
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {t.transactionStatus === 'active' && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<AssignmentReturn sx={{ fontSize: 16 }} />}
                                    onClick={() => handleReturnBook(t._id)}
                                    sx={{
                                      borderColor: overdue ? '#ef4444' : '#6366f1',
                                      color: overdue ? '#f87171' : '#818cf8',
                                      fontSize: '0.75rem',
                                      py: 0.4,
                                      '&:hover': {
                                        borderColor: overdue ? '#dc2626' : '#4f46e5',
                                        backgroundColor: overdue
                                          ? 'rgba(239,68,68,0.08)'
                                          : 'rgba(99,102,241,0.08)',
                                      },
                                    }}
                                  >
                                    Return
                                  </Button>
                                </motion.div>
                              )}
                              {(t.fineAmount > 0 || t.calculatedFine > 0) && !t.finePaid && t.transactionStatus === 'completed' && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<MonetizationOn sx={{ fontSize: 16 }} />}
                                    onClick={() => handleCollectFine(t._id)}
                                    sx={{
                                      borderColor: '#f59e0b',
                                      color: '#fbbf24',
                                      fontSize: '0.75rem',
                                      py: 0.4,
                                      '&:hover': {
                                        borderColor: '#d97706',
                                        backgroundColor: 'rgba(245,158,11,0.08)',
                                      },
                                    }}
                                  >
                                    Collect Fine
                                  </Button>
                                </motion.div>
                              )}
                            </Box>
                          </TableCell>
                        )}
                      </motion.tr>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isStaff ? 8 : 7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                      No transactions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filtered.length > 0 && (
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}
            />
          )}
        </Card>

        {/* Issue Book Dialog */}
        <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>Issue Book</DialogTitle>
          <DialogContent>
            {issueError && (
              <Alert severity="error" sx={{ mb: 2, mt: 1, borderRadius: 2 }}>
                {issueError}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={12}>
                <Autocomplete
                  options={books.filter((b) => b.bookCountAvailable > 0)}
                  getOptionLabel={(option) => `${option.bookName} — ${option.author}`}
                  onChange={(_, value) => {
                    setIssueData({
                      ...issueData,
                      bookId: value?._id || '',
                      bookName: value?.bookName || '',
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Book" required />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => `${option.userFullName} (${option.email})`}
                  onChange={(_, value) => {
                    setIssueData({
                      ...issueData,
                      borrowerId: value?._id || '',
                      borrowerName: value?.userFullName || '',
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Member" required />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={issueData.toDate}
                  onChange={(e) => setIssueData({ ...issueData, toDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIssueOpen(false)} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleIssueBook}
              disabled={issueLoading}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
              }}
            >
              {issueLoading ? 'Issuing...' : 'Issue Book'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AnimatedPage>
  );
};

export default Transactions;
