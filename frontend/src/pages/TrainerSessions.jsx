import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { backendUrl } from '../utils/constants';
import toast from 'react-hot-toast';

export default function TrainerSessions() {
  const { user } = useAuth();
  const token = localStorage.getItem('accessToken');

  const [sessions, setSessions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [memberMap, setMemberMap] = useState({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    progress: '',
    duration: '',
    nextSessionDate: null,
    nextVenueId: ''
  });
  const [subscriptionStatuses, setSubscriptionStatuses] = useState({});
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [sessRes, venuesRes,subsRes] = await Promise.all([
        axios.get(`${backendUrl}/trainers/${user.id}/sessions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${backendUrl}/venues`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${backendUrl}/members/${user.id}/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      const sessList = sessRes.data.sessions || [];
      setSessions(sessList);
      setVenues(venuesRes.data.venues || []);
      fetchMembers(sessList);

      const statuses = {};
      for (const req of sessList) {
        try {
          const subRes = await axios.get(`${backendUrl}/members/${req.memberId}/subscription`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          statuses[req.memberId] = subRes.data.active;
        } catch (err) {
          console.error("Subscription fetch failed for:", req.memberEmail);
          statuses[req._id] = false;
        }
      }
      setSubscriptionStatuses(statuses);
    } catch (err) {
      toast.error('Failed to load sessions or venues');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (sessList) => {
    const ids = Array.from(new Set(sessList.map(s => s.memberId)));
    try {
      const results = await Promise.all(
        ids.map(id =>
          axios.get(`${backendUrl}/users/findOneMember/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => ({ id, data: res.data.member || res.data }))
            .catch(() => null)
        )
      );
      const map = {};
      results.forEach(r => {
        if (r && r.data) map[r.id] = r.data;
      });
      setMemberMap(map);
    } catch {
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user.id]);

  const openDialog = (sess) => {
    if (!subscriptionStatuses[sess.memberId]) {
      toast.error('Member does not have an active subscription, you cannot proceed');
      return;
    }
    setSelected(sess);
    setForm({
      progress: sess.progress || '',
      duration: sess.duration != null ? sess.duration : '',
      nextSessionDate: null,
      nextVenueId: ''
    });
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    const dto = {
      progress: form.progress,
      duration: form.duration === '' ? undefined : Number(form.duration),
      nextSessionDate: form.nextSessionDate ? form.nextSessionDate.toISOString() : undefined,
      nextVenueId: form.nextVenueId || undefined
    };
    try {
      await axios.put(
        `${backendUrl}/trainers/${user.id}/sessions/${selected._id}`,
        dto,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Session updated!');
      setDialogOpen(false);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}><CircularProgress/></Box>
    );
  }

  const scheduled = sessions.filter(s => s.status === 'scheduled');

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Your Sessions</Typography>

      {scheduled.length === 0 ? (
        <Typography color="text.secondary" mt={2}>No scheduled sessions.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Member</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scheduled.map(s => {
                const m = memberMap[s.memberId];
                return (
                  <TableRow key={s._id} hover>
                    <TableCell>{new Date(s.date).toLocaleString()}</TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell>
                      {m
                        ? `${m.firstName} ${m.lastName} — ${m.email}`
                        : 'Loading...'}
                    </TableCell>
                    <TableCell>
                      {subscriptionStatuses[s.memberId] ? 'Active' : 'Inactive'}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openDialog(s)}>Update</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Session</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Progress Notes (optional)"
              multiline
              minRows={3}
              value={form.progress}
              onChange={e => setForm(f => ({ ...f, progress: e.target.value }))}
            />
            <TextField
              label="Duration (hours, optional)"
              type="number"
              inputProps={{ min: 0, step: 0.1 }}
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Next Session Date (optional)"
                value={form.nextSessionDate}
                onChange={date => setForm(f => ({ ...f, nextSessionDate: date }))}
                renderInput={params => <TextField {...params} />}
              />
            </LocalizationProvider>
            <TextField
              label="Next Venue (optional)"
              select
              value={form.nextVenueId}
              onChange={e => setForm(f => ({ ...f, nextVenueId: e.target.value }))}
            >
              <MenuItem value="">— keep current —</MenuItem>
              {venues.map(v => (
                <MenuItem key={v._id} value={v._id}>{v.name} — {v.address}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
