import { Copy, Download, Eye, FileText, Pencil, Power, PowerOff, Search, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMemo, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import Button from './ui/Button.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function DataTable({ columns, rows, readOnly = false, onEdit, onToggleStatus, onDelete, onCopyLogin, onView, onRowAction, rowAction, exportName = 'rdpanel-export' }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(columns[0]?.key);
  const [page, setPage] = useState(1);
  const debounced = useDebounce(query);
  const pageSize = 6;
  const hasActions = !readOnly && Boolean(onEdit || onToggleStatus || onDelete || onCopyLogin || onView || onRowAction);

  const filtered = useMemo(() => {
    const normalized = debounced.toLowerCase();
    return rows
      .filter((row) => JSON.stringify(row).toLowerCase().includes(normalized))
      .sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
  }, [debounced, rows, sortKey]);

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const exportColumns = columns.filter((column) => column.exportable !== false);
  const csvValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

  const exportCsv = () => {
    const headers = ['S.No.', ...exportColumns.map((column) => column.label)];
    const lines = filtered.map((row, index) =>
      [csvValue(index + 1), ...exportColumns.map((column) => csvValue(row[column.key]))].join(','),
    );
    const blob = new Blob([[headers.map(csvValue).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${exportName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const title = exportName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const generatedAt = new Date().toLocaleString();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 40, 36);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Generated ${generatedAt}  •  ${filtered.length} records`, 40, 52);
    doc.setTextColor(0);

    const head = [['S.No.', ...exportColumns.map((column) => column.label)]];
    const body = filtered.map((row, index) => [
      String(index + 1),
      ...exportColumns.map((column) => String(row[column.key] ?? '')),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 70,
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { halign: 'center', cellWidth: 40 } },
    });

    doc.save(`${exportName}.pdf`);
  };

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
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-1">
                      {onView ? <button type="button" onClick={() => onView(row)} title="View" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"><Eye size={15} /></button> : null}
                      {onEdit ? <button type="button" onClick={() => onEdit(row)} title="Edit" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"><Pencil size={15} /></button> : null}
                      {onToggleStatus ? <button type="button" onClick={() => onToggleStatus(row)} title={row.status === 'Active' ? 'Disable' : 'Activate'} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">{row.status === 'Active' ? <PowerOff size={15} /> : <Power size={15} />}</button> : null}
                      {onCopyLogin ? <button type="button" onClick={() => onCopyLogin(row)} title="Copy Login" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-500/10 dark:text-teal-300"><Copy size={15} /></button> : null}
                      {onRowAction ? <button type="button" onClick={() => onRowAction(row)} title={rowAction?.label || 'Action'} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"><Download size={15} /></button> : null}
                      {onDelete ? <button type="button" onClick={() => onDelete(row)} title="Delete" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-500/10"><Trash2 size={15} /></button> : null}
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
