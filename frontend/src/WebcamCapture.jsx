import CoachPanel from "./CoachPanel";
import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

// ── Landmark indices (MediaPipe BlazePose) ──────────────────────────────────
const LM = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,    RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,    RIGHT_WRIST: 16,
  LEFT_HIP: 23,      RIGHT_HIP: 24,
  LEFT_KNEE: 25,     RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,    RIGHT_ANKLE: 28,
};

// ── Geometry helpers ────────────────────────────────────────────────────────
function angleDeg(a, b, c) {
  // Angle at joint B formed by A-B-C
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (mag === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
}

// ── Rep quality standards (based on joint angle thresholds) ─────────────────
const REP_QUALITY = {
  squat:          (rep) => rep.minAngle < 100 && rep.maxAngle > 160,
  bicep_curl:     (rep) => rep.maxAngle > 150 && rep.minAngle < 60,
  shoulder_press: (rep) => rep.minAngle < 90  && rep.maxAngle > 150,
};

// ── Exercise definitions ────────────────────────────────────────────────────
const EXERCISES = {
  squat: {
    label: "Squats",
    icon: "🦵",
    color: "#00e5ff",
    getAngle: (lm) => {
      // Average both knee angles
      const l = angleDeg(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]);
      const r = angleDeg(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE]);
      return (l + r) / 2;
    },
    downThreshold: 100,   // angle < 100 → "down" position
    upThreshold: 160,     // angle > 160 → "up" position
    feedback: {
      down: "Hold it! 💪",
      up: "Stand tall!",
      going_down: "Bend those knees ↓",
      going_up: "Push up ↑",
    },
  },
  bicep_curl: {
    label: "Bicep Curls",
    icon: "💪",
    color: "#ff6b6b",
    getAngle: (lm) => {
      // Right arm elbow angle
      return angleDeg(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_ELBOW], lm[LM.RIGHT_WRIST]);
    },
    downThreshold: 160,
    upThreshold: 50,
    feedback: {
      down: "Full extension!",
      up: "Squeeze! 🔥",
      going_down: "Lower slowly ↓",
      going_up: "Curl up ↑",
    },
    invertedPhase: true, // "down" means arm extended (high angle), "up" means curled (low angle)
  },
  shoulder_press: {
    label: "Shoulder Press",
    icon: "🏋️",
    color: "#b388ff",
    getAngle: (lm) => {
      return angleDeg(lm[LM.RIGHT_ELBOW], lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP]);
    },
    downThreshold: 80,
    upThreshold: 150,
    feedback: {
      down: "Ready position",
      up: "Arms up! 🙌",
      going_down: "Lower arms ↓",
      going_up: "Press up ↑",
    },
  },
};

// ── Rep counter logic ───────────────────────────────────────────────────────
function createRepCounter(exercise) {
  return {
    reps: 0,
    phase: "up", // "up" | "down"
    angle: 0,
    feedback: "Get in position",
    update(landmarks) {
      if (!landmarks) return this;
      const angle = exercise.getAngle(landmarks);
      this.angle = Math.round(angle);

      const isDown = exercise.invertedPhase
        ? angle > exercise.downThreshold
        : angle < exercise.downThreshold;
      const isUp = exercise.invertedPhase
        ? angle < exercise.upThreshold
        : angle > exercise.upThreshold;

      if (this.phase === "up" && isDown) {
        this.phase = "down";
        this.feedback = exercise.feedback.down;
      } else if (this.phase === "down" && isUp) {
        this.phase = "up";
        this.reps += 1;
        this.feedback = exercise.feedback.up;
      } else if (this.phase === "up") {
        this.feedback = exercise.feedback.going_down;
      } else {
        this.feedback = exercise.feedback.going_up;
      }
      return { ...this };
    },
  };
}

