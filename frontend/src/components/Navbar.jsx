import { motion } from 'framer-motion';
import { Database, Home, FileCode, History, Settings, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/schema', label: 'Schema', icon: FileCode },
  { path: '/generator', label: 'Generator', icon: Database },
  { path: '/history', label: 'History', icon: History },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">
                NanoQuery
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <motion.div
                  className={`relative px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'text-primary'
                      : 'text-gray-400 hover:text-text'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              className="btn-ghost p-2"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            {navItems.map((item, index) => (
              <Link key={item.path} to={item.path}>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-gray-400 hover:bg-card'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
