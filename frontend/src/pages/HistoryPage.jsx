import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Search, Trash2, RotateCcw, Filter, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getQueryTypeColor } from '../lib/utils';
import { getHistory, clearHistory as clearHistoryAPI, deleteHistoryRecord } from '../services/api';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const records = await getHistory(50);
      setHistory(records);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.user_input.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.generated_query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.query_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return;
    
    try {
      await clearHistoryAPI();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
      alert('Failed to clear history');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await deleteHistoryRecord(recordId);
      setHistory(history.filter(item => item.id !== recordId));
    } catch (err) {
      console.error('Failed to delete record:', err);
      alert('Failed to delete record');
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Query History</h1>
          <p className="text-gray-400">View and manage your past queries</p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search queries..."
                className="input pl-11 w-full"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="SELECT">SELECT</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <motion.button
                onClick={handleClearHistory}
                disabled={isLoading || history.length === 0}
                className="btn-ghost px-3 py-2 text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isLoading && history.length > 0 ? { scale: 1.05 } : {}}
                whileTap={!isLoading && history.length > 0 ? { scale: 0.95 } : {}}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* History List */}
        <div className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-12 text-center"
            >
              <Loader className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading history...</p>
            </motion.div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-6 border-red-500/50 bg-red-500/5 text-center"
            >
              <p className="text-red-400">{error}</p>
              <motion.button
                onClick={fetchHistory}
                className="btn-primary mt-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry
              </motion.button>
            </motion.div>
          )}

          {/* History Records */}
          {!isLoading && !error && (
            <AnimatePresence>
              {filteredHistory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card p-12 text-center"
                >
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">No History Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterType !== 'all'
                      ? 'No queries match your filters'
                      : 'Your query history will appear here'}
                  </p>
                </motion.div>
              ) : (
                filteredHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-hover p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-300 font-medium mb-1">{item.user_input}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{item.timestamp}</span>
                              <span>•</span>
                              <span>{item.rows_affected} rows</span>
                            </div>
                          </div>
                          <span className={`badge ${getQueryTypeColor(item.query_type)}`}>
                            {item.query_type}
                          </span>
                        </div>

                        {/* SQL Query */}
                        <div className="code-block text-xs">
                          <code className="text-green-400">{item.generated_query}</code>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-gray-500">
                            <span>Tables: </span>
                            <span className="badge bg-primary/10 text-primary border-primary/20">
                              {item.tables_used || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <motion.button
                              onClick={() => handleDeleteRecord(item.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </motion.button>
                            <motion.button
                              className="flex items-center gap-1 text-primary hover:text-primary-400 transition-colors"
                              whileHover={{ x: 2 }}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reuse</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Stats */}
        {!isLoading && !error && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-primary">{history.length}</div>
              <div className="text-xs text-gray-500">Total Queries</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {history.filter(h => h.query_type === 'SELECT').length}
              </div>
              <div className="text-xs text-gray-500">SELECT</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {history.filter(h => h.query_type === 'UPDATE').length}
              </div>
              <div className="text-xs text-gray-500">UPDATE</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {history.filter(h => h.query_type === 'INSERT').length}
              </div>
              <div className="text-xs text-gray-500">INSERT</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
