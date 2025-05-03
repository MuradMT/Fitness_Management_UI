import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  duration,
} from '@mui/material';
import axios from 'axios';
import { backendUrl } from '../utils/constants';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const inputsRef = useRef([]);

  const handleInputChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const joinedCode = code.join('');
    if (!joinedCode || joinedCode.length < 6) {
      toast.error('Please enter full 6-digit code.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${backendUrl}/auth/verify-email`, { email, code: joinedCode });
      toast.success('Email verified successfully,now please login!',{duration: 2000});
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await axios.post(`${backendUrl}/auth/resend-code`, { email });
      toast.success('Verification code resent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resend failed.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      px={2}
    >
      <Typography variant="h5" gutterBottom>
        Verify Your Email
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        A code was sent to <strong>{email}</strong>
      </Typography>

      <Box display="flex" gap={1} mb={2}>
        {code.map((digit, i) => (
          <TextField
            key={i}
            value={digit}
            inputRef={(el) => (inputsRef.current[i] = el)}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontSize: '24px',
                width: '45px',
                height: '45px'
              }
            }}
          />
        ))}
      </Box>

      <Button
        variant="contained"
        fullWidth
        sx={{ maxWidth: 400 }}
        disabled={loading}
        onClick={handleVerify}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
      </Button>

      <Button
        sx={{ mt: 2, maxWidth: 400 }}
        color="secondary"
        onClick={handleResend}
        disabled={resending}
      >
        {resending ? 'Resending...' : 'Resend Code'}
      </Button>
    </Box>
  );
}