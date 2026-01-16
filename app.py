from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import chat_bot, chat_bot_files, user 
from config.mongodb import init_db
from utils.exception import CustomExceptionHandler
from utils.helper import create_super_admin
from utils.jwt import JwtMiddleware

# Initialize FastAPI with professional configuration
app = FastAPI(
    title="SkitSmith API",
    description="AI-powered creative chat platform with document support",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    swagger_ui_parameters={"displayRequestDuration": True}
)

# CORS Configuration - Allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes that don't require authentication
exempt_routes = [
    "/user/login",
    "/user/register",
    "/user/verify-email",
    "/user/reset-password",
    "/docs",
    "/api/docs",
    "/api/openapi.json",
    "/api/redoc",
    "/health"
]

# Add exception handling middleware
app.add_middleware(CustomExceptionHandler)

# Add JWT authentication middleware
app.add_middleware(JwtMiddleware, exempt_routes=exempt_routes)

# Initialize database and create default admin user
init_db()
create_super_admin()

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify API is running.
    Returns: OK status
    """
    return {
        "status": "healthy",
        "message": "SkitSmith API is running successfully"
    }

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "name": "SkitSmith API",
        "version": "1.0.0",
        "description": "AI-powered creative chat platform",
        "docs": "/api/docs",
        "health": "/health"
    }

# API Routes
app.include_router(
    chat_bot.router,
    prefix="/chat-bot",
    tags=["Chat Bot"]
)

app.include_router(
    user.router,
    prefix="/user",
    tags=["User"]
)

app.include_router(
    chat_bot_files.router,
    prefix="/files",
    tags=["Files"]
)

# Global error handler for 404
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint not found",
            "path": str(request.url),
            "docs": "/api/docs"
        }
    )



