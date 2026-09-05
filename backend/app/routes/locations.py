"""
Public read-only endpoints for the 3-tier location hierarchy:
  State → District → Mandi
These do NOT require authentication.

Enhanced with:
  - Nearby mandis (Haversine distance)
  - Full-text search across mandi/state/district/crop
  - Map-bounds-based loading for efficient marker rendering
  - Mandi detail with crops + latest prices
"""
import math
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional

from app.core.database import get_db
from app.models.market import State, District, Mandi, MandiCrop, MarketPrice
from app.models.agronomy import Crop
from app.schemas.locations import StateOut, DistrictOut, MandiOut

router = APIRouter(tags=["Locations"])


# ==================== HAVERSINE HELPER ====================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon points using Haversine formula."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


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


@router.get("/mandis/nearby")
def get_nearby_mandis(
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
    radius: float = Query(50, description="Search radius in km"),
    crop_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Find nearby active mandis sorted by distance from user coordinates.
    Uses Haversine calculation for accurate distance.
    """
    # Validate coordinates
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    q = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).filter(
        Mandi.is_active == True,
        Mandi.latitude.isnot(None),
        Mandi.longitude.isnot(None),
    )

    if crop_id:
        q = q.join(MandiCrop).filter(MandiCrop.crop_id == crop_id)

    mandis = q.all()

    # Calculate distances and filter by radius
    results = []
    for m in mandis:
        dist = haversine_distance(lat, lon, m.latitude, m.longitude)
        if dist <= radius:
            out = _mandi_to_out(m)
            out_dict = out.model_dump() if hasattr(out, 'model_dump') else out.__dict__
            out_dict["distance_km"] = round(dist, 1)
            # Add crop names
            out_dict["crops"] = [
                {"id": mc.crop.id, "name": mc.crop.name}
                for mc in (m.mandi_crops or []) if mc.crop
            ]
            results.append(out_dict)

    # Sort by distance
    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]


@router.get("/mandis/search")
def search_mandis(
    q: str = Query("", description="Search query"),
    state_id: Optional[int] = Query(None),
    district_id: Optional[int] = Query(None),
    crop_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Full-text search across mandi name, state, district, and crop."""
    query = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).filter(Mandi.is_active == True)

    if district_id:
        query = query.filter(Mandi.district_id == district_id)
    elif state_id:
        query = query.join(District).filter(District.state_id == state_id)

    if crop_id:
        query = query.join(MandiCrop, Mandi.id == MandiCrop.mandi_id).filter(MandiCrop.crop_id == crop_id)

    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Mandi.name.ilike(search_term),
                Mandi.address.ilike(search_term),
                Mandi.pincode.ilike(search_term),
            )
        )

    mandis = query.order_by(Mandi.name.asc()).limit(limit).all()

    results = []
    for m in mandis:
        out = _mandi_to_out(m)
        out_dict = out.model_dump() if hasattr(out, 'model_dump') else out.__dict__
        out_dict["crops"] = [
            {"id": mc.crop.id, "name": mc.crop.name}
            for mc in (m.mandi_crops or []) if mc.crop
        ]
        results.append(out_dict)

    return results


