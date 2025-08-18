import streamlit as st
import requests
import pandas as pd

# --- Page Configuration ---
st.set_page_config(
    page_title="SkillSetu Job Board",
    page_icon=" briefcase ",
    layout="wide"
)

# --- API URL ---
API_URL = "http://127.0.0.1:8000"

# --- Main Application ---
st.title("  Briefcase SkillSetu Job Board")
st.markdown("---")

# Function to fetch jobs from the backend
def fetch_jobs():
    try:
        response = requests.get(f"{API_URL}/jobs/")
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Failed to fetch jobs. Status code: {response.status_code}")
            return []
    except requests.exceptions.ConnectionError:
        st.error("Connection to the backend failed. Is the FastAPI server running?")
        return []

# Fetch and display jobs
jobs = fetch_jobs()

if jobs:
    for job in jobs:
        with st.container():
            st.subheader(job['title'])
            st.write(f"**Location:** {job['location_area']}")
            
            with st.expander("More Details"):
                st.markdown(job['description'])
                
                # Display skills in a nice format
                if job['required_skills']:
                    skills_str = ", ".join([skill['name'] for skill in job['required_skills']])
                    st.write(f"**Required Skills:** {skills_str}")
                else:
                    st.write("**Required Skills:** None specified")
            
            st.markdown("---")
else:
    st.info("No jobs posted yet. Check back later!")