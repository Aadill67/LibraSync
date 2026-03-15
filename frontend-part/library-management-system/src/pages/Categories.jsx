import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Skeleton,
  Alert,
  InputAdornment,
  Grid,
} from '@mui/material';
import { Add, Delete, Category, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6',
];

const Categories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'admin' || user?.role === 'librarian';

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await API.get('/categories/allcategories');
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = categories.filter((c) =>
    c.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newCategory.trim()) {
      setAddError('Category name is required');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      await API.post('/categories/addcategory', { categoryName: newCategory.trim() });
      setAddOpen(false);
      setNewCategory('');
      setSuccess('Category added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchCategories();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/categories/deletecategory/${toDelete._id}`);
      setDeleteOpen(false);
      setToDelete(null);
      setSuccess('Category deleted!');
      setTimeout(() => setSuccess(''), 3000);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
      setDeleteOpen(false);
    }
  };

  return (
    <AnimatedPage>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Categories
          </Typography>
          {isStaff && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => { setAddError(''); setAddOpen(true); }}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                }}
              >
                Add Category
              </Button>
            </motion.div>
          )}
        </Box>

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

        {/* Category Cards Grid */}
        <Card sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Card>

        {loading ? (
          <Grid container spacing={2}>
            {[...Array(6)].map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : filtered.length > 0 ? (
          <Grid container spacing={2}>
            {filtered.map((cat, index) => {
              const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <Card
                      onClick={() => navigate(`/categories/${cat._id}`)}
                      sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${color}22`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: `${color}44`,
                          boxShadow: `0 4px 20px ${color}15`,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            background: `${color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Category sx={{ color, fontSize: 22 }} />
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {cat.categoryName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {cat.books?.length || 0} book{(cat.books?.length || 0) !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>
                      {isAdmin && (
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); setToDelete(cat); setDeleteOpen(true); }}
                          sx={{ color: '#f87171', opacity: 0.7, '&:hover': { opacity: 1 } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Category sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">
              {search ? 'No categories match your search' : 'No categories yet. Add one to get started!'}
            </Typography>
          </Card>
        )}

        {/* Add Dialog */}
        <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>Add New Category</DialogTitle>
          <DialogContent>
            {addError && (
              <Alert severity="error" sx={{ mb: 2, mt: 1, borderRadius: 2 }}>
                {addError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              sx={{ mt: 1 }}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddOpen(false)} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={addLoading}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
              }}
            >
              {addLoading ? 'Adding...' : 'Add Category'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{toDelete?.categoryName}</strong>?
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

export default Categories;
