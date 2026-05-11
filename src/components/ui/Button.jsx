import { motion } from 'framer-motion';
import { cn } from '../../utils/cn.js';

export default function Button({ children, className, variant = 'primary', type = 'button', ...props }) {
  const variants = {
    primary: 'bg-ink text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
    secondary: 'surface text-slate-800 hover:bg-white/90 dark:text-white dark:hover:bg-white/10',
    ghost: 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      type={type}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
