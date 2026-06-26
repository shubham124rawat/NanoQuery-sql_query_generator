import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AlertTriangle, X, CheckCircle, XCircle } from 'lucide-react';
import SchemaExplorer from '../components/SchemaExplorer';
import QueryInput from '../components/QueryInput';
import QueryCard from '../components/QueryCard';
import ImpactBadge from '../components/ImpactBadge';
import ResultsTable from '../components/ResultsTable';
import { generateQuery, refineQuery, executeQuery, saveHistory } from '../services/api';

export default function GeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  const [executionResults, setExecutionResults] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingExecution, setPendingExecution] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  const handleQuerySubmit = async (prompt) => {
    try {
      setIsLoading(true);
      setError(null);
      setQueryResult(null);
      setExecutionResults(null);
      setExecutionError(null);
      setCurrentPrompt(prompt);
      
      const response = await generateQuery(prompt);
      
      if (response.success) {
        // Transform API response to match UI expectations
        const transformedResult = {
          primary: {
            sql: response.primary_query.sql,
            type: extractQueryType(response.primary_query.sql),
            tables: response.primary_query.affected_tables,
            columns: [],
            explanation: response.primary_query.explanation,
            estimatedRows: response.primary_query.impact_estimation
          },
          alternatives: response.alternatives.map(alt => ({
            sql: alt.sql,
            type: extractQueryType(alt.sql),
            tables: alt.affected_tables,
            columns: [],
            explanation: alt.explanation,
            estimatedRows: alt.impact_estimation
          })),
          impact: {
            level: response.primary_query.risk_level.toLowerCase(),
            estimatedRows: parseEstimatedRows(response.primary_query.impact_estimation),
            warnings: generateWarnings(response.primary_query.risk_level, response.primary_query.sql)
          }
        };
        
        setQueryResult(transformedResult);
      } else {
        setError(response.error || 'Failed to generate query');
      }
    } catch (err) {
      console.error('Error generating query:', err);
      setError(err.response?.data?.detail || 'Failed to generate SQL query. Please check your backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteQuery = async (sql, confirmed = false) => {
    try {
      setExecutionError(null);
      
      const response = await executeQuery(sql, confirmed);
      
      if (response.success) {
        setExecutionResults({
          rows: response.rows,
          columns: response.columns,
          rowCount: response.row_count,
          executionTime: response.execution_time_ms,
          queryType: response.query_type
        });
        
        // Save to history
        try {
          await saveHistory({
            user_input: currentPrompt,
            generated_query: sql,
            query_type: response.query_type,
            tables_used: queryResult?.primary?.tables?.join(', ') || '',
            rows_affected: response.row_count
          });
        } catch (historyErr) {
          console.error('Failed to save to history:', historyErr);
        }
        
        setShowConfirmDialog(false);
        setPendingExecution(null);
      }
    } catch (err) {
      console.error('Execution error:', err);
      
      const errorDetail = err.response?.data?.detail;
      
      // Check if confirmation is required
      if (errorDetail?.requires_confirmation) {
        setPendingExecution(sql);
        setShowConfirmDialog(true);
        setExecutionError({
          message: errorDetail.error,
          warning: errorDetail.warning,
          requiresConfirmation: true
        });
      } else {
        // Regular error
        const errorMessage = typeof errorDetail === 'string' 
          ? errorDetail 
          : errorDetail?.error || 'Query execution failed';
        
        setExecutionError({
          message: errorMessage,
          requiresConfirmation: false
        });
      }
    }
  };

  const handleConfirmExecution = async () => {
    if (pendingExecution) {
      await handleExecuteQuery(pendingExecution, true);
    }
  };

  const handleCancelExecution = () => {
    setShowConfirmDialog(false);
    setPendingExecution(null);
    setExecutionError(null);
  };

  const handleQueryRefinement = async (previousSql, refinementPrompt) => {
    try {
      setIsLoading(true);
      setError(null);
      setExecutionError(null);
      
      const response = await refineQuery(previousSql, refinementPrompt);
      
      if (response.success) {
        // Transform refined response to match UI expectations
        const transformedResult = {
          primary: {
            sql: response.primary_query.sql,
            type: extractQueryType(response.primary_query.sql),
            tables: response.primary_query.affected_tables,
            columns: [],
            explanation: response.primary_query.explanation,
            estimatedRows: response.primary_query.impact_estimation
          },
          alternatives: response.alternatives.map(alt => ({
            sql: alt.sql,
            type: extractQueryType(alt.sql),
            tables: alt.affected_tables,
            columns: [],
            explanation: alt.explanation,
            estimatedRows: alt.impact_estimation
          })),
          impact: {
            level: response.primary_query.risk_level.toLowerCase(),
            estimatedRows: parseEstimatedRows(response.primary_query.impact_estimation),
            warnings: generateWarnings(response.primary_query.risk_level, response.primary_query.sql)
          }
        };
        
        setQueryResult(transformedResult);
      } else {
        setError(response.error || 'Failed to refine query');
      }
    } catch (err) {
      console.error('Error refining query:', err);
      setError(err.response?.data?.detail || 'Failed to refine SQL query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractQueryType = (sql) => {
    const match = sql.trim().match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i);
    return match ? match[1].toUpperCase() : 'SELECT';
  };

  const parseEstimatedRows = (estimation) => {
    const match = estimation.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const generateWarnings = (riskLevel, sql) => {
    const warnings = [];
    
    if (riskLevel === 'HIGH' || riskLevel === 'DANGEROUS') {
      if (!sql.toUpperCase().includes('WHERE')) {
        warnings.push('No WHERE clause detected - this may affect all rows');
      }
      if (sql.toUpperCase().includes('DELETE') || sql.toUpperCase().includes('UPDATE')) {
        warnings.push('Destructive operation - review carefully before execution');
      }
    }
    
    if (!sql.toUpperCase().includes('LIMIT') && sql.toUpperCase().startsWith('SELECT')) {
      warnings.push('Consider adding LIMIT to avoid fetching too many rows');
    }
    
    return warnings;
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="w-full px-4 py-6 space-y-6">
        {/* Section 1 - Schema Explorer (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <SchemaExplorer />
        </motion.div>

        {/* Section 2 - Query Generator (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full space-y-6"
        >
          {/* Query Input */}
          <QueryInput onSubmit={handleQuerySubmit} isLoading={isLoading} />

          {/* Error Display */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 border-red-500/50 bg-red-500/5"
            >
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Execution Error Display */}
          {executionError && !executionError.requiresConfirmation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 border-red-500/50 bg-red-500/5"
            >
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-400 mb-1">Execution Error</h4>
                  <p className="text-red-300 text-sm">{executionError.message}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Execution Success Display */}
          {executionResults && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 border-green-500/50 bg-green-500/5"
            >
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-400 mb-1">Query Executed Successfully</h4>
                  <p className="text-green-300 text-sm">
                    {executionResults.queryType}: {executionResults.rowCount} row(s) {executionResults.queryType === 'SELECT' ? 'returned' : 'affected'} 
                    {' '}in {executionResults.executionTime}ms
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-8 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
              />
              <p className="text-gray-400">Generating SQL query with AI...</p>
            </motion.div>
          )}

          {/* Query Results */}
          {queryResult && !isLoading && (
            <div className="space-y-6">
              {/* Primary Query */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Primary Query</h3>
                <QueryCard 
                  query={queryResult.primary} 
                  isPrimary 
                  onExecute={handleExecuteQuery}
                  onRefine={handleQueryRefinement}
                />
              </div>

              {/* Alternative Queries */}
              {queryResult.alternatives.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Alternative Queries ({queryResult.alternatives.length})
                  </h3>
                  <div className="space-y-4">
                    {queryResult.alternatives.map((alt, index) => (
                      <QueryCard 
                        key={index} 
                        query={alt} 
                        index={index + 1} 
                        onExecute={handleExecuteQuery}
                        onRefine={handleQueryRefinement}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Section 3 - Impact Analysis & Results (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full space-y-6"
        >
          {/* Impact Badge */}
          {queryResult && !isLoading && (
            <ImpactBadge
              level={queryResult.impact.level}
              estimatedRows={queryResult.impact.estimatedRows}
              warnings={queryResult.impact.warnings}
            />
          )}

          {/* Results Table */}
          {executionResults ? (
            <ResultsTable 
              data={executionResults.rows}
              columns={executionResults.columns}
              executionTime={executionResults.executionTime}
            />
          ) : (
            <ResultsTable />
          )}
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelExecution}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-md w-full p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Confirm Destructive Operation</h3>
                  <p className="text-sm text-gray-400">{executionError?.message}</p>
                </div>
                <button
                  onClick={handleCancelExecution}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {executionError?.warning && (
                <div className="mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-300">{executionError.warning}</p>
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  onClick={handleCancelExecution}
                  className="flex-1 btn-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleConfirmExecution}
                  className="flex-1 btn-primary bg-red-600 hover:bg-red-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Confirm & Execute
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
