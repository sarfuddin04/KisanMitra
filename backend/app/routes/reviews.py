"""
Mandi Review Routes
====================
Endpoints for farmer ratings and reviews of mandis.
- Public: Read reviews (no auth required)
- Authenticated: Submit/edit reviews (farmer auth required)
- Admin: Moderate reviews
"""
import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user, require_admin
from app.models.market import Mandi, MandiReview
from app.models.user import User
from pydantic import BaseModel, Field

router = APIRouter(prefix="/mandis", tags=["Mandi Reviews"])


# ── Schemas ─────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewModerate(BaseModel):
    is_approved: bool
    moderation_note: Optional[str] = None


# ── Helpers ─────────────────────────────────────────────────────────────────

def _get_rating_stats(db: Session, mandi_id: int) -> dict:
    """Calculate actual rating statistics from the database — never invents data."""
    reviews = db.query(MandiReview).filter(
        MandiReview.mandi_id == mandi_id,
        MandiReview.is_approved == True,
    ).all()

    if not reviews:
        return {
            "average_rating": 0,
            "total_reviews": 0,
            "distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        }

    total = len(reviews)
    avg = sum(r.rating for r in reviews) / total
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        dist[r.rating] = dist.get(r.rating, 0) + 1

    return {
        "average_rating": round(avg, 1),
        "total_reviews": total,
        "distribution": dist,
    }


def _review_to_dict(review: MandiReview) -> dict:
    return {
        "id": review.id,
        "mandi_id": review.mandi_id,
        "user_id": review.user_id,
        "user_name": review.user.full_name if review.user else "Anonymous",
        "user_avatar": review.user.profile.avatar_url if review.user and review.user.profile else None,
        "rating": review.rating,
        "comment": review.comment,
        "is_approved": review.is_approved,
        "is_flagged": review.is_flagged,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
    }


# ── Public Endpoints ────────────────────────────────────────────────────────

@router.get("/{mandi_id}/reviews")
def get_mandi_reviews(
    mandi_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get approved reviews for a mandi. Returns genuine farmer reviews only."""
    mandi = db.query(Mandi).filter(Mandi.id == mandi_id).first()
    if not mandi:
        raise HTTPException(status_code=404, detail="Mandi not found")

    reviews = (
        db.query(MandiReview)
        .options(joinedload(MandiReview.user).joinedload(User.profile))
        .filter(
            MandiReview.mandi_id == mandi_id,
            MandiReview.is_approved == True,
        )
        .order_by(desc(MandiReview.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    stats = _get_rating_stats(db, mandi_id)

    return {
        "mandi_id": mandi_id,
        "mandi_name": mandi.name,
        "stats": stats,
        "reviews": [_review_to_dict(r) for r in reviews],
    }


@router.get("/{mandi_id}/rating")
def get_mandi_rating(mandi_id: int, db: Session = Depends(get_db)):
    """Get just the rating stats for a mandi (lightweight)."""
    mandi = db.query(Mandi).filter(Mandi.id == mandi_id).first()
    if not mandi:
        raise HTTPException(status_code=404, detail="Mandi not found")

    return _get_rating_stats(db, mandi_id)


# ── Authenticated Endpoints ─────────────────────────────────────────────────

@router.post("/{mandi_id}/reviews")
def submit_review(
    mandi_id: int,
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit or update a review for a mandi. One review per user per mandi."""
    mandi = db.query(Mandi).filter(Mandi.id == mandi_id).first()
    if not mandi:
        raise HTTPException(status_code=404, detail="Mandi not found")

    # Check for existing review
    existing = db.query(MandiReview).filter(
        MandiReview.mandi_id == mandi_id,
        MandiReview.user_id == current_user.id,
    ).first()

    if existing:
        # Update existing review
        existing.rating = review.rating
        if review.comment is not None:
            existing.comment = review.comment
        existing.updated_at = datetime.datetime.utcnow()
        existing.is_approved = True   # Re-approve on edit (admin can re-flag)
        existing.is_flagged = False
        db.commit()
        db.refresh(existing)
        return {
            "message": "Review updated successfully",
            "review": _review_to_dict(existing),
            "updated": True,
        }
    else:
        # Create new review
        new_review = MandiReview(
            mandi_id=mandi_id,
            user_id=current_user.id,
            rating=review.rating,
            comment=review.comment,
            is_approved=True,
        )
        db.add(new_review)
        db.commit()
        db.refresh(new_review)
        # Reload with relationships
        new_review = db.query(MandiReview).options(
            joinedload(MandiReview.user).joinedload(User.profile)
        ).filter(MandiReview.id == new_review.id).first()
        return {
            "message": "Review submitted successfully",
            "review": _review_to_dict(new_review),
            "updated": False,
        }


@router.get("/{mandi_id}/my-review")
def get_my_review(
    mandi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's review for a mandi."""
    review = db.query(MandiReview).options(
        joinedload(MandiReview.user).joinedload(User.profile)
    ).filter(
        MandiReview.mandi_id == mandi_id,
        MandiReview.user_id == current_user.id,
    ).first()

    if not review:
        return {"exists": False, "review": None}

    return {"exists": True, "review": _review_to_dict(review)}


@router.delete("/{mandi_id}/reviews")
def delete_my_review(
    mandi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete the current user's review."""
    review = db.query(MandiReview).filter(
        MandiReview.mandi_id == mandi_id,
        MandiReview.user_id == current_user.id,
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}


# ── Admin Endpoints ──────────────────────────────────────────────────────────

@router.get("/admin/reviews/pending")
def get_pending_reviews(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get flagged/pending reviews for moderation."""
    reviews = (
        db.query(MandiReview)
        .options(
            joinedload(MandiReview.user).joinedload(User.profile),
            joinedload(MandiReview.mandi),
        )
        .filter(MandiReview.is_flagged == True)
        .order_by(desc(MandiReview.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            **_review_to_dict(r),
            "mandi_name": r.mandi.name if r.mandi else None,
        }
        for r in reviews
    ]


@router.put("/admin/reviews/{review_id}/moderate")
def moderate_review(
    review_id: int,
    action: ReviewModerate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Approve or reject a review."""
    review = db.query(MandiReview).filter(MandiReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_approved = action.is_approved
    review.moderation_note = action.moderation_note
    review.moderated_by = admin.id
    review.moderated_at = datetime.datetime.utcnow()
    review.is_flagged = False
    db.commit()

    return {"message": f"Review {'approved' if action.is_approved else 'rejected'} successfully"}


@router.put("/admin/reviews/{review_id}/flag")
def flag_review(
    review_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Flag a review for moderation."""
    review = db.query(MandiReview).filter(MandiReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_flagged = True
    db.commit()
    return {"message": "Review flagged for moderation"}
