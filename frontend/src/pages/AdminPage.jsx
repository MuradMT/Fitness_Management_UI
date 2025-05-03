import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../utils/constants";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Typography,
  CircularProgress,
  Paper,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import toast from "react-hot-toast";
import { Toaster } from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const {user}=useAuth();

  const isAdmin = async () => {
    const token = localStorage.getItem("accessToken");

    const { data: adminResp } = await axios.get(
      `${backendUrl}/users/is-admin`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return adminResp.success;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const { data: res } = await axios.get(`${backendUrl}/users/getAllUsers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.success) {
        setUsers(res.data);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const { data: res } = await axios.patch(
        `${backendUrl}/users/approve/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.success) {
        toast.success("User successfully approved");
        fetchUsers();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve user");
    }
  };

  const openRejectDialog = (userId) => {
    setSelectedUserId(userId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedUserId(null);
    setRejectReason("");
  };

  const handleRejectSubmit = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const { data: res } = await axios.patch(
        `${backendUrl}/users/reject/${selectedUserId}`,
        { rejectionMessage: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.success) {
        toast.success("User successfully rejected");
        closeRejectDialog();
        fetchUsers();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject user");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Toaster position="top-right" />
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>{u._id}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.firstName}</TableCell>
                  <TableCell>{u.lastName}</TableCell>
                  <TableCell>
                    {isAdmin&&user.email===u.email ? "Admin" : u.isTrainer ? "Trainer" : "User"}
                  </TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell align="center">
                    {u.status === "pending" ? (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={() => handleApprove(u._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => openRejectDialog(u._id)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No actions
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={rejectDialogOpen}
        onClose={closeRejectDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reject User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason (optional)"
            type="text"
            fullWidth
            multiline
            minRows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectSubmit}
          >
            Submit Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
