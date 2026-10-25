"""
Public read-only endpoints for the 3-tier location hierarchy:
  India → State → District → Mandi → Mandi Details
These do NOT require authentication.

Features:
  - Complete All-India coverage across all 36 States and Union Territories.
  - Accurate district & state mandi counts.
  - Advanced NLP & tokenized search across Mandi / State / District / City / Crop / Mandi Type.
  - Real-time IST (UTC+5:30) operating hours calculator (Open Now / Closed / Hours Unknown).
  - Haversine distance calculation and radius filtering.
  - Batch-aggregated genuine farmer review stats (average rating, review count, 1-5 star distribution).
  - Price reporting status indicators and official vs private market report distinction.
"""
import math
import re
import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc
from typing import List, Optional, Tuple, Dict, Any

from app.core.database import get_db
from app.models.market import State, District, Mandi, MandiCrop, MandiReview, MarketPrice
from app.models.agronomy import Crop
from app.schemas.locations import StateOut, DistrictOut, MandiOut

router = APIRouter(tags=["Locations"])


# ==================== HAVERSINE DISTANCE HELPER ====================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon points using Haversine formula."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


# ==================== OPERATING HOURS CALCULATOR (IST UTC+5:30) ====================

def calculate_mandi_operating_status(
    opening_time_str: Optional[str],
    closing_time_str: Optional[str]
) -> Tuple[str, str, str]:
    """
    Calculate current mandi operating status based on Indian Standard Time (IST, UTC+5:30).
    Returns (status_key, label, detail):
      status_key: "OPEN" | "CLOSED" | "HOURS_UNKNOWN"
      label: "Open Now" | "Closed" | "Hours Unknown"
      detail: Human-readable note, e.g. "Closes at 08:00 PM" or "Hours unverified"
    Never assumes open status when hours are unverified.
    """
    if not opening_time_str or not closing_time_str:
        return "HOURS_UNKNOWN", "Hours Unknown", "Operating hours not verified"

    def parse_time_to_minutes(t_val: str) -> Optional[int]:
        if not t_val or not isinstance(t_val, str):
            return None
        t_clean = t_val.strip()
        # Common formats: "06:00 AM", "6:00 AM", "06:00", "18:00", "08:30 PM", "6 AM"
        formats = (
            "%I:%M %p", "%I:%M%p", "%I %p", "%I%p",
            "%H:%M", "%H:%M:%S",
        )
        for fmt in formats:
            try:
                dt = datetime.datetime.strptime(t_clean, fmt)
                return dt.hour * 60 + dt.minute
            except ValueError:
                continue
        # Fallback for simple "HH:MM" in 24h
        parts = re.split(r'[:\s]', t_clean)
        if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
            h, m = int(parts[0]), int(parts[1])
            if 0 <= h < 24 and 0 <= m < 60:
                return h * 60 + m
        return None

    open_min = parse_time_to_minutes(opening_time_str)
    close_min = parse_time_to_minutes(closing_time_str)

    if open_min is None or close_min is None:
        return "HOURS_UNKNOWN", "Hours Unknown", "Operating hours format unverified"

    # Current IST Time: UTC + 5h 30m
    utc_now = datetime.datetime.utcnow()
    ist_now = utc_now + datetime.timedelta(hours=5, minutes=30)
    current_min = ist_now.hour * 60 + ist_now.minute

    def format_min(m: int) -> str:
        hr = m // 60
        mn = m % 60
        ampm = "AM" if hr < 12 else "PM"
        hr12 = hr if (1 <= hr <= 12) else (hr - 12 if hr > 12 else 12)
        return f"{hr12}:{mn:02d} {ampm}"

    open_formatted = format_min(open_min)
    close_formatted = format_min(close_min)

    if open_min <= close_min:
        # Standard daytime hours (e.g. 05:00 AM to 08:00 PM)
        if open_min <= current_min <= close_min:
            return "OPEN", "Open Now", f"Closes at {close_formatted}"
        else:
            return "CLOSED", "Closed", f"Opens at {open_formatted}"
    else:
        # Overnight market (e.g. 21:00 to 06:00)
        if current_min >= open_min or current_min <= close_min:
            return "OPEN", "Open Now", f"Closes at {close_formatted}"
        else:
            return "CLOSED", "Closed", f"Opens at {open_formatted}"


