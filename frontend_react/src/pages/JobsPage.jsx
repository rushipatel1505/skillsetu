// src/pages/JobsPage.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useNavigate } from "react-router-dom";
import { fetchJobs } from "../services/api";
import { AuthContext } from "../context/AuthContext";

// helper to read employer name from job object (keeps your previous logic)
const getEmployerName = (job) => {
  const maybe = (v) => (v === null || v === undefined ? null : v);

  const employerObj = maybe(job?.employer);
  if (employerObj && typeof employerObj === "object") {
    return (
      employerObj.name ||
      employerObj.full_name ||
      employerObj.display_name ||
      employerObj.username ||
      employerObj.phone_number ||
      "Employer"
    );
  }

  const candidates = [
    maybe(job?.employer_name),
    maybe(job?.company),
    maybe(job?.posted_by_name),
    maybe(job?.posted_by),
    maybe(job?.owner_name),
    maybe(job?.owner),
    maybe(job?.user_name),
    maybe(job?.creator_name),
    maybe(job?.created_by_name),
    maybe(job?.employer_phone),
    maybe(job?.phone_number),
    maybe(job?.contact_name),
  ];
  for (const c of candidates) {
    if (c) return c;
  }

  const idCandidate = job?.employer_id ?? job?.employerId ?? job?.owner_id ?? job?.created_by;
  if (idCandidate) return `Employer #${idCandidate}`;

  return "Unknown Employer";
};

export default function JobsPage() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [limit] = useState(8);
  const [hasMore, setHasMore] = useState(true);

  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadJobs(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadJobs(skip = 0, replace = false) {
    try {
      if (skip === 0) setLoading(true);
      else setLoadingMore(true);
      setError("");

      const data = await fetchJobs(skip, limit);
      let arr = Array.isArray(data) ? data : data?.items ?? data?.results ?? [];

      if (!Array.isArray(arr)) throw new Error("Unexpected jobs response format");

      if (replace) setJobs(arr);
      else setJobs((prev) => [...prev, ...arr]);

      setHasMore(arr.length === limit);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError(err.response?.data || err.message || "Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const handleLoadMore = () => loadJobs(jobs.length, false);

  const filteredJobs = jobs.filter((job) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const title = (job?.title ?? job?.job_title ?? "").toString().toLowerCase();
    const company = (getEmployerName(job) || "").toString().toLowerCase();
    const loc = (job?.location ?? job?.location_area ?? job?.city ?? "").toString().toLowerCase();
    return title.includes(q) || company.includes(q) || loc.includes(q);
  });

  const openDetails = (job) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f7ff 0%,#ffffff 100%)" }}>
      {/* spacer so content sits below global NavBar */}
      <Toolbar />

      <Container sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
          <Typography variant="h4" fontWeight={700}>Browse Jobs</Typography>

          <TextField
            size="small"
            placeholder="Search by title, company or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: 360 } }}
          />
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={10}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box textAlign="center" py={6}>
            <Typography color="error">{String(error)}</Typography>
            <Button sx={{ mt: 2 }} variant="contained" onClick={() => loadJobs(0, true)}>Retry</Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {filteredJobs.length === 0 ? (
                <Grid item xs={12}>
                  <Box textAlign="center" py={6}>
                    <Typography variant="h6" color="text.secondary">No jobs found.</Typography>
                    <Button sx={{ mt: 2 }} variant="outlined" onClick={() => loadJobs(0, true)}>Refresh</Button>
                  </Box>
                </Grid>
              ) : (
                filteredJobs.map((job, idx) => (
                  <Grid key={job.id ?? `${idx}`} item xs={12} sm={6} md={4}>
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 2, boxShadow: 3 }}>
                      <CardContent sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <WorkOutlineIcon sx={{ color: "#6C63FF" }} />
                          <Typography variant="h6" fontWeight={700}>{job?.title ?? job?.job_title ?? "Untitled Job"}</Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          {getEmployerName(job)} • {job?.location ?? job?.location_area ?? ""}
                        </Typography>

                        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                          {job?.short_description ?? job?.summary ?? (job?.description ? job.description.slice(0, 120) + "..." : "")}
                        </Typography>
                      </CardContent>

                      <Box sx={{ p: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => openDetails(job)}>View Details</Button>
                          <Button size="small" variant="contained" onClick={() => navigate("/profile")}>Apply</Button>
                        </Stack>
                      </Box>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>

            <Box display="flex" justifyContent="center" mt={4}>
              {hasMore && <Button onClick={handleLoadMore} variant="contained" disabled={loadingMore}>{loadingMore ? "Loading..." : "Load more"}</Button>}
            </Box>
          </>
        )}
      </Container>

      {/* Details dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedJob?.title ?? selectedJob?.job_title ?? "Job details"}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary">
            {selectedJob ? `${getEmployerName(selectedJob)} ${selectedJob?.location ? `• ${selectedJob.location}` : ""}` : ""}
          </Typography>
          <Box mt={2}>
            <Typography variant="body1" paragraph>
              {selectedJob?.description ?? selectedJob?.details ?? "No further description available."}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => { setDialogOpen(false); navigate("/profile"); }}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
