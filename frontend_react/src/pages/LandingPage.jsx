// src/pages/LandingPage.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Toolbar,
} from "@mui/material";
import { Search, VerifiedUser, Work, SupportAgent } from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";

const FeatureCard = ({ icon: Icon, title, subtitle }) => (
  <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Icon sx={{ fontSize: 40, color: "primary.main" }} />
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext) || {};

  const requireAuthNavigate = (target, fallbackToSignup = false) => {
    // debug line - remove later
    console.log("[Landing] requireAuthNavigate called:", { target, tokenPresent: !!token, fallbackToSignup });

    if (token) {
      navigate(target);
      return;
    }

    if (fallbackToSignup) {
      navigate("/signup");
      return;
    }

    // go to login and remember where the user wanted to go
    navigate("/login", { state: { from: target } });
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* spacer below global NavBar */}
      <Toolbar />

      {/* HERO - ensure pointer events allowed and zIndex lower than NavBar */}
      <Box
        component="section"
        sx={{
          background: "linear-gradient(135deg, #f3f6ff 0%, #ffffff 100%)",
          py: { xs: 6, md: 10 },
          position: "relative",
          zIndex: 0,               // ensure it's below the app bar which has higher zIndex
          pointerEvents: "auto",   // be explicit so clicks are not blocked
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" fontWeight={800} gutterBottom>
                Find skilled hands. Hire with confidence.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                SkillSetU connects local skilled workers with employers — fast, reliable, and tailored to Surat’s industries.
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                  type="button"                    // prevents form submit behavior
                  onClick={() => requireAuthNavigate("/jobs")}
                  variant="contained"
                  size="large"
                  sx={{ borderRadius: 2 }}
                >
                  Find Jobs
                </Button>

                <Button
                  type="button"
                  onClick={() => requireAuthNavigate("/signup", true)}
                  variant="outlined"
                  size="large"
                  sx={{ borderRadius: 2 }}
                >
                  Get Started
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Search sx={{ color: "primary.main" }} />
                  <Typography variant="caption" color="text.secondary">
                    Search by skill or location
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 3 }}>
                  <VerifiedUser sx={{ color: "primary.main" }} />
                  <Typography variant="caption" color="text.secondary">
                    Verified employers
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ width: "100%", height: { xs: 220, md: 320 }, borderRadius: 3, overflow: "hidden", boxShadow: 6 }}>
                <CardMedia
                  component="img"
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
                  alt="Skilled workers illustration"
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FEATURES */}
      <Box component="section" sx={{ py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Typography variant="h5" fontWeight={700} gutterBottom>
            How SkillSetU helps
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <FeatureCard icon={Work} title="Local Job Listings" subtitle="Curated opportunities from employers in Surat and nearby areas." />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard icon={VerifiedUser} title="Verified Employers" subtitle="We surface verified businesses to reduce hiring risk." />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard icon={SupportAgent} title="Support & Guidance" subtitle="Help with registration, skill tagging, and application tips." />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* TRENDING */}
      <Box component="section" sx={{ py: { xs: 3, md: 6 }, bgcolor: "background.default" }}>
        <Container maxWidth="lg">
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Trending jobs
          </Typography>

          <Grid container spacing={2}>
            {[
              { title: "Electrician - Residential", loc: "Varachha, Surat", employer: "Shree Electrics" },
              { title: "Textile Machine Operator", loc: "Udhna, Surat", employer: "Sai Textiles" },
              { title: "Diamond Polisher", loc: "Adajan, Surat", employer: "Asha Diamonds" },
            ].map((job, idx) => (
              <Grid key={idx} item xs={12} md={4}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{job.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{job.employer} • {job.loc}</Typography>
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <Button
                      type="button"
                      onClick={() => requireAuthNavigate("/jobs")}
                      fullWidth
                      variant="outlined"
                      size="small"
                    >
                      View Jobs
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 3, mt: "auto", bgcolor: "grey.50" }}>
        <Container maxWidth="lg" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} SkillSetU — Connecting skilled workers with local employers.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
