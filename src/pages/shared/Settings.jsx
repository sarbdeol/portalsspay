import { Moon, Sun } from 'lucide-react';
import Page from '../../components/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';

export default function Settings() {
  const { theme, toggleTheme } = useAuthStore();
  const dark = theme === 'dark';

  return (
    <Page title="Settings" eyebrow="Workspace controls">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">Theme</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Switch between light and dark mode. Persisted across sessions.
            </p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </Card>
    </Page>
  );
}
