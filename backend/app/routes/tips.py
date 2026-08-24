from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.content import FarmingTip
from app.schemas.content import FarmingTipOut

router = APIRouter(prefix="/farming-tips", tags=["Farming Tips"])

@router.get("", response_model=List[FarmingTipOut])
def get_farming_tips(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(FarmingTip).filter(FarmingTip.is_published == True)
    if category and category != "All":
        query = query.filter(FarmingTip.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            (FarmingTip.title.ilike(f"%{search}%")) |
            (FarmingTip.summary.ilike(f"%{search}%"))
        )
    return query.order_by(FarmingTip.created_at.desc()).all()

@router.get("/{tip_id}", response_model=FarmingTipOut)
def get_single_farming_tip(tip_id: int, db: Session = Depends(get_db)):
    tip = db.query(FarmingTip).filter(FarmingTip.id == tip_id, FarmingTip.is_published == True).first()
    if not tip:
        raise HTTPException(status_code=404, detail="Farming tip not found.")
    tip.views_count += 1
    db.commit()
    db.refresh(tip)
    return tip
