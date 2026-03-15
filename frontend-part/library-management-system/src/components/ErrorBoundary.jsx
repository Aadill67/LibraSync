import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            p: 3,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Box
              sx={{
                textAlign: 'center',
                maxWidth: 480,
                p: 5,
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(239,68,68,0.15)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 12px 40px rgba(239,68,68,0.3)',
                  }}
                >
                  <ErrorOutline sx={{ color: '#fff', fontSize: 40 }} />
                </Box>
              </motion.div>

              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: '#ffffff', mb: 1, letterSpacing: '-0.02em' }}
              >
                Oops! Something broke
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.7 }}
              >
                An unexpected error occurred. Don't worry — your data is safe.
                Click below to try again.
              </Typography>

              {this.state.error && (
                <Box
                  sx={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: '12px',
                    p: 2,
                    mb: 3,
                    textAlign: 'left',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-word' }}
                  >
                    {this.state.error.toString()}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: '14px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/dashboard'}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: '14px',
                    fontWeight: 600,
                    borderColor: 'rgba(148,163,184,0.2)',
                    color: '#94a3b8',
                    '&:hover': { borderColor: '#818cf8', color: '#818cf8' },
                  }}
                >
                  Go Home
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
