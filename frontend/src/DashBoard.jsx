import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalReps: 0,
    avgAccuracy: 0
  });
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("username");

    if (!token) {
      navigate("/login");
      return;
    }

    setUsername(user);
    fetchUserStats(token);
    fetchWorkoutHistory(token);
  }, [navigate]);

  const fetchUserStats = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalWorkouts: data.totalWorkouts || 0,
          totalReps: data.totalReps || 0,
          avgAccuracy: data.avgAccuracy || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchWorkoutHistory = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/workout/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const startWorkout = () => {
    navigate("/exercise");
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "#f5f5f5",
      margin: 0,
      padding: 0,
      overflow: "hidden",
    }}>
      <nav style={{
        backgroundColor: "white",
        padding: "15px 30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <h2 style={{ margin: 0, color: "#667eea" }}>MotionCorrect</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontWeight: "500" }}>Welcome, {username}!</span>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f56565",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        boxSizing: "border-box",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "60px 40px",
          borderRadius: "12px",
          textAlign: "center",
          marginBottom: "40px",
          boxSizing: "border-box",
        }}>
          <h1 style={{
            fontSize: "36px",
            marginBottom: "15px",
            margin: "0 0 15px 0",
          }}>
            Ready to improve your form?
          </h1>
          <p style={{
            fontSize: "18px",
            marginBottom: "30px",
            opacity: 0.9,
            margin: "0 0 30px 0",
          }}>
            Start a new workout session with real-time pose detection
          </p>
          <button
            onClick={startWorkout}
            style={{
              padding: "15px 40px",
              backgroundColor: "white",
              color: "#667eea",
              border: "none",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            Start Workout
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "25px",
          marginBottom: "40px",
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>🏋️</div>
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#2d3748",
              marginBottom: "5px",
            }}>
              {stats.totalWorkouts}
            </div>
            <div style={{
              color: "#718096",
              fontSize: "14px",
              textTransform: "uppercase",
            }}>
              Total Workouts
            </div>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>💪</div>
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#2d3748",
              marginBottom: "5px",
            }}>
              {stats.totalReps}
            </div>
            <div style={{
              color: "#718096",
              fontSize: "14px",
              textTransform: "uppercase",
            }}>
              Total Reps
            </div>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#2d3748",
              marginBottom: "5px",
            }}>
              {stats.avgAccuracy}%
            </div>
            <div style={{
              color: "#718096",
              fontSize: "14px",
              textTransform: "uppercase",
            }}>
              Avg Accuracy
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: "20px", color: "#2d3748" }}>Quick Actions</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "25px",
          marginBottom: "40px",
        }}>
          <div
            onClick={startWorkout}
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "2px solid transparent",
              transition: "all 0.3s",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <h3 style={{ fontSize: "20px", margin: "0 0 8px 0", color: "#000000" }}>
              🎯 Start Exercise
            </h3>
            <p style={{ color: "#718096", fontSize: "14px", margin: 0 }}>
              Begin a new workout session
            </p>
          </div>

          <div
            onClick={() => navigate("/profile")}
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "2px solid transparent",
              transition: "all 0.3s",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <h3 style={{ fontSize: "20px", margin: "0 0 8px 0", color: "#000000" }}>
              👤 Profile
            </h3>
            <p style={{ color: "#718096", fontSize: "14px", margin: 0 }}>
              Update weight & BMI
            </p>
          </div>
        </div>

        <h2 style={{ marginBottom: "20px", color: "#2d3748" }}>📊 Workout History</h2>
        <div style={{
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}>
          {history.length === 0 ? (
            <p style={{ padding: "30px", textAlign: "center", color: "#718096", margin: 0 }}>
              No workouts yet — go save one!
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f7fafc" }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Exercise</th>
                  <th style={thStyle}>Reps</th>
                  <th style={thStyle}>Good Reps</th>
                  <th style={thStyle}>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {history.map((w, i) => (
                  <tr key={w.id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#f7fafc" }}>
                    <td style={tdStyle}>{w.created_at}</td>
                    <td style={tdStyle}>{w.exercise_type}</td>
                    <td style={tdStyle}>{w.total_reps}</td>
                    <td style={tdStyle}>{w.good_reps}</td>
                    <td style={tdStyle}>{w.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px 20px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: "700",
  color: "#718096",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle = {
  padding: "14px 20px",
  fontSize: "14px",
  color: "#2d3748",
  borderBottom: "1px solid #e2e8f0",
};

export default Dashboard;