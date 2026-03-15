import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import {
  Box, Card, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, IconButton, Skeleton,
  Alert, MenuItem, Collapse, Tooltip, LinearProgress,
} from '@mui/material';
import {
  Search, Add, Edit, Delete, MenuBook, FilterList, Close,
  Upload, Download, ExpandMore, ExpandLess, Star, Visibility, Sort, ImageSearch,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyBook = {
  bookName: '', author: '', isbn: '', publisher: '',
  language: 'English', bookCountAvailable: 1, description: '', categories: [], coverImage: '',
};

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Other'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'bookName', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'avgRating', label: 'Rating' },
  { value: 'bookCountAvailable', label: 'Availability' },
];

const AllBooks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBooks, setTotalBooks] = useState(0);

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterAvailable, setFilterAvailable] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [formData, setFormData] = useState(emptyBook);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fetchingCover, setFetchingCover] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const isStaff = user?.role === 'admin' || user?.role === 'librarian';

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage, sortBy, sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterCategory) params.category = filterCategory;
      if (filterLanguage) params.language = filterLanguage;
      if (filterAvailable) params.available = filterAvailable;
      const res = await API.get('/books/allbooks', { params });
      setBooks(res.data.books);
      setTotalBooks(res.data.totalBooks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories/allcategories');
      setCategories(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchBooks(); }, [page, rowsPerPage, debouncedSearch, filterCategory, filterLanguage, filterAvailable, sortBy, sortOrder]);
  useEffect(() => { fetchCategories(); }, []);

  const handleOpenAdd = () => { setFormData(emptyBook); setDialogMode('add'); setFormError(''); setDialogOpen(true); };
  const handleOpenEdit = (book) => {
    setFormData({
      _id: book._id, bookName: book.bookName || '', author: book.author || '',
      isbn: book.isbn || '', publisher: book.publisher || '', language: book.language || 'English',
      bookCountAvailable: book.bookCountAvailable ?? 1, description: book.description || '',
      categories: book.categories?.map((c) => c._id || c) || [],
    });
    setDialogMode('edit'); setFormError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.bookName || !formData.author) { setFormError('Book name and author are required'); return; }
    setSaving(true); setFormError('');
    try {
      if (dialogMode === 'add') await API.post('/books/addbook', formData);
      else await API.put(`/books/updatebook/${formData._id}`, formData);
      setDialogOpen(false); fetchBooks();
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to save book'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/books/removebook/${bookToDelete._id}`);
      setDeleteDialogOpen(false); setBookToDelete(null); fetchBooks();
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete book'); setDeleteDialogOpen(false); }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true); setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await API.post('/books/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(res.data);
      setSuccess(`Imported ${res.data.imported || 0} books!`);
      setTimeout(() => setSuccess(''), 4000);
      fetchBooks();
    } catch (err) {
      setImportResult({ error: err.response?.data?.message || 'Import failed' });
    } finally { setImporting(false); }
  };

  const handleExport = async () => {
    try {
      const res = await API.get('/books/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `librasync_books_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      setSuccess('Books exported!'); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Export failed'); }
  };

  const clearFilters = () => {
    setFilterCategory(''); setFilterLanguage(''); setFilterAvailable('');
    setSortBy('createdAt'); setSortOrder('desc'); setSearch(''); setPage(0);
  };

  const hasActiveFilters = filterCategory || filterLanguage || filterAvailable || sortBy !== 'createdAt' || sortOrder !== 'desc';

  return (
    <AnimatedPage>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Books</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {isStaff && (
              <>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outlined" startIcon={<Download />} onClick={handleExport}
                    sx={{ borderColor: 'rgba(16,185,129,0.4)', color: '#34d399', '&:hover': { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)' } }}
                  >Export CSV</Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outlined" startIcon={<Upload />} onClick={() => { setImportOpen(true); setImportFile(null); setImportResult(null); }}
                    sx={{ borderColor: 'rgba(245,158,11,0.4)', color: '#fbbf24', '&:hover': { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' } }}
                  >Import CSV</Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}
                    sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' } }}
                  >Add Book</Button>
                </motion.div>
              </>
            )}
          </Box>
        </Box>

        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
          </motion.div>}
          {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>
          </motion.div>}
        </AnimatePresence>

        {/* Search + Filter Toggle */}
        <Card sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth placeholder="Search books by title, author, or ISBN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment>,
              }}
              size="small"
            />
            <Tooltip title="Advanced Filters">
              <IconButton
                onClick={() => setFiltersOpen(!filtersOpen)}
                sx={{
                  color: hasActiveFilters ? '#818cf8' : 'text.secondary',
                  background: hasActiveFilters ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: hasActiveFilters ? '1px solid rgba(99,102,241,0.3)' : 'none',
                  '&:hover': { background: 'rgba(99,102,241,0.15)' },
                }}
              >
                {filtersOpen ? <ExpandLess /> : <FilterList />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Collapsible Filter Panel */}
          <Collapse in={filtersOpen}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField select fullWidth size="small" label="Category" value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}>
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((cat) => <MenuItem key={cat._id} value={cat._id}>{cat.categoryName}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField select fullWidth size="small" label="Language" value={filterLanguage}
                    onChange={(e) => { setFilterLanguage(e.target.value); setPage(0); }}>
                    <MenuItem value="">All Languages</MenuItem>
                    {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField select fullWidth size="small" label="Availability" value={filterAvailable}
                    onChange={(e) => { setFilterAvailable(e.target.value); setPage(0); }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Available</MenuItem>
                    <MenuItem value="false">Unavailable</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField select fullWidth size="small" label="Sort By" value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}>
                      {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                    </TextField>
                    <Tooltip title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}>
                      <IconButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} size="small"
                        sx={{ color: '#818cf8' }}>
                        <Sort sx={{ transform: sortOrder === 'asc' ? 'scaleY(-1)' : 'none', transition: 'transform 0.3s' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  {hasActiveFilters && (
                    <Button size="small" startIcon={<Close />} onClick={clearFilters}
                      sx={{ color: '#f87171' }}>
                      Clear Filters
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Card>

        {/* Books Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book Name</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>ISBN</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell align="center">Available</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : books.length > 0 ? (
                  books.map((book, index) => (
                    <motion.tr
                      key={book._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.15))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <MenuBook sx={{ fontSize: 18, color: '#818cf8' }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{book.bookName}</Typography>
                            {book.avgRating > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <Star sx={{ fontSize: 12, color: '#fbbf24' }} />
                                <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 600 }}>
                                  {book.avgRating?.toFixed(1)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{book.isbn || '—'}</TableCell>
                      <TableCell>{book.language}</TableCell>
                      <TableCell align="center">
                        <Chip label={book.bookCountAvailable} size="small" sx={{
                          fontWeight: 700, minWidth: 32,
                          backgroundColor: book.bookCountAvailable > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: book.bookCountAvailable > 0 ? '#34d399' : '#f87171',
                        }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={book.bookCountAvailable > 0 ? 'Available' : 'Unavailable'} size="small" sx={{
                          fontWeight: 600, fontSize: '0.7rem',
                          backgroundColor: book.bookCountAvailable > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: book.bookCountAvailable > 0 ? '#34d399' : '#f87171',
                        }} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => navigate(`/book/${book._id}`)} sx={{ color: '#818cf8' }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isStaff && (
                          <>
                            <IconButton size="small" onClick={() => handleOpenEdit(book)} sx={{ color: '#818cf8' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                            {user?.role === 'admin' && (
                              <IconButton size="small" onClick={() => { setBookToDelete(book); setDeleteDialogOpen(true); }}
                                sx={{ color: '#f87171', ml: 0.5 }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                      {search || hasActiveFilters ? 'No books found matching your filters' : 'No books in the library yet'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={totalBooks} page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: '1px solid rgba(148,163,184,0.1)' }}
          />
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>
            {dialogMode === 'add' ? 'Add New Book' : 'Edit Book'}
          </DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2, mt: 1, borderRadius: 2 }}>{formError}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={12}>
                <TextField fullWidth label="Book Name" value={formData.bookName}
                  onChange={(e) => setFormData({ ...formData, bookName: e.target.value })} required />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Author" value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })} required />
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField fullWidth label="ISBN" value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} />
                  <Tooltip title="Fetch cover image from Open Library">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!formData.isbn || fetchingCover}
                      onClick={async () => {
                        setFetchingCover(true);
                        try {
                          const cleanIsbn = formData.isbn.replace(/[-\s]/g, '');
                          const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;
                          const res = await fetch(coverUrl);
                          if (res.ok) {
                            setFormData({ ...formData, coverImage: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg` });
                            setSuccess('Cover image fetched successfully!');
                            setTimeout(() => setSuccess(''), 3000);
                          } else {
                            setFormError('No cover found for this ISBN. You can add one manually.');
                          }
                        } catch {
                          setFormError('Failed to fetch cover. Try again or add manually.');
                        } finally {
                          setFetchingCover(false);
                        }
                      }}
                      sx={{ minWidth: 100, borderColor: '#6366f1', color: '#818cf8', whiteSpace: 'nowrap' }}
                      startIcon={<ImageSearch sx={{ fontSize: 16 }} />}
                    >
                      {fetchingCover ? '...' : 'Fetch Cover'}
                    </Button>
                  </Tooltip>
                </Box>
                {formData.coverImage && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img src={formData.coverImage} alt="Cover preview" style={{ height: 60, borderRadius: 4, objectFit: 'cover' }} />
                    <Button size="small" onClick={() => setFormData({ ...formData, coverImage: '' })} sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      Remove
                    </Button>
                  </Box>
                )}
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Publisher" value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Language" value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Available Copies" type="number" value={formData.bookCountAvailable}
                  onChange={(e) => setFormData({ ...formData, bookCountAvailable: Number(e.target.value) })} inputProps={{ min: 0 }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth select label="Category" value={formData.categories[0] || ''}
                  onChange={(e) => setFormData({ ...formData, categories: e.target.value ? [e.target.value] : [] })}>
                  <MenuItem value="">None</MenuItem>
                  {categories.map((cat) => <MenuItem key={cat._id} value={cat._id}>{cat.categoryName}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Description" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline rows={3} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' } }}>
              {saving ? 'Saving...' : dialogMode === 'add' ? 'Add Book' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Book</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{bookToDelete?.bookName}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Import CSV Dialog */}
        <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Import Books from CSV
            <IconButton onClick={() => setImportOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{
              border: '2px dashed rgba(99,102,241,0.3)',
              borderRadius: 3, p: 4, textAlign: 'center', mb: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: importFile ? 'rgba(16,185,129,0.05)' : 'rgba(99,102,241,0.03)',
              '&:hover': { borderColor: '#6366f1', background: 'rgba(99,102,241,0.08)' },
            }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366f1'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) setImportFile(f);
              }}
            >
              <Upload sx={{ fontSize: 48, color: importFile ? '#34d399' : '#818cf8', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: importFile ? '#34d399' : 'text.primary' }}>
                {importFile ? importFile.name : 'Drop your CSV file here'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : 'or click to browse · CSV format required'}
              </Typography>
              <input ref={fileInputRef} type="file" accept=".csv" hidden
                onChange={(e) => setImportFile(e.target.files[0])} />
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              CSV columns: bookName, author, isbn, publisher, language, bookCountAvailable, description
            </Typography>

            {importing && <LinearProgress sx={{ mb: 2, borderRadius: 1, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6366f1, #ec4899)' } }} />}

            {importResult && (
              <Alert severity={importResult.error ? 'error' : 'success'} sx={{ borderRadius: 2 }}>
                {importResult.error ? importResult.error :
                  `Successfully imported ${importResult.imported || 0} books${importResult.skipped ? ` · ${importResult.skipped} skipped` : ''}`}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setImportOpen(false)} sx={{ color: 'text.secondary' }}>Close</Button>
            <Button variant="contained" onClick={handleImport} disabled={!importFile || importing}
              startIcon={importing ? null : <Upload />}
              sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' } }}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AnimatedPage>
  );
};

export default AllBooks;
