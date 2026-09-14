"""Educational Data Mining Daily Predictive Analytics Service.

Runs daily scheduled batch inference, evaluates student attrition & failure risk,
persists assessments, and triggers LLM automated intervention generation for high-risk students.
"""

import argparse
import asyncio
import datetime
import json
import logging
import sys
import time
from typing import Dict, Any, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from app.core.config import settings
from app.core.database import (
    init_db,
    seed_database_if_empty,
    StudentRiskAssessment,
    StudentIntervention,
    Guardian,
)
from app.analytics.connection_pool import db_pool
from app.analytics.features import feature_extractor
from app.analytics.risk_model import risk_model
from app.analytics.intervention_generator import intervention_generator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(name)s] - %(levelname)s - %(message)s",
)
logger = logging.getLogger("erp_analytics_service")


class DailyAnalyticsService:
    """Orchestrates daily predictive risk modeling and automated intervention pipelines."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.feature_extractor = feature_extractor
        self.model = risk_model
        self.intervention_generator = intervention_generator

    async def run_daily_predictive_batch(
        self,
        reference_date: datetime.date = datetime.date(2026, 9, 14),
    ) -> Dict[str, Any]:
        """Execute complete predictive analytics cycle.
        
        Steps:
        1. Extract student behavioral and academic features.
        2. Infer risk scores (Low, Medium, High) with Scikit-Learn.
        3. Persist StudentRiskAssessment records.
        4. For High-Risk students, generate counselor briefing and teacher outreach with Ollama.
        5. Persist StudentIntervention records and return audit summary.
        """
        start_time = time.perf_counter()
        logger.info(f"=== Starting Daily Educational Predictive Analytics Run (Ref Date: {reference_date}) ===")

        # Step 1: Feature Extraction
        try:
            features_df, metadata_map = await self.feature_extractor.extract_student_features(reference_date)
        except Exception as e:
            logger.exception(f"Fatal error during feature extraction: {e}")
            return {"status": "failed", "stage": "feature_extraction", "error": str(e)}

        if features_df.empty:
            logger.warning("No student records available for predictive scoring.")
            return {"status": "completed", "evaluated_students": 0, "high_risk_count": 0}

        # Step 2: Scikit-Learn Risk Classification
        try:
            predictions_df = self.model.predict(features_df)
        except Exception as e:
            logger.exception(f"Fatal error during ML risk classification: {e}")
            return {"status": "failed", "stage": "model_inference", "error": str(e)}

        # Step 3 & 4: Persist Assessments & Trigger Interventions for High-Risk Students
        high_risk_records: List[Dict[str, Any]] = []
        batch_summary = {"Low": 0, "Medium": 0, "High": 0}

        async with db_pool.get_session() as session:
            # Query guardian contacts for all evaluated students
            guardians_result = await session.execute(select(Guardian))
            all_guardians = guardians_result.scalars().all()
            guardian_map = {}
            for g in all_guardians:
                guardian_map.setdefault(g.student_id, []).append(
                    f"{g.name} ({g.relationship}, {g.email}, {g.phone})"
                )

            for student_id, pred_row in predictions_df.iterrows():
                feat_row = features_df.loc[student_id]
                meta = metadata_map.get(student_id, {})
                risk_level = pred_row["risk_level"]
                risk_score = pred_row["risk_score"]
                top_factors = pred_row["top_risk_factors"]

                batch_summary[risk_level] = batch_summary.get(risk_level, 0) + 1

                # Save Risk Assessment to database
                assessment = StudentRiskAssessment(
                    student_id=student_id,
                    attendance_rate_30d=feat_row["attendance_rate_30d"],
                    grade_drop_delta=feat_row["grade_drop_delta"],
                    fee_delay_days=int(feat_row["fee_delay_days"]),
                    balance_due=feat_row["balance_due"],
                    risk_score=risk_score,
                    risk_level=risk_level,
                    top_risk_factors=json.dumps(top_factors),
                )
                session.add(assessment)
                await session.flush()  # Generate assessment.id

                # If student is flagged as HIGH RISK, trigger automated intervention generation
                if risk_level == "High":
                    logger.warning(
                        f"🚨 High Risk Detected for Student {student_id} ({meta.get('first_name')} {meta.get('last_name')}) "
                        f"- Score: {risk_score:.2f}. Initiating LLM intervention generation..."
                    )
                    
                    student_risk_data = {
                        "risk_score": risk_score,
                        "risk_level": risk_level,
                        "attendance_rate_30d": feat_row["attendance_rate_30d"],
                        "grade_drop_delta": feat_row["grade_drop_delta"],
                        "recent_grade_avg": feat_row["recent_grade_avg"],
                        "fee_delay_days": int(feat_row["fee_delay_days"]),
                        "balance_due": feat_row["balance_due"],
                        "top_risk_factors": top_factors,
                    }
                    guard_contact = ", ".join(guardian_map.get(student_id, []))

                    counselor_briefing, teacher_outreach = await self.intervention_generator.generate_interventions(
                        student_metadata=meta,
                        risk_data=student_risk_data,
                        guardian_info=guard_contact,
                    )

                    intervention = StudentIntervention(
                        assessment_id=assessment.id,
                        student_id=student_id,
                        counselor_briefing=counselor_briefing,
                        teacher_outreach=teacher_outreach,
                        status="pending_review",
                    )
                    session.add(intervention)

                    high_risk_records.append({
                        "student_id": student_id,
                        "student_name": f"{meta.get('first_name')} {meta.get('last_name')}",
                        "risk_score": risk_score,
                        "key_factors": top_factors,
                    })

            await session.commit()

        elapsed_s = time.perf_counter() - start_time
        result_payload = {
            "status": "success",
            "evaluated_students": len(features_df),
            "tier_distribution": batch_summary,
            "high_risk_count": len(high_risk_records),
            "high_risk_students": high_risk_records,
            "duration_seconds": round(elapsed_s, 2),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        logger.info(
            f"=== Predictive Batch Completed in {elapsed_s:.2f}s ===\n"
            f"Summary: {json.dumps(batch_summary)} | High Risk Flagged: {len(high_risk_records)}"
        )
        return result_payload

    def start_scheduler(self) -> None:
        """Schedule daily recurring analytics execution."""
        trigger = CronTrigger(
            hour=settings.ANALYTICS_SCHEDULE_HOUR,
            minute=settings.ANALYTICS_SCHEDULE_MINUTE,
        )
        self.scheduler.add_job(
            self.run_daily_predictive_batch,
            trigger=trigger,
            id="daily_predictive_analytics",
            name="Daily Student Attrition & Failure Risk Analysis",
            replace_existing=True,
        )
        self.scheduler.start()
        logger.info(
            f"Predictive Analytics Scheduler activated. Next run scheduled daily at "
            f"{settings.ANALYTICS_SCHEDULE_HOUR:02d}:{settings.ANALYTICS_SCHEDULE_MINUTE:02d}."
        )

    def stop_scheduler(self) -> None:
        """Gracefully shut down scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("Predictive Analytics Scheduler stopped.")


