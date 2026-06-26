"""
Pydantic models for request/response validation.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TableSchema(BaseModel):
    """Database table schema."""
    name: str
    columns: List[str]


class DatabaseSchema(BaseModel):
    """Complete database schema."""
    tables: List[TableSchema]


class QueryGenerationRequest(BaseModel):
    """Request model for query generation."""
    user_input: str = Field(..., min_length=1, description="Natural language query input")
    schema: DatabaseSchema
    db_type: str = Field(default="MySQL", description="Database type")


class QueryGenerationResponse(BaseModel):
    """Response model for generated queries."""
    primary_query: str
    alternatives: List[str]
    explanation: str
    tables_used: List[str]
    columns_used: List[str]
    query_type: str
    estimated_rows: str


class QueryValidationRequest(BaseModel):
    """Request model for query validation."""
    query: str = Field(..., min_length=1)


class QueryValidationResponse(BaseModel):
    """Response model for query validation."""
    is_valid: bool
    warnings: List[str]
    suggestions: List[str]
    risk_level: str


class QueryExecutionRequest(BaseModel):
    """Request model for query execution."""
    query: str = Field(..., min_length=1)
    confirmed: bool = Field(default=False)


class QueryExecutionResponse(BaseModel):
    """Response model for query execution."""
    success: bool
    rows: List[Dict[str, Any]]
    row_count: int
    columns: List[str]
    execution_time_ms: Optional[float] = None
    message: str


class HistoryRecord(BaseModel):
    """Query history record."""
    id: Optional[int] = None
    user_input: str
    generated_query: str
    query_type: str
    tables_used: str
    timestamp: Optional[str] = None
    rows_affected: Optional[int] = None
