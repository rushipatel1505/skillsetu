import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  // useState hooks to store the form input values
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // useNavigate hook for programmatic redirection
  const navigate = useNavigate();

  // This function will be called when the form is submitted
  const handleLogin = async (event) => {
    event.preventDefault(); // Prevent the default browser page reload
    setError(''); // Clear previous errors

    try {
      // IMPORTANT: Our /token endpoint expects form data, not JSON.
      // We use URLSearchParams to format the data correctly.
      const params = new URLSearchParams();
      params.append('username', phone);
      params.append('password', password);

      const response = await axios.post('http://127.0.0.1:8000/token', params);
      
      // For now, we'll just show an alert and redirect.
      // In the next step, we will save the token.
      const token = response.data.access_token;
      alert('Login successful! Token: ' + token); // We'll replace this alert soon
      
      navigate('/profile'); // Redirect to the profile page

    } catch (err) {
      setError('Invalid phone number or password. Please try again.');
      console.error('Login failed:', err);
    }
  };

  return (
    <div>
      <h1>Login to SkillSetu</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Phone Number:</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required 
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label>Password:</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ marginTop: '1rem' }}>Login</button>
      </form>
    </div>
  );
}

export default LoginPage;