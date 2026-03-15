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
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Phone,
  Visibility,
  VisibilityOff,
  LocalLibrary,
  Badge,
  ArrowBack,
} from '@mui/icons-material';
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
  '& .MuiSelect-select': { color: '#f1f5f9' },
  '& .MuiSelect-icon': { color: '#64748b' },
};

const iconSx = { color: '#6366f1', fontSize: 20, opacity: 0.7 };

const Register = () => {
  const [formData, setFormData] = useState({
    userFullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    role: 'member',
    admissionId: '',
    employeeId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.userFullName || !formData.email || !formData.password || !formData.mobileNumber) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        py: 4,
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
      {/* Floating orbs */}
      <Box
        sx={{
          position: 'absolute', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          top: '-8%', left: '-5%',
          animation: 'float 7s ease-in-out infinite',
          '@keyframes float': { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-25px)' } },
        }}
      />
      <Box
        sx={{
          position: 'absolute', width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
          bottom: '-3%', right: '-3%',
          animation: 'float 9s ease-in-out infinite reverse',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Back to Home */}
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <Typography
            component={Link} to="/" variant="body2"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              color: '#94a3b8', textDecoration: 'none', mb: 2.5, fontSize: '0.85rem', fontWeight: 500,
              '&:hover': { color: '#a5b4fc' }, transition: 'color 0.2s',
            }}
          >
            <ArrowBack sx={{ fontSize: 16 }} /> Back to Home
          </Typography>
        </motion.div>

        <Card
          sx={{
            p: { xs: 4, sm: 5 },
            width: { xs: '92vw', sm: 520 },
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow */}
          <Box sx={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 200, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          {/* Logo + Header */}
          <Box sx={{ textAlign: 'center', mb: 3.5, position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}
            >
              <Box
                sx={{
                  width: 60, height: 60, borderRadius: '18px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                  boxShadow: '0 12px 40px rgba(99,102,241,0.35), 0 0 0 6px rgba(99,102,241,0.08)',
                }}
              >
                <LocalLibrary sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Create Account
              </Typography>
              <Typography variant="body1" sx={{ color: '#a5b4fc', fontWeight: 500, fontSize: '0.95rem' }}>
                Join the LibraSync community
              </Typography>
            </motion.div>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', '& .MuiAlert-icon': { color: '#f87171' } }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth label="Full Name" name="userFullName" value={formData.userFullName} onChange={handleChange} required sx={inputSx}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person sx={iconSx} /></InputAdornment> } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required sx={inputSx}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={iconSx} /></InputAdornment> } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required sx={inputSx}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><Lock sx={iconSx} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} size="small" edge="end" sx={{ color: '#64748b', '&:hover': { color: '#a5b4fc' } }}>
                            {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required sx={inputSx}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Lock sx={iconSx} /></InputAdornment> } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required sx={inputSx}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Phone sx={iconSx} /></InputAdornment> } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth select label="Role" name="role" value={formData.role} onChange={handleChange} sx={inputSx}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Badge sx={iconSx} /></InputAdornment> } }}
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="librarian">Librarian</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </Grid>

              {formData.role === 'member' && (
                <Grid size={12}>
                  <TextField fullWidth label="Admission ID" name="admissionId" value={formData.admissionId} onChange={handleChange} sx={inputSx}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Badge sx={iconSx} /></InputAdornment> } }}
                  />
                </Grid>
              )}

              {(formData.role === 'librarian' || formData.role === 'admin') && (
                <Grid size={12}>
                  <TextField fullWidth label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} sx={inputSx}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Badge sx={iconSx} /></InputAdornment> } }}
                  />
                </Grid>
              )}
            </Grid>

            <Button
              type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{
                mt: 3, py: 1.8, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.02em', borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                boxShadow: '0 8px 30px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
                  boxShadow: '0 12px 40px rgba(99,102,241,0.5), 0 4px 12px rgba(99,102,241,0.3)',
                  transform: 'translateY(-2px)',
                },
                '&:active': { transform: 'translateY(0px)' },
                '&:disabled': { background: 'rgba(99,102,241,0.25)', boxShadow: 'none' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Create Account'}
            </Button>
          </Box>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(148,163,184,0.2), transparent)' }} />
            <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</Typography>
            <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(148,163,184,0.2), transparent)' }} />
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Typography component={Link} to="/login" variant="body2" sx={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 700, '&:hover': { color: '#c7d2fe', textDecoration: 'underline' } }}>
              Sign In
            </Typography>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
};

export default Register;
