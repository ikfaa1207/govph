import { Link } from '@inertiajs/react';
import { ShieldCheck, ClipboardCheck, Users, Key } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid h-dvh flex-col items-center justify-center bg-background px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left side (Form Container) */}
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
                    {/* Small screen mobile logo header */}
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-2 lg:hidden"
                    >
                        <AppLogoIcon className="size-10 rounded-lg" />
                        <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            GIMS
                        </span>
                    </Link>

                    {/* Heading details */}
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {/* Auth Form children */}
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs sm:p-8">
                        {children}
                    </div>
                </div>
            </div>

            {/* Right side (Branding Panel) — matches welcome page light style */}
            <div className="relative hidden h-full flex-col overflow-hidden bg-[#FDFDFC] p-10 lg:flex">
                {/* Subtle indigo grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(79,70,229,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(79,70,229,1) 1px, transparent 1px)
                        `,
                        backgroundSize: '28px 28px',
                    }}
                />
                {/* Soft radial fade over the grid */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(253,253,252,0.85)_100%)]" />

                {/* Top Header */}
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#1b1b18]"
                >
                    <AppLogoIcon className="size-9 rounded-lg shadow-sm" />
                    <span>GIMS (GovPH)</span>
                </Link>

                {/* Center Content — clean text + features */}
                <div className="relative z-20 my-auto flex flex-col items-center justify-center gap-10">
                    {/* Text content */}
                    <div className="max-w-sm space-y-4 text-center">
                        <h2 className="text-2xl leading-tight font-extrabold tracking-tight text-[#1b1b18]">
                            Government Inventory Management System
                        </h2>
                        <p className="text-sm leading-relaxed text-[#706f6c]">
                            A secure and audit-ready registry for tracking
                            government properties, plant equipment, supplies
                            distribution, and accountability reports.
                        </p>
                    </div>

                    {/* Features checklist */}
                    <div className="grid w-full max-w-xs gap-3 text-xs font-medium text-[#3d3d3a]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600">
                                <ClipboardCheck className="size-4" />
                            </div>
                            <span>Property &amp; Supply Ledger Registry</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600">
                                <ShieldCheck className="size-4" />
                            </div>
                            <span>COA Auditing &amp; Reporting Compliance</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600">
                                <Users className="size-4" />
                            </div>
                            <span>Accountability Logs &amp; Issue Slips</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-600">
                                <Key className="size-4" />
                            </div>
                            <span>
                                Passkey &amp; Multi-Factor Authentication
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="relative z-20 mt-auto border-t border-[#19140035] pt-6">
                    <p className="text-xs leading-normal text-[#a09fa0] italic">
                        "Ensuring transparency, accountability, and systematic
                        accuracy in government properties and assets registry."
                    </p>
                </div>
            </div>
        </div>
    );
}
