import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const EXERCISES = [
  { key: "squat", label: "Squat", icon: "🦵" },
  { key: "bicep_curl", label: "Bicep Curl", icon: "💪" },
  { key: "shoulder_press", label: "Shoulder Press", icon: "🏋️" },
];

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [prs, setPrs] = useState({ squat: [], bicep_curl: [], shoulder_press: [] });
  const [newWeight, setNewWeight] = useState("");
  const [prInputs, setPrInputs] = useState({
    squat: { weight: "", reps: "" },
    bicep_curl: { weight: "", reps: "" },
    shoulder_press: { weight: "", reps: "" },
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchAll = useCallback(async (token) => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [profileRes, weightRes, prsRes] = await Promise.all([
        fetch("http://localhost:5000/api/profile", { headers }),
        fetch("http://localhost:5000/api/profile/weight-history", { headers }),
        fetch("http://localhost:5000/api/profile/prs", { headers }),
      ]);
      if (profileRes.ok) setProfile(await profileRes.json());
      if (weightRes.ok) setWeightLogs(await weightRes.json());
      if (prsRes.ok) setPrs(await prsRes.json());
    } catch {
      showMessage("Failed to load profile data.", "error");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchAll(token);
  }, [navigate, fetchAll]);

  const calcBMI = (height, weightLbs) => {
    if (!height || !weightLbs) return null;
    const weightKg = weightLbs * 0.453592;
    return (weightKg / ((height / 100) ** 2)).toFixed(1);
  };

  const getBMIInfo = (bmi) => {
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: "Underweight", color: "#3182ce" };
    if (b < 25)   return { label: "Normal", color: "#38a169" };
    if (b < 30)   return { label: "Overweight", color: "#d69e2e" };
    return { label: "Obese", color: "#e53e3e" };
  };

  const handleWeightUpdate = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) return;
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/profile/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ weight_lbs: parseFloat(newWeight) }),
    });
    if (res.ok) {
      showMessage("Weight updated successfully!");
      setNewWeight("");
      fetchAll(token);
    } else {
      showMessage("Failed to update weight.", "error");
    }
  };

  const handleAddPR = async (exerciseKey) => {
    const input = prInputs[exerciseKey];
    if (!input.weight || parseFloat(input.weight) <= 0) return;
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/profile/pr", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        exercise_type: exerciseKey,
        weight_lbs: parseFloat(input.weight),
        reps: parseInt(input.reps) || 1,
      }),
    });
    if (res.ok) {
      showMessage("PR recorded!");
      setPrInputs({ ...prInputs, [exerciseKey]: { weight: "", reps: "" } });
      fetchAll(token);
    } else {
      showMessage("Failed to save PR.", "error");
    }
  };

  const getBestPR = (records) => {
    if (!records || records.length === 0) return null;
    return records.reduce((best, r) => (r.weight_lbs > best.weight_lbs ? r : best), records[0]);
  };

  const bmi = profile ? calcBMI(profile.height, profile.weight) : null;
  const bmiInfo = bmi ? getBMIInfo(bmi) : null;

  return (
    <div style={{ minHeight: "100vh", width: "100vw", backgroundColor: "#f5f5f5" }}>

      {/* Nav */}
      <nav style={{
        backgroundColor: "white", padding: "15px 30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxSizing: "border-box",
      }}>
        <h2 style={{ margin: 0, color: "#667eea", cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          MotionCorrect
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate("/dashboard")} style={btnStyle("#667eea")}>
            Dashboard
          </button>
          <button onClick={() => { localStorage.clear(); navigate("/login"); }} style={btnStyle("#f56565")}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", boxSizing: "border-box" }}>

        {/* Flash Message */}
        {message.text && (
          <div style={{
            background: message.type === "error" ? "#fed7d7" : "#c6f6d5",
            color: message.type === "error" ? "#c53030" : "#276749",
            padding: "12px 20px", borderRadius: 8, marginBottom: 24, fontWeight: 600,
          }}>
            {message.text}
          </div>
        )}

        {/* User Info Card */}
        {profile && (
          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 24px 0", color: "#2d3748", fontSize: 22 }}>
              👤 {profile.username}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 24 }}>
              <StatBox label="Email" value={profile.email} small />
              <StatBox label="Member Since" value={profile.created_at} small />
              <StatBox label="Height" value={profile.height ? `${profile.height} cm` : "—"} />
              <StatBox label="Current Weight" value={profile.weight ? `${profile.weight} lbs` : "—"} />
              {bmi && (
                <StatBox label="BMI" value={bmi} sub={bmiInfo.label} subColor={bmiInfo.color} />
              )}
            </div>
          </div>
        )}

        {/* Weight Update */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 20px 0", color: "#2d3748" }}>⚖️ Update Weight</h3>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
            <input
              type="number"
              placeholder="New weight (lbs)"
              value={newWeight}
              min="20"
              max="300"
              onChange={(e) => setNewWeight(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleWeightUpdate}
              disabled={!newWeight}
              style={{ ...btnStyle("#667eea"), opacity: newWeight ? 1 : 0.5 }}
            >
              Update
            </button>
          </div>

          {weightLogs.length > 0 && (
            <>
              <p style={{ margin: "0 0 12px 0", color: "#718096", fontSize: 13, fontWeight: 600 }}>
                WEIGHT HISTORY
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {weightLogs.map((log, i) => (
                  <div key={i} style={{
                    background: i === 0 ? "#ebf8ff" : "#f7fafc",
                    border: `1px solid ${i === 0 ? "#667eea" : "#e2e8f0"}`,
                    borderRadius: 8, padding: "10px 16px", textAlign: "center",
                  }}>
                    <div style={{ fontWeight: 700, color: i === 0 ? "#667eea" : "#2d3748", fontSize: 16 }}>
                      {log.weight_lbs} lbs
                    </div>
                    <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 2 }}>{log.date}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* PR Section */}
        <h3 style={{ color: "#2d3748", margin: "0 0 20px 0" }}>🏆 Personal Records</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {EXERCISES.map((ex) => {
            const best = getBestPR(prs[ex.key]);
            const input = prInputs[ex.key];
            const history = prs[ex.key];

            return (
              <div key={ex.key} style={cardStyle}>
                <h4 style={{ margin: "0 0 16px 0", color: "#2d3748", fontSize: 18 }}>
                  {ex.icon} {ex.label}
                </h4>

                {/* Best PR badge */}
                <div style={{
                  background: "#ebf8ff", borderRadius: 8, padding: "12px 16px",
                  marginBottom: 16, borderLeft: "4px solid #667eea",
                }}>
                  <div style={{ fontSize: 11, color: "#718096", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                    BEST PR
                  </div>
                  {best ? (
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#667eea" }}>
                      {best.weight_lbs} lbs{" "}
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#718096" }}>
                        × {best.reps} rep{best.reps > 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "#a0aec0", fontStyle: "italic", fontSize: 14 }}>
                      No record yet — log your first PR!
                    </div>
                  )}
                </div>

                {/* Add PR form */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input
                    type="number"
                    placeholder="Weight (lbs)"
                    value={input.weight}
                    min="0"
                    onChange={(e) => setPrInputs({ ...prInputs, [ex.key]: { ...input, weight: e.target.value } })}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={input.reps}
                    min="1"
                    max="100"
                    onChange={(e) => setPrInputs({ ...prInputs, [ex.key]: { ...input, reps: e.target.value } })}
                    style={{ ...inputStyle, width: 70, flex: "none" }}
                  />
                  <button
                    onClick={() => handleAddPR(ex.key)}
                    disabled={!input.weight}
                    style={{ ...btnStyle("#667eea"), flex: "none", opacity: input.weight ? 1 : 0.5 }}
                  >
                    Log
                  </button>
                </div>

                {/* History */}
                {history.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#a0aec0", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                      HISTORY
                    </div>
                    {history.slice(0, 5).map((r, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "7px 0", borderBottom: "1px solid #f0f0f0",
                      }}>
                        <span style={{ color: "#2d3748", fontWeight: 600 }}>
                          {r.weight_lbs} lbs× {r.reps} rep{r.reps > 1 ? "s" : ""}
                        </span>
                        <span style={{ color: "#a0aec0", fontSize: 12 }}>{r.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const cardStyle = {
  background: "white",
  borderRadius: 12,
  padding: 28,
  marginBottom: 28,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
};

const inputStyle = {
  padding: "10px 14px",
  border: "2px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 15,
  boxSizing: "border-box",
  outline: "none",
};

const btnStyle = (bg) => ({
  padding: "10px 20px",
  background: bg,
  color: "white",
  border: "none",
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
});

// ── Stat box sub-component ────────────────────────────────────────────────────

function StatBox({ label, value, sub, subColor, small }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#a0aec0", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: small ? 14 : 20, fontWeight: 700, color: "#2d3748", wordBreak: "break-all" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 13, color: subColor || "#718096", fontWeight: 600, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default Profile;
