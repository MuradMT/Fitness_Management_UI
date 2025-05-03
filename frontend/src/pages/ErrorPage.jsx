
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';

export default function ErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const message = location.state?.message || 'An unexpected error occurred.';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        p: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h3" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {message}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login')}
        >
          Back to Login
        </Button>
      </Container>
    </Box>
  );
}

