def send_job_notification(user_name: str, phone_number: str, job_title: str):
    """
    A placeholder function to simulate sending a job notification.
    In the future, this could be an email, SMS, or push notification.
    """
    # For now, we'll just print to the console to prove it's working.
    print("--- Running Notification Task ---")
    print(f"To: {user_name} ({phone_number})")
    print(f"Message: A new job matching your skills has been posted: '{job_title}'")
    print("-----------------------------")