import { useState, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import {
  Edit, Save, Cancel, CameraAlt, Download, Badge,
  QrCode2, CalendarMonth, Email, Phone, LocationOn,
  Star, Close, Lock, Visibility, VisibilityOff, Print,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';
import { getServerFileUrl } from '../api/config';
import { useAuth } from '../context/AuthContext';



const Profile = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    userFullName: user?.userFullName || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    address: user?.address || '',
    age: user?.age || '',
    gender: user?.gender || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.photo || '');
  const [cardOpen, setCardOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const fileInputRef = useRef(null);
  const cardRef = useRef(null);

  // Password change state
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');
    if (!pwData.currentPassword || !pwData.newPassword) {
      setPwError('Please fill in all fields');
      return;
    }
    if (pwData.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setChangingPw(true);
    try {
      await API.put('/users/change-password', {
        currentPassword: pwData.currentPassword,
        newPassword: pwData.newPassword,
      });
      setPwSuccess('Password changed successfully!');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await API.put(`/users/updateuser/${user._id}`, formData);
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await API.post('/users/upload-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = res.data.photo;
      setProfilePhoto(photoUrl);
      const updatedUser = { ...user, photo: photoUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Photo updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleExportCard = async () => {
    setExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [90, 55] });
      pdf.addImage(imgData, 'PNG', 0, 0, 90, 55);
      pdf.save(`LibraSync_Card_${user?.userFullName?.replace(/\s/g, '_') || 'member'}.pdf`);
      setSuccess('Library card downloaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to generate PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const photoSrc = getServerFileUrl(profilePhoto);

  const stats = [
    { label: 'Active Borrows', value: user?.activeTransactions?.length || 0, color: '#6366f1' },
    { label: 'Past Borrows', value: user?.prevTransactions?.length || 0, color: '#10b981' },
    { label: 'Points', value: user?.points || 0, color: '#f59e0b' },
  ];

  return (
    <AnimatedPage>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          My Profile
        </Typography>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card
            sx={{
              p: 4, mb: 3,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(236,72,153,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            {/* Avatar with photo upload */}
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Avatar
                src={photoSrc}
                sx={{
                  width: 100, height: 100,
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  fontSize: '2.5rem', fontWeight: 700,
                  boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                  border: '4px solid rgba(99,102,241,0.3)',
                  transition: 'all 0.3s ease',
                }}
              >
                {!photoSrc && (user?.userFullName?.charAt(0)?.toUpperCase() || 'U')}
              </Avatar>
              <Tooltip title="Upload Photo">
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.5)',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', transform: 'scale(1.1)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {uploading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <CameraAlt sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoUpload}
              />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {user?.userFullName || 'User'}
            </Typography>
            <Chip
              label={user?.role || 'member'}
              sx={{
                textTransform: 'capitalize', fontWeight: 600,
                background: 'rgba(99,102,241,0.2)', color: '#818cf8', mb: 1,
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {user?.email}
            </Typography>

            {/* Stats */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 1 }}>
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color }}>{stat.value}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>

            {/* Library Card Button */}
            <Box sx={{ mt: 3 }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outlined"
                  startIcon={<Badge />}
                  onClick={() => setCardOpen(true)}
                  sx={{
                    borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8',
                    px: 3, py: 1,
                    '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)' },
                  }}
                >
                  View Digital Library Card
                </Button>
              </motion.div>
            </Box>
          </Card>
        </motion.div>

        {/* Profile Details Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Personal Information</Typography>
              {!editing ? (
                <Button startIcon={<Edit />} onClick={() => setEditing(true)} sx={{ color: '#818cf8' }}>Edit</Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<Cancel />} onClick={() => setEditing(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                  <Button
                    variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 3, opacity: 0.1 }} />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Full Name" value={formData.userFullName}
                  onChange={(e) => setFormData({ ...formData, userFullName: e.target.value })} disabled={!editing} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email" value={formData.email} disabled helperText="Email cannot be changed" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Mobile Number" value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} disabled={!editing} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Age" type="number" value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })} disabled={!editing} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Gender" value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })} disabled={!editing} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Address" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} disabled={!editing}
                  multiline rows={2} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                {' · '}Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong>
              </Typography>
            </Box>
          </Card>
        </motion.div>

        {/* ─── Change Password Card ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock sx={{ color: '#818cf8', fontSize: 22 }} /> Change Password
            </Typography>
            <Divider sx={{ mb: 2.5, opacity: 0.1 }} />

            {pwError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPwError('')}>{pwError}</Alert>}
            {pwSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{pwSuccess}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth label="Current Password"
                  type={showPw ? 'text' : 'password'}
                  value={pwData.currentPassword}
                  onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <IconButton onClick={() => setShowPw(!showPw)} size="small" edge="end" sx={{ color: 'text.secondary' }}>
                          {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="New Password" type="password" value={pwData.newPassword}
                  onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Confirm New Password" type="password" value={pwData.confirmPassword}
                  onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained" onClick={handleChangePassword} disabled={changingPw}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                  px: 3,
                }}
              >
                {changingPw ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Update Password'}
              </Button>
            </Box>
          </Card>
        </motion.div>

        {/* ─── Digital Library Card Dialog ─── */}
        <Dialog
          open={cardOpen}
          onClose={() => setCardOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              overflow: 'visible',
            },
          }}
        >
          <DialogTitle sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(15,23,42,0.95)', borderRadius: '16px 16px 0 0',
            border: '1px solid rgba(99,102,241,0.2)', borderBottom: 'none',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
              <Badge sx={{ mr: 1, color: '#818cf8' }} /> Digital Library Card
            </Typography>
            <IconButton onClick={() => setCardOpen(false)} sx={{ color: '#64748b' }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{
            p: 3, pt: 3,
            background: 'rgba(15,23,42,0.95)',
            borderRadius: '0 0 16px 16px',
            border: '1px solid rgba(99,102,241,0.2)', borderTop: 'none',
          }}>
            {/* The Card */}
            <Box
              ref={cardRef}
              sx={{
                width: '100%', maxWidth: 450, mx: 'auto',
                aspectRatio: '1.6/1',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 70%, #581c87 100%)',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(99,102,241,0.3), 0 0 0 1px rgba(99,102,241,0.2)',
                p: 3,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              {/* Decorative orbs */}
              <Box sx={{
                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
                top: -60, right: -40,
              }} />
              <Box sx={{
                position: 'absolute', width: 150, height: 150, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
                bottom: -30, left: -20,
              }} />

              {/* Card Top */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', letterSpacing: 3, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', mb: 0.3 }}>
                    Library Member Card
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#fff', lineHeight: 1.2 }}>
                    LibraSync
                  </Typography>
                </Box>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <Star sx={{ color: '#fbbf24', fontSize: 22 }} />
                </Box>
              </Box>

              {/* Card Bottom */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={photoSrc}
                    sx={{
                      width: 52, height: 52,
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                      fontSize: '1.2rem', fontWeight: 700,
                    }}
                  >
                    {!photoSrc && (user?.userFullName?.charAt(0)?.toUpperCase() || 'U')}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', lineHeight: 1.2 }}>
                      {user?.userFullName || 'Member'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
                      {user?.email}
                    </Typography>
                    <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', mt: 0.3 }}>
                      ID: {user?._id?.slice(-8)?.toUpperCase() || 'N/A'} · {user?.role?.toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{
                  p: 0.5, borderRadius: 1.5,
                  background: 'rgba(255,255,255,0.9)',
                }}>
                  <QRCodeSVG
                    value={`${window.location.origin}/profile/${user?._id || ''}`}
                    size={52}
                    level="M"
                    bgColor="transparent"
                  />
                </Box>
              </Box>
            </Box>

            {/* Download & Print Buttons */}
            <Box sx={{ textAlign: 'center', mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="contained"
                  startIcon={exportingPdf ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Download />}
                  onClick={handleExportCard}
                  disabled={exportingPdf}
                  sx={{
                    px: 3, py: 1.2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                  }}
                >
                  {exportingPdf ? 'Generating...' : 'Download PDF'}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    const html2canvas = import('html2canvas').then(m => m.default);
                    html2canvas.then(h2c => {
                      h2c(cardRef.current, { scale: 2, backgroundColor: null }).then(canvas => {
                        const img = canvas.toDataURL('image/png');
                        printWindow.document.write(`<html><head><title>Library Card</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0f172a"><img src="${img}" style="max-width:90vw" /></body></html>`);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      });
                    });
                  }}
                  sx={{
                    px: 3, py: 1.2,
                    borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8',
                    '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)' },
                  }}
                >
                  Print Card
                </Button>
              </motion.div>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </AnimatedPage>
  );
};

export default Profile;
