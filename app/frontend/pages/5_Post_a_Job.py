import streamlit as st
import requests
import time

st.set_page_config(page_title="Post a New Job", page_icon="💼")

API_URL = "http://127.0.0.1:8000"

# --- Helper Function to fetch all skills (can copy from Profile page) ---
def fetch_all_skills():
    try:
        response = requests.get(f"{API_URL}/skills/")
        if response.status_code == 200:
            return response.json()
    except:
        return []

st.title("💼 Post a New Job")

# --- Page Protection ---
# Check if user is logged in
if st.session_state.get("token") is None:
    st.error("You must be logged in to post a job.")
    st.stop()

# Check if user is an employer
user_details = st.session_state.get("user_details", {})
if user_details.get("role") != 'employer':
    st.error("Only users with the 'employer' role can post new jobs.")
    st.stop()

# --- Job Posting Form ---
all_skills = fetch_all_skills()
if not all_skills:
    st.warning("Could not fetch skills from the database. Please make sure the backend is running and skills are populated.")
    st.stop()

# Create a mapping of skill names to their IDs for easier processing
skill_map = {skill['name']: skill['id'] for skill in all_skills}

with st.form("post_job_form"):
    st.write("Fill out the details for the new job opening.")
    
    title = st.text_input("Job Title")
    description = st.text_area("Job Description")
    location_area = st.text_input("Location Area (e.g., Adajan, Vesu)")
    
    selected_skill_names = st.multiselect(
        "Select required skills",
        options=skill_map.keys()
    )
    
    submitted = st.form_submit_button("Post Job")

    if submitted:
        if not all([title, description, location_area, selected_skill_names]):
            st.error("Please fill out all fields and select at least one skill.")
        else:
            # Convert selected names back to IDs for the API
            required_skill_ids = [skill_map[name] for name in selected_skill_names]
            
            # Prepare data and headers for API call
            payload = {
                "title": title,
                "description": description,
                "location_area": location_area,
                "required_skill_ids": required_skill_ids
            }
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            
            response = requests.post(f"{API_URL}/jobs/", json=payload, headers=headers)
            
            if response.status_code == 200:
                st.success("Job posted successfully!")
                st.balloons()
                time.sleep(2)
                st.switch_page("Home.py") # Redirect to home to see the new job
            else:
                st.error(f"Failed to post job. Error: {response.json().get('detail')}")