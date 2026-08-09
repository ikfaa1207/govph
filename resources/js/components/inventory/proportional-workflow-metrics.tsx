import {
    FileText,
    ClipboardCheck,
    CheckCircle2,
    ShoppingCart,
    X,
} from 'lucide-react';
import React from 'react';
import { Card } from '@/components/ui/card';

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
    badgeBgClass: string;
}

function DonutRing({
    percentage,
    color,
    count,
    total,
    badgeBgClass,
}: DonutRingProps) {
    const size = 68;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex shrink-0 flex-col items-center justify-center">
            {/* Top-right floating percentage pill badge */}
            <div
                className={`absolute -top-2 -right-2 z-10 rounded-full border px-1.5 py-0.5 text-[10px] font-bold shadow-xs ${badgeBgClass}`}
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
                        className="stroke-slate-200 dark:stroke-slate-800"
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
                    <span className="text-xs leading-none font-bold text-foreground">
                        {count > 0 || total > 0 ? `${count}/${total}` : '0'}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-none font-medium text-muted-foreground">
                        ({percentage}%)
                    </span>
                </div>
            </div>
        </div>
    );
}

export function ProportionalWorkflowMetrics({
    stats,
}: ProportionalWorkflowMetricsProps) {
    const total = stats.total || 0;
    const pendingPct =
        total > 0 ? Math.round((stats.pending / total) * 100) : 0;
    const approvedPct =
        total > 0 ? Math.round((stats.approved / total) * 100) : 0;
    const orderedPct =
        total > 0 ? Math.round((stats.ordered / total) * 100) : 0;
    const rejectedPct =
        total > 0 ? Math.round((stats.rejected / total) * 100) : 0;

    return (
        <div className="space-y-3">
            {/* Header Title */}
            <div className="text-center">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    PROPORTIONAL WORKFLOW METRICS (Total PR Volume = {total})
                </h3>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Card 1: Total Requests */}
                <Card className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-300 hover:shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">
                                Total Requests
                            </span>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                                {total}
                            </p>
                        </div>
                    </div>

                    {/* Proportional Stacked Segment Bar */}
                    <div className="my-2.5 space-y-1">
                        <div className="flex justify-between px-0.5 text-[9px] font-medium text-muted-foreground">
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
                                            style={{
                                                width: `${(stats.pending / total) * 100}%`,
                                            }}
                                            className="h-full rounded-xs bg-amber-500 transition-all duration-500"
                                            title={`Pending: ${stats.pending} (${pendingPct}%)`}
                                        />
                                    )}
                                    {stats.approved > 0 && (
                                        <div
                                            style={{
                                                width: `${(stats.approved / total) * 100}%`,
                                            }}
                                            className="h-full rounded-xs bg-emerald-500 transition-all duration-500"
                                            title={`Approved: ${stats.approved} (${approvedPct}%)`}
                                        />
                                    )}
                                    {stats.ordered > 0 && (
                                        <div
                                            style={{
                                                width: `${(stats.ordered / total) * 100}%`,
                                            }}
                                            className="h-full rounded-xs bg-purple-600 transition-all duration-500"
                                            title={`PO Created: ${stats.ordered} (${orderedPct}%)`}
                                        />
                                    )}
                                    {stats.rejected > 0 && (
                                        <div
                                            style={{
                                                width: `${(stats.rejected / total) * 100}%`,
                                            }}
                                            className="h-full rounded-xs bg-rose-500 transition-all duration-500"
                                            title={`Rejected: ${stats.rejected} (${rejectedPct}%)`}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="h-full w-full rounded-xs bg-slate-200 dark:bg-slate-700" />
                            )}
                        </div>
                        <div className="flex justify-between px-0.5 text-[9px] font-medium text-muted-foreground">
                            <span>Pending</span>
                            <span>Approved</span>
                            <span>Rejected</span>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {total} Active PRs
                    </p>
                </Card>

                {/* Card 2: Pending Approval */}
                <Card className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-300 hover:shadow-sm">
                    <div className="flex min-w-0 items-start gap-3 pr-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-muted-foreground">
                                Pending Approval
                            </span>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                                {stats.pending}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                Awaiting signatures
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={pendingPct}
                        color="#f59e0b"
                        count={stats.pending}
                        total={total}
                        badgeBgClass="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    />
                </Card>

                {/* Card 3: Approved PRs */}
                <Card className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-300 hover:shadow-sm">
                    <div className="flex min-w-0 items-start gap-3 pr-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-muted-foreground">
                                Approved PRs
                            </span>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                                {stats.approved}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                Ready for ordering
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={approvedPct}
                        color="#10b981"
                        count={stats.approved}
                        total={total}
                        badgeBgClass="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    />
                </Card>

                {/* Card 4: PO Created */}
                <Card className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-300 hover:shadow-sm">
                    <div className="flex min-w-0 items-start gap-3 pr-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-muted-foreground">
                                PO Created
                            </span>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                                {stats.ordered}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                Purchase orders generated
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={orderedPct}
                        color="#8b5cf6"
                        count={stats.ordered}
                        total={total}
                        badgeBgClass="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                    />
                </Card>

                {/* Card 5: Rejected */}
                <Card className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all duration-300 hover:shadow-sm">
                    <div className="flex min-w-0 items-start gap-3 pr-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                            <X className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-muted-foreground">
                                Rejected
                            </span>
                            <p className="text-2xl font-bold tracking-tight text-foreground">
                                {stats.rejected}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                Returned requests
                            </p>
                        </div>
                    </div>
                    <DonutRing
                        percentage={rejectedPct}
                        color="#f43f5e"
                        count={stats.rejected}
                        total={total}
                        badgeBgClass="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                    />
                </Card>
            </div>
        </div>
    );
}
