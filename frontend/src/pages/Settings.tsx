import React, { useEffect, useState } from 'react';
import { Bell, Monitor, Moon, Save, Shield, Sun, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../components/Toast';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'pymastery-theme';

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

const Settings: React.FC = () => {
  const { addToast } = useToast();
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [productAnnouncements, setProductAnnouncements] = useState(false);
  const [studyReminders, setStudyReminders] = useState(true);
  const [appearance, setAppearance] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'system';
  });

  // Apply theme whenever the selection changes (live preview)
  useEffect(() => {
    applyTheme(appearance);
  }, [appearance]);

  // Also listen for system theme changes when mode === 'system'
  useEffect(() => {
    if (appearance !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [appearance]);

  const handleSave = () => {
    localStorage.setItem(THEME_KEY, appearance);
    applyTheme(appearance);
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your preferences have been updated successfully.'
    });
  };

  return (
    <div className="bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">Manage your account, notifications, and learning preferences.</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Display name</label>
                <input
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  defaultValue="PyMastery Learner"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
                <input
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  defaultValue="learner@example.com"
                />
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Study reminders', value: studyReminders, setValue: setStudyReminders },
                { label: 'Email updates', value: emailUpdates, setValue: setEmailUpdates },
                { label: 'Product announcements', value: productAnnouncements, setValue: setProductAnnouncements }
              ].map((setting) => (
                <label
                  key={setting.label}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-slate-700"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{setting.label}</span>
                  <input
                    type="checkbox"
                    checked={setting.value}
                    onChange={(event) => setting.setValue(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { id: 'system', label: 'System', icon: Monitor },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon }
              ].map((option) => {
                const Icon = option.icon;
                const active = appearance === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAppearance(option.id as 'system' | 'light' | 'dark')}
                    className={`rounded-xl border px-4 py-4 text-center transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="mx-auto mb-2 h-5 w-5" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-slate-300">
              <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-slate-700">
                Session management and personal profile controls are active.
              </div>
              <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-slate-700">
                Password reset and advanced security tools can be connected next.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
