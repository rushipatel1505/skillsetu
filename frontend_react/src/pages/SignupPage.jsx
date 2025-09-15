// src/pages/SignupPage.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
  Divider,
} from "@mui/material";
import { Person, Phone, LocationOn, Lock } from "@mui/icons-material";
import { signup } from "../services/api";
import { useNavigate, Link as RouterLink } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [formData, setFormData] = useState({
    phone_number: "",
    name: "",
    location_area: "",
    password: "",
    confirmPassword: "",
    role: "seeker",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      phone_number: formData.phone_number,
      name: formData.name,
      location_area: formData.location_area,
      password: formData.password,
      role: formData.role,
    };

    try {
      await signup(payload);

      setSuccess("Signup successful! Redirecting to login...");
      setFormData({
        phone_number: "",
        name: "",
        location_area: "",
        password: "",
        confirmPassword: "",
        role: "seeker",
      });

      timerRef.current = setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ background: "linear-gradient(135deg, #6C63FF 0%, #42A5F5 100%)", p: 2 }}>
      <Card sx={{ maxWidth: 420, width: "100%", borderRadius: 4, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom color="primary">
            SkillSetU
          </Typography>
          <Typography variant="body2" textAlign="center" mb={2} color="text.secondary">
            Create your account to start exploring opportunities.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box component="form" onSubmit={handleSignup}>
            <TextField label="Full Name" name="name" value={formData.name} onChange={handleChange} fullWidth margin="normal" required InputProps={{ startAdornment: (<InputAdornment position="start"><Person /></InputAdornment>) }} />
            <TextField label="Mobile Number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} fullWidth margin="normal" required inputProps={{ maxLength: 10, pattern: "[0-9]{10}" }} helperText="Enter a valid 10-digit mobile number" InputProps={{ startAdornment: (<InputAdornment position="start"><Phone /></InputAdornment>) }} />
            <TextField label="Location Area" name="location_area" value={formData.location_area} onChange={handleChange} fullWidth margin="normal" required InputProps={{ startAdornment: (<InputAdornment position="start"><LocationOn /></InputAdornment>) }} />
            <TextField select label="Role" name="role" value={formData.role} onChange={handleChange} fullWidth margin="normal">
              <MenuItem value="seeker">Job Seeker</MenuItem>
              <MenuItem value="employer">Employer</MenuItem>
            </TextField>
            <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth margin="normal" required InputProps={{ startAdornment: (<InputAdornment position="start"><Lock /></InputAdornment>) }} />
            <TextField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} fullWidth margin="normal" required InputProps={{ startAdornment: (<InputAdornment position="start"><Lock /></InputAdornment>) }} />

            {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}
            {success && <Typography color="primary" variant="body2" sx={{ mt: 1 }}>{success}</Typography>}

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1.2, fontWeight: "bold", background: "linear-gradient(135deg, #6C63FF 0%, #42A5F5 100%)", "&:hover": { background: "linear-gradient(135deg, #5A52E0 0%, #1E88E5 100%)" } }}>Sign Up</Button>

            {/* Already a user link */}
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already a user?{" "}
                <Typography component={RouterLink} to="/login" sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none" }}>
                  Login
                </Typography>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SignupPage;
