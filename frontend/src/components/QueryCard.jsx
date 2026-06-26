import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Play, Info, Edit2, Send, X, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getQueryTypeColor, getRiskColor } from '../lib/utils';

export default function QueryCard({ query, isPrimary = false, index = 0, onExecute, onRefine }) {
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSql, setEditedSql] = useState(query.sql);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedSql : query.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = async () => {
    if (onExecute && !isExecuting) {
      setIsExecuting(true);
      try {
        const sqlToExecute = isEditing ? editedSql : query.sql;
        await onExecute(sqlToExecute);
      } finally {
        setIsExecuting(false);
      }
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes
      query.sql = editedSql;
    }
    setIsEditing(!isEditing);
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim() || !onRefine || isRefining) return;
    
    setIsRefining(true);
    try {
      const sqlToRefine = isEditing ? editedSql : query.sql;
      await onRefine(sqlToRefine, refinementPrompt);
      setRefinementPrompt('');
      setShowRefinement(false);
    } catch (err) {
      console.error('Refinement error:', err);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`card-hover ${isPrimary ? 'ring-2 ring-primary/50' : ''}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`badge ${getQueryTypeColor(query.type)}`}>
              {query.type}
            </span>
            {isPrimary && (
              <span className="badge bg-primary/10 text-primary border-primary/20">
                Primary
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-card transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Copy SQL"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </motion.button>
            <motion.button
              onClick={handleToggleEdit}
              className={`p-2 rounded-lg hover:bg-card transition-colors ${isEditing ? 'bg-primary/10 text-primary' : ''}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isEditing ? "Save & Lock" : "Edit SQL"}
            >
              <Edit2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={handleExecute}
              disabled={isExecuting}
              className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isExecuting ? { scale: 1.05 } : {}}
              whileTap={!isExecuting ? { scale: 0.95 } : {}}
            >
              {isExecuting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full inline-block"
                  />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Execute
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-400">
            <span>Tables:</span>
            {query.tables?.map((table, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                {table}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Code - Editable or Read-only */}
      <div className="relative">
        {isEditing ? (
          <textarea
            value={editedSql}
            onChange={(e) => setEditedSql(e.target.value)}
            className="w-full p-4 bg-black/30 text-green-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
            placeholder="Edit SQL query..."
            spellCheck={false}
          />
        ) : (
          <SyntaxHighlighter
            language="sql"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.875rem'
            }}
          >
            {query.sql}
          </SyntaxHighlighter>
        )}
      </div>

      {/* Refinement Section */}
      <div className="border-t border-border">
        {!showRefinement ? (
          <motion.button
            onClick={() => setShowRefinement(true)}
            className="w-full p-3 text-sm text-gray-400 hover:text-primary hover:bg-card-hover transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refine this query...</span>
          </motion.button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-background/30"
            >
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRefine()}
                  placeholder="e.g., 'Sort by name descending' or 'Add email column'"
                  className="flex-1 input text-sm"
                  disabled={isRefining}
                  autoFocus
                />
                <motion.button
                  onClick={handleRefine}
                  disabled={!refinementPrompt.trim() || isRefining}
                  className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!isRefining ? { scale: 1.05 } : {}}
                  whileTap={!isRefining ? { scale: 0.95 } : {}}
                >
                  {isRefining ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowRefinement(false);
                    setRefinementPrompt('');
                  }}
                  className="btn-ghost p-2"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Explanation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 border-t border-border bg-background/30"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-300">{query.explanation}</p>
        </div>
      </motion.div>

      {/* Impact */}
      {query.estimatedRows && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4 pb-4"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Estimated Impact:</span>
            <span className="text-gray-300">{query.estimatedRows}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
