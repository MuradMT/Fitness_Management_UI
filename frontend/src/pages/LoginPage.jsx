import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Typography,
  Stack,
} from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import GoogleIcon from "@mui/icons-material/Google";
import { backendUrl, backgroundPictureUrl } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import hello from "hellojs";
import GitHubIcon from "@mui/icons-material/GitHub";

hello.init(
  {
    github: import.meta.env.VITE_GITHUB_CLIENT_ID,
  },
  {
    redirect_uri: window.location.origin + "/oauth-callback",
    scope: "user:email",
  }
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();
  const { login, user, socialLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors([]);
    try {
      const result = await login(email, password);
      if (!result.success) {
        if (result.statusCode === 400) {
          setErrors(result.message);
        }
        return;
      }
      const token = localStorage.getItem("accessToken");
      const { data: adminResp } = await axios.get(
        `${backendUrl}/users/is-admin`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (adminResp.success) {
        navigate("/admin");
      }
    } catch (err) {
      if (err.response?.data?.statusCode === 403) {
        if (user?.isTrainer) navigate("/trainer");
        else navigate("/home");
      }
    }
  };

  const handleSocialLogin = async (provider, token) => {
    const result = await socialLogin(provider, token);
    if (!result.success) return;
    const accessToken = localStorage.getItem("accessToken");
    try {
      const { data: adminResp } = await axios.get(
        `${backendUrl}/users/is-admin`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (adminResp.success) navigate("/admin");
    } catch (err) {
      if (err.response?.data?.statusCode === 403) {
        if (user?.isTrainer) navigate("/trainer");
        else navigate("/home");
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (res) => {
      handleSocialLogin("google", res.access_token);
    },
    onError: () => toast.error("Google login failed"),
    flow: "implicit",
  });
  useEffect(() => {
    const listener = (event) => {
      if (event.origin !== window.location.origin) return;
      const { provider, code } = event.data || {};
      if (provider === "github" && code) {
        toast.success("GitHub login successful! Redirecting...", {
          duration: 1500,
        });
        setTimeout(() => {
          handleSocialLogin("github", code);
        }, 1500);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [handleSocialLogin]);

  const loginWithGitHub = () => {
    const callbackUrl = `${window.location.origin}/oauth-callback.html`;
    hello("github").login({
      redirect_uri: callbackUrl,
      scope: "user:email",
    });
  };
  return (
    <Box sx={{ position: "relative", width: "100%", minHeight: "100vh" }}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${backgroundPictureUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.6)",
          },
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            bgcolor: "rgba(255,255,255,0.85)",
            boxShadow: 6,
          }}
        >
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Avatar sx={{ m: "auto", bgcolor: "primary.main" }}>
              <LockOpenIcon />
            </Avatar>
            <Typography variant="h5" sx={{ mt: 2, mb: 3, fontWeight: 600 }}>
              Log In to FitnessPro
            </Typography>
            <Box component="form" onSubmit={handleLogin} noValidate>
              <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <Stack alignItems="flex-start" sx={{ mt: 1 }}>
                {errors.map((err, idx) => (
                  <Typography key={idx} color="error" variant="body2">
                    • {err}
                  </Typography>
                ))}
              </Stack>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3, py: 1.5, textTransform: "none", fontWeight: 600 }}
              >
                Log In
              </Button>
              <Button
                fullWidth
                onClick={() => googleLogin()}
                startIcon={<GoogleIcon />}
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: "#DB4437",
                  "&:hover": { bgcolor: "#c23321" },
                  textTransform: "none",
                }}
              >
                Continue with Google
              </Button>
              <Button
                fullWidth
                onClick={loginWithGitHub}
                startIcon={<GitHubIcon />}
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: "#24292e",
                  "&:hover": { bgcolor: "#1b1f23" },
                  textTransform: "none",
                }}
              >
                Continue with GitHub
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Toaster position="top-right" />
    </Box>
  );
}
