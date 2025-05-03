import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  CircularProgress,
  Box,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import axios from 'axios';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { backendUrl } from '../utils/constants';

export default function Navbar() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);


  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(
          `${backendUrl}/members/${user.id}/notifications/unreadCount`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchCount();

    window.addEventListener('notificationsUpdated', fetchCount);
    return () => {
      window.removeEventListener('notificationsUpdated', fetchCount);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setChecking(false);
      return;
    }
    (async () => {
      setChecking(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(
          `${backendUrl}/users/is-admin`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) setRole('admin');
        else if (user.isTrainer) setRole('trainer');
        else setRole('member');
      } catch {
        setRole(user.isTrainer ? 'trainer' : 'member');
      } finally {
        setChecking(false);
      }
    })();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (checking) {
    return (
      <AppBar position="static" sx={{ bgcolor: 'black' }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress color="secondary" />
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  const publicLinks = [
    { text: 'Home', to: '/', icon: <HomeIcon /> },
    { text: 'Login', to: '/login', icon: <LoginIcon /> },
    { text: 'Sign Up', to: '/signup', icon: <PersonAddIcon /> },
  ];
  const memberLinks = [
    { text: 'Home', to: '/', icon: <HomeIcon /> },
    { text: 'Dashboard', to: `/member/${user?.id}/dashboard`, icon: <DashboardIcon /> },
    { text: 'Find Trainers', to: `/member/${user?.id}/trainers`, icon: <SearchIcon /> },
    { text: 'My Requests', to: `/member/${user?.id}/requests`, icon: <RequestQuoteIcon /> },
    { text: 'Appointments', to: `/member/${user?.id}/appointments`, icon: <EventIcon /> },
    { text: 'History', to: `/member/${user?.id}/history`, icon: <HistoryIcon /> },
    { text: 'Subscription', to: `/member/${user?.id}/subscription`, icon: <CreditCardIcon /> },
    { text: 'Notifications', to: `/member/${user?.id}/notifications`, icon: <NotificationsIcon />, badge: true },
    { text: 'Logout', action: handleLogout, icon: <ExitToAppIcon />, color: 'error' }
  ];
  const trainerLinks = [
    { text: 'Home', to: '/', icon: <HomeIcon /> },
    { text: 'Requests', to: `/trainer/${user?.id}/requests`, icon: <RequestQuoteIcon /> },
    { text: 'Sessions', to: `/trainer/${user?.id}/sessions`, icon: <EventAvailableIcon /> },
    { text: 'Logout', action: handleLogout, icon: <ExitToAppIcon />, color: 'error' }
  ];
  const adminLinks = [
    { text: 'Home', to: '/', icon: <HomeIcon /> },
    { text: 'Admin Dashboard', to: '/admin', icon: <AdminPanelSettingsIcon /> },
    { text: 'Logout', action: handleLogout, icon: <ExitToAppIcon />, color: 'error' }
  ];

  let navItems = publicLinks;
  if (user) {
    if (role === 'admin') navItems = adminLinks;
    else if (role === 'trainer') navItems = trainerLinks;
    else navItems = memberLinks;
  }

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'black' }}>
        <Toolbar>
          <IconButton
            component={RouterLink}
            to="/"
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
          >
            <FitnessCenterIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            noWrap
            sx={{
              flexGrow: 1,
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: 600,
              letterSpacing: '0.1rem',
              '&:hover': { color: theme.palette.primary.light }
            }}
          >
            FitnessPro
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => setDialogOpen(true)}
            sx={{ '&:hover': { color: theme.palette.primary.light } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Menu
          <IconButton edge="end" color="inherit" onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <List>
            {navItems.map((item) => {
              const isActive = item.to &&
                (item.to === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.to));
              return (
                <ListItem
                  key={item.text}
                  button
                  component={item.to ? RouterLink : 'button'}
                  to={item.to}
                  onClick={() => { item.action?.(); setDialogOpen(false); }}
                  sx={{
                    bgcolor: isActive && item.text !== 'Logout' ? 'action.selected' : 'transparent',
                    '&:hover': 'action.hover'
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: item.text === 'Logout'
                        ? 'error.main'
                        : isActive
                          ? 'primary.main'
                          : 'text.primary'
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={unreadCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        color: item.text === 'Logout'
                          ? 'error'
                          : isActive
                            ? 'primary'
                            : 'textPrimary'
                      }
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
}