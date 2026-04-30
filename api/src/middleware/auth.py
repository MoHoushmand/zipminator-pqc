from fastapi import Depends, HTTPException, status, Security, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.db.database import get_db, SessionLocal
from src.db.models import User, APIKey
from src.services.auth import decode_access_token
from typing import Optional
from datetime import datetime, timedelta
from threading import Lock
import hashlib

# F1 fix scaffolding: in-process debounce for last_used_at flushes.
# Each API key id gets its last-flushed time tracked here so we only
# write to the DB at most once per FLUSH_INTERVAL_SECONDS per key.
_FLUSH_INTERVAL_SECONDS = 60
_last_flushed: dict[int, datetime] = {}
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
    """TODO(mom5): pick a flush strategy and implement it here.

    Five candidates, all valid:

    (A) DEBOUNCE: flush at most once per _FLUSH_INTERVAL_SECONDS per key.
        In-memory only; loses state on uvicorn restart but that's fine for
        analytics. Multi-worker: each worker flushes independently, so
        worst-case write rate is workers * (1 / interval). Likely fine.

    (B) DROP: return False unconditionally and remove last_used_at calls
        elsewhere. Only correct if no consumer reads the column. Check
        models.py + dashboards before choosing this.

    (C) SAMPLE: flush 1 in N requests (e.g. random.random() < 0.01).
        Probabilistic; preserves rough "last seen" semantics with bounded
        write rate but breaks exact-time queries.

    (D) WRITE-BEHIND QUEUE: push key id onto a threading.Queue, drain
        every N seconds in a background task that does one bulk UPDATE.
        Highest throughput, most code, needs a shutdown hook.

    (E) REDIS SETEX: write to Redis with TTL = the interval. Requires
        Redis to be reachable from this process. Trades DB writes for
        Redis writes (cheaper but adds a dep).

    Pick one. The body is 5-10 lines for any of them. Default = (A) debounce.
    """
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=_FLUSH_INTERVAL_SECONDS)
    with _flush_lock:
        last = _last_flushed.get(api_key_id)
        if last is not None and last > cutoff:
            return False
        _last_flushed[api_key_id] = now
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
