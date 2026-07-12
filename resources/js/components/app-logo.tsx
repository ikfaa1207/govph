import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-8 rounded-md" />
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-indigo-600 dark:text-indigo-400">
                    GIMS
                </span>
                <span className="truncate text-[10px] leading-none font-medium text-muted-foreground">
                    Gov't Inventory Desk
                </span>
            </div>
        </>
    );
}
