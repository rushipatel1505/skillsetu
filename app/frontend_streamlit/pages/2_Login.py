import streamlit as st
import time
import requests

st.set_page_config(page_title="Login", page_icon="🔑")

# --- API URL ---
API_URL = "http://127.0.0.1:8000"

# Initialize session state keys
if 'token' not in st.session_state:
    st.session_state.token = None
if 'user_details' not in st.session_state:
    st.session_state.user_details = None

st.title("Login to SkillSetu")

# If user is already logged in, show a different message
if st.session_state.token:
    st.success(f"You are logged in as **{st.session_state.user_details['name']}**!")
    if st.button("Logout"):
        st.session_state.token = None
        st.session_state.user_details = None
        st.rerun() # Rerun the page to update the state
else:
    # Login Form
    with st.form("login_form"):
        phone = st.text_input("Phone Number")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")

        if submitted:
            if not phone or not password:
                st.warning("Please enter both phone number and password.")
            else:
                # IMPORTANT: The /token endpoint expects form data, not JSON
                response = requests.post(
                    f"{API_URL}/token",
                    data={"username": phone, "password": password}
                )


                # ... (inside the `if submitted:` block)
                if response.status_code == 200:
                    token = response.json().get("access_token")
                    st.session_state.token = token
                    
                    # Fetch user details to store in session state
                    headers = {"Authorization": f"Bearer {token}"}
                    user_response = requests.get(f"{API_URL}/users/me/", headers=headers)
                    if user_response.status_code == 200:
                        st.session_state.user_details = user_response.json()
                    
                    st.success("Logged in successfully! Redirecting...")
                    time.sleep(1) # A small delay to let the user read the message
                    st.switch_page("pages/3_Profile.py") # The magic redirect command
                else:
                    st.error("Invalid phone number or password.")