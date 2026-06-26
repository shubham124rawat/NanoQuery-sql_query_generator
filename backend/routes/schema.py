"""
Schema management and database connection routes.
Handles dynamic database switching and schema operations.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging
import pymysql
import os

from services.db_service import DatabaseService

logger = logging.getLogger(__name__)

router = APIRouter()


class DatabaseConnectionRequest(BaseModel):
    """Request model for custom database connection."""
    host: str = Field(..., min_length=1, description="Database host address")
    port: int = Field(default=3306, ge=1, le=65535, description="Database port")
    user: str = Field(..., min_length=1, description="Database username")
    password: str = Field(default="", description="Database password")
    database: str = Field(..., min_length=1, description="Database name")


class ConnectionResponse(BaseModel):
    """Response model for connection operations."""
    success: bool
    message: str
    schema: Optional[dict] = None
    error_code: Optional[int] = None
    error_type: Optional[str] = None


@router.post("/connect", response_model=ConnectionResponse)
async def connect_custom_database(request: DatabaseConnectionRequest):
    """
    Connect to a custom MySQL database instance.
    
    Tests the connection, updates runtime configuration if successful,
    and returns the extracted schema.
    
    Args:
        request: Database connection credentials
    
    Returns:
        ConnectionResponse with success status and schema data
    """
    try:
        # Attempt test connection with provided credentials
        logger.info(f"Attempting connection to {request.host}:{request.port}/{request.database}")
        
        test_connection = None
        try:
            test_connection = pymysql.connect(
                host=request.host,
                port=request.port,
                user=request.user,
                password=request.password,
                database=request.database,
                connect_timeout=5,
                cursorclass=pymysql.cursors.DictCursor
            )
            
            # Test with a simple query
            with test_connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            logger.info(f"✅ Connection successful to {request.database}")
            
        except pymysql.err.OperationalError as e:
            error_code, error_msg = e.args
            logger.error(f"Connection failed (OperationalError): {error_msg}")
            
            # Map common MySQL error codes to user-friendly messages
            error_messages = {
                1045: "Access denied. Please check your username and password.",
                1049: f"Unknown database '{request.database}'. The database does not exist.",
                2003: f"Can't connect to MySQL server on '{request.host}'. Please check the host and port.",
                2005: f"Unknown MySQL server host '{request.host}'.",
                2013: "Lost connection to MySQL server. The server may be down.",
            }
            
            user_message = error_messages.get(error_code, f"Database error: {error_msg}")
            
            return ConnectionResponse(
                success=False,
                message=user_message,
                error_code=error_code,
                error_type="OperationalError"
            )
            
        except pymysql.err.ProgrammingError as e:
            error_code, error_msg = e.args
            logger.error(f"Connection failed (ProgrammingError): {error_msg}")
            return ConnectionResponse(
                success=False,
                message=f"SQL syntax or permission error: {error_msg}",
                error_code=error_code,
                error_type="ProgrammingError"
            )
            
        except pymysql.Error as e:
            logger.error(f"Connection failed (Generic MySQL Error): {e}")
            return ConnectionResponse(
                success=False,
                message=f"MySQL connection error: {str(e)}",
                error_type="MySQLError"
            )
            
        finally:
            if test_connection and test_connection.open:
                test_connection.close()
        
        # Connection successful - create a new DatabaseService instance
        # with the custom credentials
        custom_db_service = DatabaseService()
        custom_db_service.host = request.host
        custom_db_service.port = request.port
        custom_db_service.database = request.database
        custom_db_service.user = request.user
        custom_db_service.password = request.password
        
        # Force reconnection with new credentials
        custom_db_service._connection = None
        
        # Extract schema from the connected database
        schema = custom_db_service.get_full_database_schema()
        
        if 'error' in schema:
            logger.error(f"Schema extraction failed: {schema['error']}")
            return ConnectionResponse(
                success=False,
                message=f"Connected successfully but failed to extract schema: {schema['error']}",
                error_type="SchemaExtractionError"
            )
        
        # Update the global singleton instance with new connection
        from services.db_service import _db_service
        import services.db_service as db_module
        db_module._db_service = custom_db_service
        
        logger.info(f"✅ Successfully connected and extracted {len(schema['tables'])} tables")
        
        return ConnectionResponse(
            success=True,
            message=f"Successfully connected to {request.database} ({len(schema['tables'])} tables found)",
            schema=schema
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during connection: {e}")
        return ConnectionResponse(
            success=False,
            message=f"Unexpected error: {str(e)}",
            error_type="UnexpectedError"
        )


@router.post("/use-sample", response_model=ConnectionResponse)
async def use_sample_database():
    """
    Reset connection to the default sample database.
    
    Returns runtime configuration to the original environment
    variables pointing to the local sample workspace.
    
    Returns:
        ConnectionResponse with success status and schema data
    """
    try:
        logger.info("Resetting to sample database configuration")
        
        # Read default configuration from environment
        default_host = os.getenv('DB_HOST', 'localhost')
        default_port = int(os.getenv('DB_PORT', 3306))
        default_database = os.getenv('DB_NAME', 'test')
        default_user = os.getenv('DB_USER', 'root')
        default_password = os.getenv('DB_PASSWORD', '')
        
        # Test connection with default credentials
        test_connection = None
        try:
            test_connection = pymysql.connect(
                host=default_host,
                port=default_port,
                user=default_user,
                password=default_password,
                database=default_database,
                connect_timeout=5
            )
            logger.info(f"✅ Sample database connection successful: {default_database}")
        except pymysql.Error as e:
            logger.error(f"Failed to connect to sample database: {e}")
            return ConnectionResponse(
                success=False,
                message=f"Sample database not available: {str(e)}. Please check your .env configuration.",
                error_type="SampleDatabaseError"
            )
        finally:
            if test_connection and test_connection.open:
                test_connection.close()
        
        # Create new DatabaseService instance with default config
        sample_db_service = DatabaseService()
        sample_db_service.host = default_host
        sample_db_service.port = default_port
        sample_db_service.database = default_database
        sample_db_service.user = default_user
        sample_db_service.password = default_password
        sample_db_service._connection = None
        
        # Extract schema
        schema = sample_db_service.get_full_database_schema()
        
        if 'error' in schema:
            logger.error(f"Schema extraction failed: {schema['error']}")
            return ConnectionResponse(
                success=False,
                message=f"Connected but failed to extract schema: {schema['error']}",
                error_type="SchemaExtractionError"
            )
        
        # Update global singleton
        import services.db_service as db_module
        db_module._db_service = sample_db_service
        
        logger.info(f"✅ Switched to sample database with {len(schema['tables'])} tables")
        
        return ConnectionResponse(
            success=True,
            message=f"Sample database activated: {default_database} ({len(schema['tables'])} tables loaded)",
            schema=schema
        )
        
    except Exception as e:
        logger.error(f"Unexpected error switching to sample database: {e}")
        return ConnectionResponse(
            success=False,
            message=f"Unexpected error: {str(e)}",
            error_type="UnexpectedError"
        )
