import { Download, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import Button from './ui/Button.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function DataTable({ columns, rows, readOnly = false, onEdit, onToggleStatus, onDelete, exportName = 'sspay-export' }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(columns[0]?.key);
  const [page, setPage] = useState(1);
  const debounced = useDebounce(query);
  const pageSize = 6;
  const hasActions = !readOnly && Boolean(onEdit || onToggleStatus || onDelete);

  const filtered = useMemo(() => {
    const normalized = debounced.toLowerCase();
    return rows
      .filter((row) => JSON.stringify(row).toLowerCase().includes(normalized))
      .sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
  }, [debounced, rows, sortKey]);

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const exportCsv = () => {
    const headers = columns.map((column) => column.label);
    const lines = filtered.map((row) => columns.map((column) => `"${String(row[column.key] ?? '').replaceAll('"', '""')}"`).join(','));
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${exportName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const exportPdf = () => window.print();

  return (
    <div className="surface overflow-hidden rounded-3xl shadow-ios">
      <div className="flex flex-col gap-3 border-b border-slate-200/70 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white/75 px-4 py-3 dark:bg-white/10">
          <Search size={18} className="text-slate-400" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search bank, UPI, agent, merchant, tags..." className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 dark:text-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCsv}><Download size={16} /> CSV</Button>
          <Button variant="secondary" onClick={exportPdf}><FileText size={16} /> PDF</Button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-200/70 text-xs uppercase tracking-[0.14em] text-slate-400 dark:border-white/10">
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4">
                  <button type="button" onClick={() => setSortKey(column.key)} className="font-bold">{column.label}</button>
                </th>
              ))}
              {hasActions ? <th className="px-5 py-4">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-slate-200/60 text-sm last:border-0 hover:bg-white/45 dark:border-white/10 dark:hover:bg-white/5">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 align-middle font-medium text-slate-700 dark:text-slate-200">
                    {column.render ? column.render(row) : column.key === 'status' ? <StatusBadge status={row.status} /> : row[column.key]}
                  </td>
                ))}
                {hasActions ? (
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {onEdit ? <Button variant="ghost" className="h-9 px-3" onClick={() => onEdit(row)}>Edit</Button> : null}
                      {onToggleStatus ? <Button variant="ghost" className="h-9 px-3" onClick={() => onToggleStatus(row)}>{row.status === 'Active' ? 'Disable' : 'Activate'}</Button> : null}
                      {onDelete ? <Button variant="ghost" className="h-9 px-3 text-rose-600" onClick={() => onDelete(row)}>Delete</Button> : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200/70 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
        <span>{filtered.length} records</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Prev</Button>
          <span className="font-semibold">Page {page} of {totalPages}</span>
          <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