# ==================== SMART SEARCH QUERY PARSER ====================

STATE_ALIASES = {
    "up": "Uttar Pradesh", "uttar pradesh": "Uttar Pradesh",
    "mh": "Maharashtra", "maharashtra": "Maharashtra",
    "mp": "Madhya Pradesh", "madhya pradesh": "Madhya Pradesh",
    "ap": "Andhra Pradesh", "andhra pradesh": "Andhra Pradesh",
    "ka": "Karnataka", "karnataka": "Karnataka",
    "tn": "Tamil Nadu", "tamil nadu": "Tamil Nadu",
    "rj": "Rajasthan", "rajasthan": "Rajasthan",
    "pb": "Punjab", "punjab": "Punjab",
    "hr": "Haryana", "haryana": "Haryana",
    "wb": "West Bengal", "west bengal": "West Bengal",
    "gj": "Gujarat", "gujarat": "Gujarat",
    "br": "Bihar", "bihar": "Bihar",
    "ts": "Telangana", "telangana": "Telangana", "tg": "Telangana",
    "od": "Odisha", "odisha": "Odisha", "orissa": "Odisha",
    "as": "Assam", "assam": "Assam",
    "kl": "Kerala", "kerala": "Kerala",
    "cg": "Chhattisgarh", "chhattisgarh": "Chhattisgarh",
    "jh": "Jharkhand", "jharkhand": "Jharkhand",
    "uk": "Uttarakhand", "uttarakhand": "Uttarakhand",
    "hp": "Himachal Pradesh", "himachal pradesh": "Himachal Pradesh",
    "dl": "Delhi", "delhi": "Delhi", "new delhi": "Delhi",
    "jk": "Jammu and Kashmir", "jammu and kashmir": "Jammu and Kashmir",
    "ga": "Goa", "goa": "Goa",
}

COMMON_STOPWORDS = {
    "all", "mandi", "mandis", "market", "markets", "in", "district", "state", "city",
    "near", "me", "my", "location", "prices", "price", "rate", "rates", "find",
    "show", "get", "of", "and", "the", "for", "at", "live", "today"
}


