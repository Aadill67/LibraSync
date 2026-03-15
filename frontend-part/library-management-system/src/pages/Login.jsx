import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, LocalLibrary, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ─── Shared dark input style ──────────────────────────── */
const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '14px',
    color: '#f1f5f9',
    fontSize: '0.95rem',
    padding: '4px 6px',
    '& fieldset': {
      borderColor: 'rgba(99, 102, 241, 0.2)',
      borderWidth: '1.5px',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(99, 102, 241, 0.45)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#818cf8',
      borderWidth: '2px',
      boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1), 0 0 20px rgba(99, 102, 241, 0.08)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#a5b4fc',
    fontWeight: 600,
  },
  '& input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 100px rgba(15, 23, 42, 0.95) inset',
    WebkitTextFillColor: '#f1f5f9',
    caretColor: '#f1f5f9',
    borderRadius: '14px',
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #0f172a, #1a1a3e)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      }}
    >
      {/* Floating decorative orbs */}
      <Box
        sx={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          top: '-8%',
          right: '-8%',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-30px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)',
          bottom: '-5%',
          left: '-5%',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '10%',
          animation: 'float 10s ease-in-out infinite',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Typography
            component={Link}
            to="/"
            variant="body2"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: '#94a3b8',
              textDecoration: 'none',
              mb: 2.5,
              fontSize: '0.85rem',
              fontWeight: 500,
              '&:hover': { color: '#a5b4fc' },
              transition: 'color 0.2s',
            }}
          >
            <ArrowBack sx={{ fontSize: 16 }} /> Back to Home
          </Typography>
        </motion.div>

        {/* ─── Login Card ──────────────────────────────── */}
        <Card
          sx={{
            p: { xs: 4, sm: 5 },
            width: { xs: '90vw', sm: 440 },
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow behind card top */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 200,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo + Header */}
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                  boxShadow: '0 12px 40px rgba(99,102,241,0.35), 0 0 0 6px rgba(99,102,241,0.08)',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '23px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(236,72,153,0.3))',
                    zIndex: -1,
                    filter: 'blur(8px)',
                  },
                }}
              >
                <LocalLibrary sx={{ color: '#fff', fontSize: 32 }} />
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#ffffff',
                  mb: 0.5,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#a5b4fc',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}
              >
                Sign in to your LibraSync account
              </Typography>
            </motion.div>
          </Box>

          {/* Error Alert */}
          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  '& .MuiAlert-icon': { color: '#f87171' },
                }}
              >
                {error}
              </Alert>
            </motion.div>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ ...inputSx, mb: 2.5 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#6366f1', fontSize: 20, opacity: 0.7 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
            >
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ ...inputSx, mb: 3.5 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#6366f1', fontSize: 20, opacity: 0.7 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{
                            color: '#64748b',
                            '&:hover': { color: '#a5b4fc', backgroundColor: 'rgba(99,102,241,0.08)' },
                          }}
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: 20 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 20 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                  boxShadow: '0 8px 30px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
                    boxShadow: '0 12px 40px rgba(99,102,241,0.5), 0 4px 12px rgba(99,102,241,0.3)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  },
                  '&:disabled': {
                    background: 'rgba(99,102,241,0.25)',
                    boxShadow: 'none',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </motion.div>
          </Box>

          {/* Forgot Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
          >
            <Typography
              component={Link}
              to="/forgot-password"
              variant="body2"
              sx={{
                display: 'block',
                textAlign: 'right',
                mt: 2,
                color: '#a5b4fc',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': { color: '#c7d2fe', textDecoration: 'underline' },
              }}
            >
              Forgot Password?
            </Typography>

            {/* Demo Login Buttons */}
            <Typography sx={{ mt: 2.5, mb: 1, color: '#64748b', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
              Try Demo
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '🔑 Admin', email: 'admin@library.com', pw: 'admin123', color: '#f87171' },
                { label: '📚 Librarian', email: 'librarian@library.com', pw: 'librarian123', color: '#fbbf24' },
                { label: '🎓 Member', email: 'student@library.com', pw: 'member123', color: '#34d399' },
              ].map((demo) => (
                <Button
                  key={demo.label}
                  size="small"
                  disabled={loading}
                  onClick={async () => {
                    setEmail(demo.email);
                    setPassword(demo.pw);
                    setError('');
                    setLoading(true);
                    try {
                      await login({ email: demo.email, password: demo.pw });
                      navigate('/dashboard');
                    } catch (err) {
                      setError(err.response?.data?.message || 'Demo login failed.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: demo.color,
                    border: `1px solid ${demo.color}33`,
                    borderRadius: '10px',
                    px: 2,
                    py: 0.7,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: `${demo.color}12`,
                      borderColor: `${demo.color}55`,
                    },
                  }}
                >
                  {demo.label}
                </Button>
              ))}
            </Box>

            {/* Divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                my: 3,
              }}
            >
              <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(148,163,184,0.2), transparent)' }} />
              <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                or
              </Typography>
              <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(148,163,184,0.2), transparent)' }} />
            </Box>

            <Typography
              variant="body2"
              sx={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}
            >
              Don&apos;t have an account?{' '}
              <Typography
                component={Link}
                to="/register"
                variant="body2"
                sx={{
                  color: '#a5b4fc',
                  textDecoration: 'none',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  '&:hover': { color: '#c7d2fe', textDecoration: 'underline' },
                }}
              >
                Sign Up
              </Typography>
            </Typography>
          </motion.div>
        </Card>
      </motion.div>
    </Box>
  );
};

export default Login;
