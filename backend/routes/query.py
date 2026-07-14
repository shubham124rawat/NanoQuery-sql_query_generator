"""
Query generation and execution routes using AI service.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging
import time
import re
import pymysql

from services.db_service import get_db_service
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryGenerationRequest(BaseModel):
    """Request model for query generation."""
    prompt: str = Field(..., min_length=1, description="Natural language query prompt")


class QueryRefinementRequest(BaseModel):
    """Request model for query refinement."""
    previous_sql: str = Field(..., min_length=1, description="Previous SQL query to refine")
    refinement_prompt: str = Field(..., min_length=1, description="Refinement instruction")
    db_schema: Optional[Dict[str, Any]] = Field(default=None, description="Database schema (optional, will be fetched if not provided)")


class QueryExecutionRequest(BaseModel):
    """Request model for query execution."""
    sql: str = Field(..., min_length=1, description="SQL query to execute")
    confirmed: bool = Field(default=False, description="User confirmation for destructive queries")


class SchemaResponse(BaseModel):
    """Response model for schema endpoint."""
    success: bool
    database: str
    tables: list
    message: str = ""


@router.get("/schema", response_model=SchemaResponse)
async def get_database_schema():
    """
    Get complete database schema structure.
    
    Returns:
        SchemaResponse: Database schema with tables, columns, types, and keys
    """
    try:
        db_service = get_db_service()
        schema = db_service.get_full_database_schema()
        
        if 'error' in schema:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve schema: {schema['error']}"
            )
        
        return SchemaResponse(
            success=True,
            database=schema['database'],
            tables=schema['tables'],
            message=f"Retrieved {len(schema['tables'])} tables"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving schema: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Schema retrieval failed: {str(e)}"
        )


@router.post("/generate")
async def generate_sql_query(request: QueryGenerationRequest):
    """
    Generate SQL queries from natural language prompt using AI.
    
    Args:
        request: QueryGenerationRequest containing the user's prompt
    
    Returns:
        Generated SQL queries with explanations, risk analysis, and impact estimation
    """
    try:
        # Get database schema
        db_service = get_db_service()
        schema = db_service.get_full_database_schema()
        
        if 'error' in schema:
            raise HTTPException(
                status_code=500,
                detail=f"Database schema unavailable: {schema['error']}"
            )
        
        if not schema['tables']:
            raise HTTPException(
                status_code=400,
                detail="No tables found in database. Please ensure the database is properly set up."
            )
        
        # Generate SQL using AI
        ai_service = get_ai_service()
        result = ai_service.generate_sql_from_prompt(
            user_prompt=request.prompt,
            schema=schema
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Failed to generate SQL')
            )
        
        # Structure response
        queries = result['queries']
        
        if not queries:
            raise HTTPException(
                status_code=500,
                detail="No valid queries were generated. Please try rephrasing your request."
            )
        
        # Designate first query as primary
        response = {
            "success": True,
            "prompt": request.prompt,
            "primary_query": queries[0] if queries else None,
            "alternatives": queries[1:] if len(queries) > 1 else [],
            "total_alternatives": len(queries)
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating query: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Query generation failed: {str(e)}"
        )


@router.post("/refine")
async def refine_sql_query(request: QueryRefinementRequest):
    """
    Refine an existing SQL query based on conversational feedback.
    
    This endpoint allows iterative query improvements by:
    - Taking the previous SQL statement
    - Applying user's refinement instructions
    - Maintaining database schema awareness
    - Returning structured alternatives
    
    Args:
        request: QueryRefinementRequest with previous SQL and refinement prompt
    
    Returns:
        Refined SQL queries with same structure as generate endpoint
    """
    try:
        # Get database schema if not provided
        if request.db_schema is None:
            db_service = get_db_service()
            schema = db_service.get_full_database_schema()
            
            if 'error' in schema:
                raise HTTPException(
                    status_code=500,
                    detail=f"Database schema unavailable: {schema['error']}"
                )
        else:
            schema = request.db_schema
        
        # Build refinement prompt
        refinement_instruction = f"""Given the following SQL query:

```sql
{request.previous_sql}
```

User's refinement request: "{request.refinement_prompt}"

Please modify the query according to the user's request. Generate UP TO 2 different valid refined SQL query alternatives."""
        
        # Use AI service to refine
        ai_service = get_ai_service()
        result = ai_service.generate_sql_from_prompt(
            user_prompt=refinement_instruction,
            schema=schema
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Failed to refine SQL query')
            )
        
        # Structure response
        queries = result['queries']
        
        if not queries:
            raise HTTPException(
                status_code=500,
                detail="No valid refined queries were generated. Please try rephrasing your refinement."
            )
        
        # Designate first query as primary
        response = {
            "success": True,
            "original_sql": request.previous_sql,
            "refinement_prompt": request.refinement_prompt,
            "primary_query": queries[0] if queries else None,
            "alternatives": queries[1:] if len(queries) > 1 else [],
            "total_alternatives": len(queries)
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refining query: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Query refinement failed: {str(e)}"
        )



