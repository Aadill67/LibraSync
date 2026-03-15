import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Button, Skeleton, Rating,
  Avatar, Divider, TextField, Grid, Alert, IconButton, Tooltip,
} from '@mui/material';
import {
  ArrowBack, QrCode2, MenuBook, Person, CalendarMonth,
  Star, StarBorder, Category, Language, Send,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import API from '../api/axios';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, count: 0 });
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/books/getbook/${id}`);
        setBook(data);
      } catch {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    API.get(`/reviews/book/${id}`).then(({ data }) => {
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { avgRating: 0, count: 0 });
    }).catch(() => {});
  }, [id]);

  const submitReview = async () => {
    if (!myRating) return;
    setSubmitting(true);
    try {
      await API.post('/reviews', { bookId: id, rating: myRating, comment: myComment });
      const { data } = await API.get(`/reviews/book/${id}`);
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { avgRating: 0, count: 0 });
      setMyComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mb: 3 }} />
      <Skeleton height={40} width="60%" sx={{ mb: 1 }} />
      <Skeleton height={24} width="40%" />
    </Box>
  );

  if (!book) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Alert severity="error">Book not found</Alert>
      <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go Home</Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Grid container spacing={3}>
            {/* Book Cover / QR */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  height: 300, borderRadius: 2, overflow: 'hidden',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {showQR ? (
                  <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2 }}>
                    <QRCodeSVG value={`${window.location.origin}/book/${id}`} size={200} />
                  </Box>
                ) : book.coverImage ? (
                  <Box component="img" src={book.coverImage} alt={book.bookName}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <MenuBook sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)' }} />
                )}
                <Tooltip title={showQR ? 'Show Cover' : 'Show QR Code'}>
                  <IconButton
                    onClick={() => setShowQR(!showQR)}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                  >
                    <QrCode2 />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            {/* Book Info */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {book.bookName}
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                by {book.author}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  icon={<Star />}
                  label={`${reviewStats.avgRating?.toFixed(1) || '0.0'} (${reviewStats.count} reviews)`}
                  sx={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
                />
                <Chip
                  label={book.bookCountAvailable > 0 ? `${book.bookCountAvailable} Available` : 'Not Available'}
                  color={book.bookCountAvailable > 0 ? 'success' : 'error'}
                  variant="outlined"
                />
                {book.language && <Chip icon={<Language />} label={book.language} variant="outlined" size="small" />}
              </Box>

              {book.isbn && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  <strong>ISBN:</strong> {book.isbn}
                </Typography>
              )}
              {book.publisher && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  <strong>Publisher:</strong> {book.publisher}
                </Typography>
              )}
              {book.categories?.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {book.categories.map((c) => (
                    <Chip key={c._id} icon={<Category />} label={c.categoryName} size="small" variant="outlined" />
                  ))}
                </Box>
              )}

              {book.description && (
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', lineHeight: 1.7 }}>
                  {book.description}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Card>
      </motion.div>

      {/* Reviews Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Reviews & Ratings
          </Typography>

          {/* Write review */}
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Write a Review</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Your Rating:</Typography>
              <Rating value={myRating} onChange={(_, v) => setMyRating(v)} size="large" emptyIcon={<StarBorder fontSize="inherit" />} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth size="small" placeholder="Write your review (optional)..."
                value={myComment} onChange={(e) => setMyComment(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Button
                variant="contained" endIcon={<Send />}
                onClick={submitReview} disabled={!myRating || submitting}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Submit
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>No reviews yet. Be the first!</Alert>
          ) : (
            reviews.map((r) => (
              <Box key={r._id} sx={{ mb: 2, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: 14 }}>
                    {r.userId?.userFullName?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{r.userId?.userFullName || 'User'}</Typography>
                    <Rating value={r.rating} size="small" readOnly />
                  </Box>
                  <Typography variant="caption" sx={{ ml: 'auto', color: 'text.disabled' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {r.comment && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', pl: 5.5 }}>
                    {r.comment}
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Card>
      </motion.div>
    </Box>
  );
};

export default BookDetail;
