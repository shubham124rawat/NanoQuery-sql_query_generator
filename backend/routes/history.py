"""
Query history routes for tracking executed queries.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
from datetime import datetime

from services.db_service import get_db_service
import pymysql

logger = logging.getLogger(__name__)

router = APIRouter()


class HistorySaveRequest(BaseModel):
    """Request model for saving query history."""
    user_input: str = Field(..., min_length=1, description="Natural language prompt")
    generated_query: str = Field(..., min_length=1, description="Generated SQL query")
    query_type: str = Field(default="SELECT", description="Type of SQL query")
    tables_used: str = Field(default="", description="Comma-separated list of tables")
    rows_affected: Optional[int] = Field(default=0, description="Number of rows affected")


class HistoryRecord(BaseModel):
    """History record response model."""
    id: int
    user_input: str
    generated_query: str
    query_type: str
    tables_used: str
    timestamp: str
    rows_affected: int


@router.post("/save")
async def save_query_history(request: HistorySaveRequest):
    """
    Save a query to history.
    
    Args:
        request: HistorySaveRequest containing query details
    
    Returns:
        Success response with saved record ID
    """
    try:
        db_service = get_db_service()
        
        # Insert into history table
        query = """
            INSERT INTO query_history 
            (user_input, generated_query, query_type, tables_used, rows_affected)
            VALUES (%s, %s, %s, %s, %s)
        """
        
        with db_service.get_cursor() as cursor:
            cursor.execute(
                query,
                (
                    request.user_input,
                    request.generated_query,
                    request.query_type,
                    request.tables_used,
                    request.rows_affected
                )
            )
            record_id = cursor.lastrowid
        
        logger.info(f"Saved query history record ID: {record_id}")
        
        return {
            "success": True,
            "id": record_id,
            "message": "Query saved to history"
        }
        
    except pymysql.Error as e:
        logger.error(f"Database error saving history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save history: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error saving history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save history: {str(e)}"
        )


@router.get("/", response_model=List[HistoryRecord])
async def get_query_history(limit: int = 20):
    """
    Retrieve query history records.
    
    Args:
        limit: Maximum number of records to return (default: 20)
    
    Returns:
        List of history records ordered by most recent first
    """
    try:
        db_service = get_db_service()
        
        query = """
            SELECT 
                id,
                user_input,
                generated_query,
                query_type,
                tables_used,
                DATE_FORMAT(timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') as timestamp,
                rows_affected
            FROM query_history
            ORDER BY timestamp DESC
            LIMIT %s
        """
        
        with db_service.get_cursor() as cursor:
            cursor.execute(query, (limit,))
            records = cursor.fetchall()
        
        logger.info(f"Retrieved {len(records)} history records")
        
        return [
            HistoryRecord(
                id=record['id'],
                user_input=record['user_input'],
                generated_query=record['generated_query'],
                query_type=record['query_type'],
                tables_used=record['tables_used'],
                timestamp=record['timestamp'],
                rows_affected=record['rows_affected']
            )
            for record in records
        ]
        
    except pymysql.Error as e:
        logger.error(f"Database error retrieving history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve history: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error retrieving history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve history: {str(e)}"
        )


@router.delete("/clear")
async def clear_query_history():
    """
    Clear all query history records.
    
    Returns:
        Success response with number of records deleted
    """
    try:
        db_service = get_db_service()
        
        with db_service.get_cursor() as cursor:
            cursor.execute("DELETE FROM query_history")
            deleted_count = cursor.rowcount
        
        logger.info(f"Cleared {deleted_count} history records")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Cleared {deleted_count} history records"
        }
        
    except pymysql.Error as e:
        logger.error(f"Database error clearing history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear history: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error clearing history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear history: {str(e)}"
        )


@router.delete("/{record_id}")
async def delete_history_record(record_id: int):
    """
    Delete a specific history record.
    
    Args:
        record_id: ID of the history record to delete
    
    Returns:
        Success response
    """
    try:
        db_service = get_db_service()
        
        with db_service.get_cursor() as cursor:
            cursor.execute("DELETE FROM query_history WHERE id = %s", (record_id,))
            
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"History record {record_id} not found"
                )
        
        logger.info(f"Deleted history record ID: {record_id}")
        
        return {
            "success": True,
            "message": f"Deleted history record {record_id}"
        }
        
    except HTTPException:
        raise
    except pymysql.Error as e:
        logger.error(f"Database error deleting history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete history: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error deleting history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete history: {str(e)}"
        )
