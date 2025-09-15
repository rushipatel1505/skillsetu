// src/components/NavBar.jsx
import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function NavBar() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  // prefer AuthContext.user, fallback to localStorage
  const userName = auth?.user?.name || localStorage.getItem("userName") || "";
  const role = auth?.user?.role || (auth?.user ? auth.user.role : null);
  const token = auth?.token || localStorage.getItem("token");

  const handleLogout = () => {
    if (auth && typeof auth.logout === "function") auth.logout();
    // also clear localStorage to be safe
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  return (
    <AppBar position="static" sx={{ background: "linear-gradient(135deg,#6C63FF 0%,#42A5F5 100%)" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton color="inherit" onClick={() => navigate("/")} size="large" edge="start">
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: "inherit", textDecoration: "none", fontWeight: 700 }}
          >
            SkillSetU
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/jobs">Jobs</Button>

          {token && <Button color="inherit" component={RouterLink} to="/home">Dashboard</Button>}
          {token && <Button color="inherit" component={RouterLink} to="/profile">Profile</Button>}

          {/* Post Job button only visible for employers */}
          {token && role === "employer" && (
            <Button color="inherit" component={RouterLink} to="/post-job">Post Job</Button>
          )}

          {!token ? (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button variant="contained" color="secondary" component={RouterLink} to="/signup" sx={{ ml: 1 }}>
                Sign Up
              </Button>
            </>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
              <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
                {userName.charAt(0).toUpperCase() + userName.slice(1)}
              </Typography>
              <Avatar sx={{ width: 32, height: 32 }}>{(userName || "U").charAt(0).toUpperCase()}</Avatar>
              <IconButton color="inherit" onClick={handleLogout} aria-label="logout" size="large">
                <LogoutIcon />
              </IconButton>
            </Stack>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
