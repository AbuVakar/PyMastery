import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const PWAInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!installPrompt) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await installPrompt.prompt();
        const result = await installPrompt.userChoice;

        if (result.outcome !== 'accepted') {
          setInstallPrompt(null);
          return;
        }

        setInstallPrompt(null);
      }}
      className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </button>
  );
};

export default PWAInstallPrompt;
