// src/pages/ProfilePage.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Chip,
  Stack,
  Snackbar,
  Alert,
  Divider,
  Toolbar,
} from "@mui/material";
import { getProfile, getAllSkills, updateMySkills, updateProfile } from "../services/api";
import { AuthContext } from "../context/AuthContext";

/**
 * Profile page with skill management for seekers.
 *
 * Notes:
 * - Uses getAllSkills() to populate the dropdown (expects array of {id, name, ...}).
 * - Preselects user skills whether backend returns objects or just ids.
 * - Calls updateMySkills([ids]) to persist skill selections.
 * - Updates AuthContext and localStorage with the returned user object.
 */

export default function ProfilePage() {
  const auth = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState(null);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({ name: "", phone_number: "", location_area: "", company_name: "", role: "" });

  const [snackbar, setSnackbar] = useState({ open: false, severity: "success", message: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        // fetch profile + skills in parallel
        const [p, skills] = await Promise.all([getProfile(), getAllSkills()]);
        if (!mounted) return;

        setProfile(p || {});
        setSkillsOptions(Array.isArray(skills) ? skills : []);

        // prepare basic form fields
        setBasicForm({
          name: p?.name ?? "",
          phone_number: p?.phone_number ?? "",
          location_area: p?.location_area ?? "",
          company_name: p?.company_name ?? "",
          role: p?.role ?? "",
        });

        // normalize user skills: backend might return [{id,name}, ...] or [id, ...]
        const userSkillsRaw = p?.skills ?? p?.user_skills ?? [];
        const normalized = (userSkillsRaw || []).map((s) => {
          if (!s) return null;
          if (typeof s === "object") return s;
          // if it's id, find matching skill object from skills list
          return skills?.find((opt) => Number(opt.id) === Number(s)) || { id: s, name: String(s) };
        }).filter(Boolean);

        setSelectedSkills(normalized);
      } catch (err) {
        console.error("Failed to load profile/skills:", err);
        setError(err.response?.data || err.message || "Failed to load profile or skills");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicForm((s) => ({ ...s, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError("");
    try {
      // Build payload: send fields that exist
      const payload = {
        name: basicForm.name || undefined,
        phone_number: basicForm.phone_number || undefined,
        location_area: basicForm.location_area || undefined,
        company_name: basicForm.company_name || undefined,
      };

      const updated = await updateProfile(payload);
      setProfile(updated);
      setIsEditingBasic(false);
      setSnackbar({ open: true, severity: "success", message: "Profile updated" });

      // update auth context if available
      if (auth && typeof auth.login === "function") {
        auth.login(auth.token, updated);
      } else {
        localStorage.setItem("userInfo", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Update profile failed:", err);
      setError(err.response?.data || err.message || "Failed to update profile");
      setSnackbar({ open: true, severity: "error", message: "Failed to update profile" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    setError("");
    try {
      // gather ids (skill objects may be partial)
      const ids = selectedSkills.map((s) => s?.id).filter(Boolean);
      // call backend endpoint: PUT /users/me/skills
      const updatedUser = await updateMySkills(ids);
      setProfile(updatedUser);
      setSnackbar({ open: true, severity: "success", message: "Skills updated" });

      // update AuthContext if available (so NavBar and other components update)
      if (auth && typeof auth.login === "function") {
        auth.login(auth.token, updatedUser);
      } else {
        localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Update skills failed:", err);
      setError(err.response?.data || err.message || "Failed to update skills");
      setSnackbar({ open: true, severity: "error", message: "Failed to update skills" });
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography color="error">Could not load profile.</Typography>
      </Container>
    );
  }

  const isSeeker = profile?.role === "seeker";

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Toolbar /> {/* spacer under global NavBar */}

      <Typography variant="h4" fontWeight={700} gutterBottom>My Profile</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        View and update your profile. Job seekers can update their skills here.
      </Typography>

      <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6">Basic Info</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {profile?.role === "employer" ? (
            <>
              <TextField
                label="Company name"
                name="company_name"
                value={basicForm.company_name}
                onChange={handleBasicChange}
                fullWidth
                InputProps={{ readOnly: !isEditingBasic }}
              />
              <TextField
                label="Contact person"
                name="name"
                value={basicForm.name}
                onChange={handleBasicChange}
                fullWidth
                InputProps={{ readOnly: !isEditingBasic }}
              />
            </>
          ) : (
            <TextField
              label="Full name"
              name="name"
              value={basicForm.name}
              onChange={handleBasicChange}
              fullWidth
              InputProps={{ readOnly: !isEditingBasic }}
            />
          )}

          <TextField
            label="Phone number"
            name="phone_number"
            value={basicForm.phone_number}
            onChange={handleBasicChange}
            fullWidth
            InputProps={{ readOnly: !isEditingBasic }}
            helperText="Mobile number used for login"
          />
          <TextField
            label="Location area"
            name="location_area"
            value={basicForm.location_area}
            onChange={handleBasicChange}
            fullWidth
            InputProps={{ readOnly: !isEditingBasic }}
          />
          <TextField
            label="Role"
            name="role"
            value={basicForm.role || profile?.role}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" spacing={2}>
          {!isEditingBasic ? (
            <Button variant="contained" onClick={() => setIsEditingBasic(true)}>Edit Profile</Button>
          ) : (
            <>
              <Button variant="contained" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save"}
              </Button>
              <Button variant="outlined" onClick={() => {
                setBasicForm({
                  name: profile?.name ?? "",
                  phone_number: profile?.phone_number ?? "",
                  location_area: profile?.location_area ?? "",
                  company_name: profile?.company_name ?? "",
                  role: profile?.role ?? "",
                });
                setIsEditingBasic(false);
              }}>
                Cancel
              </Button>
            </>
          )}
        </Stack>

        {/* Skill editor only for seekers */}
        {isSeeker && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6">Skills</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select skills from the list. If you can't find a skill, contact the admin to add it.
            </Typography>

            <Autocomplete
              multiple
              options={skillsOptions}
              getOptionLabel={(opt) => opt?.name ?? String(opt)}
              value={selectedSkills}
              onChange={(e, newVal) => setSelectedSkills(newVal)}
              filterSelectedOptions
              isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
              renderTags={(value, getTagProps) => value.map((option, index) => (
                <Chip label={option.name} {...getTagProps({ index })} key={option.id ?? option.name} />
              ))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Your skills"
                  placeholder="Type to search skills"
                />
              )}
              sx={{ mt: 1 }}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button variant="contained" onClick={handleSaveSkills} disabled={savingSkills}>
                {savingSkills ? "Saving skills..." : "Save Skills"}
              </Button>
              <Button variant="outlined" onClick={() => {
                // reset to profile's skills
                const profileSkills = profile?.skills ?? profile?.user_skills ?? [];
                const selected = (profileSkills || []).map((s) => {
                  if (typeof s === "object") return s;
                  return skillsOptions.find((opt) => Number(opt.id) === Number(s)) || { id: s, name: String(s) };
                });
                setSelectedSkills(selected);
              }}>
                Reset
              </Button>
            </Box>
          </>
        )}

        {error && <Typography color="error" sx={{ mt: 2 }}>{String(error)}</Typography>}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
