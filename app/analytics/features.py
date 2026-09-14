"""Educational Data Mining Feature Extraction Engine using Pandas."""

import datetime
import logging
from typing import Dict, Any, Tuple
import pandas as pd
from sqlalchemy import select

from app.analytics.connection_pool import db_pool
from app.core.database import Student, Attendance, Assessment, FeeInvoice

logger = logging.getLogger("erp_features")


class FeatureExtractor:
    """Extracts rolling attendance averages, continuous assessment grade drops, and fee delay metrics."""

    FEATURE_COLUMNS = [
        "attendance_rate_30d",
        "unexcused_absence_count",
        "grade_drop_delta",
        "recent_grade_avg",
        "fee_delay_days",
        "balance_due",
    ]

    async def extract_student_features(
        self,
        reference_date: datetime.date = datetime.date(2026, 9, 14),
    ) -> Tuple[pd.DataFrame, Dict[int, Dict[str, Any]]]:
        """Query ERP data and assemble educational data mining feature matrix.
        
        Args:
            reference_date: Cutoff date for calculating rolling attendance and fee delinquency.
            
        Returns:
            Tuple of:
              - features_df: DataFrame indexed by student_id with ML feature columns.
              - metadata_map: Dict mapping student_id to demographic & contact metadata.
        """
        async with db_pool.get_session() as session:
            # 1. Fetch Students
            st_result = await session.execute(select(Student))
            students = st_result.scalars().all()
            if not students:
                logger.warning("No students found in ERP database.")
                return pd.DataFrame(columns=self.FEATURE_COLUMNS), {}

            # 2. Fetch Attendance Records
            att_result = await session.execute(select(Attendance))
            attendances = att_result.scalars().all()

            # 3. Fetch Continuous Assessments
            ass_result = await session.execute(select(Assessment))
            assessments = ass_result.scalars().all()

            # 4. Fetch Fee Invoices
            inv_result = await session.execute(select(FeeInvoice))
            invoices = inv_result.scalars().all()

        # Build Metadata Map
        metadata_map = {
            s.id: {
                "id": s.id,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "email": s.email,
                "grade_level": s.grade_level,
                "status": s.status,
            }
            for s in students
        }

        # Convert to Pandas DataFrames for feature engineering
        # A. Attendance Processing
        att_df = pd.DataFrame([
            {"student_id": a.student_id, "date": a.date, "status": a.status.lower()}
            for a in attendances
        ]) if attendances else pd.DataFrame(columns=["student_id", "date", "status"])

        attendance_metrics = {}
        for s_id in metadata_map.keys():
            if not att_df.empty and s_id in att_df["student_id"].values:
                s_att = att_df[att_df["student_id"] == s_id]
                total_days = len(s_att)
                present_days = len(s_att[s_att["status"] == "present"])
                absent_days = len(s_att[s_att["status"] == "absent"])
                rate = present_days / total_days if total_days > 0 else 1.0
                attendance_metrics[s_id] = {
                    "attendance_rate_30d": round(float(rate), 3),
                    "unexcused_absence_count": int(absent_days),
                }
            else:
                attendance_metrics[s_id] = {
                    "attendance_rate_30d": 1.0,
                    "unexcused_absence_count": 0,
                }

        # B. Continuous Assessment Grade Drop Processing
        ass_df = pd.DataFrame([
            {"student_id": a.student_id, "date": a.date, "score": float(a.score)}
            for a in assessments
        ]) if assessments else pd.DataFrame(columns=["student_id", "date", "score"])

        grade_metrics = {}
        for s_id in metadata_map.keys():
            if not ass_df.empty and s_id in ass_df["student_id"].values:
                s_ass = ass_df[ass_df["student_id"] == s_id].sort_values("date")
                scores = s_ass["score"].tolist()
                if len(scores) >= 2:
                    # Baseline = first score (or average of first half)
                    # Recent = latest score (or average of second half)
                    half = max(1, len(scores) // 2)
                    baseline_avg = sum(scores[:half]) / half
                    recent_avg = sum(scores[half:]) / (len(scores) - half)
                    grade_drop_delta = max(0.0, baseline_avg - recent_avg)
                elif len(scores) == 1:
                    recent_avg = scores[0]
                    grade_drop_delta = 0.0
                else:
                    recent_avg = 75.0
                    grade_drop_delta = 0.0

                grade_metrics[s_id] = {
                    "recent_grade_avg": round(float(recent_avg), 1),
                    "grade_drop_delta": round(float(grade_drop_delta), 1),
                }
            else:
                grade_metrics[s_id] = {
                    "recent_grade_avg": 75.0,
                    "grade_drop_delta": 0.0,
                }

        # C. Fee Invoices Processing
        inv_df = pd.DataFrame([
            {
                "student_id": i.student_id,
                "balance_due": float(i.balance_due),
                "due_date": i.due_date,
            }
            for i in invoices
        ]) if invoices else pd.DataFrame(columns=["student_id", "balance_due", "due_date"])

        fee_metrics = {}
        for s_id in metadata_map.keys():
            if not inv_df.empty and s_id in inv_df["student_id"].values:
                s_inv = inv_df[inv_df["student_id"] == s_id]
                total_balance = float(s_inv["balance_due"].sum())
                
                # Compute max delay in days past due_date for unpaid invoices
                unpaid_invs = s_inv[s_inv["balance_due"] > 0]
                max_delay = 0
                for _, row in unpaid_invs.iterrows():
                    try:
                        due_d = datetime.datetime.strptime(row["due_date"], "%Y-%m-%d").date()
                        delta_days = (reference_date - due_d).days
                        if delta_days > max_delay:
                            max_delay = delta_days
                    except Exception:
                        pass

                fee_metrics[s_id] = {
                    "balance_due": round(total_balance, 2),
                    "fee_delay_days": int(max_delay),
                }
            else:
                fee_metrics[s_id] = {
                    "balance_due": 0.0,
                    "fee_delay_days": 0,
                }

        # D. Combine into Feature Matrix
        rows = []
        for s_id in metadata_map.keys():
            att = attendance_metrics[s_id]
            grd = grade_metrics[s_id]
            fee = fee_metrics[s_id]
            rows.append({
                "student_id": s_id,
                "attendance_rate_30d": att["attendance_rate_30d"],
                "unexcused_absence_count": att["unexcused_absence_count"],
                "grade_drop_delta": grd["grade_drop_delta"],
                "recent_grade_avg": grd["recent_grade_avg"],
                "fee_delay_days": fee["fee_delay_days"],
                "balance_due": fee["balance_due"],
            })

        features_df = pd.DataFrame(rows).set_index("student_id")
        logger.info(f"Extracted feature vectors for {len(features_df)} students.")
        return features_df, metadata_map


feature_extractor = FeatureExtractor()