@router.get("/mandis/map")
def get_mandis_for_map(
    state_id: Optional[int] = Query(None),
    district_id: Optional[int] = Query(None),
    crop_id: Optional[int] = Query(None),
    bounds_ne_lat: Optional[float] = Query(None),
    bounds_ne_lng: Optional[float] = Query(None),
    bounds_sw_lat: Optional[float] = Query(None),
    bounds_sw_lng: Optional[float] = Query(None),
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Lightweight mandi data for map markers.
    Supports map-bounds filtering for efficient loading.
    """
    query = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).filter(
        Mandi.is_active == True,
        Mandi.latitude.isnot(None),
        Mandi.longitude.isnot(None),
    )

    if district_id:
        query = query.filter(Mandi.district_id == district_id)
    elif state_id:
        query = query.join(District).filter(District.state_id == state_id)

    if crop_id:
        query = query.join(MandiCrop, Mandi.id == MandiCrop.mandi_id).filter(MandiCrop.crop_id == crop_id)

    # Bounds-based filtering
    if all(v is not None for v in [bounds_ne_lat, bounds_ne_lng, bounds_sw_lat, bounds_sw_lng]):
        query = query.filter(
            Mandi.latitude >= bounds_sw_lat,
            Mandi.latitude <= bounds_ne_lat,
            Mandi.longitude >= bounds_sw_lng,
            Mandi.longitude <= bounds_ne_lng,
        )

    mandis = query.limit(limit).all()

    results = []
    for m in mandis:
        district = m.district
        state = district.state if district else None
        crop_names = [mc.crop.name for mc in (m.mandi_crops or []) if mc.crop]

        results.append({
            "id": m.id,
            "name": m.name,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "district_name": district.name if district else None,
            "state_name": state.name if state else None,
            "image_url": m.image_url,
            "mandi_type": m.mandi_type,
            "opening_time": m.opening_time,
            "closing_time": m.closing_time,
            "crop_count": len(crop_names),
            "crops": crop_names[:10],  # First 10 for marker popup
            "address": m.address,
            "contact_number": m.contact_number,
            "pincode": m.pincode,
        })

    return results


@router.get("/mandis/{mandi_id}", response_model=MandiOut)
def get_mandi(mandi_id: int, db: Session = Depends(get_db)):
    """Get a single mandi by ID with crops and latest prices."""
    m = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).filter(Mandi.id == mandi_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mandi not found")
    return _mandi_to_out(m)


@router.get("/mandis/{mandi_id}/detail")
def get_mandi_detail(mandi_id: int, db: Session = Depends(get_db)):
    """Get full mandi detail with crops and latest prices."""
    from sqlalchemy import desc

    m = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).filter(Mandi.id == mandi_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mandi not found")

    district = m.district
    state = district.state if district else None

    # Get available crops
    crops = [
        {"id": mc.crop.id, "name": mc.crop.name, "category": mc.crop.category, "season": mc.crop.season}
        for mc in (m.mandi_crops or []) if mc.crop
    ]

    # Get latest prices
    prices = db.query(MarketPrice).filter(
        MarketPrice.mandi_id == mandi_id,
        MarketPrice.is_active == True,
    ).order_by(desc(MarketPrice.price_date)).limit(50).all()

    price_list = []
    for p in prices:
        price_list.append({
            "id": p.id,
            "crop_name": p.crop_name,
            "variety": p.variety,
            "min_price": p.min_price,
            "max_price": p.max_price,
            "modal_price": p.modal_price,
            "unit": p.unit,
            "price_date": str(p.price_date) if p.price_date else None,
            "data_source": p.data_source,
            "trend": p.trend,
            "fetched_at": str(p.fetched_at) if p.fetched_at else None,
        })

    return {
        "id": m.id,
        "name": m.name,
        "district_id": m.district_id,
        "district_name": district.name if district else None,
        "state_id": state.id if state else None,
        "state_name": state.name if state else None,
        "address": m.address,
        "pincode": m.pincode,
        "latitude": m.latitude,
        "longitude": m.longitude,
        "contact_number": m.contact_number,
        "opening_time": m.opening_time,
        "closing_time": m.closing_time,
        "mandi_type": m.mandi_type,
        "image_url": m.image_url,
        "is_active": m.is_active,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "crops": crops,
        "latest_prices": price_list,
    }


@router.get("/mandis/{mandi_id}/crops")
def get_mandi_crops(mandi_id: int, db: Session = Depends(get_db)):
    """Get crops available at a mandi."""
    mandi_crops = db.query(MandiCrop).options(
        joinedload(MandiCrop.crop)
    ).filter(MandiCrop.mandi_id == mandi_id).all()

    return [
        {"id": mc.crop.id, "name": mc.crop.name, "category": mc.crop.category, "season": mc.crop.season}
        for mc in mandi_crops if mc.crop
    ]


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
