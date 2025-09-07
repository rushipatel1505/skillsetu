import os
from sqlalchemy import create_engine, text
from langchain.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

embedding_function = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# --- 1. Database Connection ---
# Make sure your .env file has your DB credentials if you're using them
# For simplicity, we'll construct the URL here. Update with your details.
DB_USER = "root"
DB_PASSWORD = "Rushi*1527" # IMPORTANT: Replace with your actual password
DB_HOST = "127.0.0.1"
DB_NAME = "skillsetu_db"
db_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
engine = create_engine(db_url)

# --- 2. Fetch Job Data from MySQL ---
def fetch_job_data():
    """Fetches all jobs and their associated skills from the database."""
    print("Fetching job data from MySQL...")
    # This SQL query joins jobs with skills through the association table
    query = text("""
        SELECT 
            j.id as job_id, 
            j.title, 
            j.description, 
            j.location_area, 
            GROUP_CONCAT(s.name SEPARATOR ', ') as skills
        FROM jobs j
        LEFT JOIN job_skills js ON j.id = js.job_id
        LEFT JOIN skills s ON js.skill_id = s.id
        GROUP BY j.id;
    """)
    with engine.connect() as connection:
        result = connection.execute(query)
        jobs = result.fetchall()
        print(f"Found {len(jobs)} jobs in the database.")
        return jobs

# --- 3. Prepare Documents for Embedding ---
def prepare_documents(jobs):
    """Formats the job data into clean text documents for embedding."""
    print("Preparing documents for embedding...")
    documents = []
    metadatas = []
    for job in jobs:
        # Create a single block of text for each job
        content = (
            f"Job Title: {job.title}. "
            f"Location: {job.location_area}. "
            f"Description: {job.description}. "
            f"Required Skills: {job.skills if job.skills else 'None specified'}."
        )
        documents.append(content)
        # Store the original job ID in the metadata
        metadatas.append({"job_id": job.job_id})
    return documents, metadatas

# --- Main Ingestion Logic ---
if __name__ == "__main__":
    job_data = fetch_job_data()
    
    if not job_data:
        print("No jobs to ingest. Please add jobs to the database first.")
    else:
        docs, metas = prepare_documents(job_data)
        
        # Initialize the embedding model
        print("Initializing embedding model... (This may download the model the first time)")
        
        
        # Define the path for the local ChromaDB database
        db_directory = 'chroma_db'
        
        # Create the ChromaDB vector store
        print(f"Creating and persisting vector database in '{db_directory}'...")
        db = Chroma.from_documents(
            docs, 
            embedding_function, 
            metadatas=metas,
            persist_directory=db_directory
        )
        
        print(f"\nSuccessfully ingested {len(docs)} jobs into ChromaDB!")