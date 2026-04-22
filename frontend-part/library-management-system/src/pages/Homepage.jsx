import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  IconButton,
} from '@mui/material';
import {
  MenuBook,
  Search,
  ReceiptLong,
  Security,
  Speed,
  People,
  LocalLibrary,
  ArrowForward,
  GitHub,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/* ─── Book titles for scrolling marquee ─── */
const bookTitles = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', color: '#6366f1', isbn: '9780743273565' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', color: '#ec4899', isbn: '9780061120084' },
  { title: '1984', author: 'George Orwell', color: '#10b981', isbn: '9780451524935' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', color: '#f59e0b', isbn: '9780141439518' },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', color: '#06b6d4', isbn: '9780316769488' },
  { title: 'Brave New World', author: 'Aldous Huxley', color: '#8b5cf6', isbn: '9780060850524' },
  { title: 'The Alchemist', author: 'Paulo Coelho', color: '#ef4444', isbn: '9780062315007' },
  { title: 'Harry Potter', author: 'J.K. Rowling', color: '#14b8a6', isbn: '9780590353427' },
  { title: 'Lord of the Rings', author: 'J.R.R. Tolkien', color: '#f97316', isbn: '9780618640157' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', color: '#3b82f6', isbn: '9780547928227' },
  { title: 'Don Quixote', author: 'Miguel de Cervantes', color: '#a855f7', isbn: '9780060934347' },
  { title: 'Moby Dick', author: 'Herman Melville', color: '#22d3ee', isbn: '9780142437247' },
];

/* ─── Features data ─── */
const features = [
  {
    icon: <MenuBook sx={{ fontSize: 32 }} />,
    title: 'Book Management',
    description: 'Add, edit, search, and organize your entire library collection with ease.',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: <Search sx={{ fontSize: 32 }} />,
    title: 'Smart Search',
    description: 'Find any book instantly with debounced search across titles, authors, and ISBN.',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    icon: <ReceiptLong sx={{ fontSize: 32 }} />,
    title: 'Transaction Tracking',
    description: 'Issue and return books with automatic fine calculations and due date tracking.',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    icon: <Security sx={{ fontSize: 32 }} />,
    title: 'Role-Based Access',
    description: 'Secure admin, librarian, and member roles with JWT authentication.',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    icon: <Speed sx={{ fontSize: 32 }} />,
    title: 'Real-Time Dashboard',
    description: 'Monitor library analytics with interactive charts and live statistics.',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    icon: <People sx={{ fontSize: 32 }} />,
    title: 'Member Management',
    description: 'Track member activity, borrowing history, and overdue notifications.',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
];

/* ─── Animated Counter Component ─── */
const AnimatedCounter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

/* ─── Marquee Book Card ─── */
const BookCard = ({ title, author, color, isbn }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fallbackIcon = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <MenuBook sx={{ color, fontSize: 48, opacity: 0.4 }} />
    </Box>
  );

  return (
    <Box
      sx={{
        minWidth: 200,
        maxWidth: 200,
        height: 300,
        borderRadius: 3,
        background: `linear-gradient(145deg, ${color}15, ${color}08)`,
        border: `1px solid ${color}30`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'all 0.3s ease',
        cursor: 'default',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: `0 20px 40px ${color}20`,
          borderColor: `${color}60`,
        },
      }}
    >
      {/* Book cover image */}
      <Box
        sx={{
          height: 160,
          overflow: 'hidden',
          position: 'relative',
          background: `linear-gradient(135deg, ${color}25, ${color}10)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Show fallback icon while loading or on error */}
        {(!imgLoaded || imgError) && fallbackIcon}
        {!imgError && (
          <Box
            component="img"
            src={`https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`}
            alt={title}
            loading="lazy"
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              opacity: imgLoaded ? 1 : 0,
              position: imgLoaded ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              '&:hover': { transform: 'scale(1.08)' },
            }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
      </Box>
      {/* Book details */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 0.5, color: '#f1f5f9', lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {author}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MenuBook sx={{ color, fontSize: 16 }} />
        </Box>
      </Box>
    </Box>
  );
};

/* ─────────────────────────────────────────── */
/*                   HOMEPAGE                   */
/* ─────────────────────────────────────────── */
const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0f172a', overflowX: 'hidden' }}>

      {/* ─── Navbar ─── */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(148,163,184,0.08)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocalLibrary sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                LibraSync
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: 'rgba(99,102,241,0.4)',
                  color: '#818cf8',
                  px: 2.5,
                  '&:hover': {
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="small"
                sx={{
                  px: 2.5,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ─── Hero Section ─── */}
      <Box
        sx={{
          pt: { xs: 14, md: 18 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
        }}
      >
        {/* Background orbs */}
        <Box
          sx={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            top: '-10%',
            right: '-10%',
            animation: 'float 8s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-30px)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
            bottom: '0%',
            left: '-5%',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: '#818cf8',
                  fontWeight: 600,
                  letterSpacing: 3,
                  fontSize: '0.8rem',
                  mb: 2,
                  display: 'block',
                }}
              >
                📚 MODERN LIBRARY MANAGEMENT
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  lineHeight: 1.1,
                  mb: 3,
                  color: '#f1f5f9',
                }}
              >
                Welcome to{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'gradientText 4s ease infinite',
                    '@keyframes gradientText': {
                      '0%': { backgroundPosition: '0% 50%' },
                      '50%': { backgroundPosition: '100% 50%' },
                      '100%': { backgroundPosition: '0% 50%' },
                    },
                  }}
                >
                  LibraSync
                </Box>
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#94a3b8',
                  fontWeight: 400,
                  maxWidth: 600,
                  mx: 'auto',
                  mb: 5,
                  lineHeight: 1.7,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                }}
              >
                A next-generation library management system with smart search,
                real-time analytics, automated fine tracking, and beautiful
                dashboards. Manage your entire library in one place.
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      boxShadow: '0 12px 40px rgba(99,102,241,0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    borderColor: 'rgba(148,163,184,0.3)',
                    color: '#f1f5f9',
                    '&:hover': {
                      borderColor: '#6366f1',
                      backgroundColor: 'rgba(99,102,241,0.08)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* ─── Scrolling Books Marquee ─── */}
      <Box sx={{ py: 6, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0,
            width: 100,
            background: 'linear-gradient(90deg, #0f172a, transparent)',
            zIndex: 2,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0,
            width: 100,
            background: 'linear-gradient(-90deg, #0f172a, transparent)',
            zIndex: 2,
          }}
        />

        {/* Row 1 — scrolls left */}
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            mb: 2.5,
            animation: 'scrollLeft 40s linear infinite',
            '@keyframes scrollLeft': {
              '0%': { transform: 'translateX(0)' },
              '100%': { transform: 'translateX(-50%)' },
            },
            width: 'max-content',
          }}
        >
          {[...bookTitles, ...bookTitles].map((book, i) => (
            <BookCard key={`row1-${i}`} {...book} />
          ))}
        </Box>

        {/* Row 2 — scrolls right */}
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            animation: 'scrollRight 45s linear infinite',
            '@keyframes scrollRight': {
              '0%': { transform: 'translateX(-50%)' },
              '100%': { transform: 'translateX(0)' },
            },
            width: 'max-content',
          }}
        >
          {[...bookTitles.slice().reverse(), ...bookTitles.slice().reverse()].map((book, i) => (
            <BookCard key={`row2-${i}`} {...book} />
          ))}
        </Box>
      </Box>

      {/* ─── Features Section ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'rgba(15,23,42,0.5)' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="overline"
              sx={{
                color: '#818cf8',
                fontWeight: 600,
                letterSpacing: 3,
                textAlign: 'center',
                display: 'block',
                mb: 1,
              }}
            >
              FEATURES
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                color: '#f1f5f9',
              }}
            >
              Everything You Need
            </Typography>
            <Typography
              sx={{
                textAlign: 'center',
                color: '#94a3b8',
                maxWidth: 600,
                mx: 'auto',
                mb: 6,
              }}
            >
              Powerful tools to manage your library efficiently — from cataloging
              books to tracking transactions and fines.
            </Typography>
          </motion.div>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card
                    sx={{
                      p: 3.5,
                      height: '100%',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(148,163,184,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        border: '1px solid rgba(99,102,241,0.3)',
                        transform: 'translateY(-6px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2.5,
                        background: feature.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2.5,
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.05rem', color: '#f1f5f9', textDecoration: 'none', letterSpacing: '-0.01em' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.7, opacity: 0.85 }}>
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Stats Section ─── */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              { value: 10000, suffix: '+', label: 'Books Cataloged', color: '#6366f1' },
              { value: 500, suffix: '+', label: 'Active Members', color: '#ec4899' },
              { value: 2500, suffix: '+', label: 'Transactions', color: '#10b981' },
              { value: 99, suffix: '%', label: 'Uptime', color: '#f59e0b' },
            ].map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        color: stat.color,
                        fontSize: { xs: '2rem', md: '3rem' },
                        mb: 0.5,
                      }}
                    >
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── CTA Section ─── */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card
              sx={{
                p: { xs: 4, md: 6 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.1) 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 4,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '1.6rem', md: '2.2rem' },
                  color: '#f1f5f9',
                }}
              >
                Ready to Transform Your Library?
              </Typography>
              <Typography
                sx={{ color: '#94a3b8', mb: 4, maxWidth: 500, mx: 'auto' }}
              >
                Join hundreds of libraries already using LibraSync to manage their
                collections, members, and transactions efficiently.
              </Typography>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  px: 5,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                Start Now — It's Free
              </Button>
            </Card>
          </motion.div>
        </Container>
      </Box>

      {/* ─── Footer ─── */}
      <Box
        component="footer"
        sx={{
          borderTop: '1px solid rgba(148,163,184,0.08)',
          py: { xs: 6, md: 8 },
          backgroundColor: 'rgba(2, 6, 23, 0.6)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Brand */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalLibrary sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                  LibraSync
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.8, maxWidth: 280 }}>
                A modern, full-stack library management system built with React,
                Node.js, Express, and MongoDB.
              </Typography>
            </Grid>

            {/* Quick Links */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#94a3b8' }}>
                Quick Links
              </Typography>
              {['Dashboard', 'Books', 'Categories', 'Transactions'].map((link) => (
                <Typography
                  key={link}
                  component={RouterLink}
                  to={`/${link.toLowerCase()}`}
                  variant="body2"
                  sx={{
                    display: 'block',
                    color: '#64748b',
                    mb: 1,
                    textDecoration: 'none',
                    '&:hover': { color: '#818cf8' },
                    transition: 'color 0.2s',
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Grid>

            {/* About */}
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#94a3b8' }}>
                About
              </Typography>
              {['About Us', 'Privacy Policy', 'Terms of Service', 'FAQ'].map((link) => (
                <Typography
                  key={link}
                  variant="body2"
                  sx={{
                    display: 'block',
                    color: '#64748b',
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { color: '#818cf8' },
                    transition: 'color 0.2s',
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Grid>

            {/* Contact */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#94a3b8' }}>
                Contact Us
              </Typography>
              {[
                { icon: <Email sx={{ fontSize: 16 }} />, text: 'support@librasync.com' },
                { icon: <Phone sx={{ fontSize: 16 }} />, text: '+91 98765 43210' },
                { icon: <LocationOn sx={{ fontSize: 16 }} />, text: 'Library Building, University Campus' },
              ].map((item) => (
                <Box
                  key={item.text}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
                >
                  <Box sx={{ color: '#818cf8' }}>{item.icon}</Box>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>

          {/* Copyright */}
          <Box
            sx={{
              mt: 6,
              pt: 3,
              borderTop: '1px solid rgba(148,163,184,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: '#475569' }}>
              © 2026 LibraSync. All rights reserved. Built as a Final Year Project.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                sx={{
                  color: '#64748b',
                  '&:hover': { color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)' },
                }}
              >
                <GitHub sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: '#64748b',
                  '&:hover': { color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)' },
                }}
              >
                <Email sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Homepage;
