import React, { useState } from "react";
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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, set } from "date-fns";
import { backgroundPictureUrl, backendUrl } from "../utils/constants";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState(null);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [specifications, setSpecifications] = useState([]);
  const [isTrainer, setIsTrainer] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = [];

    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (isTrainer) {
      if (!bio.trim()) {
        errors.push("Bio is required");
      }
      if (specifications.length === 0) {
        errors.push("At least one specification is required");
      }
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    const data = {
      firstName,
      lastName,
      dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : "",
      address: { street, city, postcode },
      email,
      password,
      isTrainer,
    };
    if (isTrainer) {
      data.bio = bio;
      data.specifications = specifications;
    }

    try {
      const { data: result } = await axios.post(
        `${backendUrl}/auth/signup`,
        data
      );
      if (result.success) {
        toast.success(result.message, {
          duration: 2000,
        });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const resp = error.response;
      if (resp?.status === 400 && Array.isArray(resp.data.message)) {
        setValidationErrors(resp.data.message);
      } else {
        toast.error(resp?.data?.message || "An unexpected error occurred");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        backgroundImage: `url(${backgroundPictureUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
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
          px: 2,
          py: 4,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 450,
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.85)",
            boxShadow: 6,
          }}
        >
          <CardContent sx={{ textAlign: "center", p: 4 }}>
            <Avatar sx={{ m: "auto", bgcolor: "primary.main" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography
              variant="h5"
              component="h1"
              sx={{ mt: 2, mb: 1, fontWeight: 600 }}
            >
              Create Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join us and start your fitness journey
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="First Name "
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="Last Name "
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth *"
                  value={dob}
                  onChange={setDob}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      required
                    />
                  )}
                />
              </LocalizationProvider>
              <TextField
                fullWidth
                label="Street Address "
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="City "
                value={city}
                onChange={(e) => setCity(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="Postcode "
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="Email "
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="Password "
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="Confirm Password "
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                variant="outlined"
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isTrainer}
                    onChange={(e) => setIsTrainer(e.target.checked)}
                  />
                }
                label="I am a trainer"
                sx={{ mt: 1 }}
              />

              {isTrainer && (
                <Box sx={{ mt: 2, textAlign: "left" }}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Specifications (one per line)"
                    multiline
                    rows={4}
                    value={specifications.join("\n")}
                    onChange={(e) =>
                      setSpecifications(e.target.value.split("\n"))
                    }
                    margin="normal"
                    variant="outlined"
                    required
                  />
                </Box>
              )}

              {validationErrors.length > 0 && (
                <Box sx={{ mt: 2, textAlign: "left" }}>
                  {validationErrors.map((err, idx) => (
                    <Typography key={idx} color="error" variant="body2">
                      • {err}
                    </Typography>
                  ))}
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3, py: 1.5, textTransform: "none", fontWeight: 600 }}
              >
                Sign Up
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Toaster position="top-right" />
    </Box>
  );
}
