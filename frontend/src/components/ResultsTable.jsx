import { motion } from 'framer-motion';
import { Table, Download, Clock, FileDown } from 'lucide-react';
import { useState } from 'react';

export default function ResultsTable({ data = [], columns = [], executionTime = 0 }) {
  const hasData = data.length > 0 && columns.length > 0;
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportToCSV = () => {
    if (!hasData) return;

    // Create CSV header
    const csvHeader = columns.join(',');
    
    // Create CSV rows
    const csvRows = data.map(row => 
      columns.map(column => {
        const value = row[column];
        // Handle null/undefined
        if (value === null || value === undefined) return '';
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    // Combine header and rows
    const csv = [csvHeader, ...csvRows].join('\n');

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportMenu(false);
  };

  const exportToJSON = () => {
    if (!hasData) return;

    // Create JSON string with proper formatting
    const jsonString = JSON.stringify(data, null, 2);

    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel h-full flex flex-col"
    >
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Query Results</h2>
        </div>
        {hasData && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{executionTime}ms</span>
            </div>
            <span className="badge bg-primary/10 text-primary border-primary/20">
              {data.length} rows
            </span>
            
            {/* Export Menu */}
            <div className="relative">
              <motion.button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-ghost p-2 relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Download className="w-4 h-4" />
              </motion.button>

              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10"
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <motion.button
                    onClick={exportToCSV}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover transition-colors flex items-center gap-2"
                    whileHover={{ x: 4 }}
                  >
                    <FileDown className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-medium">Export CSV</div>
                      <div className="text-xs text-gray-500">Download as spreadsheet</div>
                    </div>
                  </motion.button>
                  <motion.button
                    onClick={exportToJSON}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover transition-colors flex items-center gap-2 border-t border-border"
                    whileHover={{ x: 4 }}
                  >
                    <FileDown className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Export JSON</div>
                      <div className="text-xs text-gray-500">Download as JSON file</div>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {!hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center text-center p-8"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4"
            >
              <Table className="w-8 h-8 text-primary" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">No Results Yet</h3>
            <p className="text-sm text-gray-500 max-w-md">
              Execute a query to see results displayed here. The table will show
              all returned data with pagination support.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-w-full"
          >
            <table className="w-full">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  {columns.map((column, index) => (
                    <motion.th
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      {column}
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row, rowIndex) => (
                  <motion.tr
                    key={rowIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rowIndex * 0.03 }}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {rowIndex + 1}
                    </td>
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-3 text-sm text-gray-300 font-mono"
                      >
                        {row[column] !== null && row[column] !== undefined
                          ? String(row[column])
                          : <span className="text-gray-600">NULL</span>
                        }
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {hasData && data.length > 10 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm"
        >
          <span className="text-gray-400">
            Showing 1-{Math.min(10, data.length)} of {data.length} rows
          </span>
          <div className="flex gap-2">
            <motion.button
              className="btn-secondary px-3 py-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Previous
            </motion.button>
            <motion.button
              className="btn-secondary px-3 py-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
