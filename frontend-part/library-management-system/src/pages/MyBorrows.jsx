import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
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
  Button,
  IconButton,
} from '@mui/material';
import { LibraryBooks, Warning, BookmarkRemove, FavoriteBorder, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const MyBorrows = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reservations, setReservations] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const fetchMyBorrows = async () => {
      try {
        const res = await API.get('/transactions/all-transactions');
        // Filter transactions for the current user
        const myTxns = res.data.filter(
          (t) => t.borrowerId?._id === user?._id || t.borrowerId === user?._id
        );
        setTransactions(myTxns);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your borrows');
      } finally {
        setLoading(false);
      }
    };
    fetchMyBorrows();
    fetchReservations();
    fetchWishlist();
  }, [user]);

  const fetchReservations = async () => {
    try {
      const res = await API.get('/transactions/my-reservations');
      setReservations(res.data);
    } catch (err) {
      // silently fail - user may not have any
    }
  };

  const cancelReservation = async (id) => {
    try {
      await API.delete(`/transactions/cancel-reservation/${id}`);
      setSuccess('Reservation cancelled!');
      setTimeout(() => setSuccess(''), 3000);
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await API.get('/users/wishlist');
      setWishlist(res.data);
    } catch (err) {
      // silently fail
    }
  };

  const removeFromWishlist = async (bookId) => {
    try {
      await API.delete(`/users/wishlist/${bookId}`);
      setSuccess('Removed from wishlist');
      setTimeout(() => setSuccess(''), 3000);
      fetchWishlist();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove');
    }
  };

  const activeBorrows = transactions.filter((t) => t.transactionStatus === 'active');
  const pastBorrows = transactions.filter((t) => t.transactionStatus === 'completed');
  const totalFines = transactions.reduce((sum, t) => sum + (t.calculatedFine || t.fineAmount || 0), 0);

  const isOverdue = (toDate) => new Date(toDate) < new Date();

  const getDaysUntilDue = (toDate) => {
    const diff = Math.ceil((new Date(toDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <AnimatedPage>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          My Borrows
        </Typography>

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

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            {
              label: 'Active Borrows',
              value: activeBorrows.length,
              color: '#6366f1',
              bg: 'rgba(99,102,241,0.12)',
            },
            {
              label: 'Returned',
              value: pastBorrows.length,
              color: '#10b981',
              bg: 'rgba(16,185,129,0.12)',
            },
            {
              label: 'Total Fines',
              value: `₹${totalFines}`,
              color: totalFines > 0 ? '#f87171' : '#10b981',
              bg: totalFines > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{ flex: 1, minWidth: 160 }}
            >
              <Card
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  background: stat.bg,
                  border: `1px solid ${stat.color}22`,
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </Card>
            </motion.div>
          ))}
        </Box>

        {/* Active Borrows */}
        {activeBorrows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LibraryBooks sx={{ color: '#6366f1' }} /> Currently Borrowed
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Book</TableCell>
                      <TableCell>Borrowed On</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Time Left</TableCell>
                      <TableCell>Fine</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeBorrows.map((t) => {
                      const overdue = isOverdue(t.toDate);
                      const daysLeft = getDaysUntilDue(t.toDate);
                      const totalDays = Math.max(
                        Math.ceil((new Date(t.toDate) - new Date(t.fromDate)) / (1000 * 60 * 60 * 24)),
                        1
                      );
                      const elapsedDays = Math.ceil(
                        (new Date() - new Date(t.fromDate)) / (1000 * 60 * 60 * 24)
                      );
                      const progress = Math.min((elapsedDays / totalDays) * 100, 100);

                      return (
                        <TableRow
                          key={t._id}
                          sx={{
                            backgroundColor: overdue ? 'rgba(239,68,68,0.04)' : undefined,
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>{t.bookName}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                            {new Date(t.fromDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: overdue ? '#f87171' : 'text.secondary',
                              fontWeight: overdue ? 600 : 400,
                              fontSize: '0.85rem',
                            }}
                          >
                            {new Date(t.toDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            {overdue ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Warning sx={{ color: '#f87171', fontSize: 16 }} />
                                <Typography sx={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                                  {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} overdue
                                </Typography>
                              </Box>
                            ) : (
                              <Box>
                                <Typography sx={{ fontSize: '0.8rem', mb: 0.5, color: daysLeft <= 2 ? '#fbbf24' : 'text.secondary' }}>
                                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  sx={{
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(148,163,184,0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 2,
                                      background: progress > 80
                                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                        : 'linear-gradient(90deg, #6366f1, #818cf8)',
                                    },
                                  }}
                                />
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            {(t.calculatedFine || 0) > 0 ? (
                              <Typography sx={{ color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>
                                ₹{t.calculatedFine}
                              </Typography>
                            ) : (
                              <Typography sx={{ color: '#34d399', fontSize: '0.85rem' }}>—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={overdue ? 'Overdue' : 'Active'}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                backgroundColor: overdue ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                                color: overdue ? '#f87171' : '#818cf8',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </motion.div>
        )}

        {/* Past Borrows */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Borrow History
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell>Borrowed</TableCell>
                    <TableCell>Returned</TableCell>
                    <TableCell>Fine</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(4)].map((_, j) => (
                          <TableCell key={j}><Skeleton /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : pastBorrows.length > 0 ? (
                    pastBorrows.map((t) => (
                      <TableRow key={t._id}>
                        <TableCell sx={{ fontWeight: 500 }}>{t.bookName}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          {new Date(t.fromDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          {t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          {(t.calculatedFine || t.fineAmount || 0) > 0 ? (
                            <Typography sx={{ color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>
                              ₹{t.calculatedFine || t.fineAmount}
                            </Typography>
                          ) : (
                            <Chip
                              label="No Fine"
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(16,185,129,0.12)',
                                color: '#34d399',
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        No borrow history yet. Visit the library to borrow a book!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>

        {/* My Reservations */}
        {reservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card sx={{ mt: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  📋 My Reservations ({reservations.length})
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Book</TableCell>
                      <TableCell>Reserved On</TableCell>
                      <TableCell>Hold Expires</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {r.bookId?.bookName || r.bookName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {r.bookId?.author || ''}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {new Date(r.fromDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {new Date(r.toDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.bookId?.bookCountAvailable > 0 ? 'Available Now!' : 'Waiting'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              backgroundColor: r.bookId?.bookCountAvailable > 0
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(245,158,11,0.15)',
                              color: r.bookId?.bookCountAvailable > 0 ? '#34d399' : '#fbbf24',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            startIcon={<BookmarkRemove sx={{ fontSize: 14 }} />}
                            onClick={() => cancelReservation(r._id)}
                            sx={{
                              color: '#f87171',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </motion.div>
        )}

        {/* My Wishlist */}
        {wishlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card sx={{ mt: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FavoriteBorder sx={{ color: '#ec4899' }} /> My Wishlist ({wishlist.length})
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Book</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wishlist.map((book) => (
                      <TableRow key={book._id}>
                        <TableCell sx={{ fontWeight: 600 }}>{book.bookName}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{book.author}</TableCell>
                        <TableCell>
                          <Chip
                            label={book.bookCountAvailable > 0 ? 'Available' : 'Unavailable'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              backgroundColor: book.bookCountAvailable > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: book.bookCountAvailable > 0 ? '#34d399' : '#f87171',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => removeFromWishlist(book._id)} sx={{ color: '#f87171' }}>
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </motion.div>
        )}
      </Box>
    </AnimatedPage>
  );
};

export default MyBorrows;
