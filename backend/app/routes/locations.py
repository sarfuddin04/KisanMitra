"""
Public read-only endpoints for the 3-tier location hierarchy:
  State → District → Mandi
These do NOT require authentication.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.database import get_db
from app.models.market import State, District, Mandi
from app.schemas.locations import StateOut, DistrictOut, MandiOut

router = APIRouter(tags=["Locations"])


# ==================== STATES ====================

@router.get("/states", response_model=List[StateOut])
def get_all_states(
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get all states, optionally filtered to active only."""
    q = db.query(State)
    if active_only:
        q = q.filter(State.is_active == True)
    return q.order_by(State.name.asc()).all()


@router.get("/states/{state_id}", response_model=StateOut)
def get_state(state_id: int, db: Session = Depends(get_db)):
    s = db.query(State).filter(State.id == state_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="State not found")
    return s


# ==================== DISTRICTS ====================

@router.get("/districts", response_model=List[DistrictOut])
def get_all_districts(
    state_id: Optional[int] = Query(None),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get all districts, optionally filtered by state_id."""
    q = db.query(District).options(joinedload(District.state))
    if state_id:
        q = q.filter(District.state_id == state_id)
    if active_only:
        q = q.filter(District.is_active == True)
    districts = q.order_by(District.name.asc()).all()
    result = []
    for d in districts:
        out = DistrictOut(
            id=d.id,
            state_id=d.state_id,
            name=d.name,
            is_active=d.is_active,
            state_name=d.state.name if d.state else None,
            created_at=d.created_at,
            updated_at=d.updated_at
        )
        result.append(out)
    return result


@router.get("/states/{state_id}/districts", response_model=List[DistrictOut])
def get_districts_by_state(
    state_id: int,
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get districts belonging to a specific state."""
    q = db.query(District).options(joinedload(District.state)).filter(District.state_id == state_id)
    if active_only:
        q = q.filter(District.is_active == True)
    districts = q.order_by(District.name.asc()).all()
    return [
        DistrictOut(
            id=d.id,
            state_id=d.state_id,
            name=d.name,
            is_active=d.is_active,
            state_name=d.state.name if d.state else None,
            created_at=d.created_at,
            updated_at=d.updated_at
        ) for d in districts
    ]


# ==================== MANDIS ====================

@router.get("/mandis", response_model=List[MandiOut])
def get_all_mandis(
    district_id: Optional[int] = Query(None),
    state_id: Optional[int] = Query(None),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get all mandis, optionally filtered by district_id or state_id."""
    q = db.query(Mandi).options(joinedload(Mandi.district).joinedload(District.state))
    if district_id:
        q = q.filter(Mandi.district_id == district_id)
    if state_id:
        q = q.join(District).filter(District.state_id == state_id)
    if active_only:
        q = q.filter(Mandi.is_active == True)
    mandis = q.order_by(Mandi.name.asc()).all()
    return [_mandi_to_out(m) for m in mandis]


@router.get("/districts/{district_id}/mandis", response_model=List[MandiOut])
def get_mandis_by_district(
    district_id: int,
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get mandis belonging to a specific district."""
    q = db.query(Mandi).options(joinedload(Mandi.district).joinedload(District.state))
    q = q.filter(Mandi.district_id == district_id)
    if active_only:
        q = q.filter(Mandi.is_active == True)
    mandis = q.order_by(Mandi.name.asc()).all()
    return [_mandi_to_out(m) for m in mandis]


@router.get("/mandis/{mandi_id}", response_model=MandiOut)
def get_mandi(mandi_id: int, db: Session = Depends(get_db)):
    """Get a single mandi by ID."""
    m = db.query(Mandi).options(joinedload(Mandi.district).joinedload(District.state)).filter(Mandi.id == mandi_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mandi not found")
    return _mandi_to_out(m)


def _mandi_to_out(m: Mandi) -> MandiOut:
    district = m.district
    state = district.state if district else None
    return MandiOut(
        id=m.id,
        district_id=m.district_id,
        name=m.name,
        address=m.address,
        pincode=m.pincode,
        latitude=m.latitude,
        longitude=m.longitude,
        contact_number=m.contact_number,
        opening_time=m.opening_time,
        closing_time=m.closing_time,
        mandi_type=m.mandi_type,
        image_url=m.image_url,
        is_active=m.is_active,
        district_name=district.name if district else None,
        state_id=state.id if state else None,
        state_name=state.name if state else None,
        created_at=m.created_at,
        updated_at=m.updated_at
    )