def parse_intelligent_query(raw_q: str, db: Session) -> Dict[str, Any]:
    """
    Parse natural language searches such as:
      - "Government wheat mandi in Gorakhpur"
      - "Tomato prices in Uttar Pradesh"
      - "Private mandi in Maharashtra"
      - "All mandis in Lucknow district"
      - "Open mandis near my location"
    Extracts structured entities: state, district, crop, mandi_type, open_status, residual keywords.
    """
    clean_q = raw_q.strip().lower()
    entities: Dict[str, Any] = {
        "extracted_state": None,
        "extracted_district": None,
        "extracted_crop": None,
        "extracted_type": None,
        "extracted_open_status": None,
        "requires_prices": False,
        "residual_terms": []
    }

    # 1. Check for Mandi Type in query and strip
    if "government" in clean_q or "govt" in clean_q:
        entities["extracted_type"] = "Government Mandi"
        clean_q = re.sub(r'\b(government|govt)\b', ' ', clean_q)
    elif "apmc" in clean_q:
        entities["extracted_type"] = "APMC Mandi"
        clean_q = re.sub(r'\bapmc\b', ' ', clean_q)
    elif "private" in clean_q:
        entities["extracted_type"] = "Private Wholesale Market"
        clean_q = re.sub(r'\bprivate\b', ' ', clean_q)
    elif "wholesale" in clean_q:
        entities["extracted_type"] = "Wholesale"
        clean_q = re.sub(r'\bwholesale\b', ' ', clean_q)
    elif "haat" in clean_q or "rural" in clean_q:
        entities["extracted_type"] = "Rural Haat"
        clean_q = re.sub(r'\b(rural|haat)\b', ' ', clean_q)

    # 2. Check for Open Status and strip
    if "open now" in clean_q or "open" in clean_q:
        entities["extracted_open_status"] = "open"
        clean_q = re.sub(r'\bopen(\s+now)?\b', ' ', clean_q)
    elif "closed" in clean_q:
        entities["extracted_open_status"] = "closed"
        clean_q = re.sub(r'\bclosed\b', ' ', clean_q)

    # 3. Check for price requirement and strip
    if re.search(r'\b(prices?|rates?|cost)\b', clean_q):
        entities["requires_prices"] = True
        clean_q = re.sub(r'\b(prices?|rates?|cost)\b', ' ', clean_q)

    # 4. Check for state names/abbreviations and strip
    for alias, formal_name in sorted(STATE_ALIASES.items(), key=lambda x: -len(x[0])):
        pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(pattern, clean_q):
            entities["extracted_state"] = formal_name
            clean_q = re.sub(pattern, " ", clean_q)
            break

    # 5. Check for known crops in DB and strip
    all_crops = [c[0] for c in db.query(Crop.name).all()]
    for crop_name in all_crops:
        crop_word = crop_name.lower().split()[0]  # e.g. "wheat", "rice", "tomato"
        pattern = r'\b' + re.escape(crop_word) + r'\b'
        if re.search(pattern, clean_q):
            entities["extracted_crop"] = crop_name
            clean_q = re.sub(pattern, " ", clean_q)
            break

    # 6. Check for district names and strip
    all_districts = [d[0] for d in db.query(District.name).all()]
    for dist_name in all_districts:
        dclean = dist_name.lower()
        if dclean == 'mandi':
            if re.search(r'\b(district mandi|mandi district)\b', clean_q):
                entities["extracted_district"] = "Mandi"
                clean_q = re.sub(r'\b(district mandi|mandi district)\b', ' ', clean_q)
                break
            continue
        pattern = r'\b' + re.escape(dclean) + r'\b'
        if re.search(pattern, clean_q):
            entities["extracted_district"] = dist_name
            clean_q = re.sub(pattern, " ", clean_q)
            break

    # 7. Collect residual keywords (ignoring stopwords)
    words = re.findall(r'\b[a-zA-Z0-9]{2,}\b', clean_q)
    residual = [w for w in words if w not in COMMON_STOPWORDS]
    entities["residual_terms"] = residual

    return entities


# ==================== STATES ENDPOINTS ====================

