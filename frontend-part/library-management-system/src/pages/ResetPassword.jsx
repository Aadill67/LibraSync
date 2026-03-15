import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { Lock, Visibility, VisibilityOff, LocalLibrary, CheckCircle } from '@mui/icons-material';
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
    '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.45)' },
    '&.Mui-focused fieldset': {
      borderColor: '#818cf8',
      borderWidth: '2px',
      boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)',
    },
  },
  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#a5b4fc', fontWeight: 600 },
};

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        p: 2,
      }}
    >
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
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

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
                  mx: 'auto', mb: 2.5,
                  boxShadow: '0 12px 40px rgba(99,102,241,0.35)',
                }}
              >
                <LocalLibrary sx={{ color: '#fff', fontSize: 30 }} />
              </Box>
            </motion.div>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Reset Password
            </Typography>
            <Typography variant="body1" sx={{ color: '#a5b4fc', fontWeight: 500, fontSize: '0.95rem' }}>
              Enter your new password below
            </Typography>
          </Box>

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircle sx={{ fontSize: 72, color: '#10b981', mb: 2, filter: 'drop-shadow(0 4px 12px rgba(16,185,129,0.3))' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                  Password Reset!
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  Redirecting you to login...
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', '& .MuiAlert-icon': { color: '#f87171' } }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ ...inputSx, mb: 2.5 }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#6366f1', fontSize: 20, opacity: 0.7 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small" edge="end" sx={{ color: '#64748b', '&:hover': { color: '#a5b4fc' } }}>
                          {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ ...inputSx, mb: 3.5 }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#6366f1', fontSize: 20, opacity: 0.7 }} /></InputAdornment>,
                  },
                }}
              />

              <Button
                type="submit" fullWidth variant="contained" size="large" disabled={loading}
                sx={{
                  py: 1.8, fontWeight: 700, borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                  boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)', transform: 'translateY(-2px)' },
                  '&:disabled': { background: 'rgba(99,102,241,0.25)', boxShadow: 'none' },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Reset Password'}
              </Button>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(148,163,184,0.2), transparent)' }} />
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', color: '#94a3b8' }}>
            <Typography component={Link} to="/login" variant="body2" sx={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 700, '&:hover': { textDecoration: 'underline' } }}>
              ← Back to Login
            </Typography>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
};

export default ResetPassword;
