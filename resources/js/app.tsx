import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const getAppName = (): string => {
    const envName = import.meta.env.VITE_APP_NAME || 'Govph';

    if (envName.includes('${')) {
        try {
            const appEl = document.getElementById('app');

            if (appEl && appEl.dataset.page) {
                const page = JSON.parse(appEl.dataset.page);

                if (page.props && page.props.name) {
                    return page.props.name;
                }
            }
        } catch {
            // Ignore JSON parsing errors
        }

        return 'Govph';
    }

    return envName;
};

createInertiaApp({
    title: (title) => {
        const appName = getAppName();

        return title ? `${title} - ${appName}` : appName;
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome' ||
                name.endsWith('/print') ||
                name === 'inventory/requisitions/print':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
