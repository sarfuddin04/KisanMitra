"""
Image upload endpoint for admin use.
Saves files to UPLOAD_DIR and returns a static URL.
Supported categories: mandi, crop, fertilizer, disease, banner
"""
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.deps import require_admin

router = APIRouter(prefix="/upload", tags=["Image Upload"])

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_CATEGORIES = {"mandi", "crop", "fertilizer", "disease", "banner", "general", "products"}


@router.post("/image", dependencies=[Depends(require_admin)])
async def upload_image(
    file: UploadFile = File(...),
    category: str = Form(default="general")
):
    """Upload an image file. Returns the static URL to store in the database."""
    if category not in ALLOWED_CATEGORIES:
        category = "general"

    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. Use JPEG, PNG, or WebP."
        )

    # Read file content
    content = await file.read()

    # Validate size
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds 5 MB limit. Uploaded: {len(content) // 1024} KB."
        )

    # Determine extension
    ext_map = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
    }
    ext = ext_map.get(file.content_type, "jpg")

    # Create directory
    category_dir = os.path.join(settings.UPLOAD_DIR, category)
    os.makedirs(category_dir, exist_ok=True)

    # Unique filename
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(category_dir, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Return the URL that maps to the StaticFiles mount
    static_url = f"/api/static/{category}/{filename}"
    return {"url": static_url, "filename": filename, "category": category, "size_kb": len(content) // 1024}


@router.delete("/image", dependencies=[Depends(require_admin)])
def delete_image(url: str):
    """Delete an uploaded image by its static URL."""
    # url format: /api/static/<category>/<filename>
    if not url.startswith("/api/static/"):
        raise HTTPException(status_code=400, detail="Invalid image URL format.")

    relative_path = url.replace("/api/static/", "", 1)
    file_path = os.path.join(settings.UPLOAD_DIR, relative_path)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file not found.")

    # Security: ensure path is within upload dir
    abs_upload = os.path.abspath(settings.UPLOAD_DIR)
    abs_file = os.path.abspath(file_path)
    if not abs_file.startswith(abs_upload):
        raise HTTPException(status_code=403, detail="Access denied.")

    os.remove(file_path)
    return {"message": "Image deleted successfully.", "url": url}
