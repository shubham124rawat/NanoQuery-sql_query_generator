import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, Lock, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectCustomDatabase, useSampleDatabase } from '../services/api';

export default function SchemaPage() {
  const navigate = useNavigate();
  const [customConnection, setCustomConnection] = useState({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [activatingSample, setActivatingSample] = useState(false);

  const handleCustomConnect = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const response = await connectCustomDatabase(customConnection);
      
      if (response.success) {
        setConnectionResult({
          type: 'success',
          message: response.message
        });
        
        // Wait a moment for user to see success, then navigate
        setTimeout(() => {
          navigate('/generator');
        }, 1500);
      } else {
        // Map error types to user-friendly messages
        let errorMessage = response.message;
        
        if (response.error_code === 1045) {
          errorMessage = '❌ Access Denied: Invalid username or password';
        } else if (response.error_code === 1049) {
          errorMessage = `❌ Unknown Database: '${customConnection.database}' does not exist`;
        } else if (response.error_code === 2003 || response.error_code === 2005) {
          errorMessage = `❌ Connection Failed: Cannot reach MySQL server at '${customConnection.host}:${customConnection.port}'`;
        }
        
        setConnectionResult({
          type: 'error',
          message: errorMessage,
          details: response.error_type
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionResult({
        type: 'error',
        message: '❌ Network Error: Unable to reach the backend server',
        details: error.message
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUseSample = async () => {
    setActivatingSample(true);
    setConnectionResult(null);

    try {
      const response = await useSampleDatabase();
      
      if (response.success) {
        setConnectionResult({
          type: 'success',
          message: response.message
        });
        
        // Navigate to generator
        setTimeout(() => {
          navigate('/generator');
        }, 1500);
      } else {
        setConnectionResult({
          type: 'error',
          message: response.message,
          details: 'Sample database configuration issue'
        });
      }
    } catch (error) {
      console.error('Sample database error:', error);
      setConnectionResult({
        type: 'error',
        message: '❌ Failed to activate sample database',
        details: error.message
      });
    } finally {
      setActivatingSample(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="inline-block p-4 bg-primary/10 rounded-2xl mb-4"
          >
            <Database className="w-16 h-16 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-3">Workspace Onboarding</h1>
          <p className="text-xl text-gray-400">Choose your database connection method</p>
        </motion.div>

        {/* Connection Result Alert */}
        <AnimatePresence>
          {connectionResult && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg border-2 ${
                connectionResult.type === 'success' 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-red-500/50 bg-red-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {connectionResult.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    connectionResult.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {connectionResult.message}
                  </p>
                  {connectionResult.details && (
                    <p className="text-sm text-gray-400 mt-1">{connectionResult.details}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Sample Database */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="card p-8 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Try with Sample Data</h2>
                <p className="text-sm text-gray-400">Get started immediately</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <p className="text-gray-300">
                Explore NanoQuery's AI-powered SQL generation with our preloaded HR management database:
              </p>
              
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-gray-300">7 interconnected tables</strong> (employees, departments, jobs, locations, countries, regions, dependents)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-gray-300">40+ sample employees</strong> with realistic organizational data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-gray-300">Full foreign key relationships</strong> for complex JOIN queries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-gray-300">No configuration required</strong> - start generating queries instantly</span>
                </li>
              </ul>

              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Perfect for:</strong> First-time users, demos, testing query patterns, and learning SQL generation
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleUseSample}
              disabled={activatingSample}
              className="btn-primary mt-6 w-full flex items-center justify-center gap-2 py-4 text-lg"
              whileHover={{ scale: activatingSample ? 1 : 1.02 }}
              whileTap={{ scale: activatingSample ? 1 : 0.98 }}
            >
              {activatingSample ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activating Sample Workspace...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Activate Sample Workspace
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Right Column - Custom Database */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Lock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Connect Your Database</h2>
                <p className="text-sm text-gray-400">Use your own MySQL instance</p>
              </div>
            </div>

            <form onSubmit={handleCustomConnect} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Host
                  </label>
                  <input
                    type="text"
                    value={customConnection.host}
                    onChange={(e) => setCustomConnection({...customConnection, host: e.target.value})}
                    placeholder="localhost"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-blue-400 mt-1.5 flex items-start gap-1">
                    <span className="shrink-0">💡</span>
                    <span>Using Docker? Use <code className="px-1 py-0.5 bg-blue-500/10 rounded text-blue-300">host.docker.internal</code> to connect to your local XAMPP MySQL database.</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={customConnection.port}
                    onChange={(e) => setCustomConnection({...customConnection, port: parseInt(e.target.value)})}
                    placeholder="3306"
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Database Name
                </label>
                <input
                  type="text"
                  value={customConnection.database}
                  onChange={(e) => setCustomConnection({...customConnection, database: e.target.value})}
                  placeholder="my_database"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={customConnection.user}
                  onChange={(e) => setCustomConnection({...customConnection, user: e.target.value})}
                  placeholder="root"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={customConnection.password}
                  onChange={(e) => setCustomConnection({...customConnection, password: e.target.value})}
                  placeholder="••••••••"
                  className="input w-full"
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no password is set</p>
              </div>

              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-300">
                  <strong>Security Note:</strong> Connection credentials are used only for this session and are not stored permanently
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={isConnecting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                whileHover={{ scale: isConnecting ? 1 : 1.02 }}
                whileTap={{ scale: isConnecting ? 1 : 0.98 }}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    Test & Connect Database
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            You can switch between databases anytime from the workspace settings
          </p>
        </motion.div>
      </div>
    </div>
  );
}
