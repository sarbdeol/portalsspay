import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from './ui/Toast.jsx';

export default function CopyButton({ value, label = 'Copy', full = false }) {
  const [copied, setCopied] = useState(false);
  const { notify } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    notify(`${label} copied`, 'success');
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -1 }}
      onClick={copy}
      type="button"
      className={full ? 'inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-bold text-white dark:bg-white dark:text-slate-950' : 'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/75 text-slate-500 shadow-sm transition hover:text-teal-700 dark:bg-white/10 dark:text-slate-300'}
      title={label}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {full ? label : null}
    </motion.button>
  );
}
