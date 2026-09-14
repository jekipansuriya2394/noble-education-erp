"""Comprehensive tests for Educational Data Mining, Scikit-Learn Risk Model, and Automated Interventions."""

import pytest
import pandas as pd
from unittest.mock import AsyncMock, patch

from app.core.database import (
    init_db,
    seed_database_if_empty,
    async_session,
    StudentRiskAssessment,
    StudentIntervention,
)
from app.analytics.connection_pool import db_pool
from app.analytics.features import feature_extractor
from app.analytics.risk_model import risk_model
from app.analytics.intervention_generator import intervention_generator
from app.analytics.service import analytics_service


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    import asyncio
    asyncio.run(init_db())
    asyncio.run(seed_database_if_empty())


@pytest.mark.asyncio
async def test_db_pool_health():
    """Verify database connection pool initializes and passes health checks."""
    status = await db_pool.check_health()
    assert status["status"] == "healthy"
    assert status["latency_ms"] >= 0.0


@pytest.mark.asyncio
async def test_feature_extraction_metrics():
    """Verify educational feature extraction correctly computes rolling attendance, grade drops, and fee delays."""
    features_df, metadata_map = await feature_extractor.extract_student_features()

    assert len(features_df) >= 5
    assert "attendance_rate_30d" in features_df.columns
    assert "grade_drop_delta" in features_df.columns
    assert "fee_delay_days" in features_df.columns
    assert "balance_due" in features_df.columns

    # Check Liam (Student 1: 60% attendance, steep grade drop from 88 to 50 = 38pt drop, overdue balance $2500)
    liam_features = features_df.loc[1]
    assert liam_features["attendance_rate_30d"] == pytest.approx(0.60, abs=0.05)
    assert liam_features["grade_drop_delta"] >= 25.0
    assert liam_features["fee_delay_days"] >= 20
    assert liam_features["balance_due"] == 2500.0

    # Check Sophia (Student 2: 95% attendance, negligible grade drop <= 1.0, $0 balance)
    sophia_features = features_df.loc[2]
    assert sophia_features["attendance_rate_30d"] >= 0.90
    assert sophia_features["grade_drop_delta"] <= 1.0
    assert sophia_features["balance_due"] == 0.0


def test_scikit_learn_risk_model_predictions():
    """Verify ML model accurately classifies high vs low risk students and attributes factors."""
    test_df = pd.DataFrame([
        {
            "student_id": 1,
            "attendance_rate_30d": 0.55,
            "unexcused_absence_count": 13,
            "grade_drop_delta": 35.0,
            "recent_grade_avg": 48.0,
            "fee_delay_days": 35,
            "balance_due": 2500.0,
        },
        {
            "student_id": 2,
            "attendance_rate_30d": 0.98,
            "unexcused_absence_count": 0,
            "grade_drop_delta": 0.0,
            "recent_grade_avg": 94.0,
            "fee_delay_days": 0,
            "balance_due": 0.0,
        },
    ]).set_index("student_id")

    predictions = risk_model.predict(test_df)

    # Student 1 must be HIGH risk
    pred_1 = predictions.loc[1]
    assert pred_1["risk_level"] == "High"
    assert pred_1["risk_score"] >= 0.70
    assert len(pred_1["top_risk_factors"]) >= 2
    factors_str = " ".join(pred_1["top_risk_factors"])
    assert "attendance" in factors_str.lower()
    assert "decline" in factors_str.lower() or "academic" in factors_str.lower()

    # Student 2 must be LOW risk
    pred_2 = predictions.loc[2]
    assert pred_2["risk_level"] == "Low"
    assert pred_2["risk_score"] < 0.35


@pytest.mark.asyncio
async def test_automated_intervention_generation():
    """Verify intervention generator creates counselor briefing and teacher outreach."""
    student_meta = {
        "first_name": "Liam",
        "last_name": "Johnson",
        "grade_level": "Grade 10",
        "email": "liam.j@school.edu",
    }
    risk_data = {
        "risk_score": 0.88,
        "risk_level": "High",
        "attendance_rate_30d": 0.60,
        "grade_drop_delta": 38.0,
        "recent_grade_avg": 50.0,
        "fee_delay_days": 30,
        "balance_due": 2500.0,
        "top_risk_factors": ["Severe attendance drop", "Academic decline"],
    }

    counselor_briefing, teacher_outreach = await intervention_generator.generate_interventions(
        student_metadata=student_meta,
        risk_data=risk_data,
        guardian_info="Robert Johnson (Father, robert.j@example.com)",
    )

    assert "GUIDANCE COUNSELOR BRIEFING SHEET" in counselor_briefing.upper()
    assert "liam" in counselor_briefing.lower()
    assert "Root Cause" in counselor_briefing or "Risk" in counselor_briefing

    assert "CLASS TEACHER OUTREACH" in teacher_outreach.upper() or "Dear Liam" in teacher_outreach
    assert "support" in teacher_outreach.lower() or "check in" in teacher_outreach.lower()


@pytest.mark.asyncio
async def test_full_daily_analytics_service_batch():
    """Verify end-to-end analytics batch run, persistence of assessments and interventions."""
    result = await analytics_service.run_daily_predictive_batch()

    assert result["status"] == "success"
    assert result["evaluated_students"] >= 5
    assert result["high_risk_count"] >= 1
    assert "High" in result["tier_distribution"]

    # Verify records in database
    async with async_session() as session:
        from sqlalchemy import select
        assess_res = await session.execute(select(StudentRiskAssessment))
        assessments = assess_res.scalars().all()
        assert len(assessments) >= 5

        interv_res = await session.execute(select(StudentIntervention))
        interventions = interv_res.scalars().all()
        assert len(interventions) >= 1

        first_interv = interventions[0]
        assert first_interv.status == "pending_review"
        assert len(first_interv.counselor_briefing) > 100
        assert len(first_interv.teacher_outreach) > 50
