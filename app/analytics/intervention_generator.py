"""Automated LLM Intervention Generator using local Ollama (Llama 3).

Creates customized Guidance Counselor Briefing Sheets and Class Teacher Outreach Messages
for students flagged as High Risk.
"""

import json
import logging
from typing import Dict, Any, Tuple
from app.services.ollama_client import ollama_client, OllamaClientException

logger = logging.getLogger("erp_intervention")

INTERVENTION_SYSTEM_PROMPT = """You are the Senior Educational Guidance Counselor and Student Retention Specialist for an AI-Native School ERP.
Your task is to analyze high-risk student behavioral signals and generate two vital intervention documents:

DOCUMENT 1: GUIDANCE COUNSELOR BRIEFING SHEET
- Comprehensive diagnostic assessment for the counseling staff.
- Root-cause synthesis linking attendance trends, continuous assessment grade drops, and financial/fee stress.
- Strategic 1-on-1 interview talking points.
- Actionable academic remediation and counseling accommodations.

DOCUMENT 2: DRAFT CLASS TEACHER OUTREACH MESSAGE
- A sensitive, empathetic, non-punitive email or message draft for the homeroom / class teacher to send to the student (and their guardian).
- Tone: Caring, collaborative, seeking to understand barriers without making the student feel accused or intimidated.
- Call to action: A low-stress conversation during office hours or study hall.

Output both documents clearly separated with Markdown headers:
# GUIDANCE COUNSELOR BRIEFING SHEET
...
# DRAFT CLASS TEACHER OUTREACH MESSAGE
...
"""


