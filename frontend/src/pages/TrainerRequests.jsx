import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Paper,
  TableContainer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { backendUrl } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function TrainerRequests() {
  const { user } = useAuth();
  const token = localStorage.getItem("accessToken");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("accept");
  const [altTrainer, setAltTrainer] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [subscriptionStatuses, setSubscriptionStatuses] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${backendUrl}/trainers/${user.id}/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const requestsData = res.data.requests || [];
      setRequests(requestsData);

      const statuses = {};
      for (const req of requestsData) {
        try {
          const subRes = await axios.get(`${backendUrl}/members/subscription`, {
            params: { memberEmail: req.memberEmail },
            headers: { Authorization: `Bearer ${token}` },
          });
          statuses[req._id] = subRes.data.active;
        } catch (err) {
          console.error("Subscription fetch failed for:", req.memberEmail);
          statuses[req._id] = false;
        }
      }
      setSubscriptionStatuses(statuses);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/getAllTrainers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 100 },
      });
      const list = res.data.data.trainers || [];
      setTrainers(list.filter((t) => t._id !== user.id));
    } catch {}
  };

  const openDialog = (req) => {
    if (!subscriptionStatuses[req._id]) {
      toast.error("Member does not have active subscription, you can not proceed");
      return;
    }
    setSelected(req);
    setAction("accept");
    setAltTrainer("");
    setDialogOpen(true);
    if (req.status === "pending") fetchTrainers();
  };

  const handleClose = () => setDialogOpen(false);

  const submit = async () => {
    if (!selected) return;
    const dto = { action };
    if (action === "suggest") {
      if (!altTrainer) {
        toast.error("Please pick an alternative trainer");
        return;
      }
      dto.alternativeTrainerId = altTrainer;
    }
    try {
      await axios.put(
        `${backendUrl}/trainers/${user.id}/requests/${selected._id}`,
        dto,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Request handled");
      handleClose();
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to handle request");
    }
  };

  if (!requests.length && !loading) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="text.secondary">
          No pending requests
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Pending Training Requests
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member Email</TableCell>
                <TableCell>Goals</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req._id} hover>
                  <TableCell>{req.memberEmail}</TableCell>
                  <TableCell>{req.goals}</TableCell>
                  <TableCell>
                    {new Date(req.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{subscriptionStatuses[req._id] ? "Active" : "Not Active"}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openDialog(req)}>
                      Handle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Handle Request
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset">
            <FormLabel>Action</FormLabel>
            <RadioGroup
              row
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <FormControlLabel
                value="accept"
                control={<Radio />}
                label="Accept"
              />
              <FormControlLabel
                value="reject"
                control={<Radio />}
                label="Reject"
              />
              <FormControlLabel
                value="suggest"
                control={<Radio />}
                label="Suggest Alternative"
              />
            </RadioGroup>
          </FormControl>

          {action === "suggest" && (
            <Box mt={2}>
              <TextField
                select
                label="Alternative Trainer"
                value={altTrainer}
                onChange={(e) => setAltTrainer(e.target.value)}
                fullWidth
              >
                {trainers.map((t, idx) => (
                  <MenuItem key={t._id} value={t._id}>
                    {idx + 1}. {t.firstName} {t.lastName} — {t.email}
                    <br />
                    Bio-{t.bio || "No bio"}
                    <br />
                    Specifications-
                    {Array.isArray(t.specifications)
                      ? t.specifications.join(", ")
                      : "No specs"}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={submit} variant="contained">
            Submit
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
