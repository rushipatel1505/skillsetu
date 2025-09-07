import streamlit as st
import requests
import time

st.set_page_config(page_title="Signup", page_icon="📝")

API_URL = "http://127.0.0.1:8000"

st.title("📝 Create an Account")

# If user is already logged in, they shouldn't be on this page
if st.session_state.get("token"):
    st.warning("You are already logged in. Please log out to create a new account.")
    st.stop()

with st.form("signup_form"):
    st.write("Please fill in the details below to register.")
    
    name = st.text_input("Full Name")
    phone_number = st.text_input("Phone Number")
    password = st.text_input("Password", type="password")
    confirm_password = st.text_input("Confirm Password", type="password")
    role = st.selectbox("I am a:", ('seeker', 'employer'))
    location_area = st.text_input("Location Area (e.g., Adajan, Vesu)")
    
    submitted = st.form_submit_button("Sign Up")

    if submitted:
        # --- Frontend Validation ---
        if not all([name, phone_number, password, confirm_password, role, location_area]):
            st.error("Please fill out all fields.")
        elif password != confirm_password:
            st.error("Passwords do not match.")
        else:
            # --- API Call ---
            payload = {
                "name": name,
                "phone_number": phone_number,
                "password": password,
                "role": role,
                "location_area": location_area
            }
            
            try:
                response = requests.post(f"{API_URL}/signup/", json=payload)
                
                if response.status_code == 200:
                    st.success("Account created successfully! Redirecting you to the login page...")
                    time.sleep(2) # Give user time to read the message
                    st.switch_page("pages/2_Login.py")
                elif response.status_code == 400:
                    # Specific error from our backend (e.g., phone already registered)
                    st.error(response.json().get("detail", "An error occurred."))
                else:
                    st.error("An unknown error occurred. Please try again.")

            except requests.exceptions.ConnectionError:
                st.error("Could not connect to the server. Please try again later.")