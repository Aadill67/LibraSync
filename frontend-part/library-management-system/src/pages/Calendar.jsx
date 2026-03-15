import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Chip, Grid, IconButton, Skeleton, Tooltip,
  Avatar, Badge, Alert,
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, CalendarMonth as CalIcon,
  MenuBook, Warning, CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import API from '../api/axios';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/transactions/all-transactions');
        setTransactions(Array.isArray(data) ? data : []);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty cells for padding
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [year, month]);

  // Map events to dates
  const eventMap = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      // Due dates
      if (t.toDate) {
        const key = new Date(t.toDate).toDateString();
        if (!map[key]) map[key] = [];
        const isOverdue = t.transactionStatus === 'active' && new Date(t.toDate) < new Date();
        map[key].push({
          ...t,
          eventType: isOverdue ? 'overdue' : 'due',
        });
      }
      // Return dates
      if (t.returnDate) {
        const key = new Date(t.returnDate).toDateString();
        if (!map[key]) map[key] = [];
        map[key].push({ ...t, eventType: 'returned' });
      }
    });
    return map;
  }, [transactions]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  const selectedEvents = selectedDate
    ? eventMap[new Date(year, month, selectedDate).toDateString()] || []
    : [];

  const eventColors = { due: '#f59e0b', overdue: '#ef4444', returned: '#10b981' };
  const eventIcons = { due: <MenuBook fontSize="small" />, overdue: <Warning fontSize="small" />, returned: <CheckCircle fontSize="small" /> };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <CalIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Calendar</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Due dates, returns, and overdue books</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Calendar Grid */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2, borderRadius: 3 }}>
            {/* Month Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={prevMonth}><ChevronLeft /></IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {MONTHS[month]} {year}
              </Typography>
              <IconButton onClick={nextMonth}><ChevronRight /></IconButton>
            </Box>

            {/* Day Headers */}
            <Grid container>
              {DAYS.map((d) => (
                <Grid size={12 / 7} key={d}>
                  <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', fontWeight: 600, color: 'text.secondary', py: 1 }}>
                    {d}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Cells */}
            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ) : (
              <Grid container>
                {calendarDays.map((day, i) => {
                  if (day === null) return <Grid size={12 / 7} key={`e-${i}`} />;
                  const dateStr = new Date(year, month, day).toDateString();
                  const events = eventMap[dateStr] || [];
                  const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                  const isSelected = selectedDate === day;
                  const hasOverdue = events.some((e) => e.eventType === 'overdue');
                  const hasDue = events.some((e) => e.eventType === 'due');
                  const hasReturned = events.some((e) => e.eventType === 'returned');

                  return (
                    <Grid size={12 / 7} key={day}>
                      <Box
                        onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                        sx={{
                          textAlign: 'center', py: 1.5, mx: 0.3, my: 0.3,
                          borderRadius: 2, cursor: 'pointer',
                          bgcolor: isSelected ? 'primary.main' : isToday ? 'rgba(99,102,241,0.1)' : 'transparent',
                          color: isSelected ? '#fff' : 'text.primary',
                          border: isToday && !isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' },
                          position: 'relative',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 400 }}>{day}</Typography>
                        {events.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3, mt: 0.3 }}>
                            {hasOverdue && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444' }} />}
                            {hasDue && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />}
                            {hasReturned && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
              {[['Due', '#f59e0b'], ['Overdue', '#ef4444'], ['Returned', '#10b981']].map(([label, color]) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Selected Day Events */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, borderRadius: 3, minHeight: 300 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {selectedDate
                ? `${MONTHS[month]} ${selectedDate}, ${year}`
                : 'Select a date'}
            </Typography>

            {!selectedDate ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>Click a date to see events</Alert>
            ) : selectedEvents.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No events on this date</Alert>
            ) : (
              selectedEvents.map((evt, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Box
                    sx={{
                      p: 1.5, mb: 1.5, borderRadius: 2,
                      border: `1px solid ${eventColors[evt.eventType]}30`,
                      background: `${eventColors[evt.eventType]}08`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: `${eventColors[evt.eventType]}20`, color: eventColors[evt.eventType] }}>
                        {eventIcons[evt.eventType]}
                      </Avatar>
                      <Chip
                        label={evt.eventType.charAt(0).toUpperCase() + evt.eventType.slice(1)}
                        size="small"
                        sx={{ bgcolor: `${eventColors[evt.eventType]}15`, color: eventColors[evt.eventType], height: 22, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{evt.bookName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {evt.borrowerName}
                    </Typography>
                  </Box>
                </motion.div>
              ))
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Calendar;