# Global singleton service
analytics_service = DailyAnalyticsService()


# ---------------------------------------------------------------------------
# Standalone CLI Entrypoint
# ---------------------------------------------------------------------------

async def main_cli():
    """Command-line interface to trigger batch on-demand or start background daemon."""
    parser = argparse.ArgumentParser(
        description="Educational Data Mining Background Service for Student Attrition & Risk Interventions"
    )
    parser.add_argument(
        "--run-now",
        action="store_true",
        help="Execute the predictive analytics batch immediately and exit",
    )
    parser.add_argument(
        "--daemon",
        action="store_true",
        help="Run continuously as a scheduled background daemon",
    )
    args = parser.parse_args()

    # Initialize database
    await init_db()
    await seed_database_if_empty()

    if args.run_now or not args.daemon:
        logger.info("Triggering on-demand execution of daily predictive analytics...")
        summary = await analytics_service.run_daily_predictive_batch()
        print("\n--- Daily Predictive Analytics Run Results ---")
        print(json.dumps(summary, indent=2))
        await db_pool.close()
    elif args.daemon:
        logger.info("Launching daemon mode. Press Ctrl+C to stop.")
        analytics_service.start_scheduler()
        try:
            while True:
                await asyncio.sleep(3600)
        except (KeyboardInterrupt, SystemExit):
            analytics_service.stop_scheduler()
            await db_pool.close()


if __name__ == "__main__":
    asyncio.run(main_cli())
