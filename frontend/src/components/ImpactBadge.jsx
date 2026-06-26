import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getRiskColor } from '../lib/utils';

const riskIcons = {
  low: CheckCircle,
  medium: AlertCircle,
  high: AlertTriangle,
  dangerous: XCircle
};

const riskDescriptions = {
  low: 'This query is safe to execute with minimal impact.',
  medium: 'Review this query carefully before execution.',
  high: 'This query may affect multiple rows. Proceed with caution.',
  dangerous: 'WARNING: This query could modify or delete significant data!'
};

export default function ImpactBadge({ level = 'low', estimatedRows = 0, warnings = [] }) {
  const Icon = riskIcons[level.toLowerCase()] || CheckCircle;
  const colorClasses = getRiskColor(level);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card p-6`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className={`p-3 rounded-lg border ${colorClasses}`}
          animate={{
            scale: level === 'dangerous' ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 2,
            repeat: level === 'dangerous' ? Infinity : 0
          }}
        >
          <Icon className="w-6 h-6" />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg capitalize">{level} Risk</h3>
            <span className={`badge ${colorClasses}`}>
              ~{estimatedRows} rows
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {riskDescriptions[level.toLowerCase()]}
          </p>

          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-xs font-medium text-gray-300">Warnings:</p>
              {warnings.map((warning, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 text-xs text-gray-400 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2"
                >
                  <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Visual indicator bar */}
      <div className="mt-4 h-2 bg-background rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: level === 'low' ? '25%' : level === 'medium' ? '50%' : level === 'high' ? '75%' : '100%'
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${
            level === 'low' ? 'bg-green-500' :
            level === 'medium' ? 'bg-yellow-500' :
            level === 'high' ? 'bg-orange-500' :
            'bg-red-500'
          }`}
        />
      </div>
    </motion.div>
  );
}
