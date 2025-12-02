import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(true);
  const navigate = useNavigate();
  const { API_URL } = useContext(StoreContext);

  // Check server connection on component mount
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        if (!response.ok) {
          throw new Error('Server is not responding');
        }
        setIsServerConnected(true);
      } catch (err) {
        console.error('Server connection error:', err);
        setIsServerConnected(false);
        setError('Cannot connect to the server. Please try again later.');
      }
    };

    checkServerConnection();
  }, [API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Check server connection before making the request
      if (!isServerConnected) {
        throw new Error('Cannot connect to the server. Please try again later.');
      }

      // Make login request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.token) {
        throw new Error('No authentication token received');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to home page or previous page
      const returnTo = localStorage.getItem('returnTo') || '/';
      localStorage.removeItem('returnTo');
      navigate(returnTo);
    } catch (err) {
      console.error('Login error:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to the server. Please try again later.');
        setIsServerConnected(false);
      } else {
        setError(err.message || 'An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (!response.ok) {
        throw new Error('Server is not responding');
      }
      setIsServerConnected(true);
      setError('');
    } catch (err) {
      console.error('Server connection error:', err);
      setError('Still cannot connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>Login</h2>
        {error && (
          <div className="error-message">
            {error}
            {!isServerConnected && (
              <button onClick={handleRetry} className="retry-button" disabled={loading}>
                {loading ? 'Retrying...' : 'Retry Connection'}
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={!isServerConnected || loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={!isServerConnected || loading}
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !isServerConnected}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="register-link">
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')} className="link">
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login; 