class InterventionGenerator:
    """Generates personalized intervention artifacts via local Ollama inference."""

    def __init__(self):
        self.ollama = ollama_client

    async def generate_interventions(
        self,
        student_metadata: Dict[str, Any],
        risk_data: Dict[str, Any],
        guardian_info: Any = None,
    ) -> Tuple[str, str]:
        """Call Ollama Llama 3 to produce counselor briefing sheet and teacher message.
        
        Args:
            student_metadata: Name, grade level, email.
            risk_data: Risk score, attendance rate, grade drop, fee delay, risk factors.
            guardian_info: Contact details of parents/guardians.
            
        Returns:
            Tuple of (counselor_briefing_markdown, teacher_outreach_markdown)
        """
        student_name = f"{student_metadata.get('first_name', '')} {student_metadata.get('last_name', '')}".strip()
        grade_level = student_metadata.get("grade_level", "Unknown")
        risk_score = risk_data.get("risk_score", 0.0)
        attendance_pct = int(risk_data.get("attendance_rate_30d", 1.0) * 100)
        grade_drop = risk_data.get("grade_drop_delta", 0.0)
        recent_grade = risk_data.get("recent_grade_avg", 0.0)
        fee_delay = risk_data.get("fee_delay_days", 0)
        balance = risk_data.get("balance_due", 0.0)
        factors = risk_data.get("top_risk_factors", [])

        user_prompt = f"""Generate an urgent student retention intervention package for the following student:

STUDENT PROFILE:
- Name: {student_name}
- Grade: {grade_level}
- Email: {student_metadata.get('email')}
- Guardian Info: {guardian_info or 'Robert Johnson (Father)'}

PREDICTIVE ML RISK METRICS:
- Overall Attrition / Failure Risk Score: {risk_score:.2f} (HIGH RISK)
- 30-Day Rolling Attendance: {attendance_pct}% present
- Continuous Assessment Grade Drop: -{grade_drop:.1f}% points (Current assessment avg: {recent_grade:.1f}%)
- Tuition Arrears: ${balance:.2f} (Due {fee_delay} days overdue)
- Identified Risk Drivers: {json.dumps(factors)}

Please provide both the Guidance Counselor Briefing Sheet and the Draft Class Teacher Outreach Message now.
"""

        try:
            # Check if Ollama is online
            health = await self.ollama.check_health()
            if health.get("status") == "online":
                logger.info(f"Invoking Ollama ({self.ollama.model}) to generate interventions for {student_name}...")
                response = await self.ollama.chat(
                    messages=[
                        {"role": "system", "content": INTERVENTION_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    tools=None,
                    temperature=0.3,
                )
                raw_text = response.content or ""
                return self._parse_llm_output(raw_text, student_name)
            else:
                logger.warning(f"Ollama is offline. Generating rule-based high-fidelity briefing for {student_name}.")
                return self._generate_fallback_intervention(student_metadata, risk_data)

        except Exception as err:
            logger.exception(f"Error calling LLM for intervention generation: {err}. Using fallback template.")
            return self._generate_fallback_intervention(student_metadata, risk_data)

    def _parse_llm_output(self, raw_text: str, student_name: str) -> Tuple[str, str]:
        """Split LLM response into counselor briefing sheet and teacher outreach."""
        teacher_header_variants = [
            "# DRAFT CLASS TEACHER OUTREACH MESSAGE",
            "## DRAFT CLASS TEACHER OUTREACH MESSAGE",
            "### DRAFT CLASS TEACHER OUTREACH MESSAGE",
            "DOCUMENT 2: DRAFT CLASS TEACHER OUTREACH MESSAGE",
            "# CLASS TEACHER OUTREACH MESSAGE",
        ]

        split_idx = -1
        for header in teacher_header_variants:
            idx = raw_text.find(header)
            if idx != -1:
                split_idx = idx
                break

        if split_idx != -1:
            counselor_briefing = raw_text[:split_idx].strip()
            teacher_outreach = raw_text[split_idx:].strip()
        else:
            counselor_briefing = raw_text
            teacher_outreach = (
                f"Subject: Checking in - Thinking of you, {student_name}\n\n"
                f"Dear {student_name},\n\n"
                "I wanted to reach out and see how everything is going. I noticed things have felt a bit challenging lately, "
                "and I want you to know that the teaching team is here to support you in any way we can.\n\n"
                "Do you have a few minutes this week after class or during study hall to chat? No pressure at all—just want to check in and help you succeed.\n\n"
                "Warm regards,\nYour Class Teacher"
            )

        return counselor_briefing, teacher_outreach

    def _generate_fallback_intervention(
        self,
        student_metadata: Dict[str, Any],
        risk_data: Dict[str, Any],
    ) -> Tuple[str, str]:
        """Produce high-fidelity intervention documents when LLM is in test or offline mode."""
        student_name = f"{student_metadata.get('first_name', '')} {student_metadata.get('last_name', '')}".strip()
        grade = student_metadata.get("grade_level", "Grade 10")
        attendance_pct = int(risk_data.get("attendance_rate_30d", 0.6) * 100)
        grade_drop = risk_data.get("grade_drop_delta", 35.0)
        recent_grade = risk_data.get("recent_grade_avg", 50.0)
        balance = risk_data.get("balance_due", 2500.0)
        days = risk_data.get("fee_delay_days", 30)

        counselor_briefing = f"""# GUIDANCE COUNSELOR BRIEFING SHEET: {student_name.upper()}
**Date:** Automated Daily Analytics Run | **Student Grade:** {grade} | **Risk Priority:** HIGH (Score: {risk_data.get('risk_score', 0.85):.2f})

### 1. Key Risk Indicators Summary
- **Attendance Disengagement:** 30-day rolling attendance has dropped to **{attendance_pct}%** (unexcused pattern).
- **Academic Deceleration:** Continuous assessment performance dropped by **-{grade_drop:.1f}% points**, currently averaging **{recent_grade:.1f}%**.
- **Financial Friction:** Tuition balance of **${balance:.2f}** is **{days} days** past the due date.

### 2. Root Cause Hypothesis
The confluence of sharp attendance drop-offs and concurrent fee arrears strongly suggests external socioeconomic or familial stress impacting classroom engagement, rather than purely cognitive subject difficulty.

### 3. Recommended 1-on-1 Counseling Protocol
1. **Rapport & Well-being Check:** Open with open-ended inquiries regarding student health, transportation, and home commitments.
2. **Academic Recovery Plan:** Establish tutoring support in core decline areas (Mathematics / Sciences) without assigning punitive remedial work.
3. **Bursar Coordination:** Silently coordinate with the financial aid office to review tuition installment restructuring to de-escalate pressure on the household.
"""

        teacher_outreach = f"""# DRAFT CLASS TEACHER OUTREACH MESSAGE

**To:** {student_name} ({student_metadata.get('email', 'student@school.edu')})
**Subject:** Checking in regarding {grade} - We are here for you!

Dear {student_name},

I hope your week is off to a gentle start. I'm reaching out because I've noticed you've had to miss a few classes recently and things have seemed a bit demanding with our recent coursework.

I want to remind you that your presence in our classroom is valued, and my priority is making sure you have whatever support you need to feel comfortable and confident in your studies. 

Could we set aside 10 minutes this Wednesday or Thursday during advisory period or after school to touch base? We can review recent topics at your pace or talk through any accommodations that would make things smoother for you.

Looking forward to seeing you,

Warmly,  
**Your Class Teacher**  
*Cc: Guidance Counseling Department*
"""
        return counselor_briefing, teacher_outreach


intervention_generator = InterventionGenerator()
