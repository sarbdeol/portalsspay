import { ArrowUpRight } from 'lucide-react';
import Card from './ui/Card.jsx';

export default function StatCard({ label, value, helper, icon: Icon, delay }) {
  return (
    <Card delay={delay} className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-teal-300/20" />
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-white/80 p-3 text-teal-700 shadow-sm dark:bg-white/10 dark:text-teal-200">
          <Icon size={22} />
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
          <ArrowUpRight size={14} /> 12%
        </span>
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
    </Card>
  );
}
