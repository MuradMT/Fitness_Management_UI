import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { backendUrl } from "../utils/constants";

export default function Notifications() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${backendUrl}/members/${user.id}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setNotes(res.data.notifications || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const markRead = async (id) => {
    try {
      await axios.put(
        `${backendUrl}/members/${user.id}/notifications/${id}/read`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      toast.success("Marked as read");
      setNotes((ns) =>
        ns.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  if (loading)
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  if (!notes.length)
    return <Typography align="center" mt={2}>No notifications.</Typography>;

  return (
    <Box p={3} display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>
      {notes.map((note) => (
        <Paper
          key={note._id}
          elevation={note.read ? 0 : 2}
          sx={{ mb: 2, p: 2, width: "100%", maxWidth: 600 }}
        >
          <Typography>{note.message}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(note.createdAt).toLocaleDateString()}
          </Typography>
          {!note.read && (
            <Box textAlign="right">
              <Button size="small" onClick={() => markRead(note._id)}>
                Mark as read
              </Button>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
}
