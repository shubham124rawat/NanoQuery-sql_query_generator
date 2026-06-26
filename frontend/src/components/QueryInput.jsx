import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function QueryInput({ onSubmit, isLoading = false }) {
  const [query, setQuery] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setCharCount(value.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel"
    >
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Natural Language Query</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <motion.textarea
            value={query}
            onChange={handleInputChange}
            placeholder="Describe what you want to query... 
            
Example: Show all employees with salary greater than 50000"
            className="input min-h-[120px] resize-none"
            disabled={isLoading}
            whileFocus={{ scale: 1.01 }}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {charCount} characters
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span>{isLoading ? 'Generating...' : 'Ready'}</span>
          </div>

          <motion.button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
            whileHover={{ scale: query.trim() && !isLoading ? 1.05 : 1 }}
            whileTap={{ scale: query.trim() && !isLoading ? 0.95 : 1 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing
              </>
            ) : (
              <>
                Generate SQL
                <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </div>

        {/* Quick Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4 border-t border-border"
        >
          <p className="text-xs text-gray-500 mb-2">Quick Examples:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'List all students with CGPA > 8.5',
              'Count employees by department',
              'Find highest paid employee'
            ].map((example, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => setQuery(example)}
                className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card-hover transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                {example}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}
