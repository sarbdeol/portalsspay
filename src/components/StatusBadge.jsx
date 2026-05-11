import { cn } from '../utils/cn.js';

const tones = {
  Active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Disabled: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  Pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Hold: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

export default function StatusBadge({ status }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-bold', tones[status] || tones.Pending)}>{status}</span>;
}
