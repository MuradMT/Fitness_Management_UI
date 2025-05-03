import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { backendUrl } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

export default function MemberDashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(false);
  const [stats, setStats] = useState({ totalHoursWeek: 0, totalHoursMonth: 0 });

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };
        const [subRes, histRes] = await Promise.all([
          axios.get(`${backendUrl}/members/${user.id}/subscription`, {
            headers,
          }),
          axios.get(`${backendUrl}/members/${user.id}/history`, { headers }),
        ]);
        setSubscription(subRes.data.active);
        setStats({
          totalHoursWeek: histRes.data.totalHoursWeek,
          totalHoursMonth: histRes.data.totalHoursMonth,
        });
      } catch (err) {
        toast.error(err.response.data.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const pieData = {
    labels: ["This Week", "This Month"],
    datasets: [
      {
        data: [stats.totalHoursWeek, stats.totalHoursMonth],
        backgroundColor: ["#1976d2", "#9c27b0"],
      },
    ],
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
      }}
    >
      <Grid container spacing={4}  justifyContent="center"
       >
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
            }}
          >
            {[
              {
                title: "Subscription",
                content: subscription ? "Active" : "Inactive",
                icon: (
                  <Avatar
                    sx={{
                      bgcolor: subscription
                        ? theme.palette.success.light
                        : theme.palette.error.light,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <CreditCardIcon
                      fontSize="large"
                      color={subscription ? "success" : "error"}
                    />
                  </Avatar>
                ),
                action: {
                  to: `/member/${user.id}/subscription`,
                  label: "Manage",
                },
              },
              {
                title: "Hours This Week",
                content: stats.totalHoursWeek,
                icon: (
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.info.light,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <AccessTimeIcon fontSize="large" color="info" />
                  </Avatar>
                ),
              },
              {
                title: "Hours This Month",
                content: stats.totalHoursMonth,
                icon: (
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.light,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <CalendarIcon fontSize="large" color="primary" />
                  </Avatar>
                ),
              },
            ].map(({ title, content, icon, action }) => (
              <Card
                key={title}
                elevation={3}
                sx={{
                  width: 240,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 2,
                }}
              >
                {icon}
                <Typography
                  variant="subtitle2"
                  sx={{
                    mt: 1,
                    textTransform: "uppercase",
                    color: "text.secondary",
                  }}
                >
                  {title}
                </Typography>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {content}
                </Typography>
                {action && (
                  <Button
                    component={RouterLink}
                    to={action.to}
                    variant="outlined"
                    size="small"
                  >
                    {action.label}
                  </Button>
                )}
              </Card>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 4,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Find Trainers", to: `/member/${user.id}/trainers` },
              { label: "My Requests", to: `/member/${user.id}/requests` },
              { label: "Appointments", to: `/member/${user.id}/appointments` },
              { label: "Session History", to: `/member/${user.id}/history` },
            ].map(({ label, to }) => (
              <Button
                key={label}
                component={RouterLink}
                to={to}
                variant="outlined"
                sx={{
                  minWidth: 140,
                  textTransform: "none",
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: theme.palette.primary.main,
                    color: "#fff",
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ maxWidth: 360, mx: "auto" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                Weekly vs Monthly Hours
              </Typography>
              <Pie data={pieData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
