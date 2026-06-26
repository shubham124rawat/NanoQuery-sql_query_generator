import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Database, Table2, Key, Type, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSchema } from '../services/api';

function TableItem({ table, index }) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-2"
    >
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-card-hover transition-colors group"
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
        <Table2 className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm flex-1 text-left">{table.name}</span>
        <span className="text-xs text-gray-500 bg-card px-2 py-0.5 rounded">
          {table.columns.length}
        </span>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 mt-1 space-y-1"
          >
            {table.columns.map((column, colIndex) => (
              <motion.div
                key={colIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: colIndex * 0.05 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-card transition-colors text-sm group"
                whileHover={{ x: 4 }}
              >
                {column.is_primary_key ? (
                  <Key className="w-3 h-3 text-yellow-500" />
                ) : (
                  <Type className="w-3 h-3 text-gray-500" />
                )}
                <span className="text-gray-300 flex-1">{column.name}</span>
                <span className="text-xs text-gray-500 font-mono">
                  {column.type}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SchemaExplorer({ className = '' }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSchema();
      setSchema(data);
    } catch (err) {
      console.error('Failed to fetch schema:', err);
      setError('Failed to load database schema');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`panel h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading schema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`panel h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchSchema}
            className="mt-4 text-xs text-primary hover:text-primary-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tables = schema?.tables || [];

  return (
    <div className={`panel h-full flex flex-col ${className}`}>
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Schema Explorer</h2>
        </div>
        <div className="badge bg-primary/10 text-primary border-primary/20">
          {tables.length} tables
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {tables.map((table, index) => (
          <TableItem key={index} table={table} index={index} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-4 border-t border-border"
      >
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <Key className="w-3 h-3 text-yellow-500" />
            <span>Primary Key</span>
          </div>
          <div className="flex items-center gap-2">
            <Type className="w-3 h-3 text-gray-500" />
            <span>Column</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
