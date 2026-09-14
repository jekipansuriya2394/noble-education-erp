"""Collects a student's entire term academic, behavioral, and attendance footprint."""

import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import (
    Student,
    Attendance,
    Assessment,
    Course,
    TeacherBehavioralNote,
)

logger = logging.getLogger("erp_footprint")


class SubjectPerformance(BaseModel):
    course_code: str
    course_title: str
    scores: List[float] = Field(default_factory=list)
    average_score: float = 0.0
    latest_assessment_name: Optional[str] = None
    latest_score: Optional[float] = None


class StudentTermFootprint(BaseModel):
    """Complete multi-dimensional term footprint for a student."""
    student_id: int
    student_name: str
    grade_level: str
    term: str
    attendance_rate: float
    total_attendance_days: int
    present_days: int
    absent_days: int
    term_gpa_average: float
    subject_performances: List[SubjectPerformance] = Field(default_factory=list)
    behavioral_notes: List[Dict[str, str]] = Field(default_factory=list)


class TermFootprintCollector:
    """Queries and normalizes attendance, continuous assessments, and behavioral observations."""

    async def collect_student_footprint(
        self,
        session: AsyncSession,
        student_id: int,
        term: str = "Fall 2026",
    ) -> Optional[StudentTermFootprint]:
        """Aggregate all term data for a single student."""
        # 1. Fetch Student Info
        st_res = await session.execute(select(Student).where(Student.id == student_id))
        student = st_res.scalar_one_or_none()
        if not student:
            return None

        # 2. Attendance Footprint
        att_res = await session.execute(
            select(Attendance).where(Attendance.student_id == student_id)
        )
        attendances = att_res.scalars().all()
        total_days = len(attendances)
        present_days = sum(1 for a in attendances if a.status.lower() == "present")
        absent_days = total_days - present_days
        attendance_rate = (present_days / total_days) if total_days > 0 else 1.0

        # 3. Continuous Assessment & Course Grades
        courses_res = await session.execute(select(Course))
        courses = {c.id: c for c in courses_res.scalars().all()}

        ass_res = await session.execute(
            select(Assessment)
            .where(Assessment.student_id == student_id)
            .order_by(Assessment.date.asc())
        )
        assessments = ass_res.scalars().all()

        # Group assessments by course
        course_assessments: Dict[int, List[Assessment]] = {}
        for ass in assessments:
            course_assessments.setdefault(ass.course_id, []).append(ass)

        subject_list: List[SubjectPerformance] = []
        all_scores: List[float] = []

        for course_id, ass_list in course_assessments.items():
            course = courses.get(course_id)
            if not course:
                continue
            scores = [float(a.score) for a in ass_list]
            all_scores.extend(scores)
            avg = sum(scores) / len(scores) if scores else 0.0
            latest = ass_list[-1] if ass_list else None

            subject_list.append(
                SubjectPerformance(
                    course_code=course.code,
                    course_title=course.title,
                    scores=scores,
                    average_score=round(avg, 1),
                    latest_assessment_name=latest.assessment_name if latest else None,
                    latest_score=float(latest.score) if latest else None,
                )
            )

        term_gpa = (sum(all_scores) / len(all_scores)) if all_scores else 75.0

        # 4. Teacher Behavioral Notes
        notes_res = await session.execute(
            select(TeacherBehavioralNote)
            .where(
                TeacherBehavioralNote.student_id == student_id,
                TeacherBehavioralNote.term == term,
            )
        )
        notes = notes_res.scalars().all()
        behavioral_data = [
            {
                "teacher": n.teacher_name,
                "category": n.category,
                "observation": n.note_text,
            }
            for n in notes
        ]

        return StudentTermFootprint(
            student_id=student.id,
            student_name=f"{student.first_name} {student.last_name}",
            grade_level=student.grade_level,
            term=term,
            attendance_rate=round(attendance_rate, 3),
            total_attendance_days=total_days,
            present_days=present_days,
            absent_days=absent_days,
            term_gpa_average=round(term_gpa, 1),
            subject_performances=subject_list,
            behavioral_notes=behavioral_data,
        )


footprint_collector = TermFootprintCollector()
