"""
Database service layer with connection pooling for MySQL.
Provides robust connection management and query execution utilities.
"""
import os
from typing import Optional, List, Dict, Any, Tuple
import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseService:
    """MySQL database service with connection pooling."""
    
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = int(os.getenv('DB_PORT', 3306))
        self.database = os.getenv('DB_NAME', 'sql_generator_db')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self._connection: Optional[pymysql.connections.Connection] = None
    
    def _get_connection(self) -> pymysql.connections.Connection:
        """Get or create a database connection."""
        if self._connection is None or not self._connection.open:
            try:
                self._connection = pymysql.connect(
                    host=self.host,
                    port=self.port,
                    user=self.user,
                    password=self.password,
                    database=self.database,
                    cursorclass=DictCursor,
                    autocommit=False,
                    connect_timeout=5,
                    read_timeout=10,
                    write_timeout=10
                )
                logger.info(f"Connected to database: {self.database}")
            except pymysql.Error as e:
                logger.error(f"Database connection failed: {e}")
                raise
        return self._connection
    
    @contextmanager
    def get_cursor(self):
        """Context manager for database cursor with automatic commit/rollback."""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database operation failed: {e}")
            raise
        finally:
            cursor.close()
    
    def test_connection(self) -> Tuple[bool, str]:
        """
        Test database connectivity.
        
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            with self.get_cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                if result:
                    return True, f"Connected to {self.database}"
        except pymysql.Error as e:
            return False, f"Connection failed: {str(e)}"
        except Exception as e:
            return False, f"Unexpected error: {str(e)}"
        
        return False, "Unknown error"
    
    def execute_query(
        self, 
        query: str, 
        params: Optional[tuple] = None,
        fetch_results: bool = True
    ) -> Dict[str, Any]:
        """
        Execute a SQL query and return results.
        
        Args:
            query: SQL query string
            params: Optional query parameters for prepared statements
            fetch_results: Whether to fetch and return results (False for INSERT/UPDATE/DELETE)
        
        Returns:
            Dictionary containing:
                - success: bool
                - rows: list of dicts (if fetch_results=True)
                - row_count: int
                - columns: list of column names
                - message: str
        """
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params)
                
                if fetch_results:
                    rows = cursor.fetchall()
                    columns = [desc[0] for desc in cursor.description] if cursor.description else []
                    return {
                        "success": True,
                        "rows": rows,
                        "row_count": len(rows),
                        "columns": columns,
                        "message": "Query executed successfully"
                    }
                else:
                    return {
                        "success": True,
                        "rows": [],
                        "row_count": cursor.rowcount,
                        "columns": [],
                        "message": f"Query executed: {cursor.rowcount} row(s) affected"
                    }
        except pymysql.Error as e:
            logger.error(f"Query execution failed: {e}")
            return {
                "success": False,
                "rows": [],
                "row_count": 0,
                "columns": [],
                "message": f"Error: {str(e)}"
            }
    
    def get_tables(self) -> List[str]:
        """Get list of all tables in the database."""
        try:
            with self.get_cursor() as cursor:
                cursor.execute("SHOW TABLES")
                tables = [list(row.values())[0] for row in cursor.fetchall()]
                return tables
        except pymysql.Error as e:
            logger.error(f"Failed to fetch tables: {e}")
            return []
    
    def get_table_schema(self, table_name: str) -> List[Dict[str, str]]:
        """Get schema information for a specific table."""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(f"DESCRIBE {table_name}")
                return cursor.fetchall()
        except pymysql.Error as e:
            logger.error(f"Failed to fetch schema for {table_name}: {e}")
            return []
    
    def get_full_database_schema(self) -> Dict[str, Any]:
        """
        Extract complete database schema using INFORMATION_SCHEMA.
        Returns a structured JSON map of all tables, columns, types, and keys.
        """
        try:
            schema_structure = {
                "database": self.database,
                "tables": []
            }
            
            # Get all tables in the database
            with self.get_cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME, TABLE_TYPE, TABLE_COMMENT
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = %s
                    AND TABLE_TYPE = 'BASE TABLE'
                    ORDER BY TABLE_NAME
                """, (self.database,))
                tables = cursor.fetchall()
            
            # For each table, get column information
            for table in tables:
                table_name = table['TABLE_NAME']
                
                with self.get_cursor() as cursor:
                    # Get column details
                    cursor.execute("""
                        SELECT 
                            COLUMN_NAME,
                            COLUMN_TYPE,
                            DATA_TYPE,
                            IS_NULLABLE,
                            COLUMN_KEY,
                            COLUMN_DEFAULT,
                            EXTRA,
                            COLUMN_COMMENT
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = %s
                        AND TABLE_NAME = %s
                        ORDER BY ORDINAL_POSITION
                    """, (self.database, table_name))
                    columns = cursor.fetchall()
                
                # Get foreign key information
                with self.get_cursor() as cursor:
                    cursor.execute("""
                        SELECT 
                            COLUMN_NAME,
                            REFERENCED_TABLE_NAME,
                            REFERENCED_COLUMN_NAME
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = %s
                        AND TABLE_NAME = %s
                        AND REFERENCED_TABLE_NAME IS NOT NULL
                    """, (self.database, table_name))
                    foreign_keys = cursor.fetchall()
                
                # Build foreign key map
                fk_map = {
                    fk['COLUMN_NAME']: {
                        'references_table': fk['REFERENCED_TABLE_NAME'],
                        'references_column': fk['REFERENCED_COLUMN_NAME']
                    }
                    for fk in foreign_keys
                }
                
                # Structure column data
                columns_data = []
                for col in columns:
                    column_info = {
                        "name": col['COLUMN_NAME'],
                        "type": col['COLUMN_TYPE'],
                        "data_type": col['DATA_TYPE'],
                        "nullable": col['IS_NULLABLE'] == 'YES',
                        "is_primary_key": col['COLUMN_KEY'] == 'PRI',
                        "is_unique": col['COLUMN_KEY'] == 'UNI',
                        "is_auto_increment": 'auto_increment' in col['EXTRA'].lower(),
                        "default": col['COLUMN_DEFAULT'],
                        "comment": col['COLUMN_COMMENT']
                    }
                    
                    # Add foreign key info if exists
                    if col['COLUMN_NAME'] in fk_map:
                        column_info['foreign_key'] = fk_map[col['COLUMN_NAME']]
                    
                    columns_data.append(column_info)
                
                # Get row count estimate
                with self.get_cursor() as cursor:
                    cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
                    row_count = cursor.fetchone()['count']
                
                table_info = {
                    "name": table_name,
                    "type": table['TABLE_TYPE'],
                    "comment": table['TABLE_COMMENT'],
                    "row_count": row_count,
                    "columns": columns_data
                }
                
                schema_structure["tables"].append(table_info)
            
            logger.info(f"Successfully extracted schema for {len(schema_structure['tables'])} tables")
            return schema_structure
            
        except pymysql.Error as e:
            logger.error(f"Failed to extract database schema: {e}")
            return {
                "database": self.database,
                "tables": [],
                "error": str(e)
            }
    
    def close(self):
        """Close database connection."""
        if self._connection and self._connection.open:
            self._connection.close()
            logger.info("Database connection closed")


# Singleton instance
_db_service: Optional[DatabaseService] = None


def get_db_service() -> DatabaseService:
    """Get or create the singleton DatabaseService instance."""
    global _db_service
    if _db_service is None:
        _db_service = DatabaseService()
    return _db_service
