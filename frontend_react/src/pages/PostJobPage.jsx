// src/pages/PostJobPage.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Chip,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { createJob, getAllSkills, getProfile } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PostJobPage() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const timerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });

  const [myRole, setMyRole] = useState(auth?.user?.role ?? null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // fetch skills for select dropdown
        const skills = await getAllSkills();
        if (!mounted) return;
        setSkillsOptions(skills || []);

        // If auth context doesn't have user role, fetch profile
        if (!myRole) {
          try {
            const profile = await getProfile();
            if (!mounted) return;
            setMyRole(profile?.role ?? null);
          } catch (e) {
            // ignore; server will enforce role anyway
            console.warn("Could not fetch profile for role check:", e?.response?.data || e.message);
          }
        }
      } catch (err) {
        console.error("Failed to load skills/profile:", err);
        setError(err.response?.data || err.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    if (!title.trim()) return "Please enter a job title";
    if (!description.trim()) return "Please enter a job description";
    if (!locationArea.trim()) return "Please enter a location area";
    if (!selectedSkills.length) return "Please select at least one required skill";
    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    // Role check: if we know role and it's not employer, block client-side
    if (myRole && myRole !== "employer") {
      setError("Only employer accounts can post jobs. Switch to an employer account or create one.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location_area: locationArea.trim(),
        // backend expects required_skills as array of IDs (safe assumption based on existing responses)
        required_skills: selectedSkills.map((s) => s.id).filter(Boolean),
      };

      const res = await createJob(payload);
      console.log("Job created:", res);

      setSnack({ open: true, severity: "success", message: "Job posted successfully" });

      // reset form
      setTitle("");
      setDescription("");
      setLocationArea("");
      setSelectedSkills([]);

      // navigate to dashboard/home after short moment so user sees the snackbar
      timerRef.current = setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (err) {
      console.error("Create job failed:", err);
      const msg = err.response?.data?.detail || err.response?.data || err.message || "Failed to create job";
      setError(msg);
      setSnack({ open: true, severity: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // If role is known and user is not employer, show informative message
  if (myRole && myRole !== "employer") {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Post a Job</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Only users registered as <strong>employers</strong> can post jobs.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/profile")}>Go to Profile</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Post a Job</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: "background.paper", p: 3, borderRadius: 2, boxShadow: 1 }}>
        <Stack spacing={2}>
          <TextField
            label="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            fullWidth
            multiline
            minRows={4}
          />

          <TextField
            label="Location area"
            value={locationArea}
            onChange={(e) => setLocationArea(e.target.value)}
            required
            fullWidth
          />

          <Autocomplete
            multiple
            options={skillsOptions}
            getOptionLabel={(opt) => opt.name ?? ""}
            value={selectedSkills}
            onChange={(e, value) => setSelectedSkills(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, idx) => <Chip key={option.id ?? option.name} label={option.name} {...getTagProps({ index: idx })} />)
            }
            renderInput={(params) => <TextField {...params} label="Required skills" placeholder="Pick skills" />}
          />

          {error && <Typography color="error">{String(error)}</Typography>}

          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? "Posting..." : "Post Job"}</Button>
            <Button variant="outlined" onClick={() => { setTitle(""); setDescription(""); setLocationArea(""); setSelectedSkills([]); }}>Reset</Button>
            <Button color="inherit" onClick={() => navigate(-1)}>Cancel</Button>
          </Stack>
        </Stack>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
