import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Chip,
  Skeleton,
  Alert,
  IconButton,
  Grid,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  MenuBook,
  CheckCircle,
  Cancel,
  Person,
  Language,
  Business,
  BookmarkAdd,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CategoryBooks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reserving, setReserving] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCategoryBooks = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/categories/${id}/books`);
        setCategory(res.data.category);
        setBooks(res.data.books);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load books for this category');
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryBooks();
  }, [id]);

  return (
    <AnimatedPage>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={() => navigate('/categories')}
              sx={{
                backgroundColor: 'rgba(99,102,241,0.1)',
                '&:hover': { backgroundColor: 'rgba(99,102,241,0.2)' },
              }}
            >
              <ArrowBack sx={{ color: '#818cf8' }} />
            </IconButton>
          </motion.div>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {loading ? <Skeleton width={200} /> : category?.categoryName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {loading ? (
                <Skeleton width={120} />
              ) : (
                `${books.length} book${books.length !== 1 ? 's' : ''} in this category`
              )}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </motion.div>
        )}

        {/* Books Grid */}
        {loading ? (
          <Grid container spacing={2}>
            {[...Array(4)].map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : books.length > 0 ? (
          <Grid container spacing={2.5}>
            {books.map((book, index) => {
              const available = book.bookCountAvailable > 0;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={book._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.35 }}
                    whileHover={{ y: -4 }}
                    style={{ height: '100%' }}
                  >
                    <Card
                      sx={{
                        p: 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        border: '1px solid rgba(148,163,184,0.1)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          borderColor: 'rgba(99,102,241,0.3)',
                          boxShadow: '0 8px 30px rgba(99,102,241,0.12)',
                        },
                      }}
                    >
                      {/* Book cover placeholder */}
                      <Box
                        sx={{
                          height: 120,
                          background: `linear-gradient(135deg, ${
                            available
                              ? 'rgba(99,102,241,0.15), rgba(139,92,246,0.15)'
                              : 'rgba(239,68,68,0.1), rgba(248,113,113,0.1)'
                          })`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        <MenuBook sx={{ fontSize: 48, color: available ? '#818cf8' : '#f87171', opacity: 0.5 }} />

                        {/* Availability badge */}
                        <Chip
                          icon={available ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                          label={available ? 'Available' : 'Unavailable'}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            height: 24,
                            backgroundColor: available
                              ? 'rgba(16,185,129,0.15)'
                              : 'rgba(239,68,68,0.15)',
                            color: available ? '#34d399' : '#f87171',
                            '& .MuiChip-icon': {
                              color: available ? '#34d399' : '#f87171',
                            },
                          }}
                        />
                      </Box>

                      {/* Book details */}
                      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            mb: 0.5,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {book.bookName}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {book.author}
                          </Typography>
                        </Box>

                        {book.publisher && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Business sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {book.publisher}
                            </Typography>
                          </Box>
                        )}

                        {book.language && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Language sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {book.language}
                            </Typography>
                          </Box>
                        )}

                        {book.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.72rem',
                              lineHeight: 1.5,
                              mb: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              flex: 1,
                            }}
                          >
                            {book.description}
                          </Typography>
                        )}

                        {/* Categories chips */}
                        {book.categories && book.categories.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                            {book.categories.map((cat) => (
                              <Chip
                                key={cat._id}
                                label={cat.categoryName}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.6rem',
                                  fontWeight: 600,
                                  backgroundColor: 'rgba(99,102,241,0.1)',
                                  color: '#818cf8',
                                }}
                              />
                            ))}
                          </Box>
                        )}

                        {/* Copies info */}
                        <Box
                          sx={{
                            mt: 'auto',
                            pt: 1.5,
                            borderTop: '1px solid rgba(148,163,184,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: available ? '#34d399' : '#f87171',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          >
                            {available
                              ? `${book.bookCountAvailable} ${book.bookCountAvailable === 1 ? 'copy' : 'copies'} available`
                              : 'All copies issued'}
                          </Typography>
                          {book.isbn && (
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.disabled', fontSize: '0.65rem' }}
                            >
                              ISBN: {book.isbn.slice(-6)}
                            </Typography>
                          )}
                        </Box>

                        {/* Reserve button for unavailable books */}
                        {!available && user?.role === 'member' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<BookmarkAdd sx={{ fontSize: 14 }} />}
                            disabled={reserving === book._id}
                            onClick={async () => {
                              setReserving(book._id);
                              setError('');
                              try {
                                const res = await API.post('/transactions/reserve', { bookId: book._id });
                                setSuccess(res.data.message);
                                setTimeout(() => setSuccess(''), 4000);
                              } catch (err) {
                                setError(err.response?.data?.message || 'Failed to reserve');
                              } finally {
                                setReserving(null);
                              }
                            }}
                            sx={{
                              mt: 1,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              borderColor: '#f59e0b',
                              color: '#fbbf24',
                              '&:hover': { borderColor: '#d97706', backgroundColor: 'rgba(245,158,11,0.08)' },
                            }}
                          >
                            {reserving === book._id ? 'Reserving...' : 'Reserve This Book'}
                          </Button>
                        )}
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <MenuBook sx={{ fontSize: 56, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
            <Typography variant="h6" sx={{ mb: 0.5, color: 'text.secondary' }}>
              No Books Found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mb: 2 }}>
              There are no books in the "{category?.categoryName}" category yet.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/categories')}
              sx={{
                borderColor: '#6366f1',
                color: '#818cf8',
                '&:hover': { borderColor: '#4f46e5', backgroundColor: 'rgba(99,102,241,0.08)' },
              }}
            >
              Back to Categories
            </Button>
          </Card>
        )}
      </Box>
    </AnimatedPage>
  );
};

export default CategoryBooks;