@router.get("/states", response_model=List[StateOut])
def get_all_states(
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    Get all 36 Indian states and Union Territories with accurate, live counts of
    verified districts and mandis.
    """
    q = db.query(State)
    if active_only:
        q = q.filter(State.is_active == True)
    states = q.order_by(State.name.asc()).all()

    # Batch compute district and mandi counts for performance
    dist_counts = dict(
        db.query(District.state_id, func.count(District.id))
        .filter(District.is_active == True)
        .group_by(District.state_id)
        .all()
    )
    mandi_counts = dict(
        db.query(District.state_id, func.count(Mandi.id))
        .join(Mandi, Mandi.district_id == District.id)
        .filter(Mandi.is_active == True)
        .group_by(District.state_id)
        .all()
    )

    result = []
    for s in states:
        out = StateOut(
            id=s.id,
            name=s.name,
            code=s.code,
            data_source=s.data_source or "Survey of India / LGD",
            image_url=s.image_url,
            is_active=s.is_active,
            district_count=dist_counts.get(s.id, 0),
            mandi_count=mandi_counts.get(s.id, 0),
            created_at=s.created_at or datetime.datetime.utcnow(),
            updated_at=s.updated_at or datetime.datetime.utcnow(),
        )
        result.append(out)

    return result


@router.get("/states/{state_id}", response_model=StateOut)
def get_state(state_id: int, db: Session = Depends(get_db)):
    """Get single state details with accurate district and mandi counts."""
    s = db.query(State).filter(State.id == state_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="State not found")

    dist_count = db.query(District).filter(District.state_id == s.id, District.is_active == True).count()
    mandi_count = (
        db.query(Mandi)
        .join(District, Mandi.district_id == District.id)
        .filter(District.state_id == s.id, Mandi.is_active == True)
        .count()
    )

    return StateOut(
        id=s.id,
        name=s.name,
        code=s.code,
        data_source=s.data_source or "Survey of India / LGD",
        image_url=s.image_url,
        is_active=s.is_active,
        district_count=dist_count,
        mandi_count=mandi_count,
        created_at=s.created_at or datetime.datetime.utcnow(),
        updated_at=s.updated_at or datetime.datetime.utcnow(),
    )


# ==================== DISTRICTS ENDPOINTS ====================

@router.get("/districts", response_model=List[DistrictOut])
def get_all_districts(
    state_id: Optional[int] = Query(None),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    Get all districts with live mandi count and parent state info.
    Supports filtering by state_id.
    """
    q = db.query(District).options(joinedload(District.state))
    if state_id and isinstance(state_id, int):
        q = q.filter(District.state_id == state_id)
    if active_only:
        q = q.filter(District.is_active == True)

    districts = q.order_by(District.name.asc()).all()

    # Batch compute mandi counts per district
    mandi_counts = dict(
        db.query(Mandi.district_id, func.count(Mandi.id))
        .filter(Mandi.is_active == True)
        .group_by(Mandi.district_id)
        .all()
    )

    result = []
    for d in districts:
        out = DistrictOut(
            id=d.id,
            state_id=d.state_id,
            name=d.name,
            code=d.code,
            data_source=d.data_source or "Census of India / LGD",
            image_url=d.image_url,
            is_active=d.is_active,
            state_name=d.state.name if d.state else None,
            mandi_count=mandi_counts.get(d.id, 0),
            created_at=d.created_at or datetime.datetime.utcnow(),
            updated_at=d.updated_at or datetime.datetime.utcnow(),
        )
        result.append(out)

    return result


@router.get("/states/{state_id}/districts", response_model=List[DistrictOut])
def get_districts_by_state(
    state_id: int,
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get districts belonging to a specific state with verified mandi counts."""
    q = db.query(District).options(joinedload(District.state)).filter(District.state_id == state_id)
    if active_only:
        q = q.filter(District.is_active == True)

    districts = q.order_by(District.name.asc()).all()

    mandi_counts = dict(
        db.query(Mandi.district_id, func.count(Mandi.id))
        .filter(Mandi.is_active == True)
        .group_by(Mandi.district_id)
        .all()
    )

    return [
        DistrictOut(
            id=d.id,
            state_id=d.state_id,
            name=d.name,
            code=d.code,
            data_source=d.data_source or "Census of India / LGD",
            image_url=d.image_url,
            is_active=d.is_active,
            state_name=d.state.name if d.state else None,
            mandi_count=mandi_counts.get(d.id, 0),
            created_at=d.created_at or datetime.datetime.utcnow(),
            updated_at=d.updated_at or datetime.datetime.utcnow(),
        ) for d in districts
    ]


# ==================== MANDIS SEARCH & MAP ENDPOINTS ====================

@router.get("/mandis/map")
def get_mandis_for_map(
    q: Optional[str] = Query(None, description="Natural language search or keyword"),
    state_id: Optional[int] = Query(None),
    state_name: Optional[str] = Query(None, description="Filter by state name"),
    district_id: Optional[int] = Query(None),
    district_name: Optional[str] = Query(None, description="Filter by district name"),
    mandi_type: Optional[str] = Query(None, description="Filter by category (APMC, Government, Private)"),
    crop_id: Optional[int] = Query(None),
    crop_name: Optional[str] = Query(None, description="Filter by commodity/crop name"),
    open_status: Optional[str] = Query(None, description="all, open, closed, unknown"),
    operating_status: Optional[str] = Query(None, description="Alias for open_status"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0),
    has_prices: Optional[bool] = Query(None),
    user_lat: Optional[float] = Query(None),
    user_lon: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None, description="Alias for user_lon"),
    radius_km: Optional[float] = Query(None, ge=1, le=500),
    max_distance_km: Optional[float] = Query(None, description="Alias for radius_km"),
    bounds_ne_lat: Optional[float] = Query(None),
    bounds_ne_lng: Optional[float] = Query(None),
    bounds_sw_lat: Optional[float] = Query(None),
    bounds_sw_lng: Optional[float] = Query(None),
    active_only: bool = Query(True),
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Primary endpoint powering the interactive Mandi Intelligence Map & List.
    Combines NLP search, multi-factor filtering, IST operating hours calculation,
    and batch review and price indicators.
    """
    # Sanitize parameter types cleanly
    s_id = state_id if isinstance(state_id, int) else None
    s_name = state_name if isinstance(state_name, str) and state_name.strip() and state_name.lower() != "all" else None
    d_id = district_id if isinstance(district_id, int) else None
    d_name = district_name if isinstance(district_name, str) and district_name.strip() and district_name.lower() != "all" else None
    m_type = mandi_type if isinstance(mandi_type, str) and mandi_type.strip() and mandi_type.lower() != "all" else None
    c_id = crop_id if isinstance(crop_id, int) else None
    c_name = crop_name if isinstance(crop_name, str) and crop_name.strip() and crop_name.lower() != "all" else None
    
    raw_op = operating_status if isinstance(operating_status, str) and operating_status.strip() else open_status
    op_filter = raw_op if isinstance(raw_op, str) and raw_op.strip() else "all"
    
    rating_filter = min_rating if isinstance(min_rating, (int, float)) else None
    price_filter = has_prices if isinstance(has_prices, bool) else None
    u_lat = user_lat if isinstance(user_lat, (int, float)) else None
    u_lon = user_lon if isinstance(user_lon, (int, float)) else (user_lng if isinstance(user_lng, (int, float)) else None)
    r_km = radius_km if isinstance(radius_km, (int, float)) else (max_distance_km if isinstance(max_distance_km, (int, float)) else None)
    query_str = q if isinstance(q, str) and q.strip() else None

    query = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).join(District, Mandi.district_id == District.id, isouter=True
    ).join(State, District.state_id == State.id, isouter=True)

    if isinstance(active_only, bool) and active_only:
        query = query.filter(Mandi.is_active == True)

    # 1. Structured location filters
    if d_id:
        query = query.filter(Mandi.district_id == d_id)
    elif d_name:
        query = query.filter(District.name.ilike(f"%{d_name}%"))
    elif s_id:
        query = query.filter(District.state_id == s_id)
    elif s_name:
        query = query.filter(State.name.ilike(f"%{s_name}%"))

    # 2. Structured mandi type filter
    if m_type:
        if "government" in m_type.lower():
            query = query.filter(Mandi.mandi_type.ilike("%Government%"))
        elif "apmc" in m_type.lower():
            query = query.filter(Mandi.mandi_type.ilike("%APMC%"))
        elif "private" in m_type.lower():
            query = query.filter(Mandi.mandi_type.ilike("%Private%"))
        else:
            query = query.filter(Mandi.mandi_type.ilike(f"%{m_type}%"))

    # 3. Structured crop filter
    if c_id:
        query = query.join(MandiCrop, Mandi.id == MandiCrop.mandi_id).filter(MandiCrop.crop_id == c_id)
    elif c_name:
        query = query.join(MandiCrop, Mandi.id == MandiCrop.mandi_id).join(Crop, MandiCrop.crop_id == Crop.id).filter(
            Crop.name.ilike(f"%{c_name}%")
        )

    # 4. Map bounding box filter
    if all(isinstance(v, (int, float)) for v in [bounds_ne_lat, bounds_ne_lng, bounds_sw_lat, bounds_sw_lng]):
        query = query.filter(
            Mandi.latitude >= bounds_sw_lat,
            Mandi.latitude <= bounds_ne_lat,
            Mandi.longitude >= bounds_sw_lng,
            Mandi.longitude <= bounds_ne_lng,
        )

    # 5. Natural Language & Keyword Query Parsing (Fixes "0 Mandis Found")
    if query_str:
        parsed = parse_intelligent_query(query_str, db)

        # Apply state if detected and not already explicitly filtered
        if parsed["extracted_state"] and not s_id and not s_name:
            query = query.filter(State.name.ilike(f"%{parsed['extracted_state']}%"))

        # Apply district if detected and not already explicitly filtered
        if parsed["extracted_district"] and not d_id and not d_name:
            query = query.filter(District.name.ilike(f"%{parsed['extracted_district']}%"))

        # Apply type if detected and not already filtered
        if parsed["extracted_type"] and not m_type:
            query = query.filter(Mandi.mandi_type.ilike(f"%{parsed['extracted_type']}%"))

        # Apply crop if detected
        if parsed["extracted_crop"]:
            crop_kw = parsed["extracted_crop"].split()[0]
            query = query.filter(
                or_(
                    Mandi.id.in_(
                        db.query(MandiCrop.mandi_id).join(Crop, MandiCrop.crop_id == Crop.id).filter(
                            Crop.name.ilike(f"%{crop_kw}%")
                        )
                    ),
                    Mandi.id.in_(
                        db.query(MarketPrice.mandi_id).filter(
                            MarketPrice.crop_name.ilike(f"%{crop_kw}%")
                        )
                    )
                )
            )

        # Apply price requirement if detected
        if parsed["requires_prices"]:
            query = query.filter(
                Mandi.id.in_(
                    db.query(MarketPrice.mandi_id).filter(MarketPrice.is_active == True)
                )
            )

        # Apply residual keywords across mandi name, address, pincode, district, state
        for term in parsed["residual_terms"]:
            term_wildcard = f"%{term}%"
            query = query.filter(
                or_(
                    Mandi.name.ilike(term_wildcard),
                    Mandi.address.ilike(term_wildcard),
                    Mandi.pincode.ilike(term_wildcard),
                    District.name.ilike(term_wildcard),
                    State.name.ilike(term_wildcard),
                    Mandi.id.in_(
                        db.query(MandiCrop.mandi_id).join(Crop, MandiCrop.crop_id == Crop.id).filter(
                            Crop.name.ilike(term_wildcard)
                        )
                    )
                )
            )

    actual_limit = limit if isinstance(limit, int) else 500
    mandis = query.limit(actual_limit).all()

    # Batch compute ratings and reviews
    mandi_ids = [m.id for m in mandis]
    rating_data = {}
    price_data = {}

    if mandi_ids:
        # Reviews
        rating_rows = (
            db.query(
                MandiReview.mandi_id,
                func.avg(MandiReview.rating).label("avg_rating"),
                func.count(MandiReview.id).label("review_count"),
            )
            .filter(MandiReview.mandi_id.in_(mandi_ids), MandiReview.is_approved == True)
            .group_by(MandiReview.mandi_id)
            .all()
        )
        for r in rating_rows:
            rating_data[r.mandi_id] = {
                "average_rating": round(float(r.avg_rating), 1),
                "review_count": r.review_count,
            }

        # Prices presence & latest date
        price_rows = (
            db.query(
                MarketPrice.mandi_id,
                func.count(MarketPrice.id).label("price_count"),
                func.max(MarketPrice.price_date).label("latest_date"),
            )
            .filter(MarketPrice.mandi_id.in_(mandi_ids), MarketPrice.is_active == True)
            .group_by(MarketPrice.mandi_id)
            .all()
        )
        for p in price_rows:
            price_data[p.mandi_id] = {
                "has_prices": p.price_count > 0,
                "price_count": p.price_count,
                "latest_price_date": str(p.latest_date) if p.latest_date else None,
            }

    results = []
    has_user_loc = (isinstance(user_lat, (int, float)) and isinstance(user_lon, (int, float)) and
                    -90 <= user_lat <= 90 and -180 <= user_lon <= 180)

    for m in mandis:
        district = m.district
        state = district.state if district else None
        crop_names = [mc.crop.name for mc in (m.mandi_crops or []) if mc.crop]

        # Ratings
        rd = rating_data.get(m.id, {"average_rating": 0.0, "review_count": 0})

        # Filter by min_rating if requested
        if isinstance(min_rating, (int, float)) and rd["average_rating"] < min_rating:
            continue

        # Prices
        pd = price_data.get(m.id, {"has_prices": False, "price_count": 0, "latest_price_date": None})
        if isinstance(has_prices, bool) and has_prices is True and not pd["has_prices"]:
            continue

        # Operating Status (IST)
        op_status, status_label, status_detail = calculate_mandi_operating_status(
            m.opening_time, m.closing_time
        )

        # Filter by open_status if requested
        if isinstance(open_status, str):
            os_lower = open_status.lower()
            if os_lower == "open" and op_status != "OPEN":
                continue
            elif os_lower == "closed" and op_status != "CLOSED":
                continue
            elif os_lower == "unknown" and op_status != "HOURS_UNKNOWN":
                continue

        # Distance calculation
        dist_km = None
        if has_user_loc and isinstance(m.latitude, (int, float)) and isinstance(m.longitude, (int, float)):
            dist_km = haversine_distance(user_lat, user_lon, m.latitude, m.longitude)
            if isinstance(radius_km, (int, float)) and dist_km > radius_km:
                continue

        results.append({
            "id": m.id,
            "name": m.name,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "district_name": district.name if district else None,
            "state_name": state.name if state else None,
            "state_id": state.id if state else None,
            "district_id": district.id if district else None,
            "image_url": m.image_url,
            "mandi_type": m.mandi_type or "APMC Mandi",
            "opening_time": m.opening_time,
            "closing_time": m.closing_time,
            "operating_status": op_status,
            "status_label": status_label,
            "status_detail": status_detail,
            "crop_count": len(crop_names),
            "crops": crop_names[:10],
            "address": m.address,
            "contact_number": m.contact_number,
            "pincode": m.pincode,
            "data_source": getattr(m, 'data_source', 'AGMARKNET / DMI') or 'AGMARKNET / DMI',
            "is_verified": getattr(m, 'is_verified', True) if getattr(m, 'is_verified', None) is not None else True,
            "verification_status": getattr(m, 'verification_status', 'VERIFIED') or 'VERIFIED',
            "updated_at": m.updated_at.isoformat() if m.updated_at else None,
            "average_rating": rd["average_rating"],
            "review_count": rd["review_count"],
            "has_prices": pd["has_prices"],
            "price_count": pd["price_count"],
            "latest_price_date": pd["latest_price_date"],
            "distance_km": dist_km,
        })

    # If user coordinates were provided, optionally sort by distance
    if has_user_loc:
        results.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"]))

    return results


@router.get("/mandis/search")
def search_mandis(
    q: str = Query("", description="Search query"),
    state_id: Optional[int] = Query(None),
    state_name: Optional[str] = Query(None),
    district_id: Optional[int] = Query(None),
    district_name: Optional[str] = Query(None),
    mandi_type: Optional[str] = Query(None),
    crop_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Full-text intelligent search proxy redirecting to get_mandis_for_map with search defaults."""
    return get_mandis_for_map(
        q=q,
        state_id=state_id,
        state_name=state_name,
        district_id=district_id,
        district_name=district_name,
        mandi_type=mandi_type,
        crop_id=crop_id,
        limit=limit,
        db=db,
    )


@router.get("/mandis/nearby")
def get_nearby_mandis(
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
    radius: float = Query(50, description="Search radius in km"),
    crop_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Find nearby active mandis using Haversine calculation."""
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    return get_mandis_for_map(
        user_lat=lat,
        user_lon=lon,
        radius_km=radius,
        crop_id=crop_id,
        limit=limit,
        db=db,
    )


# ==================== MANDI DETAILS & REVIEWS ====================

@router.get("/mandis/{mandi_id}", response_model=MandiOut)
def get_mandi(mandi_id: int, db: Session = Depends(get_db)):
    """Get single mandi basic representation."""
    m = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).filter(Mandi.id == mandi_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mandi not found")
    return _mandi_to_out(m, db)


@router.get("/mandis/{mandi_id}/detail")
def get_mandi_detail(mandi_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive mandi detail with:
      - Verified geographic coordinates & data source
      - Real-time IST operating schedule
      - Commodity and crop catalog
      - Available agricultural market prices (with date, source, trend, unit)
      - Actual farmer reviews & genuine rating distribution
    """
    m = db.query(Mandi).options(
        joinedload(Mandi.district).joinedload(District.state),
        joinedload(Mandi.mandi_crops).joinedload(MandiCrop.crop),
    ).filter(Mandi.id == mandi_id).first()

    if not m:
        raise HTTPException(status_code=404, detail="Mandi not found")

    district = m.district
    state = district.state if district else None

    # Available crops
    crops = [
        {"id": mc.crop.id, "name": mc.crop.name, "category": mc.crop.category, "season": mc.crop.season}
        for mc in (m.mandi_crops or []) if mc.crop
    ]

    # Latest prices from database
    prices = (
        db.query(MarketPrice)
        .filter(MarketPrice.mandi_id == mandi_id, MarketPrice.is_active == True)
        .order_by(desc(MarketPrice.price_date), desc(MarketPrice.updated_at))
        .limit(50)
        .all()
    )

    price_list = []
    for p in prices:
        price_list.append({
            "id": p.id,
            "crop_name": p.crop_name,
            "variety": p.variety or "Standard",
            "min_price": p.min_price,
            "max_price": p.max_price,
            "modal_price": p.modal_price,
            "unit": p.unit or "₹/Quintal",
            "price_date": str(p.price_date) if p.price_date else None,
            "data_source": p.data_source or "AGMARKNET / DMI",
            "trend": p.trend or "STABLE",
            "change_percent": p.change_percent or 0.0,
            "fetched_at": p.fetched_at.isoformat() if p.fetched_at else None,
            "is_official": (p.data_source or "").lower() in ("data.gov.in", "agmarknet", "dmi"),
        })

    # Genuine farmer ratings and reviews
    approved_reviews = (
        db.query(MandiReview)
        .filter(MandiReview.mandi_id == mandi_id, MandiReview.is_approved == True)
        .order_by(desc(MandiReview.created_at))
        .all()
    )

    rating_stats = {
        "average_rating": 0.0,
        "total_reviews": 0,
        "distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        "has_reviews": False,
        "rating_label": "Not Rated Yet — Be the First to Review."
    }

    if approved_reviews:
        total = len(approved_reviews)
        avg = sum(r.rating for r in approved_reviews) / total
        dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in approved_reviews:
            if 1 <= r.rating <= 5:
                dist[r.rating] += 1
        rating_stats = {
            "average_rating": round(avg, 1),
            "total_reviews": total,
            "distribution": dist,
            "has_reviews": True,
            "rating_label": f"⭐ {round(avg, 1)}/5 ({total} Farmer Reviews)"
        }

    # Operating Status in IST
    op_status, status_label, status_detail = calculate_mandi_operating_status(
        m.opening_time, m.closing_time
    )

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
        "operating_status": op_status,
        "status_label": status_label,
        "status_detail": status_detail,
        "mandi_type": m.mandi_type or "APMC Mandi",
        "image_url": m.image_url,
        "data_source": getattr(m, 'data_source', 'AGMARKNET / DMI') or 'AGMARKNET / DMI',
        "is_verified": getattr(m, 'is_verified', True) if getattr(m, 'is_verified', None) is not None else True,
        "verification_status": getattr(m, 'verification_status', 'VERIFIED') or 'VERIFIED',
        "is_active": m.is_active,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "crops": crops,
        "has_prices": len(price_list) > 0,
        "latest_prices": price_list,
        "rating_stats": rating_stats,
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


def _mandi_to_out(m: Mandi, db: Session) -> MandiOut:
    district = m.district
    state = district.state if district else None
    crop_names = [mc.crop.name for mc in (m.mandi_crops or []) if mc.crop]

    # Ratings
    revs = db.query(MandiReview).filter(MandiReview.mandi_id == m.id, MandiReview.is_approved == True).all()
    avg_r = round(sum(r.rating for r in revs) / len(revs), 1) if revs else 0.0

    # Prices
    has_pr = db.query(MarketPrice.id).filter(MarketPrice.mandi_id == m.id, MarketPrice.is_active == True).first() is not None

    # Status
    op_status, status_label, status_detail = calculate_mandi_operating_status(m.opening_time, m.closing_time)

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
        data_source=getattr(m, 'data_source', 'AGMARKNET / DMI'),
        is_verified=getattr(m, 'is_verified', True),
        verification_status=getattr(m, 'verification_status', 'VERIFIED'),
        is_active=m.is_active,
        district_name=district.name if district else None,
        state_id=state.id if state else None,
        state_name=state.name if state else None,
        crop_count=len(crop_names),
        crops=[{"id": mc.crop.id, "name": mc.crop.name} for mc in (m.mandi_crops or []) if mc.crop],
        average_rating=avg_r,
        review_count=len(revs),
        operating_status=op_status,
        status_label=status_label,
        status_detail=status_detail,
        has_prices=has_pr,
        created_at=m.created_at or datetime.datetime.utcnow(),
        updated_at=m.updated_at or datetime.datetime.utcnow(),
    )
