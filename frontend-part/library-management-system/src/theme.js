import { createTheme } from '@mui/material/styles';

/* ─── Shared Config ──────────────────────────────────── */
const shared = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 10,
        padding: '10px 24px',
      },
      contained: {
        boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
        '&:hover': { boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.6)' },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { backgroundImage: 'none' },
    },
  },
};

/* ─── Dark Theme ─────────────────────────────────────── */
export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#ec4899', light: '#f472b6', dark: '#db2777' },
    background: { default: '#0f172a', paper: '#1e293b' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
    divider: 'rgba(148, 163, 184, 0.12)',
  },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(148, 163, 184, 0.1)' },
        head: { fontWeight: 600, backgroundColor: 'rgba(15, 23, 42, 0.6)' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        },
      },
    },
  },
});

/* ─── Light Theme ────────────────────────────────────── */
export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', light: '#6366f1', dark: '#3730a3' },
    secondary: { main: '#db2777', light: '#ec4899', dark: '#be185d' },
    background: { default: '#f1f5f9', paper: '#ffffff' },
    success: { main: '#059669' },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    text: { primary: '#0f172a', secondary: '#475569' },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(15, 23, 42, 0.06)' },
        head: { fontWeight: 600, backgroundColor: 'rgba(241, 245, 249, 0.8)' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.08)',
        },
      },
    },
  },
});

// Default export for backward compat
export default darkTheme;
