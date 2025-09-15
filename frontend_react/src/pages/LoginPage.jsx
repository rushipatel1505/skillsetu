// src/pages/LoginPage.jsx
import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { login, getProfile } from "../services/api";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({ phone_number: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/home";

  const auth = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();                 // ✅ prevent page reload
    setError("");
    setLoading(true);
    try {
      const tokenData = await login(formData.phone_number, formData.password);

      // ✅ Save token and fetch profile
      localStorage.setItem("token", tokenData.access_token);
      const profile = await getProfile();

      if (auth && typeof auth.login === "function") {
        auth.login(tokenData.access_token, profile);
      } else {
        localStorage.setItem("userInfo", JSON.stringify(profile));
      }

      navigate(from, { replace: true }); // redirect to home or intended page
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError("Login failed. Check your phone number or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ background: "linear-gradient(135deg, #6C63FF 0%, #42A5F5 100%)" }}
    >
      <Card sx={{ maxWidth: 420, width: "100%", p: 2, borderRadius: 3, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
            Login
          </Typography>

          {/* ✅ handleLogin now properly bound and prevents reload */}
          <form onSubmit={handleLogin}>
            <TextField
              label="Mobile Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              inputProps={{ autoComplete: "current-password" }}
            />
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 3, py: 1.2 }}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
