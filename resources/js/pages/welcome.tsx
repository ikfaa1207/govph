import { Head, Link, usePage, useForm } from '@inertiajs/react';
import {
    TrendingUp,
    ShieldCheck,
    ClipboardCheck,
    ArrowRight,
    Warehouse,
    CheckCircle2,
    Lock,
    X,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [modalContent, setModalContent] = useState<
        'terms' | 'privacy' | 'coa' | null
    >(null);

    const loginForm = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginForm.post('/login', {
            onFinish: () => loginForm.reset('password'),
        });
    };

    return (
        <>
            <Head>
                <title>
                    GIMS - Government Inventory & Asset Management System
                </title>
                <meta
                    name="description"
                    content="GIMS (Government Inventory Management System) provides secure, COA-compliant asset tracking, physical inventory counts, and moving-average cost valuations for public offices."
                />
                <meta
                    name="keywords"
                    content="government inventory management system, asset tracking, COA compliance, PAR, ICS, moving average cost, public property accounting"
                />
                <meta name="robots" content="index, follow" />
                <meta
                    property="og:title"
                    content="GIMS - Government Inventory & Asset Management System"
                />
                <meta
                    property="og:description"
                    content="Secure, COA-compliant asset tracking and moving-average valuation engine for government agencies."
                />
                <meta property="og:image" content="/images/gims_hero.png" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://ikfaa.com" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="GIMS - Government Inventory & Asset Management System"
                />
                <meta
                    name="twitter:description"
                    content="Secure, COA-compliant asset tracking and moving-average valuation engine for government agencies."
                />
                <meta name="twitter:image" content="/images/gims_hero.png" />
                <link rel="canonical" href="https://ikfaa.com" />
            </Head>

            {/* Background Gradients and Ambient Glows */}
            <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
                <div className="pointer-events-none absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="pointer-events-none absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

                {/* Grid Pattern overlay */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #4f46e5 1px, transparent 1px),
                            linear-gradient(to bottom, #4f46e5 1px, transparent 1px)
                        `,
                        backgroundSize: '24px 24px',
                    }}
                />

                {/* Navbar */}
                <nav className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-md transition-all duration-300 dark:border-slate-800/50 dark:bg-slate-950/70">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <img
                                src="/favicon.png"
                                alt="GIMS Logo"
                                className="h-9 w-9 rounded-lg shadow-md ring-2 ring-indigo-500/20"
                            />
                            <div className="flex flex-col">
                                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-base font-extrabold tracking-tight text-transparent dark:from-indigo-400 dark:to-violet-400">
                                    GIMS
                                </span>
                                <span className="text-[10px] leading-none font-bold text-slate-500 dark:text-slate-400">
                                    GOVPH Portal
                                </span>
                            </div>
                        </div>

                        {/* Mid Nav Links (hidden on mobile) */}
                        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
                            <a
                                href="#features"
                                className="hover:text-indigo-650 group relative py-1 transition-colors dark:hover:text-indigo-400"
                            >
                                Features
                                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full dark:bg-indigo-400" />
                            </a>
                            <a
                                href="#challenges"
                                className="hover:text-indigo-650 group relative py-1 transition-colors dark:hover:text-indigo-400"
                            >
                                The Challenge
                                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full dark:bg-indigo-400" />
                            </a>
                            <a
                                href="#portal"
                                className="hover:text-indigo-650 group relative py-1 transition-colors dark:hover:text-indigo-400"
                            >
                                Access Portal
                                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full dark:bg-indigo-400" />
                            </a>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="py-1.8 shadow-indigo-650/20 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-indigo-700"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="py-1.8 text-slate-805 inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white/80 px-4 text-sm font-semibold transition-all duration-150 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80"
                                >
                                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                                    Log In
                                </button>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-12 pb-20 lg:grid-cols-12 lg:pt-20 lg:pb-28">
                    <div className="space-y-6 lg:col-span-6">
                        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                            Streamlined Inventory &{' '}
                            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                                Asset Accountability
                            </span>
                        </h1>
                        <p className="dark:text-slate-350 max-w-xl text-lg leading-relaxed font-normal text-slate-600">
                            Designed specifically for COA compliance, dynamic
                            moving-average valuations, and automated handovers.
                            GIMS transforms the tedious, paper-heavy inventory
                            cycle into a digital, error-free system.
                        </p>
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700"
                                >
                                    Access Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsDrawerOpen(true)}
                                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700"
                                    >
                                        Log In to Portal
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </button>
                                    <a
                                        href="#challenges"
                                        className="dark:text-slate-205 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition-all duration-150 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800/80"
                                    >
                                        Learn the Challenges
                                    </a>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Hero Graphic Frame */}
                    <div className="relative flex justify-center lg:col-span-6">
                        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 blur-2xl" />
                        <div className="w-full max-w-[500px] rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-2xl backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                            <img
                                src="/images/gims_hero.png"
                                alt="GIMS Core Asset Tracking"
                                className="aspect-[4/3] h-auto w-full rounded-xl border border-slate-100 object-cover shadow-md dark:border-slate-800"
                            />
                        </div>
                    </div>
                </header>

                {/* Section: The Hard Reality (The Challenges) */}
                <section
                    id="challenges"
                    className="mx-auto max-w-7xl border-t border-slate-200/50 px-6 py-20 dark:border-slate-800/50"
                >
                    <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
                        <h2 className="text-xs font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
                            Operational Context
                        </h2>
                        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Why Public Asset Management is Exceptionally
                            Challenging
                        </h3>
                        <p className="text-sm leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                            Inventory officers in public agencies face strict
                            regulatory mandates and physical logistics
                            complexities. Manual paper-based tracking introduces
                            severe risks.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {/* Challenge 1 */}
                        <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <img
                                src="/images/challenge_math_fatigue.png"
                                alt="Moving Average Cost Mismatches"
                                className="h-40 w-full border-b border-slate-100 object-cover dark:border-slate-800"
                            />
                            <div className="flex flex-grow flex-col p-6">
                                <h4 className="mb-2 text-base font-bold text-slate-900 dark:text-white">
                                    Moving Average Cost Mismatches
                                </h4>
                                <p className="dark:text-slate-355 flex-grow text-[13px] leading-relaxed text-slate-600">
                                    Calculating moving average unit costs for
                                    thousands of incoming stock-in and issuing
                                    stock-out transactions manually is extremely
                                    exhausting. A single cost rounding
                                    discrepancy results in auditing mismatches
                                    by year-end.
                                </p>
                            </div>
                        </div>

                        {/* Challenge 2 */}
                        <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <img
                                src="/images/challenge_asset_threshold.png"
                                alt="Tracking Threshold Accountability"
                                className="h-40 w-full border-b border-slate-100 object-cover dark:border-slate-800"
                            />
                            <div className="flex flex-grow flex-col p-6">
                                <h4 className="mb-2 text-base font-bold text-slate-900 dark:text-white">
                                    Tracking Threshold Accountability
                                </h4>
                                <p className="dark:text-slate-355 flex-grow text-[13px] leading-relaxed text-slate-600">
                                    Correctly routing handovers based on cost
                                    threshold limits is critical. Distinguishing
                                    high-value PPE (requiring a PAR receipt)
                                    from semi-expendable items (requiring an ICS
                                    slip) creates huge paper backlogs for
                                    compliance staff.
                                </p>
                            </div>
                        </div>

                        {/* Challenge 3 */}
                        <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <img
                                src="/images/challenge_auditing_backlog.png"
                                alt="Rigorous Annual COA Audits"
                                className="h-40 w-full border-b border-slate-100 object-cover dark:border-slate-800"
                            />
                            <div className="flex flex-grow flex-col p-6">
                                <h4 className="mb-2 text-base font-bold text-slate-900 dark:text-white">
                                    Rigorous Annual COA Audits
                                </h4>
                                <p className="dark:text-slate-355 flex-grow text-[13px] leading-relaxed text-slate-600">
                                    When auditors request a Physical Count
                                    sheet, officers must pause operations,
                                    manually map thousands of paper sheets with
                                    asset condition codes, and match ledger
                                    values, exposing the agency to penalties if
                                    numbers disagree.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Features (The Solution) */}
                <section
                    id="features"
                    className="relative mx-auto max-w-7xl border-t border-slate-200/50 px-6 py-24 dark:border-slate-800/50"
                >
                    <div className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl" />

                    {/* Centered, full-width section header to balance the layout columns */}
                    <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
                        <span className="text-indigo-650 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase dark:bg-indigo-400/10 dark:text-indigo-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                            GIMS Capabilities
                        </span>
                        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                            Built to Solve Government Audit Demands
                        </h3>
                        <p className="text-slate-505 mx-auto max-w-2xl text-sm leading-relaxed font-normal dark:text-slate-400">
                            GIMS combines high-performance web engineering with
                            standard public administrative practices, ensuring
                            complete compliance with the Government Accounting
                            Manual (GAM).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
                        {/* Left Column: Compliance Standards (3 cards) */}
                        <div className="space-y-6 lg:col-span-5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                    Compliance Standards
                                </span>
                                <div className="h-px flex-grow bg-slate-200/60 dark:bg-slate-800/60" />
                            </div>

                            <div className="space-y-4">
                                <div className="group flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:border-slate-800/40 dark:bg-slate-900/10 dark:hover:bg-slate-900/30">
                                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Automatic Moving-Average Valuation
                                        </h4>
                                        <p className="text-xs leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                                            Updates stock values instantly on
                                            stock-in, completely eliminating
                                            round-off discrepancies.
                                        </p>
                                    </div>
                                </div>

                                <div className="group flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:border-slate-800/40 dark:bg-slate-900/10 dark:hover:bg-slate-900/30">
                                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Intelligent Threshold Routing
                                        </h4>
                                        <p className="text-xs leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                                            Automatically channels assets to PAR
                                            or ICS layouts depending on standard
                                            capitalization bounds.
                                        </p>
                                    </div>
                                </div>

                                <div className="group flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:border-slate-800/40 dark:bg-slate-900/10 dark:hover:bg-slate-900/30">
                                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Standardized Print Layouts
                                        </h4>
                                        <p className="text-xs leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                                            Export-ready documents designed in
                                            strict alignment with COA Appendix
                                            60, 61, and 63.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Platform Features (2x2 Grid) */}
                        <div className="space-y-6 lg:col-span-7">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                    System Engine & Workflows
                                </span>
                                <div className="h-px flex-grow bg-slate-200/60 dark:bg-slate-800/60" />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Feature 1 */}
                                <div className="group hover:border-indigo-150 relative space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/10 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:border-indigo-900/30 dark:hover:from-slate-900/40 dark:hover:to-indigo-950/5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-indigo-650 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/20 dark:text-indigo-400">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Core Engine
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                            Cost Valuation Engine
                                        </h4>
                                        <p className="text-slate-505 text-xs leading-relaxed font-normal dark:text-slate-400">
                                            Pessimistic database transaction
                                            locks guarantee that concurrent
                                            stock entry updates remain
                                            mathematically accurate and
                                            lock-safe.
                                        </p>
                                    </div>
                                </div>

                                {/* Feature 2 */}
                                <div className="group hover:border-indigo-150 relative space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/10 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:border-indigo-900/30 dark:hover:from-slate-900/40 dark:hover:to-indigo-950/5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-indigo-650 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/20 dark:text-indigo-400">
                                            <ClipboardCheck className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Workflows
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                            Stateful RIS Handovers
                                        </h4>
                                        <p className="text-slate-505 text-xs leading-relaxed font-normal dark:text-slate-400">
                                            Seamless end-to-end routing mapping
                                            request submissions, head officer
                                            authorizations, supply allocations,
                                            and eventual handovers.
                                        </p>
                                    </div>
                                </div>

                                {/* Feature 3 */}
                                <div className="group hover:border-indigo-150 hover:border-indigo-150 relative space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/10 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:border-indigo-900/30 dark:hover:from-slate-900/40 dark:hover:to-indigo-950/5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-indigo-655 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/20 dark:text-indigo-400">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Security
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                            Audit Trails & Security
                                        </h4>
                                        <p className="text-slate-505 text-xs leading-relaxed font-normal dark:text-slate-400">
                                            Every ledger modification logs
                                            historical diffs. Secure custodian
                                            access is hardened with 2FA TOTP
                                            configurations and Passkeys.
                                        </p>
                                    </div>
                                </div>

                                {/* Feature 4 */}
                                <div className="group hover:border-indigo-150 hover:border-indigo-150 relative space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/10 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:border-indigo-900/30 dark:hover:from-slate-900/40 dark:hover:to-indigo-950/5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-indigo-655 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/20 dark:text-indigo-400">
                                            <Warehouse className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                            Auditing
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                            Physical Count Drafts
                                        </h4>
                                        <p className="text-slate-550 text-xs leading-relaxed font-normal dark:text-slate-400">
                                            Initiate localized count templates,
                                            freeze active stock levels
                                            temporarily, and auto-evaluate
                                            ledger differences for instant
                                            reports.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Access Portal (The Login Action Call) */}
                <section
                    id="portal"
                    className="mx-auto flex max-w-7xl flex-col items-center border-t border-slate-200/50 px-6 py-20 dark:border-slate-800/50"
                >
                    <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/90 to-violet-900/90 p-8 text-center text-white shadow-2xl md:p-12">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent" />

                        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
                            <h3 className="text-3xl font-extrabold tracking-tight">
                                Ready to Access the Asset Management Portal?
                            </h3>
                            <p className="text-sm leading-relaxed font-normal text-indigo-200">
                                Authenticate to view your department
                                requisitions, manage custody logs, generate
                                statutory receipts, or review outstanding
                                counts.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex w-full items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-900 shadow-md transition-colors hover:bg-slate-50 sm:w-auto"
                                    >
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4 text-indigo-900" />
                                    </Link>
                                ) : (
                                    <>
                                        <button
                                            onClick={() =>
                                                setIsDrawerOpen(true)
                                            }
                                            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-900 shadow-md transition-colors hover:bg-slate-50 sm:w-auto"
                                        >
                                            Sign In to Your Account
                                        </button>
                                        <span className="text-xs font-medium font-semibold text-indigo-300">
                                            or contact your unit admin
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between border-t border-slate-200/50 px-6 py-8 text-xs text-slate-500 sm:flex-row dark:border-slate-800/50 dark:text-slate-400">
                    <p>
                        © 2026 Government Inventory Management System (GIMS).
                        All rights reserved.
                    </p>
                    <div className="mt-4 flex gap-4 sm:mt-0">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setModalContent('terms');
                            }}
                            className="hover:underline"
                        >
                            Terms of Use
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setModalContent('privacy');
                            }}
                            className="hover:underline"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setModalContent('coa');
                            }}
                            className="hover:underline"
                        >
                            COA Manuals
                        </a>
                    </div>
                </footer>

                {/* Modal Container */}
                {modalContent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                        <div
                            className="fixed inset-0 -z-10 cursor-pointer"
                            onClick={() => setModalContent(null)}
                        />
                        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-950">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800/80">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {modalContent === 'terms' &&
                                            'Terms of Use & Authorization'}
                                        {modalContent === 'privacy' &&
                                            'Privacy Policy & Data Protection'}
                                        {modalContent === 'coa' &&
                                            'COA Guidelines & Reference Manuals'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {modalContent === 'terms' &&
                                            'Official Government Access Policy'}
                                        {modalContent === 'privacy' &&
                                            'Republic Act No. 10173 (Data Privacy Act of 2012)'}
                                        {modalContent === 'coa' &&
                                            'Government Accounting Manual (GAM) Regulations'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setModalContent(null)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800/60 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="text-slate-650 dark:text-slate-350 max-h-[60vh] space-y-6 overflow-y-auto p-6 text-sm leading-relaxed font-normal">
                                {modalContent === 'terms' && (
                                    <>
                                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
                                            <strong>WARNING:</strong> This is a
                                            secure government resource.
                                            Unauthorized actions or access
                                            violations are prosecuted under
                                            Republic Act No. 10175 (Cybercrime
                                            Prevention Act of 2012).
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                                                    1. System Access
                                                </h4>
                                                <p>
                                                    Access is restricted
                                                    strictly to authorized
                                                    property officers, supply
                                                    personnel, and designated
                                                    administrators. Multi-Factor
                                                    Authentication (MFA) must
                                                    remain active for all
                                                    credentialed accounts.
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                                                    2. Audit Monitoring
                                                </h4>
                                                <p>
                                                    All transactions, including
                                                    inventory issuances,
                                                    transfers, disposal reports,
                                                    and physical count entries,
                                                    are tracked with permanent,
                                                    cryptographic audit logs
                                                    matching the user
                                                    identifier.
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                                                    3. Accountability
                                                </h4>
                                                <p>
                                                    Users are legally and
                                                    administratively responsible
                                                    for the accuracy of
                                                    valuations, property
                                                    assignments, and forms
                                                    generated under their
                                                    account credentials.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {modalContent === 'privacy' && (
                                    <>
                                        <p>
                                            In accordance with Republic Act No.
                                            10173, also known as the Data
                                            Privacy Act of 2012, this portal
                                            collects and processes only
                                            information strictly necessary for
                                            administrative inventory controls:
                                        </p>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                                                    Collection Scope
                                                </h4>
                                                <ul className="list-disc space-y-1 pl-5">
                                                    <li>
                                                        User Credentials (email,
                                                        name, password hash).
                                                    </li>
                                                    <li>
                                                        Security configurations
                                                        (Passkey keys, 2FA
                                                        credentials).
                                                    </li>
                                                    <li>
                                                        Activity signatures
                                                        (timestamp, IP address,
                                                        device metadata).
                                                    </li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                                                    Security Standards
                                                </h4>
                                                <p>
                                                    All credentials, session
                                                    headers, and audit trails
                                                    are encrypted in transit and
                                                    at rest using standard
                                                    government-grade
                                                    cryptographic mechanisms.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {modalContent === 'coa' && (
                                    <>
                                        <p>
                                            This application implements controls
                                            in strict compliance with Commission
                                            on Audit (COA) circulars and
                                            manuals:
                                        </p>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                                                    Government Accounting Manual
                                                    (GAM)
                                                </h4>
                                                <p>
                                                    Form valuations use the
                                                    standard moving-average
                                                    method, ensuring correct
                                                    unit cost calculation for
                                                    inventory assets and
                                                    preventing fractional
                                                    rounding-off errors.
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                                                    Threshold Classifications
                                                </h4>
                                                <ul className="list-disc space-y-1.5 pl-5">
                                                    <li>
                                                        <strong>
                                                            Property
                                                            Acknowledgment
                                                            Receipt (PAR):
                                                        </strong>{' '}
                                                        Issued for Capital
                                                        Assets / PPE valued at
                                                        ₱50,000.00 and above (in
                                                        compliance with COA
                                                        Circular No. 2022-004).
                                                    </li>
                                                    <li>
                                                        <strong>
                                                            Inventory Custodian
                                                            Slip (ICS):
                                                        </strong>{' '}
                                                        Issued for
                                                        Semi-expendable items
                                                        valued below the
                                                        ₱50,000.00 threshold.
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end border-t border-slate-100 p-4 dark:border-slate-800/80">
                                <Button
                                    onClick={() => setModalContent(null)}
                                    className="cursor-pointer bg-slate-100 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Drawer Backdrop Overlay */}
                {isDrawerOpen && (
                    <div
                        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                )}

                {/* Sliding Drawer */}
                <div
                    className={`fixed top-0 right-0 z-50 h-full w-full transform border-l border-slate-200 bg-white shadow-2xl transition-transform duration-350 ease-in-out sm:w-[440px] dark:border-slate-800 dark:bg-slate-950 ${
                        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    <div className="flex h-full flex-col overflow-y-auto p-8">
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Portal Sign In
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="hover:text-slate-650 dark:hover:text-slate-250 text-slate-400 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Info text */}
                        <p className="mb-6 text-xs leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                            Enter your official credentials below to sign in.
                            GIMS uses two-factor authorization for roles with
                            ledger mutation permissions.
                        </p>

                        {/* Login Form */}
                        <form
                            onSubmit={handleLoginSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-1.5">
                                <Label htmlFor="drawer-email">
                                    Email address
                                </Label>
                                <Input
                                    id="drawer-email"
                                    type="email"
                                    name="email"
                                    required
                                    value={loginForm.data.email}
                                    onChange={(e) =>
                                        loginForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-10"
                                />
                                <InputError message={loginForm.errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="drawer-password">
                                        Password
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-indigo-650 text-xs hover:underline dark:text-indigo-400"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <PasswordInput
                                    id="drawer-password"
                                    name="password"
                                    required
                                    value={loginForm.data.password}
                                    onChange={(e) =>
                                        loginForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="h-10"
                                />
                                <InputError
                                    message={loginForm.errors.password}
                                />
                            </div>

                            <div className="flex items-center space-x-3 pt-1">
                                <Checkbox
                                    id="drawer-remember"
                                    name="remember"
                                    checked={loginForm.data.remember}
                                    onCheckedChange={(checked) =>
                                        loginForm.setData(
                                            'remember',
                                            checked === true,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="drawer-remember"
                                    className="text-xs"
                                >
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-6 h-10 w-full cursor-pointer bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700"
                                disabled={loginForm.processing}
                            >
                                {loginForm.processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Sign In
                            </Button>
                        </form>

                        {/* Passkey fallback */}
                        <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <div className="text-center">
                                <span className="text-slate-450 text-xs dark:text-slate-500">
                                    Or use other methods
                                </span>
                            </div>
                            <Link
                                href={login()}
                                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white/80 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80"
                            >
                                Sign In with Passkeys / WebAuthn
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
