import streamlit as st
import requests
import time

st.set_page_config(page_title="My Profile", page_icon="👤")

API_URL = "http://127.0.0.1:8000"

# --- Helper Function to fetch all skills ---
def fetch_all_skills():
    try:
        response = requests.get(f"{API_URL}/skills/")
        if response.status_code == 200:
            return response.json()
    except requests.exceptions.ConnectionError:
        pass # The main error handling is in the main part of the app
    return []

# --- Check for Login ---
if st.session_state.get("token") is None:
    st.error("You need to be logged in to access this page.")
    st.stop()

st.title("👤 My Profile")

# --- Display User Details ---
user = st.session_state.get("user_details", {})

if user:
    st.subheader(f"Welcome, {user.get('name', 'User')}!")
    
    col1, col2 = st.columns(2)
    with col1:
        st.write(f"**Phone Number:**")
        st.info(user.get('phone_number'))
    with col2:
        st.write(f"**Location Area:**")
        st.info(user.get('location_area'))

    st.write(f"**Role:**")
    st.info(user.get('role').capitalize())

    st.subheader("My Skills")
    skills = user.get('skills', [])
    if skills:
        for skill in skills:
            st.success(f"{skill['name']} ({skill['category']})")
    else:
        st.warning("You haven't added any skills to your profile yet.")
    
    st.markdown("---")

    # --- FORM TO UPDATE SKILLS (Only for Seekers) ---
    if user.get('role') == 'seeker':
        st.subheader("Update Your Skills")

        all_skills = fetch_all_skills()
        if all_skills:
            # Create a mapping of skill names to their IDs
            skill_map = {skill['name']: skill['id'] for skill in all_skills}
            
            # Get the names of the user's current skills for the default selection
            current_skill_names = [skill['name'] for skill in user.get('skills', [])]
            
            with st.form("update_skills_form"):
                selected_skill_names = st.multiselect(
                    "Select your skills",
                    options=skill_map.keys(),
                    default=current_skill_names
                )
                submitted = st.form_submit_button("Update Skills")

                if submitted:
                    # Convert selected names back to IDs
                    selected_skill_ids = [skill_map[name] for name in selected_skill_names]
                    
                    # Prepare data and headers for API call
                    payload = {"skill_ids": selected_skill_ids}
                    headers = {"Authorization": f"Bearer {st.session_state.token}"}
                    
                    response = requests.put(f"{API_URL}/users/me/skills", json=payload, headers=headers)
                    
                    if response.status_code == 200:
                        # IMPORTANT: Update the session state with the new user details
                        st.session_state.user_details = response.json()
                        st.success("Skills updated successfully!")
                        time.sleep(1)
                        st.rerun()
                    else:
                        st.error("Failed to update skills. Please try again.")

else:
    st.error("Could not retrieve user details.")