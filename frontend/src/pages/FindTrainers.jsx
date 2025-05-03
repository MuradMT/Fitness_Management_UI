import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  CircularProgress,
  Paper,
  TableContainer,
  Typography,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { backendUrl } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';

export default function FindTrainers() {
  const { user } = useAuth();
  const token = localStorage.getItem('accessToken');
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [filters, setFilters] = useState({ firstName: '', lastName: '', email: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [trainers, setTrainers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      try {
        const params = {
          page: page + 1,
          limit: rowsPerPage,
          ...(filters.firstName && { firstName: filters.firstName }),
          ...(filters.lastName && { lastName: filters.lastName }),
          ...(filters.email && { email: filters.email })
        };
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${backendUrl}/users/getAllTrainers`, { params, headers });
        const payload = res.data?.data || {};
        const list = Array.isArray(payload.trainers) ? payload.trainers : [];
        setTrainers(list);
        setTotal(typeof payload.total === 'number' ? payload.total : list.length);
      } catch {
        enqueueSnackbar('Failed to load trainers', { variant: 'error' });
        setTrainers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, [filters, page, rowsPerPage, token, enqueueSnackbar]);

  const handleFilterChange = (field) => (e) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }));
    setPage(0);
  };
  const handleChangePage = (_, newPage) => setPage(newPage);

  return (
    <Box p={3}>
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" justifyContent="center">
        {['firstName','lastName','email'].map((field) => (
          <TextField
            key={field}
            label={field === 'email' ? 'Email' : field.replace(/([A-Z])/g,' $1').replace(/^./, str=>str.toUpperCase())}
            value={filters[field]}
            onChange={handleFilterChange(field)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        ))}
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : trainers.length === 0 ? (
        <Typography align="center" variant="h6" color="text.secondary">
          No trainers found
        </Typography>
      ) : (
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                  }}
                >
                  {['First Name', 'Last Name', 'Email', 'Profile'].map((label) => (
                    <TableCell
                      key={label}
                      align="center"
                      sx={{
                        color: '#fff',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {trainers.map((t, idx) => (
                  <TableRow
                    key={t._id || idx}
                    hover
                    sx={{
                      backgroundColor: idx % 2 === 0 ? theme.palette.grey[50] : '#fff',
                    }}
                  >
                    <TableCell align="center">{t.firstName}</TableCell>
                    <TableCell align="center">{t.lastName}</TableCell>
                    <TableCell align="center">{t.email}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        component={RouterLink}
                        to={`/member/${user.id}/trainers/${t._id}`}
                        color="inherit"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[rowsPerPage]}
            sx={{ justifyContent: 'center', display: 'flex', p: 2 }}
          />
        </Paper>
      )}
    </Box>
  );
}