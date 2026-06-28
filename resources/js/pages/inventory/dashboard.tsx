import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { 
    AlertTriangle, 
    CheckCircle2, 
    ClipboardList, 
    FileText, 
    TrendingDown, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Package, 
    Database 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardProps {
    stats: {
        totalItems: number;
        lowStocks: number;
        outOfStocks: number;
        totalValue: number;
        totalProperties: number;
        pendingRequests: number;
    };
    recentIssuances: Array<any>;
    recentReceiving: Array<any>;
    pendingRequests: Array<any>;
}

export default function Dashboard({ stats, recentIssuances, recentReceiving, pendingRequests }: DashboardProps) {
    const breadcrumbs = [{ title: 'GIMS Dashboard', href: '/dashboard' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="GIMS - Government Inventory Management System" />
            <div className="space-y-6 p-6">
                
                {/* Header Section */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Government Inventory Management System (GIMS)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            COA-compliant asset tracking, supplies monitoring, and property accountability desk.
                        </p>
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Metrics 1: Total Stock Value */}
                    <Card className="relative overflow-hidden bg-linear-to-br from-indigo-500/10 via-background to-background">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Supplies Value</CardTitle>
                            <TrendingDown className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">₱{stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <p className="text-xs text-muted-foreground mt-1">Consolidated Moving Avg Cost</p>
                        </CardContent>
                    </Card>

                    {/* Metrics 2: Total Items Cataloged */}
                    <Card className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Supplies Catalog</CardTitle>
                            <Package className="h-4 w-4 text-sky-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalItems} Items</div>
                            <p className="text-xs text-muted-foreground mt-1">Available for requisition (RIS)</p>
                        </CardContent>
                    </Card>

                    {/* Metrics 3: PPE Property Registry */}
                    <Card className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Accountable Property</CardTitle>
                            <Database className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalProperties} Assets</div>
                            <p className="text-xs text-muted-foreground mt-1">Tracked under PAR / ICS</p>
                        </CardContent>
                    </Card>

                    {/* Metrics 4: Pending Requisitions */}
                    <Card className={`relative overflow-hidden ${stats.pendingRequests > 0 ? 'bg-amber-500/5 border-amber-500/20' : ''}`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending RIS Requests</CardTitle>
                            <ClipboardList className={`h-4 w-4 ${stats.pendingRequests > 0 ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.pendingRequests} Requisitions</div>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting approvals / issuance</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Stock Warning Banners if there are stock issues */}
                {(stats.lowStocks > 0 || stats.outOfStocks > 0) && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {stats.lowStocks > 0 && (
                            <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <div>
                                    <span className="font-semibold">{stats.lowStocks} supplies are below reorder level.</span> Consider starting a new Purchase Request (PR).
                                </div>
                            </div>
                        )}
                        {stats.outOfStocks > 0 && (
                            <div className="flex items-center gap-3 p-4 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <div>
                                    <span className="font-semibold">{stats.outOfStocks} supplies are completely out of stock.</span> Requisitions cannot be issued.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Feed Tables */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    
                    {/* Left: Pending RIS Requests */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-amber-500" />
                                Requisitions Dashboard (RIS)
                            </CardTitle>
                            <CardDescription>Recent Requisition & Issue Slips submitted by personnel.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                    No pending requisitions at the moment.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-border pb-2 text-muted-foreground font-medium">
                                                <th className="py-2">RIS Number</th>
                                                <th className="py-2">Requester</th>
                                                <th className="py-2">Status</th>
                                                <th className="py-2 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {pendingRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-muted/50">
                                                    <td className="py-3 font-mono font-medium text-primary">
                                                        <Link href="/inventory/requisitions" className="hover:underline">{req.ris_number.split('-')[0] + '-...'}</Link>
                                                    </td>
                                                    <td className="py-3">
                                                        <div>{req.requester?.name}</div>
                                                        <div className="text-xs text-muted-foreground">{req.requester?.department?.name}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge variant="outline" className="capitalize">
                                                            {req.status.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 text-right text-muted-foreground">
                                                        {new Date(req.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: Activity logs / quick actions */}
                    <div className="space-y-6">
                        {/* Quick Issuances feed */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                    Recent Stock Issuances
                                </CardTitle>
                                <CardDescription>Latest supplies issued out of the warehouse.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentIssuances.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-muted-foreground">
                                        No recent stock issuances.
                                    </div>
                                ) : (
                                    recentIssuances.map((iss) => (
                                        <div key={iss.id} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-mono text-xs font-semibold text-primary">{iss.issue_number}</div>
                                                <div className="text-xs text-muted-foreground">To: {iss.receiver?.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-medium">{iss.issued_date}</div>
                                                <div className="text-[10px] text-muted-foreground">by {iss.issuer?.name}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Deliveries */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <ArrowDownLeft className="h-4 w-4 text-sky-500" />
                                    Recent Deliveries (IAR)
                                </CardTitle>
                                <CardDescription>Latest deliveries accepted by the supply unit.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentReceiving.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-muted-foreground">
                                        No recent deliveries recorded.
                                    </div>
                                ) : (
                                    recentReceiving.map((rec) => (
                                        <div key={rec.id} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-mono text-xs font-semibold text-primary">{rec.iar_number}</div>
                                                <div className="text-xs text-muted-foreground">From: {rec.purchase_order?.supplier?.name ?? 'Supplier'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-medium">{rec.received_date}</div>
                                                <div className="text-[10px] text-muted-foreground">Accepted by: {rec.receiver?.name}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
