import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Get risk level color classes
 */
export function getRiskColor(level) {
  const colors = {
    low: 'text-green-500 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    dangerous: 'text-red-500 bg-red-500/10 border-red-500/20'
  };
  return colors[level?.toLowerCase()] || colors.low;
}

/**
 * Get query type color
 */
export function getQueryTypeColor(type) {
  const colors = {
    SELECT: 'text-green-400 bg-green-400/10',
    INSERT: 'text-blue-400 bg-blue-400/10',
    UPDATE: 'text-yellow-400 bg-yellow-400/10',
    DELETE: 'text-red-400 bg-red-400/10'
  };
  return colors[type?.toUpperCase()] || colors.SELECT;
}
