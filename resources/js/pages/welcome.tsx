import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                            <h1 className="mb-2 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Government Inventory Management System
                            </h1>
                            <p className="mb-6 text-sm text-[#706f6c] dark:text-[#A1A09A] leading-relaxed">
                                GIMS provides a secure, COA-compliant tracking environment for government properties, supplies, and asset distributions. 
                            </p>
                            <ul className="mb-8 flex flex-col space-y-3">
                                <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50">
                                        <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                    </span>
                                    <span>Track property accountability and PPE ledgers</span>
                                </li>
                                <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50">
                                        <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                    </span>
                                    <span>Process Requisition and Issue Slips (RIS)</span>
                                </li>
                                <li className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50">
                                        <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                    </span>
                                    <span>Generate COA compliance reports and audits</span>
                                </li>
                            </ul>
                            <div className="flex gap-3">
                                <Link
                                    href={login()}
                                    className="inline-block rounded-md border border-transparent bg-indigo-600 hover:bg-indigo-700 px-6 py-2 text-sm font-semibold leading-normal text-white transition-colors duration-150"
                                >
                                    Access Portal
                                </Link>
                            </div>
                        </div>
                        <div className="relative -mb-px aspect-[335/364] w-full shrink-0 overflow-hidden rounded-t-lg bg-indigo-50/50 dark:bg-indigo-950/20 lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg flex items-center justify-center">
                            {/* Subtle grid pattern background */}
                            <div
                                className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(rgba(79,70,229,1) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(79,70,229,1) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '28px 28px',
                                }}
                            />

                            {/* Outermost large translucent ring */}
                            <div className="absolute rounded-full border border-indigo-200/60 dark:border-indigo-700/30 bg-indigo-100/10 dark:bg-indigo-900/10" style={{ width: 340, height: 340 }} />
                            {/* Second ring */}
                            <div className="absolute rounded-full border border-indigo-300/50 dark:border-indigo-600/30 bg-indigo-100/15 dark:bg-indigo-900/15" style={{ width: 270, height: 270 }} />
                            {/* Third ring */}
                            <div className="absolute rounded-full border border-indigo-400/40 dark:border-indigo-500/40 bg-indigo-200/20 dark:bg-indigo-800/20" style={{ width: 206, height: 206 }} />
                            {/* Fourth inner ring */}
                            <div className="absolute rounded-full border border-indigo-500/30 dark:border-indigo-400/40 bg-indigo-200/25 dark:bg-indigo-800/25" style={{ width: 152, height: 152 }} />

                            {/* The main icon — centered with shadow */}
                            <img
                                src="/favicon.png"
                                alt="GIMS Icon"
                                className="relative z-10 w-24 h-24 rounded-2xl shadow-2xl shadow-indigo-500/30 dark:shadow-indigo-400/20 ring-4 ring-white/80 dark:ring-white/10"
                            />
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
