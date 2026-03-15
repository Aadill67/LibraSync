import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email, LocalLibrary, ArrowBack, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import API from '../api/axios';

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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Failed to send reset link. Please try again.');
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        p: 2,
      }}
    >
      {/* Floating orbs */}
      <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', top: '-8%', right: '-5%', animation: 'float 7s ease-in-out infinite', '@keyframes float': { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-25px)' } } }} />
      <Box sx={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', bottom: '-3%', left: '-3%', animation: 'float 9s ease-in-out infinite reverse' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        <Card
          sx={{
            p: { xs: 4, sm: 5 },
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow */}
          <Box sx={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          {/* Logo + Header */}
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.2 }}
            >
              <Box
                sx={{
                  width: 64, height: 64, borderRadius: '18px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', mb: 2.5,
                  boxShadow: '0 12px 40px rgba(99,102,241,0.35), 0 0 0 6px rgba(99,102,241,0.08)',
                }}
              >
                <LocalLibrary sx={{ color: '#fff', fontSize: 30 }} />
              </Box>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Forgot Password?
              </Typography>
              <Typography variant="body1" sx={{ color: '#a5b4fc', fontWeight: 500, fontSize: '0.95rem' }}>
                {sent ? 'Check your inbox for the reset link' : "No worries, we'll send you a reset link"}
              </Typography>
            </motion.div>
          </Box>

          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircle sx={{ fontSize: 72, color: '#10b981', mb: 2, filter: 'drop-shadow(0 4px 12px rgba(16,185,129,0.3))' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', mb: 1 }}>
                  Email Sent!
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.6 }}>
                  If an account exists for <strong style={{ color: '#a5b4fc' }}>{email}</strong>, you&apos;ll receive a password reset link shortly.
                </Typography>
                <Button
                  component={Link} to="/login" variant="contained" fullWidth
                  sx={{
                    py: 1.8, fontWeight: 700, borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', transform: 'translateY(-2px)' },
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            </motion.div>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', '& .MuiAlert-icon': { color: '#f87171' } }}>
                  {error}
                </Alert>
              )}

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
                <TextField
                  fullWidth label="Email Address" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ ...inputSx, mb: 3.5 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#6366f1', fontSize: 20, opacity: 0.7 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  autoFocus
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }}>
                <Button
                  type="submit" variant="contained" fullWidth disabled={loading}
                  sx={{
                    py: 1.8, fontWeight: 700, borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                    boxShadow: '0 8px 30px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)', boxShadow: '0 12px 40px rgba(99,102,241,0.5)', transform: 'translateY(-2px)' },
                    '&:disabled': { background: 'rgba(99,102,241,0.25)', boxShadow: 'none' },
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Send Reset Link'}
                </Button>
              </motion.div>
            </Box>
          )}

          {/* Back to Login */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(148,163,184,0.2), transparent)' }} />
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', color: '#94a3b8' }}>
            <Typography
              component={Link} to="/login" variant="body2"
              sx={{
                color: '#a5b4fc', textDecoration: 'none', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                '&:hover': { color: '#c7d2fe', textDecoration: 'underline' },
              }}
            >
              <ArrowBack sx={{ fontSize: 16 }} /> Back to Login
            </Typography>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
};

export default ForgotPassword;
