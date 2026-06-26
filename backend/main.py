"""
NanoQuery - AI-Powered SQL Query Generator
Main FastAPI application entry point
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
env_loaded = load_dotenv()

# 🔍 ULTIMATE DEBUG PATH CHECK
# print("\n" + "="*60)
# print(f"🔍 DEBUG: Is the .env file found and loaded? {env_loaded}")
# print(f"🔍 DEBUG: Exact path Python is looking at: {os.path.abspath('.env')}")
# print(f"🔍 DEBUG: What is the API Key value? {os.getenv('GEMINI_API_KEY')}")
# print("="*60 + "\n")

from services.db_service import get_db_service


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NanoQuery API",
    description="AI-Powered Natural Language to SQL Query Generator",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup."""
    logger.info("NanoQuery API starting up...")
    
    # Test database connection
    db_service = get_db_service()
    success, message = db_service.test_connection()
    if success:
        logger.info(f"Database connection successful: {message}")
    else:
        logger.warning(f"Database connection failed: {message}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("NanoQuery API shutting down...")
    db_service = get_db_service()
    db_service.close()


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": "NanoQuery API",
        "version": "1.0.0",
        "description": "AI-Powered SQL Query Generator",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Verifies API status and database connectivity.
    """
    db_service = get_db_service()
    db_connected, db_message = db_service.test_connection()
    
    # Check if Gemini API key is configured
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    gemini_configured = bool(gemini_api_key and gemini_api_key != 'your_gemini_api_key_here')
    
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": {
            "connected": db_connected,
            "message": db_message,
            "host": os.getenv('DB_HOST', 'localhost'),
            "database": os.getenv('DB_NAME', 'sql_generator_db')
        },
        "gemini_api": {
            "configured": gemini_configured
        },
        "api_version": "1.0.0"
    }


# Import and register route modules
from routes import query, history, schema
app.include_router(query.router, prefix="/api/query", tags=["query"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(schema.router, prefix="/api/schema", tags=["schema"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
