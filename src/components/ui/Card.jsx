import { motion } from 'framer-motion';
import { cn } from '../../utils/cn.js';

export default function Card({ children, className, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className={cn('surface rounded-3xl p-5 shadow-ios', className)}
    >
      {children}
    </motion.section>
  );
}
