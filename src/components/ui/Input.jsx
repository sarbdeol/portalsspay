import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { cn } from '../../utils/cn.js';

const Input = forwardRef(function Input({ label, error, type = 'text', className, icon: Icon, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="group block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</span>
      <div className={cn('flex h-13 items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 shadow-sm backdrop-blur-xl transition focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-400/15 dark:border-white/10 dark:bg-white/[0.08]', className)}>
        {Icon ? <Icon size={18} className="text-slate-400" /> : null}
        <input
          ref={ref}
          type={isPassword && visible ? 'text' : type}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          {...props}
        />
        {isPassword ? (
          <button type="button" onClick={() => setVisible((value) => !value)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-900/5 dark:hover:bg-white/10">
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? <span className="mt-2 block text-xs font-medium text-rose-500">{error}</span> : null}
    </label>
  );
});

export default Input;
