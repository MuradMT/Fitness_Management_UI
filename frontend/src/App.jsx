import React from "react";
import {  Routes, Route, Navigate } from "react-router-dom";
import { Box, CssBaseline } from "@mui/material";
import { Toaster } from 'react-hot-toast';
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";


import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";


import MemberDashboard from "./pages/MemberDahboard.jsx";
import FindTrainers from "./pages/FindTrainers.jsx";
import TrainerProfile from "./pages/TrainerProfile.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Appointments from "./pages/Appointments.jsx";
import SessionHistory from "./pages/SessionHistory.jsx";
import SubscriptionPage from "./pages/SubscriptionPage.jsx";
import NotificationList from "./pages/NotificationList.jsx";


import TrainerRequests from "./pages/TrainerRequests.jsx";
import TrainerSessions from "./pages/TrainerSessions.jsx";

import VerifyEmail from "./pages/VerifyEmailPage.jsx";


export default function App() {
  return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <CssBaseline />
        <Toaster position="top-right" />
        <Navbar />
        <Box component="main" sx={{ flex: 1 }}>
          <Routes>
            
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute role="admin">
                  <AdminPage />
                </PrivateRoute>
              }
            />
  

          
            <Route
              path="/member/:id/dashboard"
              element={
                <PrivateRoute role="member">
                  <MemberDashboard />
                </PrivateRoute>
              }
            />


            <Route
              path="/member/:id/trainers"
              element={
                <PrivateRoute role="member">
                  <FindTrainers />
                </PrivateRoute>
              }
            />
            <Route
              path="/member/:id/trainers/:trainerId"
              element={
                <PrivateRoute role="member">
                  <TrainerProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/member/:id/requests"
              element={
                <PrivateRoute role="member">
                  <MyRequests />
                </PrivateRoute>
              }
            />
           
            <Route
              path="/member/:id/appointments"
              element={
                <PrivateRoute role="member">
                  <Appointments />
                </PrivateRoute>
              }
            />
            <Route
              path="/member/:id/history"
              element={
                <PrivateRoute role="member">
                  <SessionHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/member/:id/subscription"
              element={
                <PrivateRoute role="member">
                  <SubscriptionPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/member/:id/notifications"
              element={
                <PrivateRoute role="member">
                  <NotificationList />
                </PrivateRoute>
              }
            />

            
            <Route
              path="/trainer/:id/requests"
              element={
                <PrivateRoute role="trainer">
                  <TrainerRequests />
                </PrivateRoute>
              }
            />
            <Route
              path="/trainer/:id/sessions"
              element={
                <PrivateRoute role="trainer">
                  <TrainerSessions />
                </PrivateRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
  );
}
