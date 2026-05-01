from fastapi import Depends, HTTPException, status, Security, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.db.database import get_db, SessionLocal
from src.db.models import User, APIKey
from src.services.auth import decode_access_token
from typing import Optional
from collections import OrderedDict
from datetime import datetime, timedelta
from threading import Lock
import hashlib

# Strategy (A) DEBOUNCE + LRU/TTL bound. Per-worker in-memory cache that
# debounces last_used_at writes to one per key per _FLUSH_INTERVAL_SECONDS.
# OrderedDict gives O(1) LRU semantics; _FLUSH_CACHE_MAX caps RSS so a
# long-running worker can't leak unbounded memory across distinct API keys.
_FLUSH_INTERVAL_SECONDS = 60
_FLUSH_CACHE_MAX = 10_000
_last_flushed: "OrderedDict[int, datetime]" = OrderedDict()
_flush_lock = Lock()


def _flush_last_used(api_key_id: int) -> None:
    """Background task body: write last_used_at for one key.

    Runs after the response has been sent. Uses a fresh DB session
    because the request-scoped session is already closed.
    """
    with SessionLocal() as session:
        session.query(APIKey).filter(APIKey.id == api_key_id).update(
            {APIKey.last_used_at: datetime.utcnow()},
            synchronize_session=False,
        )
        session.commit()


def _should_flush(api_key_id: int) -> bool:
    """Return True iff this request should write last_used_at for api_key_id.

    Strategy (A): DEBOUNCE with LRU+TTL bound. Decided 2026-05-01.
    Per-worker scope; multi-worker write rate = workers * (1 / interval).
    Bounded RSS: oldest-touched key evicted once cache exceeds _FLUSH_CACHE_MAX.
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=_FLUSH_INTERVAL_SECONDS)
    with _flush_lock:
        last = _last_flushed.get(api_key_id)
        if last is not None and last > cutoff:
            _last_flushed.move_to_end(api_key_id)
            return False
        _last_flushed[api_key_id] = now
        _last_flushed.move_to_end(api_key_id)
        if len(_last_flushed) > _FLUSH_CACHE_MAX:
            _last_flushed.popitem(last=False)
        return True

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current user from JWT token

    Args:
        credentials: HTTP Bearer token
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user ID from token
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user"""
    return current_user


async def verify_api_key(
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
) -> APIKey:
    api_key = credentials.credentials
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    db_key = db.query(APIKey).filter(APIKey.key_hash == key_hash).first()

    if db_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not db_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key is inactive",
        )

    if _should_flush(db_key.id):
        background_tasks.add_task(_flush_last_used, db_key.id)

    return db_key
