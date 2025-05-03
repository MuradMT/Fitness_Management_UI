import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { backendUrl } from "../utils/constants";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Appointments() {
  const { user } = useAuth();
  const token = localStorage.getItem("accessToken");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [newSession, setNewSession] = useState({
    trainerId: "",
    venueId: "",
    date: new Date(),
  });
  const [subscription, setSubscription] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [apptRes, venueRes, reqRes, subsRes] = await Promise.all([
          axios.get(`${backendUrl}/members/${user.id}/appointments`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${backendUrl}/venues`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${backendUrl}/members/${user.id}/requests`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${backendUrl}/members/${user.id}/subscription`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const allAppointments = apptRes.data.appointments || [];

        const acceptedReqs = (reqRes.data.requests || []).filter(
          (r) => r.status === "accepted"
        );
        const acceptedTrainerIds = [
          ...new Set(acceptedReqs.map((r) => r.trainerId)),
        ];

        const trainersRes = await Promise.all(
          acceptedTrainerIds.map((id) =>
            axios.get(`${backendUrl}/users/findOneTrainer/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            })
          )
        );

        const strictTrainers = trainersRes.map((res) => res.data);
        setTrainers(strictTrainers);

        const venueIds = [...new Set(allAppointments.map((a) => a.venueId))];
        const strictVenues = (venueRes.data.venues || []).filter((v) =>
          venueIds.includes(v._id)
        );
        
        if(trainers&&apptRes.data.appointments.length === 0){
          setVenues(venueRes.data.venues)
        }else{
          setVenues(strictVenues);
        }

        const appointmentsWithDetails = allAppointments.map((a) => {
          const trainer = strictTrainers.find((t) => t._id === a.trainerId);
          const venue = strictVenues.find((v) => v._id === a.venueId);
          return {
            ...a,
            trainerName: trainer
              ? `${trainer.firstName} ${trainer.lastName} — ${trainer.email}`
              : "Unknown",
            venueName: venue ? venue.name : "Unknown",
            venueLatLng: venue ? [venue.latitude, venue.longitude] : null,
          };
        });

        setAppointments(appointmentsWithDetails);
        setSubscription(subsRes.data.active || false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load appointments or trainers");
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id,token]);

  const cancelAppointment = async (sessionId) => {
    try {
      await axios.delete(
        `${backendUrl}/members/${user.id}/appointments/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      toast.success("Appointment cancelled");
      setAppointments((prev) => prev.filter((a) => a._id !== sessionId));
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  const scheduleSession = async () => {
    const selectedDay = newSession.date.toISOString().split("T")[0];
    const alreadyBooked = appointments.some(
      (app) => app.date.split("T")[0] === selectedDay
    );
    if (alreadyBooked) {
      toast.error("You already have a session scheduled on this day.");
      return;
    }
    try {
      await axios.post(
        `${backendUrl}/members/${user.id}/appointments`,
        {
          trainerId: newSession.trainerId,
          venueId: newSession.venueId,
          date: newSession.date.toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      toast.success("Appointment scheduled");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule");
    }
  };

   if(!subscription){
      return (
        <Typography align="center" variant="h6" color="text.secondary" mt={2}>
          You can not access to appointments page without active subscription.
        </Typography>
      );
    }

  return (
    <Box p={3}>
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box mb={5} display="flex" justifyContent="center">
            <Box sx={{ width: "100%", maxWidth: 800 }}>
              <Typography variant="h5" gutterBottom textAlign="center">
                Schedule New Session
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Trainer"
                    value={newSession.trainerId}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        trainerId: e.target.value,
                      })
                    }
                    sx={{ minWidth: 150 }}
                  >
                    {trainers.map((t) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.firstName} {t.lastName} — {t.email}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Venue"
                    value={newSession.venueId}
                    onChange={(e) =>
                      setNewSession({ ...newSession, venueId: e.target.value })
                    }
                    sx={{ minWidth: 150 }}
                  >
                    {venues.map((v) => (
                      <MenuItem key={v._id} value={v._id}>
                        {v.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Date & Time"
                      value={newSession.date}
                      onChange={(date) =>
                        setNewSession({ ...newSession, date })
                      }
                      renderInput={(params) => (
                        <TextField fullWidth {...params} />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  variant="contained"
                  onClick={scheduleSession}
                  disabled={!newSession.trainerId || !newSession.venueId}
                >
                  Schedule
                </Button>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {appointments.map((app) => (
              <Grid item xs={12} md={6} key={app._id}>
                <Card
                  elevation={3}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ width: "100%" }}>
                    <Typography variant="h6" textAlign="center">
                      Trainer: {app.trainerName}
                    </Typography>
                    <Typography textAlign="center">
                      Date: {new Date(app.date).toLocaleString()}
                    </Typography>
                    <Typography textAlign="center">
                      Venue: {app.venueName}
                    </Typography>
                    {app.venueLatLng && (
                      <Box sx={{ height: 200, width: "100%", mt: 2 }}>
                        <MapContainer
                          center={app.venueLatLng}
                          zoom={13}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={app.venueLatLng}>
                            <Popup>{app.venueName}</Popup>
                          </Marker>
                        </MapContainer>
                      </Box>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => cancelAppointment(app._id)}
                    >
                      Cancel Appointment
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
