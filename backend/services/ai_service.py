"""
AI Service for Natural Language to SQL conversion using modern Google Gemini SDK.
"""
import os
import json
import re
import logging
from typing import Dict, Any, List
# 🟢 Switched to modern GenAI SDK
from google import genai
from google.genai import types

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AIService:
    """Google Gemini AI service for NL to SQL conversion."""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key or self.api_key == 'your_gemini_api_key_here':
            logger.warning("Gemini API key not configured")
            self.client = None
        else:
            try:
                # 🟢 Initialize the modern client architecture with your API key
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini AI service initialized successfully using google-genai SDK")
            except Exception as e:
                logger.error(f"Failed to initialize modern Gemini Client: {e}")
                self.client = None
    
    def _build_system_prompt(self, schema: Dict[str, Any]) -> str:
        """
        Build a comprehensive system prompt with database schema context.
        """
        schema_text = "DATABASE SCHEMA:\n\n"
        
        for table in schema.get('tables', []):
            schema_text += f"Table: {table['name']}\n"
            schema_text += f"  Row Count: ~{table['row_count']} rows\n"
            schema_text += "  Columns:\n"
            
            for col in table['columns']:
                pk_indicator = " [PRIMARY KEY]" if col['is_primary_key'] else ""
                nullable = " [NULLABLE]" if col['nullable'] else " [NOT NULL]"
                auto_inc = " [AUTO_INCREMENT]" if col['is_auto_increment'] else ""
                
                schema_text += f"    - {col['name']}: {col['type']}{pk_indicator}{nullable}{auto_inc}\n"
                
                if 'foreign_key' in col:
                    fk = col['foreign_key']
                    schema_text += f"      → References {fk['references_table']}.{fk['references_column']}\n"
            
            schema_text += "\n"
        
        return schema_text
    
    def _build_instruction_prompt(self, user_prompt: str, schema_text: str) -> str:
        """Build the complete instruction prompt for Gemini."""
        
        instruction = f"""You are an expert MySQL database assistant. Given the database schema below, convert the user's natural language request into valid MySQL SQL queries.

{schema_text}

IMPORTANT INSTRUCTIONS:
1. Generate UP TO 2 different valid SQL query alternatives for the user's request
2. Return ONLY a valid JSON array, no markdown, no code blocks, no extra text
3. Each query alternative must be a complete, executable MySQL statement
4. Analyze the risk level and impact of each query

USER REQUEST: "{user_prompt}"

Return a JSON array with this EXACT structure (no markdown formatting):
[
  {{
    "sql": "complete SQL query here",
    "explanation": "clear explanation of what this query does",
    "affected_tables": ["table1", "table2"],
    "risk_level": "LOW|MEDIUM|HIGH|DANGEROUS",
    "impact_estimation": "estimate of rows affected or returned"
  }}
]

RISK LEVEL GUIDELINES:
- LOW: Safe SELECT queries with WHERE clauses and LIMIT
- MEDIUM: SELECT without LIMIT, or complex JOINs
- HIGH: UPDATE/DELETE with WHERE clause
- DANGEROUS: UPDATE/DELETE without WHERE clause, or operations affecting many rows

Return ONLY the JSON array, nothing else."""

        return instruction
    
    def _clean_sql_response(self, sql: str) -> str:
        """
        Clean SQL response by removing markdown code blocks and extra whitespace.
        """
        # Remove markdown code blocks
        sql = re.sub(r'^```sql\s*', '', sql, flags=re.MULTILINE)
        sql = re.sub(r'^```\s*', '', sql, flags=re.MULTILINE)
        sql = re.sub(r'```$', '', sql)
        
        # Remove extra whitespace
        sql = sql.strip()
        
        return sql
    
    def _parse_and_validate_response(self, response_text: str) -> List[Dict[str, Any]]:
        """
        Parse and validate the AI response, ensuring it's valid JSON.
        """
        try:
            # Clean the response
            cleaned = response_text.strip()
            
            # Remove markdown code blocks if present
            cleaned = re.sub(r'^```json\s*', '', cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r'^```\s*', '', cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r'```$', '', cleaned)
            cleaned = cleaned.strip()
            
            # Parse JSON
            data = json.loads(cleaned)
            
            # Ensure it's a list
            if not isinstance(data, list):
                data = [data]
            
            # Validate and clean each query
            validated_queries = []
            for query in data[:2]:  # Max 2 alternatives
                if not isinstance(query, dict):
                    continue
                
                # Clean SQL
                if 'sql' in query:
                    query['sql'] = self._clean_sql_response(query['sql'])
                
                # Validate required fields
                if all(key in query for key in ['sql', 'explanation', 'affected_tables', 'risk_level', 'impact_estimation']):
                    # Ensure affected_tables is a list
                    if isinstance(query['affected_tables'], str):
                        query['affected_tables'] = [query['affected_tables']]
                    
                    # Normalize risk level
                    query['risk_level'] = query['risk_level'].upper()
                    if query['risk_level'] not in ['LOW', 'MEDIUM', 'HIGH', 'DANGEROUS']:
                        query['risk_level'] = 'MEDIUM'
                    
                    validated_queries.append(query)
            
            return validated_queries if validated_queries else []
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            return []
        except Exception as e:
            logger.error(f"Error validating response: {e}")
            return []
    
    def generate_sql_from_prompt(
        self, 
        user_prompt: str, 
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate SQL queries from natural language using Gemini AI.
        """
        if not self.client:
            return {
                "success": False,
                "error": "AI service not initialized. Please configure GEMINI_API_KEY.",
                "queries": []
            }
        
        if not user_prompt or not user_prompt.strip():
            return {
                "success": False,
                "error": "User prompt cannot be empty",
                "queries": []
            }
        
        try:
            # Build prompts
            schema_text = self._build_system_prompt(schema)
            full_prompt = self._build_instruction_prompt(user_prompt, schema_text)
            
            logger.info(f"Generating SQL for prompt: {user_prompt[:100]}...")
            
            # 🟢 Execute generation using the modern stateless client structure
            # Utilizing 'gemini-2.5-flash', the optimized stable model path.
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1  # Forces predictable, precise structured SQL outputs
                )
            )
            response_text = response.text
            
            logger.info(f"Received response from Gemini (length: {len(response_text)})")
            
            # Parse and validate
            queries = self._parse_and_validate_response(response_text)
            
            if not queries:
                return {
                    "success": False,
                    "error": "Failed to generate valid SQL queries. Please try rephrasing your request.",
                    "queries": [],
                    "raw_response": response_text[:500]
                }
            
            return {
                "success": True,
                "queries": queries,
                "prompt": user_prompt,
                "alternatives_count": len(queries)
            }
            
        except Exception as e:
            logger.error(f"Error generating SQL: {e}")
            return {
                "success": False,
                "error": f"AI generation failed: {str(e)}",
                "queries": []
            }


# Singleton instance
_ai_service: AIService = None


def get_ai_service() -> AIService:
    """Get or create the singleton AIService instance."""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
