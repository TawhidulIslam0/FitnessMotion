import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userId', data.user.id);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Unable to connect to server');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '400px',
        maxWidth: '90%'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '10px',
          color: '#2d3748',
          fontSize: '32px'
        }}>
          MotionCorrect
        </h1>
        <p style={{ 
          textAlign: 'center', 
          color: '#666', 
          marginBottom: '30px',
          fontSize: '14px'
        }}>
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: '600',
              color: '#2d3748'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: '600',
              color: '#2d3748'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fed7d7',
              color: '#c53030',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </form>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          color: '#718096',
          fontSize: '14px'
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ 
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;