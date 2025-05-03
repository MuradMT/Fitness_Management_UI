import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  Button,
  Chip,
  TableContainer,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box as MuiBox
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { backendUrl } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function MyRequests() {
  const { user } = useAuth();
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [primaryTrainer, setPrimaryTrainer] = useState(null);
  const [altTrainer, setAltTrainer] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [{ data: reqPayload }, { data: apptPayload },{data:subsPayload}] = await Promise.all([
          axios.get(`${backendUrl}/members/${user.id}/requests`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${backendUrl}/members/${user.id}/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${backendUrl}/members/${user.id}/subscription`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setRequests(reqPayload.requests || []);
        setAppointments(apptPayload.appointments || []);
        setSubscription(subsPayload.active || false);
      } catch {
        setRequests([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user.id, token]);

  const statusColor = {
    pending: 'default',
    accepted: 'success',
    rejected: 'error',
    suggested: 'warning',
    cancelled: 'error'
  };

  const uniqueRequests = React.useMemo(() => {
    const seen = new Set();
    return requests.filter(r => {
      if (r.status === 'accepted') {
        if (seen.has(r.trainerId)) return false;
        seen.add(r.trainerId);
      }
      return true;
    });
  }, [requests]);

  const cancelRequest = async (requestId) => {
    try {
      await axios.delete(
        `${backendUrl}/members/${user.id}/requests/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Request cancelled');
      setRequests(reqs => reqs.filter(r => r._id !== requestId));
    } catch {
      toast.error('Failed to cancel request');
    }
  };

  const openDetails = async (req) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/members/${user.id}/requests/${req._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDetail(data.request || data);
      const pt = await axios.get(
        `${backendUrl}/users/findOneTrainer/${req.trainerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPrimaryTrainer(pt.data || pt.data.data);
      if (req.alternativeTrainerId) {
        const at = await axios.get(
          `${backendUrl}/users/findOneTrainer/${req.alternativeTrainerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAltTrainer(at.data || at.data.data);
      } else {
        setAltTrainer(null);
      }
      setDialogOpen(true);
    } catch {
      toast.error('Failed to load request details');
    }
  };

  const closeDetails = () => {
    setDialogOpen(false);
    setDetail(null);
    setPrimaryTrainer(null);
    setAltTrainer(null);
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  if(!subscription){
    return (
      <Typography align="center" variant="h6" color="text.secondary" mt={2}>
        You can not access to my requests page without active subscription.
      </Typography>
    );
  }
  if (!uniqueRequests.length) {
    return (
      <Typography align="center" variant="h6" color="text.secondary" mt={2}>
        You have no training requests.
      </Typography>
    );
  }


  return (
    <Box p={3}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Goals</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uniqueRequests.map(r => (
              <TableRow key={r._id} hover>
                <TableCell>{r.goals}</TableCell>
                <TableCell>
                  <Chip
                    label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    color={statusColor[r.status]}
                  />
                </TableCell>
                <TableCell align="right">
                  {r.status === 'pending' && (
                    <Button size="small" color="error" variant="outlined" onClick={() => cancelRequest(r._id)}>
                      Cancel Request
                    </Button>
                  )}
                  {r.status === 'accepted' && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        toast('Please schedule a session on the Appointments page.', { icon: '⏳', duration: 2000 });
                        setTimeout(() => navigate(`/member/${user.id}/appointments`), 2000);
                      }}
                    >
                      Schedule Session
                    </Button>
                  )}
                  {r.status === 'suggested' && (
                    <Button size="small" component={RouterLink} to={`/member/${user.id}/trainers/${r.alternativeTrainerId}`} variant="outlined">
                      View Alternative
                    </Button>
                  )}
                  <Button size="small" sx={{ ml: 1 }} onClick={() => openDetails(r)}>
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDetails} fullWidth maxWidth="sm">
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <MuiBox>
              <Typography><strong>Goals:</strong> {detail.goals}</Typography>
              <Typography><strong>Status:</strong> {detail.status}</Typography>
              <Typography><strong>Requested At:</strong> {new Date(detail.createdAt).toLocaleString()}</Typography>
              <Box mt={2}>
                <Typography variant="subtitle1">Primary Trainer</Typography>
                {primaryTrainer ? (
                  <Box ml={2}>
                    <Typography><strong>Name:</strong> {primaryTrainer.firstName} {primaryTrainer.lastName}</Typography>
                    <Typography><strong>Email:</strong> {primaryTrainer.email}</Typography>
                  </Box>
                ) : <Typography>–</Typography>}
              </Box>
              {altTrainer && (
                <Box mt={2}>
                  <Typography variant="subtitle1">Alternative Trainer</Typography>
                  <Box ml={2}>
                    <Typography><strong>Name:</strong> {altTrainer.firstName} {altTrainer.lastName}</Typography>
                    <Typography><strong>Email:</strong> {altTrainer.email}</Typography>
                  </Box>
                </Box>
              )}
            </MuiBox>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}