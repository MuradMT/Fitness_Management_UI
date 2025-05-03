import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';

export default function GlobalNotificationWatcher() {
  const { user } = useAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [latestNote, setLatestNote] = useState(null);
  const [newCount, setNewCount] = useState(0);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${backendUrl}/members/${user.id}/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const notifications = res.data.notifications || [];
        const unread = notifications.filter((n) => !n.read);

        if (unread.length > prevCountRef.current) {
          const newest = unread[0]; 
          setLatestNote(newest);
          setNewCount(unread.length - prevCountRef.current);
          setSnackbarOpen(true);
        }

        prevCountRef.current = unread.length;
      } catch (err) {
        console.error("Notification check failed", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <Snackbar
      open={snackbarOpen}
      onClose={() => setSnackbarOpen(false)}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      message={
        latestNote
          ? `🔔 ${newCount} new notification${newCount > 1 ? 's' : ''}: ${latestNote.message}`
          : `🔔 You have new notifications`
      }
      action={
        <Button
          color="inherit"
          size="small"
          href={`/member/${user?.id}/notifications`}
        >
          View
        </Button>
      }
    />
  );
}