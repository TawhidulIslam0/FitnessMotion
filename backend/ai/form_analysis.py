EXERCISE_STANDARDS = {
    "Squats": {
        "joint": "knee",
        "good_bottom": "angle below 100° (deep squat)",
        "good_top": "angle above 160° (full extension)",
        "tips": "Keep knees tracking over toes, chest upright, weight in heels.",
    },
    "Bicep Curls": {
        "joint": "elbow",
        "good_bottom": "angle above 150° (arm fully extended)",
        "good_top": "angle below 60° (fully curled)",
        "tips": "Avoid swinging, keep elbows pinned to sides, control the descent.",
    },
    "Shoulder Press": {
        "joint": "shoulder",
        "good_bottom": "angle below 90° (ready position)",
        "good_top": "angle above 150° (arms fully extended overhead)",
        "tips": "Keep core tight, press straight up, avoid flaring elbows.",
    },
}

def analyze_workout(exercise_type: str, total_reps: int, good_reps: int, accuracy: float, rep_stats: list = None) -> str:
    """Automatically analyzes workout and highlights key insights"""
    insights = []
    
    # Key insight - Overall performance
    if accuracy >= 90:
        insights.append(f"✓ EXCELLENT: {accuracy}% accuracy - outstanding form consistency")
    elif accuracy >= 75:
        insights.append(f"✓ GOOD: {accuracy}% accuracy - solid performance with room to improve")
    elif accuracy >= 60:
        insights.append(f"⚠ FAIR: {accuracy}% accuracy - focus on form quality")
    else:
        insights.append(f"⚠ NEEDS WORK: {accuracy}% accuracy - review proper form")
    
    # Key insight - Completion rate
    insights.append(f"→ Completed {total_reps} reps ({good_reps} with proper form)")
    
    # Analyze rep stats if available
    if rep_stats and len(rep_stats) > 0:
        avg_bottom = sum(r.get("minAngle", 0) for r in rep_stats) / len(rep_stats)
        avg_top = sum(r.get("maxAngle", 0) for r in rep_stats) / len(rep_stats)
        
        standards = EXERCISE_STANDARDS.get(exercise_type, {})
        
        # Range of motion insight
        if exercise_type == "Squats":
            if avg_bottom < 100:
                insights.append(f"✓ Great depth: averaging {avg_bottom:.0f}° at bottom")
            else:
                insights.append(f"⚡ OPTIMIZE: Go deeper (current: {avg_bottom:.0f}°, target: below 100°)")
                
            if avg_top > 160:
                insights.append(f"✓ Full extension: {avg_top:.0f}° at top")
            else:
                insights.append(f"⚡ OPTIMIZE: Extend fully at top (current: {avg_top:.0f}°, target: above 160°)")
                
        elif exercise_type == "Bicep Curls":
            if avg_bottom > 150:
                insights.append(f"✓ Good extension: {avg_bottom:.0f}° at bottom")
            else:
                insights.append(f"⚡ OPTIMIZE: Extend arms fully (current: {avg_bottom:.0f}°, target: above 150°)")
                
            if avg_top < 60:
                insights.append(f"✓ Full curl: {avg_top:.0f}° at top")
            else:
                insights.append(f"⚡ OPTIMIZE: Curl tighter (current: {avg_top:.0f}°, target: below 60°)")
                
        elif exercise_type == "Shoulder Press":
            if avg_bottom < 90:
                insights.append(f"✓ Good start position: {avg_bottom:.0f}°")
            else:
                insights.append(f"⚡ OPTIMIZE: Lower start position (current: {avg_bottom:.0f}°, target: below 90°)")
                
            if avg_top > 150:
                insights.append(f"✓ Full overhead extension: {avg_top:.0f}°")
            else:
                insights.append(f"⚡ OPTIMIZE: Press higher (current: {avg_top:.0f}°, target: above 150°)")
        
        # Consistency check
        bottom_angles = [r.get("minAngle", 0) for r in rep_stats]
        variance = max(bottom_angles) - min(bottom_angles) if bottom_angles else 0
        
        if variance > 25:
            insights.append(f"⚠ ISSUE: High variance ({variance:.0f}°) - maintain consistency")
        elif variance < 15:
            insights.append(f"✓ Very consistent range of motion")
    
    # Volume insight
    if total_reps < 8:
        insights.append(f"⚡ OPTIMIZE: Increase volume (aim for 10-15 reps per set)")
    elif total_reps > 20:
        insights.append(f"⚡ OPTIMIZE: Consider adding weight (20+ reps suggests you can increase resistance)")
    
    # Technique tip
    if standards := EXERCISE_STANDARDS.get(exercise_type):
        insights.append(f"💡 TIP: {standards.get('tips', '')}")
    
    return "\n".join(insights)
 
def build_form_prompt(exercise_type: str, total_reps: int, rep_stats: list) -> str:
    standards = EXERCISE_STANDARDS.get(exercise_type, {})
 
    rep_lines = ""
    for i, rep in enumerate(rep_stats, 1):
        rep_lines += f"  Rep {i}: bottom {rep.get('minAngle', '?')}°, top {rep.get('maxAngle', '?')}°\n"
 
    avg_bottom = (
        round(sum(r.get("minAngle", 0) for r in rep_stats) / len(rep_stats))
        if rep_stats else 0
    )
    avg_top = (
        round(sum(r.get("maxAngle", 0) for r in rep_stats) / len(rep_stats))
        if rep_stats else 0
    )
 
    return f"""You are an expert personal trainer. Analyze the exercise form data below and give specific feedback.
 
Exercise: {exercise_type}
Total reps: {total_reps}
Average bottom position: {avg_bottom}°
Average top position: {avg_top}°
 
Per-rep breakdown:
{rep_lines}
Good form standards for {exercise_type}:
- Bottom position: {standards.get('good_bottom', 'full range of motion')}
- Top position: {standards.get('good_top', 'full extension')}
- Key tips: {standards.get('tips', '')}
 
Based on the data, provide:
1. Overall form rating: Good / Needs Improvement / Poor
2. What the athlete did well (1-2 points)
3. What to improve with specific angle targets (1-2 points)
 
Be concise, encouraging, and specific. Maximum 120 words."""