// ── Component ───────────────────────────────────────────────────────────────
export default function WebcamCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("squat");
  const [repData, setRepData] = useState({ reps: 0, angle: 0, feedback: "Select exercise & start camera", phase: "up" });
  const [modelReady, setModelReady] = useState(false);

  const [formFeedback, setFormFeedback] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const isDetectingRef = useRef(false);
  const animFrameRef = useRef(null);
  const repCounterRef = useRef(createRepCounter(EXERCISES.squat));
  const repStatsRef = useRef([]);
  const currentRepAnglesRef = useRef([]);
  const prevRepsRef = useRef(0);

  // Reset counter and angle tracking when exercise changes
  useEffect(() => {
    repCounterRef.current = createRepCounter(EXERCISES[selectedExercise]);
    setRepData({ reps: 0, angle: 0, feedback: "Get in position", phase: "up" });
    repStatsRef.current = [];
    currentRepAnglesRef.current = [];
    prevRepsRef.current = 0;
  }, [selectedExercise]);

  // Init MediaPipe
  useEffect(() => {
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        setPoseLandmarker(landmarker);
        setModelReady(true);
      } catch (err) {
        console.error("MediaPipe error:", err);
      }
    })();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setIsDetecting(false);
      isDetectingRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  };

  const startDetection = () => {
    if (!poseLandmarker) return;
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) { setTimeout(startDetection, 500); return; }
    setIsDetecting(true);
    isDetectingRef.current = true;
    detectLoop();
  };

  const stopDetection = () => {
    setIsDetecting(false);
    isDetectingRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  const detectLoop = useCallback(() => {
    if (!isDetectingRef.current || !videoRef.current || !canvasRef.current || !poseLandmarker) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const exercise = EXERCISES[selectedExercise];

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const results = poseLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks?.length > 0) {
      const landmarks = results.landmarks[0];
      const drawingUtils = new DrawingUtils(ctx);

      // Draw skeleton
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
        color: "rgba(255,255,255,0.3)",
        lineWidth: 2,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: exercise.color,
        radius: 5,
        fillColor: "rgba(0,0,0,0.6)",
      });

      // Highlight the key joint for the selected exercise
      const keyJointIndex = {
        squat: LM.LEFT_KNEE,
        bicep_curl: LM.RIGHT_ELBOW,
        shoulder_press: LM.RIGHT_SHOULDER,
      }[selectedExercise];

      const kj = landmarks[keyJointIndex];
      if (kj) {
        ctx.beginPath();
        ctx.arc(kj.x * canvas.width, kj.y * canvas.height, 12, 0, Math.PI * 2);
        ctx.fillStyle = exercise.color + "99";
        ctx.fill();
        ctx.strokeStyle = exercise.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Update rep counter
      const updated = repCounterRef.current.update(landmarks);
      setRepData({ ...updated });

      // Collect angle data per rep
      currentRepAnglesRef.current.push(updated.angle);
      if (updated.reps > prevRepsRef.current) {
        const angles = currentRepAnglesRef.current;
        repStatsRef.current.push({
          minAngle: Math.min(...angles),
          maxAngle: Math.max(...angles),
        });
        currentRepAnglesRef.current = [];
        prevRepsRef.current = updated.reps;
      }
    }

    animFrameRef.current = requestAnimationFrame(detectLoop);
  }, [poseLandmarker, selectedExercise]);

  // Re-bind detectLoop when exercise changes mid-detection
  useEffect(() => {
    if (isDetecting) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      detectLoop();
    }
  }, [selectedExercise, detectLoop]);

  const saveWorkout = async () => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login to save workouts'); return; }

    try {
      // Calculate good reps and accuracy from angle data
      const repStats = repStatsRef.current;
      const qualityCheck = REP_QUALITY[selectedExercise];
      const goodReps = repStats.filter(qualityCheck).length;
      const accuracy = repStats.length > 0 ? Math.round((goodReps / repStats.length) * 100) : 0;

      // 1. Save workout to database
      const saveRes = await fetch('http://localhost:5000/api/workout/save', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_type: EXERCISES[selectedExercise].label,
          total_reps: repData.reps,
          good_reps: goodReps,
          accuracy: accuracy
        })
      });

      if (!saveRes.ok) {
        const data = await saveRes.json();
        alert('Failed to save: ' + (data.error || 'Unknown error'));
        return;
      }

      // 2. Start background AI form analysis
      setIsAnalyzing(true);
      setFormFeedback("");
      const analyzeRes = await fetch('http://localhost:5000/api/analyze-form', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_type: EXERCISES[selectedExercise].label,
          total_reps: repData.reps,
          rep_stats: repStatsRef.current,
        })
      });

      if (analyzeRes.ok) {
        const { task_id } = await analyzeRes.json();
        // Poll for result every 3 seconds
        const pollInterval = setInterval(async () => {
          try {
            const resultRes = await fetch(`http://localhost:5000/api/analyze-form/result/${task_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resultRes.status === 202) return; // still processing
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            if (resultRes.ok) {
              const data = await resultRes.json();
              setFormFeedback(data.feedback);
            }
          } catch {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
          }
        }, 3000);
        // Stop polling after 3 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
        }, 180000);
      } else {
        setIsAnalyzing(false);
      }

      // 3. Reset counter and angle tracking
      repCounterRef.current = createRepCounter(EXERCISES[selectedExercise]);
      setRepData({ reps: 0, angle: 0, feedback: "Get in position", phase: "up" });
      repStatsRef.current = [];
      currentRepAnglesRef.current = [];
      prevRepsRef.current = 0;

    } catch (err) {
      setIsAnalyzing(false);
      alert('Unable to connect to server');
      console.error('Save workout error:', err);
    }
  };

  const exercise = EXERCISES[selectedExercise];
  const progress = Math.min(100, (repData.reps % 10) * 10); // ring fills every 10 reps

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.logo}>MOTION<span style={{ color: exercise.color }}>CORRECT</span></span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ ...styles.badge, background: modelReady ? "#1a2a1a" : "#2a1a1a", color: modelReady ? "#4caf50" : "#f44336" }}>
            {modelReady ? "● MODEL READY" : "● LOADING..."}
          </span>
          <button onClick={() => navigate("/dashboard")} style={styles.navBtn}>
            ← DASHBOARD
          </button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.videoPanel}>
          <div style={styles.videoWrapper}>
            <video ref={videoRef} autoPlay playsInline width="640" height="480" style={styles.video} />
            <canvas ref={canvasRef} style={styles.canvas} />
            {!isStreaming && (
              <div style={styles.videoOverlay}>
                <span style={{ fontSize: 48 }}>📷</span>
                <p style={{ color: "#aaa", marginTop: 8 }}>Camera off</p>
              </div>
            )}
            {isDetecting && (
              <div style={{ ...styles.angleBadge, borderColor: exercise.color }}>
                <span style={{ color: exercise.color, fontSize: 22, fontWeight: 700 }}>{repData.angle}°</span>
                <span style={{ color: "#888", fontSize: 11, marginTop: 2 }}>JOINT ANGLE</span>
              </div>
            )}
          </div>

          <div style={styles.controls}>
            {!isStreaming ? (
              <button onClick={startCamera} style={{ ...styles.btn, background: "#1e3a1e", color: "#4caf50", border: "1px solid #4caf50" }}>
                ▶ Start Camera
              </button>
            ) : (
              <>
                <button onClick={stopCamera} style={{ ...styles.btn, background: "#3a1e1e", color: "#f44336", border: "1px solid #f44336" }}>
                  ■ Stop Camera
                </button>
                {!isDetecting ? (
                  <button onClick={startDetection} disabled={!modelReady} style={{ ...styles.btn, background: "#1a1e3a", color: exercise.color, border: `1px solid ${exercise.color}`, opacity: modelReady ? 1 : 0.4 }}>
                    ◉ Start Detection
                  </button>
                ) : (
                  <button onClick={stopDetection} style={{ ...styles.btn, background: "#2a1a2a", color: "#ff9800", border: "1px solid #ff9800" }}>
                    ◎ Stop Detection
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div style={styles.statsPanel}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>EXERCISE</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(EXERCISES).map(([key, ex]) => (
                <button
                  key={key}
                  onClick={() => setSelectedExercise(key)}
                  style={{
                    ...styles.exBtn,
                    background: selectedExercise === key ? ex.color + "22" : "transparent",
                    border: `1px solid ${selectedExercise === key ? ex.color : "#333"}`,
                    color: selectedExercise === key ? ex.color : "#888",
                  }}
                >
                  {ex.icon} {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <p style={styles.cardLabel}>REP COUNT</p>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="#222" strokeWidth="8" />
                <circle
                  cx="45" cy="45" r="38" fill="none"
                  stroke={exercise.color} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 45 45)"
                  style={{ transition: "stroke-dashoffset 0.4s ease" }}
                />
                <text x="45" y="52" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">
                  {repData.reps}
                </text>
              </svg>
              <div>
                <p style={{ color: "#555", fontSize: 12, margin: 0 }}>TOTAL REPS</p>
                <p style={{ color: "white", fontSize: 36, fontWeight: 800, margin: "4px 0" }}>{repData.reps}</p>
                <p style={{ color: "#555", fontSize: 12, margin: 0 }}>
                  PHASE: <span style={{ color: exercise.color }}>{repData.phase.toUpperCase()}</span>
                </p>
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, borderColor: exercise.color + "55" }}>
            <p style={styles.cardLabel}>COACH FEEDBACK</p>
            <p style={{ color: exercise.color, fontSize: 18, fontWeight: 600, margin: 0, minHeight: 28 }}>
              {repData.feedback}
            </p>
          </div>

          <button
            onClick={() => {
              repCounterRef.current = createRepCounter(EXERCISES[selectedExercise]);
              setRepData({ reps: 0, angle: 0, feedback: "Get in position", phase: "up" });
              repStatsRef.current = [];
              currentRepAnglesRef.current = [];
              prevRepsRef.current = 0;
              setFormFeedback("");
            }}
            style={{ ...styles.btn, width: "100%", background: "#1a1a1a", color: "#555", border: "1px solid #333", marginTop: 4 }}
          >
            ↺ Reset Counter
          </button>

          <button
            onClick={saveWorkout}
            disabled={repData.reps === 0}
            style={{ 
              ...styles.btn, 
              width: "100%", 
              background: repData.reps > 0 ? "#1e3a1e" : "#1a1a1a", 
              color: repData.reps > 0 ? "#4caf50" : "#555", 
              border: `1px solid ${repData.reps > 0 ? "#4caf50" : "#333"}`, 
              marginTop: 8,
              opacity: repData.reps === 0 ? 0.5 : 1,
              cursor: repData.reps === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            💾 Save Workout
          </button>
        </div>

        <div style={styles.coachPanel}>
          <CoachPanel formFeedback={formFeedback} isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    width: "100vw",
    background: "#0a0a0a",
    color: "white",
    fontFamily: "'Courier New', monospace",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    boxSizing: "border-box",
    margin: 0,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid #1e1e1e",
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 3,
    color: "white",
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    padding: "6px 12px",
    borderRadius: 4,
    border: "1px solid #333",
  },
  navBtn: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    padding: "6px 12px",
    borderRadius: 4,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#aaa",
    cursor: "pointer",
    fontFamily: "'Courier New', monospace",
  },
  body: {
    display: "flex",
    gap: 24,
    flex: 1,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
  },
  videoPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  videoWrapper: {
    position: "relative",
    width: 640,
    height: 480,
    background: "#111",
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid #1e1e1e",
  },
  video: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  videoOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#0d0d0d",
  },
  angleBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "rgba(0,0,0,0.75)",
    border: "1px solid",
    borderRadius: 6,
    padding: "6px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backdropFilter: "blur(4px)",
  },
  controls: {
    display: "flex",
    gap: 10,
  },
  statsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: 320,
    minWidth: 280,
  },
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: 8,
    padding: "16px 20px",
  },
  cardLabel: {
    color: "#444",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 700,
    marginBottom: 12,
    marginTop: 0,
  },
  btn: {
    padding: "12px 20px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    borderRadius: 6,
    cursor: "pointer",
    transition: "opacity 0.2s",
    fontFamily: "'Courier New', monospace",
  },
  exBtn: {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 6,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "'Courier New', monospace",
    transition: "all 0.2s",
  },
  coachPanel: {
    flex: 1,
    minWidth: 320,
    display: "flex",
    flexDirection: "column",
  },
};