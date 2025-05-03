import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#000', color: '#fff', py: 2 }}>
      <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
        <Typography variant="body2">© {new Date().getFullYear()} FitnessPro</Typography>
        <Box>
          <Link href="/terms" color="inherit" underline="hover" sx={{ mx: 1 }}>Terms</Link>
          <Link href="/privacy" color="inherit" underline="hover" sx={{ mx: 1 }}>Privacy</Link>
        </Box>
      </Container>
    </Box>
  );
}
