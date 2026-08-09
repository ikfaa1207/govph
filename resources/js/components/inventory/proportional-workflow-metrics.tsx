import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, ClipboardCheck, CheckCircle2, ShoppingCart, X } from 'lucide-react';

interface PRStats {
    total: number;
    pending: number;
    approved: number;
    ordered: number;
    rejected: number;
}

interface ProportionalWorkflowMetricsProps {
    stats: PRStats;
}

interface DonutRingProps {
    percentage: number;
    color: string;
    count: number;
    total: number;
    percentTextColor: string;
    badgeBgClass: string;
}

function DonutRing({
    percentage,
    color,
    count,
    total,
    percentTextColor,
    badgeBgClass,
}: DonutRingProps) {
    const size = 72;
    const strokeWidth = 7.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex shrink-0 flex-col items-center justify-center">
            {/* Top-right floating percentage pill badge */}
            <div
                className={`absolute -top-1.5 -right-1.5 z-10 rounded-full border px-1.5 py-0.5 text-[10px] font-extrabold shadow-2xs ${badgeBgClass}`}
            >
                {percentage}%
            </div>

            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size}
                    height={size}
                    className="-rotate-90 transform"
                >
                    {/* Background Ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className="stroke-slate-200/80 dark:stroke-slate-800"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Arc */}
                    {percentage > 0 && (
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                        />
                    )}
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold leading-none text-slate-900 dark:text-slate-100">
                        {count > 0 || total > 0 ? `${count}/${total}` : '0'}
                    </span>
                    <span className={`mt-0.5 text-[10px] font-semibold leading-none ${percentTextColor}`}>
                        ({percentage}%)
                    </span>
                </div>
            </div>
        </div>
    );
}

export function ProportionalWorkflowMetrics({ stats }: ProportionalWorkflowMetricsProps) {
    const total = stats.total || 0;
    const pendingPct = total > 0 ? Math.round((stats.pending / total) * 100) : 0;
    const approvedPct = total > 0 ? Math.round((stats.approved / total) * 100) : 0;
    const orderedPct = total > 0 ? Math.round((stats.ordered / total) * 100) : 0;
    const rejectedPct = total > 0 ? Math.round((stats.rejected / total) * 100) : 0;

    return (
        <div className="rounded-2xl border border-[#e5ded4] bg-[#f4efe8]/80 p-4 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/60 sm:p-5">
            {/* Header Title */}
            <div className="mb-4 text-center">
                <h3 className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    PROPORTIONAL WORKFLOW METRICS (Total PR Volume = {total})
                </h3>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                {/* Card 1: Total Requests */}
                <Card className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                            <FileText className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                Total Requests
                            </span>
                            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                {total}
                            </p>
                        </div>
                    </div>

                    {/* Proportional Stacked Segment Bar */}
                    <div className="my-3 space-y-1">
                        <div className="flex justify-between px-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">
                            <span>Pending</span>
                            <span>Approved</span>
                            <span>PO Created</span>
                            <span>Rejected</span>
                        </div>
                        <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
                            {total > 0 ? (
                                <>
                                    {stats.pending > 0 && (
                                        <div
                                            style={{ width: `${(stats.pending / total) * 100}%` }}
                                            className="h-full rounded-xs bg-[#f97316] transition-all duration-500"
                                            title={`Pending: ${stats.pending} (${pendingPct}%)`}
                                        />
                                    )}
                                    {stats.approved > 0 && (
                                        <div
                                            style={{ width: `${(stats.approved / total) * 100}%` }}
                                            className="h-full rounded-xs bg-[#16a34a] transition-all duration-500"
                                            title={`Approved: ${stats.approved} (${approvedPct}%)`}
                                        />
                                    )}
                                    {stats.ordered > 0 && (
                                        <div
                                            style={{ width: `${(stats.ordered / total) * 100}%` }}
                                            className="h-full rounded-xs bg-[#9333ea] transition-all duration-500"
                                            title={`PO Created: ${stats.ordered} (${orderedPct}%)`}
                                        />
                                    )}
                                    {stats.rejected > 0 && (
                                        <div
                                            style={{ width: `${(stats.rejected / total) * 100}%` }}
                                            className="h-full rounded-xs bg-[#e11d48] transition-all duration-500"
                                            title={`Rejected: ${stats.rejected} (${rejectedPct}%)`}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="h-full w-full rounded-xs bg-slate-200 dark:bg-slate-700" />
                            )}
                        </div>
                        <div className="flex justify-between px-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">
                            <span>Pending</span>
                            <span>Approved</span>
                            <span>Rejected</span>
                        </div>
                    </div>

                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        {total} Active PRs
                    </p>
                </Card>

                {/* Card 2: Pending Approval */}
                <Card className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex min-w-0 items-start gap-3 pr-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                            <ClipboardCheck className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                                Pending Approval
                            </span>
                            <p className="my-0.5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                {stats.pending}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                Awaiting signatures
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={pendingPct}
                        color="#f97316"
                        count={stats.pending}
                        total={total}
                        percentTextColor="text-amber-600 dark:text-amber-400"
                        badgeBgClass="bg-amber-100 text-amber-800 border-amber-200/80 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    />
                </Card>

                {/* Card 3: Approved PRs */}
                <Card className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex min-w-0 items-start gap-3 pr-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                                Approved PRs
                            </span>
                            <p className="my-0.5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                {stats.approved}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                Ready for ordering
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={approvedPct}
                        color="#16a34a"
                        count={stats.approved}
                        total={total}
                        percentTextColor="text-emerald-600 dark:text-emerald-400"
                        badgeBgClass="bg-emerald-100 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    />
                </Card>

                {/* Card 4: PO Created */}
                <Card className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex min-w-0 items-start gap-3 pr-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                            <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                                PO Created
                            </span>
                            <p className="my-0.5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                {stats.ordered}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                Purchase orders generated
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={orderedPct}
                        color="#9333ea"
                        count={stats.ordered}
                        total={total}
                        percentTextColor="text-purple-600 dark:text-purple-400"
                        badgeBgClass="bg-purple-100 text-purple-800 border-purple-200/80 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                    />
                </Card>

                {/* Card 5: Rejected */}
                <Card className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex min-w-0 items-start gap-3 pr-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                            <X className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                                Rejected
                            </span>
                            <p className="my-0.5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                {stats.rejected}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                Returned requests
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={rejectedPct}
                        color="#e11d48"
                        count={stats.rejected}
                        total={total}
                        percentTextColor="text-rose-600 dark:text-rose-400"
                        badgeBgClass="bg-rose-100 text-rose-800 border-rose-200/80 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                    />
                </Card>
            </div>
        </div>
    );
}
