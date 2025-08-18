import os
import requests
from langchain_groq import ChatGroq
from langchain.agents import tool, AgentExecutor, create_tool_calling_agent # Changed import
from langchain_core.prompts import ChatPromptTemplate # Changed import

# --- 1. The Brain: Initialize the Language Model ---
llm = ChatGroq(
    temperature=0, 
    groq_api_key=os.getenv("GROQ_API_KEY"), 
    model_name="llama3-70b-8192"
)

@tool
def find_jobs_tool(skill: str = "", location: str = "") -> str:
    """
    Searches for jobs based on a required skill and/or a location.
    You must provide at least one of the following: skill, location.
    Returns a list of matching jobs or a message if no jobs are found.
    """
    print(f"--- Running find_jobs_tool with skill: '{skill}', location: '{location}' ---")

    if not skill and not location:
        return "Error: You must provide either a skill or a location to search for jobs."

    api_url = "http://127.0.0.1:8000/jobs/"
    try:
        response = requests.get(api_url)
        if response.status_code != 200:
            return "Error: Could not fetch jobs from the API."

        all_jobs = response.json()
        matching_jobs = []
        
        # --- SMARTER FILTERING LOGIC ---
        skill_search_words = set(skill.lower().split())

        for job in all_jobs:
            # Check for skill match
            skill_match = not skill
            if skill:
                for s in job.get('required_skills', []):
                    db_skill_words = set(s.get('name', '').lower().split())
                    # Check if any of the search words overlap with the database skill words
                    if not skill_search_words.isdisjoint(db_skill_words):
                        skill_match = True
                        break
            
            # Check for location match
            location_match = not location
            if location:
                if location.lower() in job.get('location_area', '').lower():
                    location_match = True

            if skill_match and location_match:
                matching_jobs.append(f"- '{job['title']}' in {job['location_area']}")

        if not matching_jobs:
            return f"No jobs found matching your criteria."
        
        return "I found the following jobs:\n" + "\n".join(matching_jobs)

    except Exception as e:
        return f"An error occurred while searching for jobs: {e}"


# --- 3. The Agent: (Upgraded Version) ---

tools = [find_jobs_tool]

# This is our new, stricter prompt.
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant for the SkillSetu job board, a platform for jobs in Surat, India. "
            "You must use the tools provided to answer the user's questions about jobs. "
            "Do not make up information, skills, or locations. Be friendly and conversational."
        ),
        ("placeholder", "{chat_history}"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ]
)

# Create the new, more reliable Tool Calling agent
agent = create_tool_calling_agent(llm, tools, prompt) # Changed agent type

# The Agent Executor remains the same
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)