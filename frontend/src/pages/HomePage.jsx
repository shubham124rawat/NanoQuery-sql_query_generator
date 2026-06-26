import { motion } from 'framer-motion';
import { Database, Sparkles, Zap, Shield, ArrowRight, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Convert natural language to SQL instantly using Google Gemini AI'
  },
  {
    icon: Code2,
    title: 'Smart Alternatives',
    description: 'Get multiple query variations with detailed explanations'
  },
  {
    icon: Shield,
    title: 'Risk Analysis',
    description: 'Real-time impact prediction and safety warnings'
  },
  {
    icon: Zap,
    title: 'Instant Execution',
    description: 'Test queries on sample database with live results'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10
    }
  }
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6 glow"
        >
          <Database className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="text-gradient">NanoQuery</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-2xl mx-auto">
          AI-Powered SQL Query Generator
        </p>

        <p className="text-gray-500 max-w-xl mx-auto mb-8">
          Transform natural language into precise SQL queries with intelligent analysis, 
          safety warnings, and instant execution capabilities.
        </p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Link to="/generator">
              <motion.button
                className="btn-primary px-8 py-3 text-lg group glow-hover"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/schema">
              <motion.button
                className="btn-secondary px-8 py-3 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Setup Schema
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="card-hover p-6 text-center group cursor-pointer"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/20 transition-colors">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 flex flex-wrap justify-center gap-8 text-center"
      >
        <div>
          <div className="text-3xl font-bold text-primary">1000+</div>
          <div className="text-gray-500 text-sm">Queries Generated</div>
        </div>
        <div className="w-px bg-border"></div>
        <div>
          <div className="text-3xl font-bold text-primary">99.9%</div>
          <div className="text-gray-500 text-sm">Accuracy</div>
        </div>
        <div className="w-px bg-border"></div>
        <div>
          <div className="text-3xl font-bold text-primary">&lt;5s</div>
          <div className="text-gray-500 text-sm">Response Time</div>
        </div>
      </motion.div>
    </div>
  );
}
