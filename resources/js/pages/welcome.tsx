import { Head, Link, usePage, useForm } from '@inertiajs/react';
import {
    ShieldCheck,
    ClipboardCheck,
    ArrowRight,
    Warehouse,
    Lock,
    X,
    Sun,
    Moon,
    Calculator,
    Sliders,
    GitCommit,
    FileText,
    Database,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [modalContent, setModalContent] = useState<
        'terms' | 'privacy' | 'coa' | null
    >(null);

    // Appearance Hook
    const { resolvedAppearance, updateAppearance } = useAppearance();

    // Multi-tab Bento Showcase state
    const [activeTab, setActiveTab] = useState<
        'threshold' | 'calculator' | 'workflow'
    >('threshold');

    // 1. Threshold State
    const [thresholdValue, setThresholdValue] = useState<number>(45000);

    // 2. Moving Average Calculator State
    const [qty1, setQty1] = useState<number>(10);
    const [cost1, setCost1] = useState<number>(150);
    const [qty2, setQty2] = useState<number>(20);
    const [cost2, setCost2] = useState<number>(180);

    // 3. Workflow State
    const [activeStep, setActiveStep] = useState<number>(0);

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

    // Calculate moving average
    const totalQty = qty1 + qty2;
    const totalVal1 = qty1 * cost1;
    const totalVal2 = qty2 * cost2;
    const totalValue = totalVal1 + totalVal2;
    const movingAverage =
        totalQty > 0 ? Math.round((totalValue / totalQty) * 100) / 100 : 0;

    const thresholdPresets = [
        { label: 'Ergonomic Chair', value: 8500 },
        { label: 'Department Laptop', value: 45000 },
        { label: 'Network Router', value: 25000 },
        { label: 'Aircon Split Unit', value: 55000 },
        { label: 'Enterprise Server Rack', value: 85000 },
    ];

    const workflowSteps = [
        {
            title: 'Draft Submission',
            role: 'Requisitioning Officer',
            doc: 'RIS Form (GAM Appendix 48)',
            desc: 'The requesting unit drafts a Requisition & Issue Slip detailing the item quantity and specs needed for their operations.',
            action: 'Status: Pending Approval',
        },
        {
            title: 'Division Sign-off',
            role: 'Division Head',
            doc: 'Authorized RIS Signature',
            desc: 'The division head validates that the requested items are necessary and approves the draft slip in the system.',
            action: 'Status: Approved & Forwarded',
        },
        {
            title: 'Supply Allocation',
            role: 'Supply Officer',
            doc: 'Stock Ledger Check',
            desc: 'The supply custodian verifies stock availability, checks moving average costs, and prepares the physical handovers.',
            action: 'Status: Allocated / Ready',
        },
        {
            title: 'Custody Handover',
            role: 'End-User Recipient',
            doc: 'ICS or PAR Generated',
            desc: 'The items are issued. The recipient signs the custody document. The system updates stock levels and posts audit logs.',
            action: 'Status: Completed / Issued',
        },
    ];

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
                    content="Secure, COA-compliant asset tracking and moving-average valuation module for government agencies."
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
                    content="Secure, COA-compliant asset tracking and moving-average valuation module for government agencies."
                />
                <meta name="twitter:image" content="/images/gims_hero.png" />
                <link rel="canonical" href="https://ikfaa.com" />
            </Head>

            {/* Background Gradients and Ambient Glows */}
            <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-500 selection:bg-indigo-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
                {/* Dynamic Ambient Glow Blobs */}
                <div className="pointer-events-none absolute top-[-10%] left-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 blur-3xl transition-opacity duration-1000 dark:from-blue-500/10 dark:to-indigo-500/15" />
                <div className="pointer-events-none absolute top-[30%] right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 blur-3xl transition-opacity duration-1000 dark:from-violet-500/10 dark:to-purple-500/15" />
                <div className="pointer-events-none absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 blur-3xl transition-opacity duration-1000 dark:from-blue-500/5 dark:to-teal-500/10" />

                {/* Grid Pattern overlay */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.02] transition-opacity duration-500 dark:opacity-[0.03]"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #4f46e5 1px, transparent 1px),
                            linear-gradient(to bottom, #4f46e5 1px, transparent 1px)
                        `,
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Navbar */}
                <nav className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/70 backdrop-blur-md transition-all duration-300 dark:border-slate-800/50 dark:bg-slate-950/70">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <img
                                src="/favicon.png"
                                alt="GIMS Logo"
                                className="h-9 w-9 rounded-lg shadow-md ring-2 ring-indigo-500/20"
                            />
                            <div className="flex flex-col">
                                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-base font-extrabold tracking-tight text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                                    GIMS
                                </span>
                                <span className="text-[10px] leading-none font-bold text-slate-500 dark:text-slate-400">
                                    GOVPH Portal
                                </span>
                            </div>
                        </div>

                        {/* Mid Nav Links (hidden on mobile) */}
                        <div className="dark:text-slate-350 hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
                            <a
                                href="#demo-section"
                                className="group relative py-1 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                                Try Calculator
                                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full dark:bg-indigo-400" />
                            </a>
                            <a
                                href="#capabilities"
                                className="group relative py-1 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                                Capabilities
                                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full dark:bg-indigo-400" />
                            </a>
                            <a
                                href="#challenges"
                                className="group relative py-1 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                                Challenges
                                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-indigo-600 transition-all duration-300 group-hover:w-full dark:bg-indigo-400" />
                            </a>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Theme Toggler */}
                            <button
                                onClick={() =>
                                    updateAppearance(
                                        resolvedAppearance === 'dark'
                                            ? 'light'
                                            : 'dark',
                                    )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800/80"
                                aria-label="Toggle theme"
                            >
                                {resolvedAppearance === 'dark' ? (
                                    <Sun className="h-4.5 w-4.5 text-amber-500 transition-transform duration-300 hover:rotate-45" />
                                ) : (
                                    <Moon className="h-4.5 w-4.5 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
                                )}
                            </button>

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-lg"
                                >
                                    Dashboard
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80"
                                >
                                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                                    Log In
                                </button>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-12 lg:pt-24 lg:pb-32">
                    <div className="space-y-6 lg:col-span-5">
                        <h1 className="text-4xl leading-tight font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                            Government{' '}
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
                                Inventory & Assets
                            </span>{' '}
                            Portal
                        </h1>
                        <p className="dark:text-slate-355 max-w-xl text-base leading-relaxed text-slate-600">
                            Eliminate paper bottlenecks. GIMS provides a secure,
                            digital portal designed specifically for public
                            agency inventory cycles, tracking capitalization
                            thresholds and moving-average cost valuations.
                        </p>
                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
                                >
                                    Access Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsDrawerOpen(true)}
                                        className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
                                    >
                                        Log In to Portal
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Hero: Dynamic Interactive Tab Showcase */}
                    <div id="demo-section" className="relative lg:col-span-7">
                        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 blur-2xl dark:from-indigo-400/5 dark:to-violet-400/5" />

                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
                            {/* Tab Headers */}
                            <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
                                <button
                                    onClick={() => setActiveTab('threshold')}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                        activeTab === 'threshold'
                                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Sliders className="h-3.5 w-3.5" />
                                    Threshold Router
                                </button>
                                <button
                                    onClick={() => setActiveTab('calculator')}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                        activeTab === 'calculator'
                                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Calculator className="h-3.5 w-3.5" />
                                    Moving Average
                                </button>
                                <button
                                    onClick={() => setActiveTab('workflow')}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                        activeTab === 'workflow'
                                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <GitCommit className="h-3.5 w-3.5" />
                                    RIS Lifecycle
                                </button>
                            </div>

                            {/* Tab Content Panel */}
                            <div className="p-6">
                                {/* TAB 1: Threshold Router */}
                                {activeTab === 'threshold' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                Capitalization Bounds Router
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Drag the slider to see how GIMS
                                                dynamically channels property
                                                assignments to PAR vs ICS based
                                                on standard cost regulations.
                                            </p>
                                        </div>

                                        {/* Slider & Value Display */}
                                        <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-950/40">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-500">
                                                    Asset Unit Cost:
                                                </span>
                                                <span className="text-lg font-black text-indigo-600 dark:text-blue-400">
                                                    ₱{' '}
                                                    {thresholdValue.toLocaleString(
                                                        'en-US',
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={5000}
                                                max={100000}
                                                step={5000}
                                                value={thresholdValue}
                                                onChange={(e) =>
                                                    setThresholdValue(
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-800 dark:accent-blue-400"
                                            />
                                            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                                                <span>₱ 5,000.00</span>
                                                <span className="dark:text-slate-350 font-bold text-slate-500">
                                                    Threshold Bound: ₱ 50,000.00
                                                </span>
                                                <span>₱ 100,000.00</span>
                                            </div>
                                        </div>

                                        {/* Presets */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {thresholdPresets.map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() =>
                                                        setThresholdValue(
                                                            preset.value,
                                                        )
                                                    }
                                                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                                                        thresholdValue ===
                                                        preset.value
                                                            ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/25 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Dynamic Output Box */}
                                        <div
                                            className={`flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300 ${
                                                thresholdValue >= 50000
                                                    ? 'border-indigo-500/20 bg-indigo-500/5 dark:border-blue-400/20 dark:bg-blue-950/10'
                                                    : 'border-amber-500/20 bg-amber-500/5 dark:border-amber-400/20 dark:bg-amber-950/10'
                                            }`}
                                        >
                                            <div
                                                className={`shrink-0 rounded-xl p-2.5 ${
                                                    thresholdValue >= 50000
                                                        ? 'bg-indigo-500/10 text-indigo-600 dark:bg-blue-400/25 dark:text-blue-400'
                                                        : 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/25 dark:text-amber-400'
                                                }`}
                                            >
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`rounded px-2 py-0.5 text-xs font-extrabold uppercase ${
                                                            thresholdValue >=
                                                            50000
                                                                ? 'bg-indigo-600 text-white dark:bg-blue-500'
                                                                : 'bg-amber-500 text-slate-900 dark:bg-amber-400 dark:text-slate-950'
                                                        }`}
                                                    >
                                                        {thresholdValue >= 50000
                                                            ? 'PAR Form'
                                                            : 'ICS Form'}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                        {thresholdValue >= 50000
                                                            ? 'Property Acknowledgment Receipt'
                                                            : 'Inventory Custodian Slip'}
                                                    </span>
                                                </div>
                                                <p className="dark:text-slate-350 text-xs leading-relaxed font-normal text-slate-600">
                                                    {thresholdValue >= 50000
                                                        ? 'This item matches the standard Capital Expense threshold (₱50,000+). Routed as Property, Plant & Equipment (PPE), requiring a lifetime Property Acknowledgment Receipt (PAR).'
                                                        : 'This item represents a Semi-Expendable asset (<₱50,000). Expensed immediately but issued using an Inventory Custodian Slip (ICS) for tracking accountability.'}
                                                </p>
                                                <div className="pt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    {thresholdValue >= 50000
                                                        ? 'GAM Appendix 61 Compliance'
                                                        : 'GAM Appendix 59 Compliance'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: Moving Average Cost Calculator */}
                                {activeTab === 'calculator' && (
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                Moving Average Valuation
                                                Calculator
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Enter quantity and costs for
                                                stock-in deliveries to watch
                                                GIMS recalculate weighted
                                                average costs in real time.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* Inputs */}
                                            <div className="space-y-3.5 rounded-2xl border border-slate-200/50 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                                                <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                                    Transaction Parameters
                                                </span>

                                                <div className="space-y-2">
                                                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                        Initial Balance:
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="mb-0.5 block text-[9px] font-semibold text-slate-400">
                                                                Quantity
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={qty1}
                                                                onChange={(e) =>
                                                                    setQty1(
                                                                        Math.max(
                                                                            1,
                                                                            parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        ),
                                                                    )
                                                                }
                                                                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="mb-0.5 block text-[9px] font-semibold text-slate-400">
                                                                Unit Price (₱)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={cost1}
                                                                onChange={(e) =>
                                                                    setCost1(
                                                                        Math.max(
                                                                            1,
                                                                            parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        ),
                                                                    )
                                                                }
                                                                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                        New Shipment Received:
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="mb-0.5 block text-[9px] font-semibold text-slate-400">
                                                                Quantity
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={qty2}
                                                                onChange={(e) =>
                                                                    setQty2(
                                                                        Math.max(
                                                                            1,
                                                                            parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        ),
                                                                    )
                                                                }
                                                                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="mb-0.5 block text-[9px] font-semibold text-slate-400">
                                                                Unit Price (₱)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={cost2}
                                                                onChange={(e) =>
                                                                    setCost2(
                                                                        Math.max(
                                                                            1,
                                                                            parseInt(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        ),
                                                                    )
                                                                }
                                                                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Calculations readout */}
                                            <div className="dark:bg-blue-955/20 flex flex-col justify-between rounded-2xl border border-indigo-500/10 bg-indigo-900/5 p-4 dark:border-blue-900/25">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase dark:text-blue-400">
                                                        Valuation Output
                                                    </span>
                                                    <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                                        Balance: ₱{' '}
                                                        {totalVal1.toLocaleString()}{' '}
                                                        ({qty1} units) <br />
                                                        Receipt: ₱{' '}
                                                        {totalVal2.toLocaleString()}{' '}
                                                        ({qty2} units)
                                                    </div>
                                                </div>

                                                <div className="py-3">
                                                    <div className="text-[10px] font-semibold text-slate-400 uppercase dark:text-slate-500">
                                                        New Unit Cost
                                                    </div>
                                                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                                                        ₱{' '}
                                                        {movingAverage.toLocaleString(
                                                            'en-US',
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto rounded-lg bg-slate-950 p-2.5 font-mono text-[9px] leading-relaxed text-emerald-400 shadow-inner select-all">
                                                    {`// Weighted Average Formula\n`}
                                                    {`(${totalVal1} + ${totalVal2}) / (${qty1} + ${qty2})\n`}
                                                    {`= ${totalValue} / ${totalQty}\n`}
                                                    {`= ₱ ${movingAverage.toFixed(2)} / unit`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: RIS Handover Flow */}
                                {activeTab === 'workflow' && (
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                Requisition & Issue Slip (RIS)
                                                Lifecycle
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Click any stage of the document
                                                lifecycle below to preview
                                                authorization and state custody
                                                handovers.
                                            </p>
                                        </div>

                                        {/* Stepper Buttons */}
                                        <div className="relative mt-2 mb-4 flex items-center justify-between px-2">
                                            {/* Line backdrop container */}
                                            <div className="absolute top-4 right-6 left-6 -z-10 h-0.5">
                                                <div className="h-full w-full bg-slate-200 dark:bg-slate-800" />
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-300 dark:bg-blue-500"
                                                    style={{
                                                        width: `${(activeStep / 3) * 100}%`,
                                                    }}
                                                />
                                            </div>

                                            {workflowSteps.map((step, idx) => (
                                                <button
                                                    key={step.title}
                                                    onClick={() =>
                                                        setActiveStep(idx)
                                                    }
                                                    className="relative z-10 flex shrink-0 flex-col items-center"
                                                >
                                                    <div
                                                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition-all ${
                                                            activeStep === idx
                                                                ? 'scale-110 border-indigo-600 bg-indigo-600 text-white ring-4 ring-indigo-500/20 dark:border-blue-500 dark:bg-blue-500 dark:ring-blue-500/25'
                                                                : idx <
                                                                    activeStep
                                                                  ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600'
                                                                  : 'border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900'
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Step Detail Card */}
                                        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                                            <div className="mb-2 flex items-start justify-between gap-4">
                                                <div>
                                                    <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase dark:text-blue-400">
                                                        Step {activeStep + 1}:{' '}
                                                        {
                                                            workflowSteps[
                                                                activeStep
                                                            ].role
                                                        }
                                                    </span>
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                        {
                                                            workflowSteps[
                                                                activeStep
                                                            ].title
                                                        }
                                                    </h4>
                                                </div>
                                                <span className="dark:text-slate-355 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                                                    {
                                                        workflowSteps[
                                                            activeStep
                                                        ].doc
                                                    }
                                                </span>
                                            </div>

                                            <p className="mb-3 text-xs leading-relaxed font-normal text-slate-600 dark:text-slate-400">
                                                {workflowSteps[activeStep].desc}
                                            </p>

                                            <div className="flex items-center gap-2 text-[10px] font-bold font-semibold text-emerald-600 dark:text-emerald-400">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                                {
                                                    workflowSteps[activeStep]
                                                        .action
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Capabilities Bento Grid Section */}
                <section
                    id="capabilities"
                    className="mx-auto max-w-7xl border-t border-slate-200/50 px-6 py-24 dark:border-slate-900/50"
                >
                    <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
                        <span className="text-indigo-650 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-bold tracking-wider uppercase dark:bg-indigo-400/10 dark:text-indigo-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                            Core Capabilities
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                            Designed to Address Statutory Guidelines
                        </h2>
                        <p className="mx-auto max-w-xl text-sm text-slate-500 dark:text-slate-400">
                            GIMS brings robust, secure, and modern web
                            application patterns to local and federal public
                            asset tracking operations.
                        </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Card 1: Compliance (Large) */}
                        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 md:col-span-2 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/50">
                            <div className="flex h-full flex-col justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-blue-400/10 dark:text-blue-400">
                                        <Warehouse className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            COA Asset Ledger Reconciliation
                                        </h3>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                            Our system strictly implements the
                                            calculations and reporting formats
                                            specified by the Government
                                            Accounting Manual (GAM). Track
                                            assets with custom-bound threshold
                                            parameters and output print-ready
                                            PDF layouts conforming to COA
                                            standards.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="dark:text-slate-350 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                                        Appendix 48 (RIS)
                                    </span>
                                    <span className="dark:text-slate-350 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                                        Appendix 59 (ICS)
                                    </span>
                                    <span className="dark:text-slate-350 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                                        Appendix 61 (PAR)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Cryptographic Audit (Normal) */}
                        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/50">
                            <div className="flex h-full flex-col justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Permanent Audit Trails
                                        </h3>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                            Every ledger entry modification
                                            creates a permanent historical diff
                                            log including user identity,
                                            timestamps, IP signatures, and item
                                            snapshots. Secured with optional 2FA
                                            TOTP configurations.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    2FA & Passkey Ready
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Locking (Normal) */}
                        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/50">
                            <div className="flex h-full flex-col justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Race Condition Safety
                                        </h3>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                            GIMS incorporates transaction
                                            database locks to ensure that
                                            simultaneous stock allocations,
                                            releases, or transfers do not yield
                                            arithmetic cost conflicts or
                                            rounding-off bugs.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    Lock-Safe Transactions
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Inventory Templates (Large) */}
                        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 md:col-span-2 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/50">
                            <div className="flex h-full flex-col justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400">
                                        <ClipboardCheck className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Stateful Physical Inventory Sheets
                                        </h3>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                            Create localized physical inventory
                                            templates (RPCPPE/RPCI). Freeze
                                            active ledger values temporarily
                                            during audits, record actual
                                            physically counted balances, and let
                                            the system compute variations and
                                            reconciliations.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="dark:text-slate-350 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                                        RPCPPE Export
                                    </span>
                                    <span className="dark:text-slate-350 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                                        Auditing Freeze
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: The Hard Reality (The Challenges) */}
                <section
                    id="challenges"
                    className="mx-auto max-w-7xl border-t border-slate-200/50 px-6 py-20 dark:border-slate-900/50"
                >
                    <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
                        <span className="dark:text-rose-450 inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-rose-600 uppercase dark:bg-rose-400/10">
                            The Challenge
                        </span>
                        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Why Public Property Administration is Complex
                        </h3>
                        <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            Property officers face rigid, mandatory compliance
                            standards. Manual oversight generates major audit
                            vulnerabilities.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {/* Challenge 1 */}
                        <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/5 dark:border-slate-800 dark:bg-slate-900/20">
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                                <img
                                    src="/images/challenge_math_fatigue.png"
                                    alt="Moving Average Cost Mismatches"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                            </div>
                            <div className="flex flex-grow flex-col space-y-2 p-6">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                    Mathematical Valuation Errors
                                </h4>
                                <p className="text-xs leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                                    Manually tracking cumulative inventory stock
                                    balances and recalculating weighted averages
                                    on successive ledger sheets causes
                                    fractional discrepancies that auditor checks
                                    flags.
                                </p>
                            </div>
                        </div>

                        {/* Challenge 2 */}
                        <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/5 dark:border-slate-800 dark:bg-slate-900/20">
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                                <img
                                    src="/images/challenge_asset_threshold.png"
                                    alt="Tracking Threshold Accountability"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                            </div>
                            <div className="flex flex-grow flex-col space-y-2 p-6">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                    Threshold Routing Overload
                                </h4>
                                <p className="text-xs leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                                    Deciding whether an acquisition requires a
                                    long-term PAR receipt or an expensed ICS
                                    card involves strict threshold evaluations,
                                    creating processing backlogs for supply
                                    staff.
                                </p>
                            </div>
                        </div>

                        {/* Challenge 3 */}
                        <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/5 dark:border-slate-800 dark:bg-slate-900/20">
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                                <img
                                    src="/images/challenge_auditing_backlog.png"
                                    alt="Rigorous Annual COA Audits"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                            </div>
                            <div className="flex flex-grow flex-col space-y-2 p-6">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                    Rigorous COA Auditing Pressure
                                </h4>
                                <p className="text-xs leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                                    Annual physical count audits require halting
                                    work to cross-check thousands of items,
                                    matching serial keys and condition tags to
                                    paper ledgers under critical compliance
                                    deadlines.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Access Portal Call-to-Action */}
                <section
                    id="portal"
                    className="mx-auto flex max-w-7xl flex-col items-center border-t border-slate-200/50 px-6 py-24 dark:border-slate-900/50"
                >
                    <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-indigo-950/90 p-8 text-center text-white shadow-2xl md:p-14">
                        {/* Inside ambient glow */}
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/25 via-transparent to-transparent" />

                        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
                            <h3 className="text-3xl font-black tracking-tight sm:text-4xl">
                                Ready to Access the Asset Management Portal?
                            </h3>
                            <p className="mx-auto max-w-lg text-sm leading-relaxed font-normal text-indigo-200">
                                Authenticate to monitor department requisitions,
                                manage asset assignments, export statutory
                                receipts, or review audits.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex w-full items-center justify-center rounded-xl bg-white px-8 py-4 text-sm font-bold text-indigo-900 shadow-md transition-colors hover:bg-slate-50 sm:w-auto"
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
                                            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-white px-8 py-4 text-sm font-bold text-indigo-900 shadow-md transition-colors hover:bg-slate-50 sm:w-auto"
                                        >
                                            Sign In to Your Account
                                        </button>
                                        <span className="text-indigo-305 text-xs font-semibold">
                                            or contact your unit administrator
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between border-t border-slate-200/50 px-6 py-8 text-xs text-slate-500 sm:flex-row dark:border-slate-900/50 dark:text-slate-400">
                    <p>
                        © 2026 Government Inventory Management System (GIMS).
                        All rights reserved.
                    </p>
                    <div className="mt-4 flex gap-6 sm:mt-0">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setModalContent('terms');
                            }}
                            className="hover:text-slate-800 hover:underline dark:hover:text-slate-200"
                        >
                            Terms of Use
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setModalContent('privacy');
                            }}
                            className="hover:text-slate-800 hover:underline dark:hover:text-slate-200"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setModalContent('coa');
                            }}
                            className="hover:text-slate-800 hover:underline dark:hover:text-slate-200"
                        >
                            COA Regulations
                        </a>
                    </div>
                </footer>

                {/* Modal Container */}
                {modalContent && (
                    <div className="bg-slate-955/65 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
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
                            <div className="dark:text-slate-350 max-h-[60vh] space-y-6 overflow-y-auto p-6 text-sm leading-relaxed font-normal text-slate-600">
                                {modalContent === 'terms' && (
                                    <>
                                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-semibold text-amber-800 dark:text-amber-300">
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
                                                <h4 className="text-slate-905 mb-1 font-semibold dark:text-white">
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
                                <Lock className="h-5 w-5 text-indigo-600 dark:text-blue-400" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Portal Sign In
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="hover:text-slate-655 text-slate-400 transition-colors dark:hover:text-slate-200"
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
                                        className="text-xs text-indigo-600 hover:underline dark:text-blue-400"
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
                                <span className="dark:text-slate-505 text-xs text-slate-400">
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
