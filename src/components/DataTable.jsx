import { Copy, Download, Eye, FileText, Pencil, Power, PowerOff, Search, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMemo, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import Button from './ui/Button.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function DataTable({
  columns,
  rows,
  readOnly = false,
  onEdit,
  onToggleStatus,
  onDelete,
  onCopyLogin,
  onView,
  onRowAction,
  rowAction,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkBar = null,
  exportFields,
  exportName = 'rdpanel-export',
  customPdf,
  customCsv,
  onRowClick,
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(columns[0]?.key);
  const [page, setPage] = useState(1);
  const debounced = useDebounce(query);
  const pageSize = 100;
  const hasActions = !readOnly && Boolean(onEdit || onToggleStatus || onDelete || onCopyLogin || onView || onRowAction);

  const filtered = useMemo(() => {
    const normalized = debounced.toLowerCase();
    return rows
      .filter((row) => JSON.stringify(row).toLowerCase().includes(normalized))
      .sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')));
  }, [debounced, rows, sortKey]);

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selectedSet.has(row.id));
  const toggleRow = (row) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedSet);
    if (next.has(row.id)) next.delete(row.id); else next.add(row.id);
    onSelectionChange([...next]);
  };
  const toggleAllFiltered = () => {
    if (!onSelectionChange) return;
    if (allFilteredSelected) {
      const remaining = selectedIds.filter((id) => !filtered.some((row) => row.id === id));
      onSelectionChange(remaining);
    } else {
      const next = new Set(selectedIds);
      filtered.forEach((row) => next.add(row.id));
      onSelectionChange([...next]);
    }
  };
  // If the page passes `exportFields`, use that complete field set for CSV/PDF
  // exports. Otherwise fall back to whatever columns are visible on screen.
  const fallbackFields = columns
    .filter((column) => column.exportable !== false)
    .map((column) => ({ label: column.label, value: (row) => row[column.key] }));
  const fields = (exportFields && exportFields.length ? exportFields : fallbackFields);
  const csvValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

  // If the user has ticked rows with checkboxes, export only those — otherwise
  // export everything currently filtered/searched.
  const exportRows = selectedIds.length
    ? filtered.filter((row) => selectedSet.has(row.id))
    : filtered;

  const exportCsv = () => {
    if (customCsv) return customCsv(exportRows);
    const headers = ['S.No.', ...fields.map((field) => field.label)];
    const lines = exportRows.map((row, index) =>
      [csvValue(index + 1), ...fields.map((field) => csvValue(field.value(row)))].join(','),
    );
    // UTF-8 BOM so Excel handles unicode correctly when opened directly.
    const blob = new Blob(['﻿', [headers.map(csvValue).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${exportName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (customPdf) return customPdf(exportRows);
    // Many fields → landscape A3 keeps the table readable.
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
    const title = exportName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const generatedAt = new Date().toLocaleString();

    // Title bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200);
    doc.text(`Generated ${generatedAt}   •   ${filtered.length} records`, 30, 48);
    doc.setTextColor(0);

    const head = [['S.No.', ...fields.map((field) => field.label)]];
    const body = exportRows.map((row, index) => [
      String(index + 1),
      ...fields.map((field) => String(field.value(row) ?? '')),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 78,
      margin: { left: 24, right: 24, bottom: 36 },
      styles: { fontSize: 7, cellPadding: { top: 4, right: 5, bottom: 4, left: 5 }, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'left', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { halign: 'center', cellWidth: 28, fontStyle: 'bold' } },
      didDrawPage: (data) => {
        const page = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `Page ${data.pageNumber} of ${page}`,
          doc.internal.pageSize.getWidth() - 60,
          doc.internal.pageSize.getHeight() - 16,
        );
      },
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
          <Button variant="secondary" onClick={exportCsv}>
            <Download size={16} /> CSV{selectedIds.length ? ` (${selectedIds.length})` : ''}
          </Button>
          <Button variant="secondary" onClick={exportPdf}>
            <FileText size={16} /> PDF{selectedIds.length ? ` (${selectedIds.length})` : ''}
          </Button>
        </div>
      </div>

      {selectable && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/70 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-white/10 dark:text-white">
          <span>{selectedIds.length} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {bulkBar}
            <Button variant="ghost" className="h-9 px-3" onClick={() => onSelectionChange?.([])}>Clear</Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-200/70 text-xs uppercase tracking-[0.14em] text-slate-400 dark:border-white/10">
              {selectable ? (
                <th className="w-12 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    title={allFilteredSelected ? 'Clear all' : 'Select all'}
                  />
                </th>
              ) : null}
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
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-200/60 text-sm last:border-0 hover:bg-white/45 dark:border-white/10 dark:hover:bg-white/5 ${selectedSet.has(row.id) ? 'bg-teal-500/5' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {selectable ? (
                  <td className="w-12 px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(row.id)}
                      onChange={() => toggleRow(row)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 align-middle font-medium text-slate-700 dark:text-slate-200">
                    {column.render ? column.render(row) : column.key === 'status' ? <StatusBadge status={row.status} /> : row[column.key]}
                  </td>
                ))}
                {hasActions ? (
                  <td className="whitespace-nowrap px-5 py-4" onClick={(e) => e.stopPropagation()}>
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
