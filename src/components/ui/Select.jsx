import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const Select = forwardRef(function Select({ label, error, options = [], className, children, ...props }, ref) {
  return (
    <label className="group block">
      {label ? (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          'relative flex h-13 items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 shadow-sm backdrop-blur-xl transition focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-400/15 dark:border-white/10 dark:bg-white/[0.08]',
          className,
        )}
      >
        <select
          ref={ref}
          className="h-12 min-w-0 flex-1 appearance-none bg-transparent pr-6 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          {...props}
        >
          {children
            ? children
            : options.map((option) => {
                const value = typeof option === 'string' ? option : option.value;
                const text = typeof option === 'string' ? option : option.label;
                return (
                  <option key={value} value={value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {text}
                  </option>
                );
              })}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 text-slate-400" />
      </div>
      {error ? <span className="mt-2 block text-xs font-medium text-rose-500">{error}</span> : null}
    </label>
  );
});

export default Select;
