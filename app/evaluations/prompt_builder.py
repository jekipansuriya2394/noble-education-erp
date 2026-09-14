"""Pedagogical Prompt Builder for Personalized Narrative Report Cards."""

import json
from app.evaluations.footprint import StudentTermFootprint

EVALUATION_SYSTEM_PROMPT = """You are the Senior Academic Dean and Master Evaluator for an AI-Native School ERP.
Your mission is to craft an authentic, constructive, deeply personalized end-of-term narrative report card comment.

STRICT PEDAGOGICAL GUIDELINES:
1. BAN GENERIC BOILERPLATE: NEVER use cliché filler such as "It has been a pleasure to teach...", "hardworking student who always smiles", "good student with potential", or "keep up the good work".
2. EVIDENCE-BASED: Concretely weave the student's actual continuous assessment scores, course milestones, and attendance percentages into the narrative.
3. BEHAVIORAL SYNTHESIS: Directly integrate the teacher's classroom observations (participation, curiosity, collaboration, or focus lapses) to paint a vivid, respectful portrait of how the student learns.
4. GROWTH MINDSET & ACTIONABLE: Provide honest appraisal of growth opportunities, followed by 2 specific, achievable academic targets for the upcoming term.

FORMAT YOUR RESPONSE AS CLEAN MARKDOWN WITH THESE 4 SECTIONS:
### 1. Academic Trajectory & Conceptual Mastery
(Analyze subject scores, quiz-to-exam progression, and core strengths)

### 2. Classroom Engagement & Collaboration
(Incorporate teacher behavioral observations and social-emotional dynamics)

### 3. Obstacles & Academic Resilience
(Address attendance disruptions or test confidence honestly and supportively)

### 4. Actionable Next-Term Recommendations
(List 2 specific, concrete targets for student and guardian support)
"""


def build_evaluation_prompt(footprint: StudentTermFootprint) -> str:
    """Transform student term footprint into a rich pedagogical prompt for Ollama."""
    subjects_summary = []
    for sp in footprint.subject_performances:
        scores_str = ", ".join(f"{s:.0f}%" for s in sp.scores)
        subjects_summary.append(
            f"- {sp.course_title} ({sp.course_code}): Avg {sp.average_score:.1f}% [Assessments: {scores_str}]"
        )
    subjects_text = "\n".join(subjects_summary) if subjects_summary else "General Curriculum"

    notes_summary = []
    for n in footprint.behavioral_notes:
        notes_summary.append(
            f"- Teacher {n.get('teacher')} [{n.get('category')}]: \"{n.get('observation')}\""
        )
    notes_text = "\n".join(notes_summary) if notes_summary else "No formal behavioral infractions or commendations noted."

    return f"""Please compose a personalized end-of-term narrative evaluation for:

STUDENT IDENTIFICATION:
- Name: {footprint.student_name}
- Grade Level: {footprint.grade_level}
- Term: {footprint.term}

TERM ATTENDANCE FOOTPRINT:
- Attendance Rate: {int(footprint.attendance_rate * 100)}% ({footprint.present_days} days present, {footprint.absent_days} absences out of {footprint.total_attendance_days} days)

SUBJECT-WISE ACADEMIC PERFORMANCE (Term Average: {footprint.term_gpa_average:.1f}%):
{subjects_text}

TEACHER BEHAVIORAL OBSERVATIONS:
{notes_text}

Compose the 4-part personalized narrative report card comment now.
"""
