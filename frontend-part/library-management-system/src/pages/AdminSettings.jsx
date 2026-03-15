import { useState } from 'react';
import {
  Box, Typography, Card, Button, Grid, Alert, Snackbar,
  CircularProgress, Divider, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import {
  Backup, Restore, Storage, CloudDownload, CloudUpload,
  Warning, CheckCircle, Settings,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import API from '../api/axios';

const AdminSettings = () => {
  const [loading, setLoading] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleBackup = async () => {
    setLoading('backup');
    try {
      const { data } = await API.get('/admin/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `librasync-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Backup downloaded successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Backup failed: ' + (err.response?.data?.message || err.message), severity: 'error' });
    } finally {
      setLoading('');
    }
  };

  const handleRestore = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoading('restore');
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const { data: result } = await API.post('/admin/restore', data);
        setSnackbar({
          open: true,
          message: `Restored! ${Object.keys(result.collections).length} collections, ${Object.values(result.collections).reduce((a, b) => a + b, 0)} documents`,
          severity: 'success',
        });
        setConfirmRestore(false);
      } catch (err) {
        setSnackbar({ open: true, message: 'Restore failed: ' + (err.response?.data?.message || err.message), severity: 'error' });
      } finally {
        setLoading('');
      }
    };
    input.click();
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { data } = await API.get('/admin/stats');
      setDbStats(data);
    } catch {
      setDbStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Settings sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Admin Settings</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Database management & system configuration</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Backup */}
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  p: 1.2, borderRadius: 2,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', display: 'flex',
                }}>
                  <Backup />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Database Backup</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Export all database collections as a JSON file. This includes users, books, transactions, reviews, and all other data.
              </Typography>
              <Button
                variant="contained"
                startIcon={loading === 'backup' ? <CircularProgress size={18} color="inherit" /> : <CloudDownload />}
                onClick={handleBackup}
                disabled={!!loading}
                fullWidth
                sx={{
                  borderRadius: 2, py: 1.2,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' },
                }}
              >
                {loading === 'backup' ? 'Creating Backup...' : 'Download Backup'}
              </Button>
            </Card>
          </motion.div>
        </Grid>

        {/* Restore */}
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  p: 1.2, borderRadius: 2,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', display: 'flex',
                }}>
                  <Restore />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Database Restore</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Restore database from a previously exported backup file.
              </Typography>
              <Alert severity="warning" sx={{ borderRadius: 2, mb: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                This will overwrite all existing data. Make sure to create a backup first!
              </Alert>
              <Button
                variant="outlined"
                color="warning"
                startIcon={loading === 'restore' ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}
                onClick={() => setConfirmRestore(true)}
                disabled={!!loading}
                fullWidth
                sx={{ borderRadius: 2, py: 1.2 }}
              >
                {loading === 'restore' ? 'Restoring...' : 'Restore from Backup'}
              </Button>
            </Card>
          </motion.div>
        </Grid>

        {/* Database Stats */}
        <Grid size={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    p: 1.2, borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff', display: 'flex',
                  }}>
                    <Storage />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Database Statistics</Typography>
                </Box>
                <Button onClick={fetchStats} disabled={statsLoading} variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                  {statsLoading ? <CircularProgress size={16} /> : 'Load Stats'}
                </Button>
              </Box>

              {dbStats ? (
                <>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.08)' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{dbStats.totalCollections}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Collections</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.08)' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>{dbStats.totalDocuments}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Documents</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1}>
                    {dbStats.collectionStats?.map((c) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={c.name}>
                        <Chip
                          label={`${c.name}: ${c.count}`}
                          variant="outlined"
                          sx={{ width: '100%', justifyContent: 'flex-start' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Click "Load Stats" to view database statistics</Typography>
              )}
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Confirm Restore Dialog */}
      <Dialog open={confirmRestore} onClose={() => setConfirmRestore(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" /> Confirm Database Restore
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will <strong>replace all existing data</strong> with the backup file contents.
            This action cannot be undone. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRestore(false)}>Cancel</Button>
          <Button onClick={handleRestore} color="warning" variant="contained">
            Yes, Restore
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSettings;
