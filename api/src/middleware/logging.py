import logging
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        log_enabled = logger.isEnabledFor(logging.INFO)

        if log_enabled:
            logger.info("Request: %s %s", request.method, request.url.path)

        response = await call_next(request)
        duration = time.time() - start_time

        if log_enabled:
            logger.info(
                "Response: %s %s Status: %d Duration: %.3fs",
                request.method, request.url.path,
                response.status_code, duration,
            )

        response.headers["X-Process-Time"] = f"{duration:.6f}"

        return response
