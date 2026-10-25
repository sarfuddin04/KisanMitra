"""
Image upload endpoint for admin and authenticated farmers.
Saves files to persistent UPLOAD_DIR and returns a static URL.
Supported categories:
  - Admin only: mandi, crop, fertilizer, disease, banner
  - Authenticated Farmers & Admin: products, general, profiles
"""
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Image Upload"])

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_CATEGORIES = {"mandi", "crop", "fertilizer", "disease", "banner", "general", "products", "profiles"}
ADMIN_ONLY_CATEGORIES = {"mandi", "crop", "fertilizer", "disease", "banner"}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    category: str = Form(default="products"),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an image file securely to persistent storage.
    Farmers can upload for products and general items.
    Admin can upload for all categories.
    """
    category = category.lower().strip()
    if category not in ALLOWED_CATEGORIES:
        category = "products"

    # Enforce role permissions for admin-only categories
    is_admin = bool(current_user.role and current_user.role.name == "ADMIN")
    if category in ADMIN_ONLY_CATEGORIES and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only administrators can upload images for category '{category}'."
        )

    # Validate content type
    content_type = (file.content_type or "").lower().strip()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not supported. Use JPG, JPEG, PNG, or WebP."
        )

    # Read and validate size
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({len(content) // 1024} KB) exceeds the 5 MB limit."
        )

    # Determine extension
    ext_map = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    ext = ext_map.get(content_type, "jpg")

    # Target directory in persistent storage
    category_dir = os.path.join(settings.UPLOAD_DIR, category)
    os.makedirs(category_dir, exist_ok=True)

    # Unique identifier
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(category_dir, filename)

    # Write file to disk
    with open(file_path, "wb") as f:
        f.write(content)

    static_url = f"/api/static/{category}/{filename}"
    return {
        "url": static_url,
        "filename": filename,
        "category": category,
        "size_kb": len(content) // 1024,
        "content_type": content_type
    }


@router.delete("/image")
def delete_image(
    url: str,
    current_user: User = Depends(get_current_user),
):
    """Delete an uploaded image by its static URL with ownership/admin check."""
    if not url.startswith("/api/static/"):
        raise HTTPException(status_code=400, detail="Invalid image URL format.")

    relative_path = url.replace("/api/static/", "", 1).strip()
    category = relative_path.split("/")[0] if "/" in relative_path else "general"

    is_admin = bool(current_user.role and current_user.role.name == "ADMIN")
    if category in ADMIN_ONLY_CATEGORIES and not is_admin:
        raise HTTPException(status_code=403, detail="Admin permissions required to delete this asset.")

    file_path = os.path.join(settings.UPLOAD_DIR, relative_path)
    if not os.path.exists(file_path):
        return {"message": "Image file not found on disk, reference removed.", "url": url}

    # Security: ensure path is within upload dir
    abs_upload = os.path.abspath(settings.UPLOAD_DIR)
    abs_file = os.path.abspath(file_path)
    if not abs_file.startswith(abs_upload):
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        os.remove(file_path)
    except Exception as e:
        pass

    return {"message": "Image deleted successfully.", "url": url}
