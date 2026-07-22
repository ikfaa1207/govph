import { Head, useForm, setLayoutProps, router, Link } from '@inertiajs/react';
import {
    PlusCircle,
    Eye,
    FileText,
    ClipboardList,
    Truck,
    PackageCheck,
    Printer,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { SimplePagination } from '@/components/simple-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SmartSelect } from '@/components/ui/smart-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TourGuide } from '@/components/ui/tour-guide';
import type { TourStep } from '@/components/ui/tour-guide';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface POItem {
    id: number;
    item_id: number;
    quantity: number;
    unit_cost: number;
    remarks: string | null;
    item: {
        id: number;
        name: string;
        unit?: {
            abbreviation: string;
        };
    };
}

interface PurchaseOrder {
    id: number;
    purchase_request_id: number;
    po_number: string;
    supplier_id: number;
    po_date: string;
    delivery_date: string | null;
    status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
    created_at: string;
    purchase_request?: {
        pr_number: string;
        purpose: string;
        requester?: {
            name: string;
        };
    };
    supplier?: {
        name: string;
    };
    items: POItem[];
}

interface PurchaseOrderIndexProps {
    purchaseOrders: {
        data: PurchaseOrder[];
        links: any[];
    };
    stats: {
        total: number;
        draft: number;
        sent: number;
        received: number;
    };
    approvedPurchaseRequests: Array<{
        id: number;
        pr_number: string;
        purpose: string;
        department?: { name: string };
        requester?: { name: string };
        items: Array<{
            item_id: number;
            quantity: number;
            estimated_unit_cost: number;
            item: {
                id: number;
                name: string;
                unit?: { abbreviation: string };
            };
        }>;
    }>;
    suppliers: Array<{
        id: number;
        name: string;
    }>;
    auth: {
        user: {
            id: number;
            name: string;
            permissions?: string[];
        };
    };
    filters?: {
        search?: string;
        status?: string;
        supplier_id?: string;
    };
}

