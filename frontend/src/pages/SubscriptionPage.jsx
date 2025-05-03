
import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Avatar } from '@mui/material';
import { CreditCard as CreditCardIcon, Cancel as CancelIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { backendUrl } from '../utils/constants';
import toast from 'react-hot-toast';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const token = localStorage.getItem('accessToken');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/members/${user.id}/subscription`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setActive(res.data.active);
      } catch {
        toast.error('Failed to load subscription');
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id, token]);

  const handleActivate = async () => {
    try {
      await axios.post(
        `${backendUrl}/members/${user.id}/subscription`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActive(true);
      toast.success('Subscription activated!');
    } catch {
      toast.error('Activation failed');
    }
  };

  const handleCancel = async () => {
    try {
      await axios.delete(
        `${backendUrl}/members/${user.id}/subscription`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActive(false);
      toast.success('Subscription canceled');
    } catch {
      toast.error('Cancellation failed');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, p: 2 }}>
      <Card elevation={4} sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar
            sx={{ bgcolor: active ? 'success.main' : 'error.main', mx: 'auto', mb: 2 }}>
            {active ? <CheckCircleIcon /> : <CancelIcon />}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {active ? 'Active Subscription' : 'No Active Subscription'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {active
              ? 'Thank you for staying with us! You can cancel anytime.'
              : 'Subscribe now to access personalized training sessions and track your progress.'}
          </Typography>
          {active ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              Cancel Subscription
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CreditCardIcon />}
              onClick={handleActivate}
            >
              Activate Subscription
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}