import React, { useState, useEffect } from 'react';
import axios from 'axios';

// This is a React component. It's a function that returns HTML-like JSX.
function JobList() {
  // 'useState' is a "hook" to give our component memory.
  // We'll store our list of jobs here.
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  // 'useEffect' is a "hook" to perform actions when the component loads.
  // The empty array [] at the end means "run this only once".
  useEffect(() => {
    // We define an async function inside to fetch the data
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/jobs/');
        setJobs(response.data); // Save the fetched jobs into our state
      } catch (err) {
        setError('Failed to fetch jobs. Is the backend server running?');
        console.error(err);
      }
    };

    fetchJobs(); // Call the function
  }, []);

  return (
    <div>
      <h1>SkillSetu Job Board</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        {/* We loop over the 'jobs' array and create a div for each job */}
        {jobs.map(job => (
          <div key={job.id} style={{ border: '1px solid grey', padding: '10px', margin: '10px' }}>
            <h2>{job.title}</h2>
            <p><strong>Location: </strong> {job.location_area}</p>
            <p><strong>Job description: </strong>{job.description}</p>
            <p><strong>Skills: </strong> {job.required_skills.map(skill => skill.name).join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobList;