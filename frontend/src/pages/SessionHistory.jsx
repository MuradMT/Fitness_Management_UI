import React, { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { backendUrl } from '../utils/constants';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SessionHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    (async () => {
      try {
        const [sessionsRes, historyRes] = await Promise.all([
          axios.get(`${backendUrl}/members/${user.id}/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${backendUrl}/members/${user.id}/history`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setSessions(sessionsRes.data.sessions);
        const chart = historyRes.data.sessions.map(s => ({
          date: new Date(s.date).toLocaleDateString(),
          duration: s.duration || 0
        }));
        setChartData(chart);
      } catch {
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id, token]);

  const fetchSessionDetails = async (sessionId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/members/${user.id}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const session = data.session;

      const [trainerRes, venueRes] = await Promise.all([
        axios.get(`${backendUrl}/users/findOneTrainer/${session.trainerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${backendUrl}/venues/${session.venueId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSelectedSession({
        ...session,
        trainer: trainerRes.data,
        venue: venueRes.data.venue
      });
      setDialogOpen(true);
    } catch {
      toast.error('Failed to load session details');
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4 }}>
      <Typography variant="h4" gutterBottom textAlign="center">Session History</Typography>

      {loading ? (
        <Box textAlign="center" mt={4}><CircularProgress /></Box>
      ) : (
        <>
          <Box mb={4} sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="duration" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {sessions.map(s => (
              <Grid item xs={12} md={6} key={s._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      Date: {new Date(s.date).toLocaleString()}
                    </Typography>
                    <Typography>Status: {s.status}</Typography>
                    <Typography>Duration: {s.duration || 'N/A'} hrs</Typography>
                    <Button sx={{ mt: 1 }} variant="outlined" size="small" onClick={() => fetchSessionDetails(s._id)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Session Details</DialogTitle>
            <DialogContent>
              {selectedSession && (
                <>
                  <Typography><strong>Date:</strong> {new Date(selectedSession.date).toLocaleString()}</Typography>
                  <Typography><strong>Status:</strong> {selectedSession.status}</Typography>
                  <Typography><strong>Progress:</strong> {selectedSession.progress || 'N/A'}</Typography>
                  <Typography><strong>Duration:</strong> {selectedSession.duration || 'N/A'} hrs</Typography>
                  <Typography sx={{ mt: 2 }}><strong>Trainer:</strong> {selectedSession.trainer?.firstName} {selectedSession.trainer?.lastName} ({selectedSession.trainer?.email})</Typography>
                  <Typography><strong>Venue:</strong> {selectedSession.venue?.name}, {selectedSession.venue?.address}</Typography>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </Box>
  );
}
