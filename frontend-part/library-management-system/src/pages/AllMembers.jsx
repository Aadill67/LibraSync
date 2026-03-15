import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Skeleton,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TablePagination,
} from '@mui/material';
import { Search, Delete, Visibility, FileDownload, CheckCircle, Block } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AllMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users/allmembers');
      setMembers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(
    (m) =>
      m.userFullName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.admissionId?.toLowerCase().includes(search.toLowerCase()) ||
      m.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedMembers = filteredMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Mobile', 'Role', 'ID', 'Gender', 'Age', 'Joined'];
    const rows = filteredMembers.map((m) => [
      m.userFullName,
      m.email,
      m.mobileNumber || '',
      m.role,
      m.admissionId || m.employeeId || '',
      m.gender || '',
      m.age || '',
      m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/users/deleteuser/${memberToDelete._id}`);
      setDeleteOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete member');
      setDeleteOpen(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/users/approve/${id}`);
      setSuccess('User account approved!');
      setTimeout(() => setSuccess(''), 3000);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await API.put(`/users/suspend/${id}`);
      setSuccess('User account suspended.');
      setTimeout(() => setSuccess(''), 3000);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to suspend user');
    }
  };

  const pendingMembers = members.filter((m) => m.accountStatus === 'pending');

  const roleColors = {
    admin: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
    librarian: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    member: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  };

  const avatarGradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #11998e, #38ef7d)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #6366f1, #ec4899)',
  ];

  return (
    <AnimatedPage>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          Members
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {success}
            </Alert>
          </motion.div>
        )}

        {/* Pending Approvals Section */}
        {pendingMembers.length > 0 && (
          <Card sx={{ p: 2, mb: 3, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#fbbf24' }}>
              ⏳ Pending Approvals ({pendingMembers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {pendingMembers.map((m) => (
                <Box
                  key={m._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(245,158,11,0.06)',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={m.photo ? `${API_BASE}${m.photo}` : undefined}
                      sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #f59e0b, #f97316)', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      {!m.photo && m.userFullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.userFullName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{m.email}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
                      onClick={() => handleApprove(m._id)}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        fontSize: '0.75rem',
                        py: 0.5,
                        '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' },
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Block sx={{ fontSize: 16 }} />}
                      onClick={() => handleSuspend(m._id)}
                      sx={{
                        borderColor: '#ef4444',
                        color: '#f87171',
                        fontSize: '0.75rem',
                        py: 0.5,
                        '&:hover': { borderColor: '#dc2626', backgroundColor: 'rgba(239,68,68,0.08)' },
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        )}

        {/* Search + Export */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              onClick={exportCSV}
              sx={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}
            >
              Export CSV
            </Button>
          </Box>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="center">Active Borrows</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredMembers.length > 0 ? (
                  paginatedMembers.map((member, index) => (
                    <motion.tr
                      key={member._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={member.photo ? `${API_BASE}${member.photo}` : undefined}
                            sx={{
                              width: 36,
                              height: 36,
                              background: member.photo ? 'transparent' : avatarGradients[index % avatarGradients.length],
                              fontSize: '0.85rem',
                              fontWeight: 600,
                            }}
                          >
                            {!member.photo && member.userFullName?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {member.userFullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {member.mobileNumber || '—'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {member.email}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {member.admissionId || member.employeeId || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.role}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            ...roleColors[member.role],
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={member.activeTransactions?.length || 0}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            minWidth: 28,
                            backgroundColor:
                              (member.activeTransactions?.length || 0) > 0
                                ? 'rgba(99,102,241,0.15)'
                                : 'rgba(148,163,184,0.1)',
                            color:
                              (member.activeTransactions?.length || 0) > 0
                                ? '#818cf8'
                                : '#64748b',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          sx={{ color: '#818cf8' }}
                          onClick={() => { setSelectedMember(member); setDetailOpen(true); }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: '#f87171', ml: 0.5 }}
                          onClick={() => { setMemberToDelete(member); setDeleteOpen(true); }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                      {search ? 'No members found matching your search' : 'No members registered yet'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredMembers.length > 0 && (
            <TablePagination
              component="div"
              count={filteredMembers.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}
            />
          )}
        </Card>

        {/* Member Detail Dialog */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>Member Details</DialogTitle>
          <DialogContent>
            {selectedMember && (
              <Box sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    src={selectedMember.photo ? `${API_BASE}${selectedMember.photo}` : undefined}
                    sx={{
                      width: 56,
                      height: 56,
                      background: selectedMember.photo ? 'transparent' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                      fontSize: '1.3rem',
                      fontWeight: 600,
                    }}
                  >
                    {!selectedMember.photo && selectedMember.userFullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedMember.userFullName}
                    </Typography>
                    <Chip
                      label={selectedMember.role}
                      size="small"
                      sx={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        ...roleColors[selectedMember.role],
                      }}
                    />
                  </Box>
                </Box>

                {[
                  { label: 'Email', value: selectedMember.email },
                  { label: 'Mobile', value: selectedMember.mobileNumber },
                  { label: 'Admission ID', value: selectedMember.admissionId },
                  { label: 'Employee ID', value: selectedMember.employeeId },
                  { label: 'Gender', value: selectedMember.gender },
                  { label: 'Age', value: selectedMember.age },
                  { label: 'Active Borrows', value: selectedMember.activeTransactions?.length || 0 },
                  { label: 'Total Transactions', value: (selectedMember.activeTransactions?.length || 0) + (selectedMember.prevTransactions?.length || 0) },
                  { label: 'Joined', value: selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : '—' },
                ].filter((item) => item.value).map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: '1px solid rgba(148,163,184,0.08)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>Delete Member</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{memberToDelete?.userFullName}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteOpen(false)} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AnimatedPage>
  );
};

export default AllMembers;
