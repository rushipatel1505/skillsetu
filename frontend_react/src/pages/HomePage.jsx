// src/pages/HomePage.jsx
import React, { useContext, useEffect } from "react";
import {
  Box,
  Toolbar,
  Container,
  Avatar,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const jobsPlaceholder = [
  { title: "Frontend Developer", company: "TechCorp", location: "Remote" },
  { title: "Backend Engineer", company: "CodeWorks", location: "New York" },
  { title: "UI/UX Designer", company: "Designify", location: "San Francisco" },
];

export default function HomePage() {
  const navigate = useNavigate();

  // ✅ Pull the user from AuthContext
  const { user } = useContext(AuthContext);

  // ✅ Debug to verify what context contains
  useEffect(() => {
    console.log("Context user:", user);
  }, [user]);

  // ✅ Fallback to localStorage if context is empty
  const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const displayName = user?.name || storedUser?.name || "User";

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)" }}>
      <Toolbar />

      {/* Hero Section */}
      <Box
        sx={{
          py: 6,
          textAlign: "center",
          background: "linear-gradient(135deg, #6C63FF 0%, #42A5F5 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Avatar
            sx={{
              bgcolor: "#42A5F5",
              width: 72,
              height: 72,
              margin: "0 auto 16px",
              fontSize: 28,
              boxShadow: 3,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>

          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome, {displayName.charAt(0).toUpperCase() + displayName.slice(1)}!
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.95 }}>
            Find your next opportunity or post a job today.
          </Typography>
          <Button
            variant="contained"
            sx={{
              mt: 3,
              px: 4,
              py: 1.2,
              background: "white",
              color: "#6C63FF",
              fontWeight: "bold",
              "&:hover": { background: "#f0f0f0" },
            }}
            onClick={() => navigate("/jobs")}
          >
            Browse Jobs
          </Button>
        </Container>
      </Box>

      {/* Featured Jobs */}
      <Container sx={{ py: 6 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
          Featured Jobs
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {jobsPlaceholder.map((job, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    {job.title}
                  </Typography>
                  <Typography color="text.secondary">{job.company}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.location}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2 }}>
                  <Button size="small" onClick={() => navigate("/jobs")}>
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: "center", background: "#f5f5f5", mt: "auto" }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} SkillSetU
        </Typography>
      </Box>
    </Box>
  );
}