export default function PurchaseOrdersIndex({
    purchaseOrders,
    stats,
    approvedPurchaseRequests,
    suppliers,
    auth,
    filters = {},
}: PurchaseOrderIndexProps) {
    const breadcrumbs = [
        { title: 'Purchase Orders', href: '/inventory/purchase-orders' },
    ];
    setLayoutProps({ breadcrumbs });

    const permissions = auth.user.permissions || [];
    const canCreate = permissions.includes('procurement.create');

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || 'all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleFilterChange = (
        newSearch: string,
        newStatus: string,
        newSupplier: string,
    ) => {
        router.get(
            '/inventory/purchase-orders',
            {
                search: newSearch || undefined,
                status: newStatus !== 'all' ? newStatus : undefined,
                supplier_id: newSupplier !== 'all' ? newSupplier : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange(search, status, supplierId);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setSupplierId('all');
        router.get(
            '/inventory/purchase-orders',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Form for creating PO
    const createForm = useForm({
        purchase_request_id: '',
        supplier_id: '',
        po_date: new Date().toISOString().slice(0, 10),
        delivery_date: '',
        items: [] as Array<{
            item_id: string;
            quantity: number;
            unit_cost: number;
            remarks: string;
        }>,
    });

    const handleSelectPR = (prId: string) => {
        createForm.setData('purchase_request_id', prId);

        const pr = approvedPurchaseRequests.find(
            (p) => String(p.id) === String(prId),
        );

        if (pr) {
            const mappedItems = pr.items.map((item) => ({
                item_id: String(item.item_id),
                quantity: item.quantity,
                unit_cost: item.estimated_unit_cost,
                remarks: '',
            }));
            createForm.setData((data) => ({
                ...data,
                purchase_request_id: prId,
                items: mappedItems,
            }));
        } else {
            createForm.setData('items', []);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updated = [...createForm.data.items] as any[];
        updated[index][field] = value;
        createForm.setData('items', updated);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/inventory/purchase-orders', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                toast.success('Purchase Order created successfully.');
            },
            onError: () => {
                toast.error(
                    'Failed to create Purchase Order. Verify all fields.',
                );
            },
        });
    };

    const handleSendPO = (po: PurchaseOrder) => {
        if (
            !confirm(
                'Mark this PO as sent to supplier? This moves it out of draft state.',
            )
        ) {
            return;
        }

        router.post(
            `/inventory/purchase-orders/${po.id}/send`,
            {},
            {
                onSuccess: () => {
                    setIsDetailOpen(false);
                    toast.success('Purchase Order marked as sent.');
                },
                onError: () => {
                    toast.error('Failed to mark PO as sent.');
                },
            },
        );
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'draft':
                return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300';
            case 'sent':
                return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
            case 'partially_received':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
            case 'received':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
            case 'cancelled':
                return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const calculatePOTotal = (po: PurchaseOrder) => {
        return (
            po.items?.reduce(
                (sum, item) => sum + item.quantity * item.unit_cost,
                0,
            ) || 0
        );
    };

    const tourSteps: TourStep[] = [
        {
            target: '#po-tour-header',
            title: 'Purchase Orders (PO)',
            description:
                'This is the Procurement tracking board where finalized purchase orders are generated and tracked to completion.',
        },
    ];

    if (canCreate) {
        tourSteps.push({
            target: '#po-tour-create',
            title: 'Generate Purchase Order',
            description:
                'Click here to create a PO from any verified and approved Purchase Request.',
        });
    }

    tourSteps.push({
        target: '#po-tour-list',
        title: 'PO Board',
        description:
            'Track the delivery status, total values, and active items of dispatched purchase orders.',
    });

    return (
        <>
            {approvedPurchaseRequests.length > 0 && (
                <TourGuide tourId="po-index" steps={tourSteps} />
            )}
            <div className="space-y-6 p-6">
                <Head title="Purchase Orders" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div id="po-tour-header">
                        <h1 className="text-xl font-bold tracking-tight">
                            Purchase Orders (PO)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Generate official orders from approved Purchase
                            Requests.
                        </p>
                    </div>

                    {canCreate && (
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    id="po-tour-create"
                                    className="w-full gap-2 sm:w-auto"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Generate Purchase Order
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        New Purchase Order
                                    </DialogTitle>
                                    <DialogDescription>
                                        Create a PO by pulling items from an
                                        approved Purchase Request.
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={handleCreateSubmit}
                                    className="space-y-4"
                                >
                                    {approvedPurchaseRequests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                                            <div className="rounded-full bg-amber-50 p-4 text-amber-500 dark:bg-amber-950/20">
                                                <ClipboardList className="h-10 w-10 animate-pulse" />
                                            </div>
                                            <div className="max-w-md space-y-2">
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    No Approved Purchase
                                                    Requests Found
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Purchase Orders require an
                                                    authorized, approved
                                                    Purchase Request (PR) to
                                                    pull items from. Currently,
                                                    there are no approved PRs in
                                                    the system.
                                                </p>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setIsCreateOpen(false)
                                                    }
                                                    className="text-xs"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    asChild
                                                    className="bg-indigo-600 text-xs font-semibold hover:bg-indigo-700"
                                                >
                                                    <Link
                                                        href="/inventory/purchase-requests"
                                                        onClick={() =>
                                                            setIsCreateOpen(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        Go to Purchase Requests
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="space-y-1">
                                                    <Label>
                                                        Select Approved Purchase
                                                        Request
                                                    </Label>
                                                    <SmartSelect
                                                        options={approvedPurchaseRequests.map(
                                                            (p) => ({
                                                                value: String(
                                                                    p.id,
                                                                ),
                                                                label: `${p.pr_number} - ${p.purpose} (${p.department?.name})`,
                                                            }),
                                                        )}
                                                        value={
                                                            createForm.data
                                                                .purchase_request_id
                                                        }
                                                        onValueChange={
                                                            handleSelectPR
                                                        }
                                                        placeholder="Select approved PR..."
                                                        searchThreshold={0}
                                                    />
                                                    {createForm.errors
                                                        .purchase_request_id && (
                                                        <span className="text-xs text-rose-500">
                                                            {
                                                                createForm
                                                                    .errors
                                                                    .purchase_request_id
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <Label>Supplier</Label>
                                                    <SmartSelect
                                                        options={suppliers.map(
                                                            (s) => ({
                                                                value: String(
                                                                    s.id,
                                                                ),
                                                                label: s.name,
                                                            }),
                                                        )}
                                                        value={
                                                            createForm.data
                                                                .supplier_id
                                                        }
                                                        onValueChange={(val) =>
                                                            createForm.setData(
                                                                'supplier_id',
                                                                val,
                                                            )
                                                        }
                                                        placeholder="Select supplier..."
                                                        searchThreshold={0}
                                                    />
                                                    {createForm.errors
                                                        .supplier_id && (
                                                        <span className="text-xs text-rose-500">
                                                            {
                                                                createForm
                                                                    .errors
                                                                    .supplier_id
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <Label>PO Date</Label>
                                                    <DatePicker
                                                        value={
                                                            createForm.data
                                                                .po_date
                                                        }
                                                        onChange={(val) =>
                                                            createForm.setData(
                                                                'po_date',
                                                                val || '',
                                                            )
                                                        }
                                                    />
                                                    {createForm.errors
                                                        .po_date && (
                                                        <span className="text-xs text-rose-500">
                                                            {
                                                                createForm
                                                                    .errors
                                                                    .po_date
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <Label>
                                                        Expected Delivery Date
                                                    </Label>
                                                    <DatePicker
                                                        value={
                                                            createForm.data
                                                                .delivery_date
                                                        }
                                                        onChange={(val) =>
                                                            createForm.setData(
                                                                'delivery_date',
                                                                val || '',
                                                            )
                                                        }
                                                    />
                                                    {createForm.errors
                                                        .delivery_date && (
                                                        <span className="text-xs text-rose-500">
                                                            {
                                                                createForm
                                                                    .errors
                                                                    .delivery_date
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {createForm.data.items.length >
                                                0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold">
                                                        Line Items (Populated
                                                        from PR)
                                                    </Label>
                                                    <div className="overflow-hidden rounded-md border">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>
                                                                        Item
                                                                    </TableHead>
                                                                    <TableHead className="w-[80px]">
                                                                        Quantity
                                                                    </TableHead>
                                                                    <TableHead className="w-[150px]">
                                                                        Unit
                                                                        Cost
                                                                    </TableHead>
                                                                    <TableHead>
                                                                        Remarks
                                                                    </TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {createForm.data.items.map(
                                                                    (
                                                                        row,
                                                                        idx,
                                                                    ) => {
                                                                        const pr =
                                                                            approvedPurchaseRequests.find(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    String(
                                                                                        p.id,
                                                                                    ) ===
                                                                                    String(
                                                                                        createForm
                                                                                            .data
                                                                                            .purchase_request_id,
                                                                                    ),
                                                                            );
                                                                        const prItem =
                                                                            pr?.items.find(
                                                                                (
                                                                                    i,
                                                                                ) =>
                                                                                    String(
                                                                                        i.item_id,
                                                                                    ) ===
                                                                                    String(
                                                                                        row.item_id,
                                                                                    ),
                                                                            );

                                                                        return (
                                                                            <TableRow
                                                                                key={
                                                                                    idx
                                                                                }
                                                                            >
                                                                                <TableCell className="py-2">
                                                                                    <div className="text-sm font-medium">
                                                                                        {prItem
                                                                                            ?.item
                                                                                            ?.name ||
                                                                                            'Loading item...'}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="py-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        min={
                                                                                            1
                                                                                        }
                                                                                        value={
                                                                                            row.quantity
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            handleItemChange(
                                                                                                idx,
                                                                                                'quantity',
                                                                                                parseInt(
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                ) ||
                                                                                                    0,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="py-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        min={
                                                                                            0
                                                                                        }
                                                                                        value={
                                                                                            row.unit_cost
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            handleItemChange(
                                                                                                idx,
                                                                                                'unit_cost',
                                                                                                parseFloat(
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                ) ||
                                                                                                    0,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="py-2">
                                                                                    <Input
                                                                                        placeholder="Remarks"
                                                                                        value={
                                                                                            row.remarks
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            handleItemChange(
                                                                                                idx,
                                                                                                'remarks',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    },
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-2 border-t pt-4">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setIsCreateOpen(false)
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        createForm.processing ||
                                                        createForm.data.items
                                                            .length === 0
                                                    }
                                                >
                                                    Generate PO
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Total Orders
                            </span>
                            <FileText
                                className="h-4 w-4 text-blue-500"
                                strokeWidth={2}
                            />
                        </div>
                        <div className="mt-2 space-y-1">
                            <p className="truncate text-2xl font-bold tracking-tight text-foreground">
                                {stats.total}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Total purchase orders created
                            </p>
                        </div>
                    </Card>
                    <Card className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Draft POs
                            </span>
                            <ClipboardList
                                className="h-4 w-4 text-slate-500"
                                strokeWidth={2}
                            />
                        </div>
                        <div className="mt-2 space-y-1">
                            <p className="truncate text-2xl font-bold tracking-tight text-foreground">
                                {stats.draft}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Pending finalization and dispatch
                            </p>
                        </div>
                    </Card>
                    <Card className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Sent to Supplier
                            </span>
                            <Truck
                                className="h-4 w-4 text-amber-500"
                                strokeWidth={2}
                            />
                        </div>
                        <div className="mt-2 space-y-1">
                            <p className="truncate text-2xl font-bold tracking-tight text-foreground">
                                {stats.sent}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Out for delivery/fulfillment
                            </p>
                        </div>
                    </Card>
                    <Card className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                Received (Deliveries)
                            </span>
                            <PackageCheck
                                className="h-4 w-4 text-emerald-500"
                                strokeWidth={2}
                            />
                        </div>
                        <div className="mt-2 space-y-1">
                            <p className="truncate text-2xl font-bold tracking-tight text-foreground">
                                {stats.received}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Fulfilled and stocked in
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Filter Bar */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-xs sm:flex-row"
                >
                    <div className="flex w-full gap-2 sm:flex-1">
                        <Input
                            placeholder="Search PO number, supplier, PR ref..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md"
                        />
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                        {(search ||
                            status !== 'all' ||
                            supplierId !== 'all') && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearFilters}
                            >
                                Reset
                            </Button>
                        )}
                    </div>

                    <div className="flex w-full gap-2 sm:w-auto">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                handleFilterChange(
                                    search,
                                    e.target.value,
                                    supplierId,
                                );
                            }}
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="received">Received</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={supplierId}
                            onChange={(e) => {
                                setSupplierId(e.target.value);
                                handleFilterChange(
                                    search,
                                    status,
                                    e.target.value,
                                );
                            }}
                            className="max-w-[200px] rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Suppliers</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </form>

                {/* Main Table */}
                <div
                    id="po-tour-list"
                    className="overflow-hidden rounded-lg border bg-card shadow-xs"
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>PR Reference</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>PO Date</TableHead>
                                <TableHead className="text-center">
                                    Items Count
                                </TableHead>
                                <TableHead className="text-right">
                                    Total Value
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrders.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="p-4 md:p-8"
                                    >
                                        <EmptyState
                                            icon={FileText}
                                            title={
                                                search ||
                                                status !== 'all' ||
                                                supplierId !== 'all'
                                                    ? 'No matching purchase orders found'
                                                    : 'No purchase orders generated'
                                            }
                                            description={
                                                search ||
                                                status !== 'all' ||
                                                supplierId !== 'all'
                                                    ? 'Try adjusting your search terms or filters.'
                                                    : 'Get started by generating your first purchase order from an approved request.'
                                            }
                                            action={
                                                canCreate &&
                                                !(
                                                    search ||
                                                    status !== 'all' ||
                                                    supplierId !== 'all'
                                                ) ? (
                                                    <Button
                                                        className="gap-2"
                                                        onClick={() =>
                                                            setIsCreateOpen(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        <PlusCircle className="h-4 w-4" />
                                                        Generate Purchase Order
                                                    </Button>
                                                ) : undefined
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                purchaseOrders.data.map((po) => (
                                    <TableRow key={po.id}>
                                        <TableCell className="font-semibold">
                                            {po.po_number}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {po.purchase_request?.pr_number ||
                                                'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {po.supplier?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell>{po.po_date}</TableCell>
                                        <TableCell className="text-center">
                                            {po.items?.length || 0}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(
                                                calculatePOTotal(po),
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`border ${getStatusColor(po.status)}`}
                                                variant="outline"
                                            >
                                                {po.status
                                                    .replace('_', ' ')
                                                    .toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedPO(po);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="gap-1"
                                            >
                                                <Eye className="h-4 w-4" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <SimplePagination links={purchaseOrders.links} />

                {/* Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-h-[90vh] w-[95vw] overflow-x-hidden overflow-y-auto p-4 sm:max-w-4xl md:p-6">
                        {selectedPO && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-xl">
                                            PO Details: {selectedPO.po_number}
                                        </DialogTitle>
                                        <Badge
                                            className={`border ${getStatusColor(selectedPO.status)}`}
                                            variant="outline"
                                        >
                                            {selectedPO.status
                                                .replace('_', ' ')
                                                .toUpperCase()}
                                        </Badge>
                                    </div>
                                    <DialogDescription>
                                        Generated from PR{' '}
                                        {selectedPO.purchase_request?.pr_number}{' '}
                                        | Filed{' '}
                                        {formatDateTime(selectedPO.created_at)}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-1 gap-4 border-y py-4 text-sm md:grid-cols-2">
                                    <div>
                                        <p className="font-semibold text-muted-foreground">
                                            Supplier
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {selectedPO.supplier?.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-muted-foreground">
                                            PR Purpose
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {
                                                selectedPO.purchase_request
                                                    ?.purpose
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-muted-foreground">
                                            PO Date
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {selectedPO.po_date}
                                        </p>
                                    </div>
                                    {selectedPO.delivery_date && (
                                        <div>
                                            <p className="font-semibold text-muted-foreground">
                                                Expected Delivery
                                            </p>
                                            <p className="font-medium text-foreground">
                                                {selectedPO.delivery_date}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 py-4">
                                    <Label className="text-sm font-semibold">
                                        Ordered Items
                                    </Label>
                                    <div className="overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Item Name
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                        Quantity
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Unit Cost
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Total Cost
                                                    </TableHead>
                                                    <TableHead>
                                                        Remarks
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedPO.items?.map(
                                                    (item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">
                                                                {
                                                                    item.item
                                                                        ?.name
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {item.quantity}{' '}
                                                                {item.item?.unit
                                                                    ?.abbreviation ||
                                                                    'pcs'}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(
                                                                    item.unit_cost,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold">
                                                                {formatCurrency(
                                                                    item.quantity *
                                                                        item.unit_cost,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">
                                                                {item.remarks ||
                                                                    '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                                <TableRow className="border-t-2 bg-muted/50 font-bold hover:bg-muted/50">
                                                    <TableCell
                                                        colSpan={3}
                                                        className="text-right"
                                                    >
                                                        Total Value:
                                                    </TableCell>
                                                    <TableCell className="text-right text-primary">
                                                        {formatCurrency(
                                                            calculatePOTotal(
                                                                selectedPO,
                                                            ),
                                                        )}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 border-t pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDetailOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400"
                                        onClick={() => {
                                            window.open(
                                                `/inventory/purchase-orders/${selectedPO.id}/print`,
                                                '_blank',
                                            );
                                        }}
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print Order (Appendix 61)
                                    </Button>
                                    {selectedPO.status === 'draft' &&
                                        canCreate && (
                                            <Button
                                                className="gap-1 bg-amber-600 text-white hover:bg-amber-700"
                                                onClick={() =>
                                                    handleSendPO(selectedPO)
                                                }
                                            >
                                                Mark as Sent
                                            </Button>
                                        )}
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
