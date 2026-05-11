import Page from '../../components/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import { useActivityLogs, unwrapError } from '../../hooks/useCrm.js';

export default function ActivityLogs() {
  const { data: logs = [], isLoading, isError, error } = useActivityLogs();

  return (
    <Page title="Activity Logs" eyebrow="Audit trail">
      <Card>
        {isLoading ? (
          <div className="p-6 text-center text-sm font-semibold text-slate-500">Loading activity...</div>
        ) : isError ? (
          <div className="p-6 text-center text-sm font-semibold text-rose-600">{unwrapError(error)}</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-sm font-semibold text-slate-500">No activity yet.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 rounded-2xl bg-white/60 p-4 dark:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="font-bold">{log.action}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {log.actor} • {log.target} • {log.time}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}
