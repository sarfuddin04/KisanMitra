import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import jwt, JWTError

from app.core.config import settings

# Hybrid secure password hasher
def hash_password(password: str) -> str:
    """Hashes a password with salt using SHA-256 and HMAC."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((salt + password + settings.SECRET_KEY).encode("utf-8")).hexdigest()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored salt$hash."""
    try:
        if "$" not in hashed_password:
            # Fallback for plain bcrypt if used elsewhere
            return False
        salt, expected_hash = hashed_password.split("$", 1)
        actual_hash = hashlib.sha256((salt + plain_password + settings.SECRET_KEY).encode("utf-8")).hexdigest()
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False

def create_access_token(subject: Any, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
