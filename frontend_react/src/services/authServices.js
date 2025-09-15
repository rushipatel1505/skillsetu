import api from "../services/api";

export const signupUser = async (data) => {
  const response = await api.post("/signup/", data);
  return response.data;
};
export const loginUser = async (credentials) => {
  const formData = new URLSearchParams();
  formData.append("username", credentials.username);
  formData.append("password", credentials.password);

  const response = await api.post("/token", formData);
  return response.data;
};
export const fetchJobs = async () => {
  const response = await api.get("/jobs/");
  return response.data;
};
