import { motion } from 'framer-motion';

export default function Page({ title, eyebrow, actions, children }) {
  return (
    <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{eyebrow}</p> : null}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </motion.main>
  );
}
