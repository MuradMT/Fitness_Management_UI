import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { backendUrl, homePagePictureUrl } from "../utils/constants";

export default function HomePage() {
  const { user } = useAuth();
  const token = localStorage.getItem("accessToken");
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (!user) return navigate("/login");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const { data: adminResp } = await axios.get(
        `${backendUrl}/users/is-admin`,
        { headers }
      );
      if (adminResp.success) return navigate("/admin");
    } catch {}
    if (user?.isTrainer) return navigate(`/trainer/${user.id}/requests`);
    return navigate(`/member/${user.id}/dashboard`);
  };

  return (
    <Box>
      <Box
        sx={{
          height: "100vh",
          backgroundImage:
            `url(${homePagePictureUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            px: 2,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: "common.white",
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: "2.5rem", md: "4rem" },
            }}
          >
            Welcome to FitnessPro
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "common.white",
              mb: 4,
              maxWidth: 600,
            }}

          >
            
            {user?.email ? (
              <>
                 
                Hello, {user.firstName} {user.lastName}!<br />
                {user.email}
              </>
            ) : (
              "Your ultimate fitness companion."
            )}
          </Typography>
         
          
          <Typography
            variant="h5"
            sx={{
              color: "common.white",
              mb: 4,
              maxWidth: 600,
            }}
          >
            Connect with top trainers, track your progress, and manage your
            fitness journey—all in one place.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              backgroundColor: "primary.main",
              py: 1.5,
              px: 4,
              fontSize: "1rem",
              "&:hover": { backgroundColor: "primary.dark" },
            }}
          >
            Get Started
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