@router.post("/execute")
async def execute_sql_query(request: QueryExecutionRequest):
    """
    Execute a SQL query and return results.
    
    This endpoint provides SQL execution with:
    - Runtime exception handling
    - Clean result formatting
    - Execution time tracking
    - Support for all DML (INSERT, UPDATE, DELETE) and DDL (CREATE, ALTER, DROP, TRUNCATE) commands
    
    Args:
        request: QueryExecutionRequest containing SQL query
    
    Returns:
        Execution results with rows, columns, and metadata
    """
    try:
        sql = request.sql.strip()
        
        # Validate query is not empty
        if not sql:
            raise HTTPException(
                status_code=400,
                detail="SQL query cannot be empty"
            )
        
        # Extract query type
        query_type_match = re.match(r'^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|SHOW|DESCRIBE|DESC)',
                                    sql, re.IGNORECASE)
        query_type = query_type_match.group(1).upper() if query_type_match else "UNKNOWN"
        
        # 🧠 MEMORY AUTO-LIMITING: Append LIMIT for SELECT queries without one
        if query_type == 'SELECT':
            # Check if LIMIT clause exists
            has_limit = re.search(r'\bLIMIT\s+\d+', sql, re.IGNORECASE) is not None
            
            if not has_limit:
                # Check if it ends with semicolon
                if sql.rstrip().endswith(';'):
                    sql = sql.rstrip()[:-1] + ' LIMIT 100;'
                else:
                    sql = sql + ' LIMIT 100'
                
                logger.info(f"Auto-appended LIMIT 100 to SELECT query for memory safety")
        
        # Execute the query
        db_service = get_db_service()
        start_time = time.time()
        
        try:
            # Determine if we should fetch results
            fetch_results = query_type in ['SELECT', 'SHOW', 'DESCRIBE', 'DESC']
            
            with db_service.get_cursor() as cursor:
                cursor.execute(sql)
                
                if fetch_results:
                    # SELECT/SHOW/DESCRIBE query - fetch results
                    rows = cursor.fetchall()
                    
                    # DictCursor returns list of dicts - keep it that way for frontend
                    if rows and len(rows) > 0:
                        if isinstance(rows[0], dict):
                            # DictCursor - extract columns, keep rows as dicts
                            columns = list(rows[0].keys())
                            logger.info(f"Fetched {len(rows)} rows with columns: {columns}")
                        elif isinstance(rows[0], tuple):
                            # Tuple cursor - convert to dict format
                            columns = [desc[0] for desc in cursor.description] if cursor.description else []
                            rows = [{col: val for col, val in zip(columns, row)} for row in rows]
                        else:
                            # Unknown format
                            columns = [desc[0] for desc in cursor.description] if cursor.description else []
                    else:
                        # Empty result set
                        columns = [desc[0] for desc in cursor.description] if cursor.description else []
                        rows = []
                    
                    row_count = len(rows)
                else:
                    # Modification query (DML/DDL) - get affected count
                    rows = []
                    columns = []
                    row_count = cursor.rowcount if cursor.rowcount > 0 else 0
            
            execution_time_ms = round((time.time() - start_time) * 1000, 2)
            
            logger.info(f"Executed {query_type} query: {row_count} rows affected/returned in {execution_time_ms}ms")
            
            return {
                "success": True,
                "query_type": query_type,
                "rows": rows,
                "columns": columns,
                "row_count": row_count,
                "execution_time_ms": execution_time_ms,
                "message": f"Query executed successfully: {row_count} row(s) {'returned' if fetch_results else 'affected'}"
            }
            
        except pymysql.err.ProgrammingError as e:
            # SQL syntax errors
            error_code, error_msg = e.args
            logger.error(f"SQL syntax error: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": f"SQL Syntax Error: {error_msg}",
                    "error_code": error_code,
                    "query_type": query_type
                }
            )
            
        except pymysql.err.OperationalError as e:
            # Database operational errors (table doesn't exist, connection issues, etc.)
            error_code, error_msg = e.args
            logger.error(f"SQL operational error: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": f"Database Error: {error_msg}",
                    "error_code": error_code,
                    "query_type": query_type
                }
            )
            
        except pymysql.err.IntegrityError as e:
            # Foreign key, unique constraints, etc.
            error_code, error_msg = e.args
            logger.error(f"SQL integrity error: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": f"Constraint Violation: {error_msg}",
                    "error_code": error_code,
                    "query_type": query_type
                }
            )
            
        except pymysql.Error as e:
            # Generic MySQL error
            logger.error(f"MySQL error during execution: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": f"MySQL Error: {str(e)}",
                    "query_type": query_type
                }
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error during query execution: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
        )
