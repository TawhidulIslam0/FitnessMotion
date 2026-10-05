import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    height: '',
    weight: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const heightM = formData.height / 100;
      const weightKg = formData.weight * 0.453592;
      const bmi = (weightKg / (heightM * heightM)).toFixed(1);
      return bmi;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully!');
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Unable to connect to server');
    }
  };

  const bmi = calculateBMI();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '500px',
        maxWidth: '90%'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '10px',
          color: '#2d3748',
          fontSize: '32px'
        }}>
          Create Account
        </h1>
        <p style={{ 
          textAlign: 'center', 
          color: '#666', 
          marginBottom: '30px',
          fontSize: '14px'
        }}>
          Join MotionCorrect
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
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
              color: '#2d3748',
              fontSize: '14px'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px', 
            marginBottom: '20px' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: '600',
                color: '#2d3748',
                fontSize: '14px'
              }}>
                Height (cm)
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="170"
                min="100"
                max="250"
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

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: '600',
                color: '#2d3748',
                fontSize: '14px'
              }}>
                Weight (lbs)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="154"
                min="66"
                max="440"
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
          </div>

          {bmi && (
            <div style={{
              backgroundColor: '#ebf8ff',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px',
              borderLeft: '4px solid #667eea',
              fontSize: '14px'
            }}>
              <span>Your BMI: </span>
              <strong style={{ fontSize: '18px', color: '#667eea' }}>{bmi}</strong>
              <span style={{ marginLeft: '8px', color: '#4a5568' }}>
                {bmi < 18.5 && '(Underweight)'}
                {bmi >= 18.5 && bmi < 25 && '(Normal)'}
                {bmi >= 25 && bmi < 30 && '(Overweight)'}
                {bmi >= 30 && '(Obese)'}
              </span>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              minLength="6"
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
            Create Account
          </button>
        </form>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          color: '#718096',
          fontSize: '14px'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ 
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;