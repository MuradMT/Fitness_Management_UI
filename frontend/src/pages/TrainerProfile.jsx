import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField,
  Card, CardContent, Avatar, Divider, CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  BusinessCenter as BizIcon,
  InfoOutlined as InfoIcon,
  Category as CategoryIcon,
  RequestQuote as RequestIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { backendUrl } from '../utils/constants';

export default function TrainerProfile() {
  const { id: memberId, trainerId } = useParams();
  const { user } = useAuth();
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState('');

  useEffect(() => {
    axios
      .get(`${backendUrl}/users/findOneTrainer/${trainerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setTrainer(res.data))
      .catch(() => toast.error('Failed to load trainer'))
      .finally(() => setLoading(false));
  }, [trainerId, token]);

  const sendRequest = () => {
    if (!goals.trim()) return toast.error('Please describe your goals');
    axios
      .post(
        `${backendUrl}/members/${memberId}/requests`,
        { trainerId, goals },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        toast.success('Request sent!');
        navigate(`/member/${memberId}/dashboard`);
      })
      .catch(err => toast.error(err.response?.data?.message || 'Send failed'));
  };

  if (loading) {
    return <Box textAlign="center" py={4}><CircularProgress /></Box>;
  }
  if (!trainer) {
    return <Typography align="center" py={4}>Trainer not found</Typography>;
  }

  const {
    firstName, lastName,
    dateOfBirth, email, address,
    isTrainer, bio, specifications = []
  } = trainer;

  const format = (icon, value) =>
    <Box display="flex" alignItems="center" mb={1}>
      {icon} <Typography sx={{ ml: 1 }}>{value || '—'}</Typography>
    </Box>;

  return (
    <Box p={3} display="flex" justifyContent="center">
      <Card sx={{ maxWidth: 600, width: '100%' }} elevation={3}>
        <CardContent>
          
          <Box textAlign="center" mb={2}>
            <Avatar sx={{ mx: 'auto', bgcolor: 'primary.main', width: 64, height: 64 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" mt={1}>
              {`${firstName || 'N/A'} ${lastName || ''}`.trim()}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          
          {format(<CalendarIcon color="action" />, new Date(dateOfBirth).toLocaleDateString())}
          {format(<EmailIcon color="action" />, email)}
          {format(<HomeIcon color="action" />, `${address?.street}, ${address?.city}, ${address?.postcode}`)}
          {format(<BizIcon color="action" />, isTrainer ? 'Certified Trainer' : 'User')}

          
          {bio && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoIcon color="action" />
                <Typography sx={{ ml: 1, fontWeight: 500 }}>Bio</Typography>
              </Box>
              <Typography>{bio}</Typography>
            </Box>
          )}

         
          {specifications.length > 0 && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <CategoryIcon color="action" />
                <Typography sx={{ ml: 1, fontWeight: 500 }}>Specialties</Typography>
              </Box>
              <Typography>{specifications.join(', ')}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Send Training Request
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Describe your fitness goals..."
            value={goals}
            onChange={e => setGoals(e.target.value)}
          />
          <Button
            variant="contained"
            startIcon={<RequestIcon />}
            sx={{ mt: 2 }}
            onClick={sendRequest}
          >
            Send Request
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}