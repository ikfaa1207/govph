import { Head, useForm, setLayoutProps, router, Link } from '@inertiajs/react';
import {
    PlusCircle,
    X,
    Eye,
    Plus,
    ShieldAlert,
    ClipboardCheck,
    Printer,
    Package2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { ProportionalWorkflowMetrics } from '@/components/inventory/proportional-workflow-metrics';
import { SimplePagination } from '@/components/simple-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

interface PRItem {
    id: number;
    item_id: number;
    quantity: number;
    estimated_unit_cost: number;
    remarks: string | null;
    item: {
        id: number;
        name: string;
        unit?: {
            abbreviation: string;
        };
    };
}

interface PurchaseRequest {
    id: number;
    pr_number: string;
    requested_by: number;
    department_id: number;
    purpose: string;
    status: 'pending' | 'approved' | 'rejected' | 'ordered';
    approved_by: number | null;
    rejection_reason: string | null;
    created_at: string;
    requester?: {
        name: string;
    };
    department?: {
        name: string;
    };
    approver?: {
        name: string;
    };
    items: PRItem[];
}

interface PurchaseRequestIndexProps {
    purchaseRequests: {
        data: PurchaseRequest[];
        links: any[];
    };
    stats: {
        total: number;
        pending: number;
        approved: number;
        ordered: number;
        rejected: number;
    };
    items: Array<{
        id: number;
        name: string;
        unit: string;
        unit_cost: number;
    }>;
    departments: Array<{
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
    };
}

export default function PurchaseRequestsIndex({
    purchaseRequests,
    stats,
    items,
    departments,
    auth,
    filters = {},
}: PurchaseRequestIndexProps) {
    const breadcrumbs = [
        { title: 'Purchase Requests', href: '/inventory/purchase-requests' },
    ];
    setLayoutProps({ breadcrumbs });

    const permissions = auth.user.permissions || [];
    const canCreate = permissions.includes('procurement.create');
    const canApprove = permissions.includes('procurement.approve');

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isApproveOpen, setIsApproveOpen] = useState(false);

    const handleFilterChange = (newSearch: string, newStatus: string) => {
        router.get(
            '/inventory/purchase-requests',
            {
                search: newSearch || undefined,
                status: newStatus !== 'all' ? newStatus : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange(search, status);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        router.get(
            '/inventory/purchase-requests',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Form for creating PR
    const createForm = useForm({
        department_id: '',
        purpose: '',
        items: [
            { item_id: '', quantity: 1, estimated_unit_cost: 0, remarks: '' },
        ] as Array<{
            item_id: string;
            quantity: number;
            estimated_unit_cost: number;
            remarks: string;
        }>,
    });

    const handleAddItemRow = () => {
        createForm.setData('items', [
            ...createForm.data.items,
            { item_id: '', quantity: 1, estimated_unit_cost: 0, remarks: '' },
        ]);
    };

    const handleRemoveItemRow = (index: number) => {
        if (createForm.data.items.length === 1) {
            toast.error('At least one item is required.');

            return;
        }

        const updated = [...createForm.data.items];
        updated.splice(index, 1);
        createForm.setData('items', updated);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updated = [...createForm.data.items] as any[];
        updated[index][field] = value;

        // Auto-populate estimated unit cost when item changes
        if (field === 'item_id') {
            const selectedItem = items.find(
                (i) => String(i.id) === String(value),
            );

            if (selectedItem) {
                updated[index]['estimated_unit_cost'] = selectedItem.unit_cost;
            }
        }

        createForm.setData('items', updated);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/inventory/purchase-requests', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                toast.success('Purchase Request submitted successfully.');
            },
            onError: () => {
                toast.error(
                    'Failed to submit Purchase Request. Verify all fields.',
                );
            },
        });
    };

    const handleApprove = () => {
        if (!selectedPR) {
            return;
        }

        router.post(
            `/inventory/purchase-requests/${selectedPR.id}/approve`,
            {},
            {
                onSuccess: () => {
                    setIsApproveOpen(false);
                    setIsDetailOpen(false);
                    toast.success('Purchase Request approved.');
                },
                onError: (err) => {
                    toast.error(
                        err.error || 'Failed to approve Purchase Request.',
                    );
                },
            },
        );
    };

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPR) {
            return;
        }

        rejectForm.post(
            `/inventory/purchase-requests/${selectedPR.id}/reject`,
            {
                onSuccess: () => {
                    setIsRejectOpen(false);
                    setIsDetailOpen(false);
                    rejectForm.reset();
                    toast.success('Purchase Request rejected.');
                },
                onError: () => {
                    toast.error(
                        'Failed to reject. Rejection reason is required.',
                    );
                },
            },
        );
    };

    const totalEstimatedCost = createForm.data.items.reduce((sum, item) => {
        return sum + item.quantity * item.estimated_unit_cost;
    }, 0);

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
            case 'approved':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
            case 'ordered':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
            case 'rejected':
                return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const tourSteps: TourStep[] = [
        {
            target: '#pr-tour-header',
            title: 'Purchase Requests (PR)',
            description:
                'This is where you initiate and manage departmental purchase requests for supplies and equipment prior to procurement.',
        },
    ];

    if (canCreate) {
        tourSteps.push({
            target: '#pr-tour-create',
            title: 'Create Purchase Request',
            description:
                'Click here to draft a new Purchase Request, select catalog line items, and submit for verification.',
        });
    }

    tourSteps.push({
        target: '#pr-tour-list',
        title: 'PR Board',
        description:
            'Track the progress of your requests, view line item details, and approve/reject submissions.',
    });

    return (
        <>
            {items.length > 0 && (
                <TourGuide tourId="pr-index" steps={tourSteps} />
            )}
            <div className="space-y-6 p-6">
                <Head title="Purchase Requests" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div id="pr-tour-header">
                        <h1 className="text-xl font-bold tracking-tight">
                            Purchase Requests (PR)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage requests for procurement before generating
                            Purchase Orders.
                        </p>
                    </div>

                    {canCreate && (
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    id="pr-tour-create"
                                    className="w-full gap-2 sm:w-auto"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Create Purchase Request
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        New Purchase Request
                                    </DialogTitle>
                                    <DialogDescription>
                                        Specify procurement details and line
                                        items. Estimates are based on catalog
                                        values.
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={handleCreateSubmit}
                                    className="space-y-4"
                                >
                                    {items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                                            <div className="rounded-full bg-amber-50 p-4 text-amber-500 dark:bg-amber-950/20">
                                                <Package2 className="h-10 w-10 animate-pulse" />
                                            </div>
                                            <div className="max-w-md space-y-2">
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    No Catalog Items Available
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Purchase Requests require
                                                    choosing items from the
                                                    system's item catalog.
                                                    Currently, there are no
                                                    items in the catalog.
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
                                                        href="/inventory/items"
                                                        onClick={() =>
                                                            setIsCreateOpen(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        Go to Item Catalog
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="space-y-1">
                                                    <Label htmlFor="department_id">
                                                        Target Department
                                                    </Label>
                                                    <SmartSelect
                                                        options={departments.map(
                                                            (d) => ({
                                                                value: String(
                                                                    d.id,
                                                                ),
                                                                label: d.name,
                                                            }),
                                                        )}
                                                        value={
                                                            createForm.data
                                                                .department_id
                                                        }
                                                        onValueChange={(val) =>
                                                            createForm.setData(
                                                                'department_id',
                                                                val,
                                                            )
                                                        }
                                                        placeholder="Select department..."
                                                        searchThreshold={0}
                                                    />
                                                    {createForm.errors
                                                        .department_id && (
                                                        <span className="text-xs text-rose-500">
                                                            {
                                                                createForm
                                                                    .errors
                                                                    .department_id
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="purpose">
                                                    Purpose / Justification
                                                </Label>
                                                <Input
                                                    id="purpose"
                                                    placeholder="e.g. Procurement of IT Equipment for new hires..."
                                                    value={
                                                        createForm.data.purpose
                                                    }
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            'purpose',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {createForm.errors.purpose && (
                                                    <span className="text-xs text-rose-500">
                                                        {
                                                            createForm.errors
                                                                .purpose
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-semibold">
                                                        Line Items
                                                    </Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={
                                                            handleAddItemRow
                                                        }
                                                        className="gap-1"
                                                    >
                                                        <Plus className="h-3 w-3" />{' '}
                                                        Add Item
                                                    </Button>
                                                </div>

                                                <div className="overflow-hidden rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[45%]">
                                                                    Item
                                                                </TableHead>
                                                                <TableHead className="w-[15%]">
                                                                    Quantity
                                                                </TableHead>
                                                                <TableHead className="w-[20%]">
                                                                    Est. Unit
                                                                    Cost
                                                                </TableHead>
                                                                <TableHead className="w-[20%]">
                                                                    Remarks
                                                                </TableHead>
                                                                <TableHead className="w-[50px]"></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {createForm.data.items.map(
                                                                (row, idx) => {
                                                                    return (
                                                                        <TableRow
                                                                            key={
                                                                                idx
                                                                            }
                                                                        >
                                                                            <TableCell className="p-2">
                                                                                <SmartSelect
                                                                                    options={items.map(
                                                                                        (
                                                                                            i,
                                                                                        ) => ({
                                                                                            value: String(
                                                                                                i.id,
                                                                                            ),
                                                                                            label: `${i.name} (${i.unit})`,
                                                                                        }),
                                                                                    )}
                                                                                    value={
                                                                                        row.item_id
                                                                                    }
                                                                                    onValueChange={(
                                                                                        val,
                                                                                    ) =>
                                                                                        handleItemChange(
                                                                                            idx,
                                                                                            'item_id',
                                                                                            val,
                                                                                        )
                                                                                    }
                                                                                    placeholder="Choose item..."
                                                                                    searchThreshold={
                                                                                        0
                                                                                    }
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell className="p-2">
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
                                                                            <TableCell className="p-2">
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min={
                                                                                        0
                                                                                    }
                                                                                    value={
                                                                                        row.estimated_unit_cost
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        handleItemChange(
                                                                                            idx,
                                                                                            'estimated_unit_cost',
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
                                                                            <TableCell className="p-2">
                                                                                <Input
                                                                                    placeholder="Optional remarks"
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
                                                                            <TableCell className="p-2 text-center">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() =>
                                                                                        handleRemoveItemRow(
                                                                                            idx,
                                                                                        )
                                                                                    }
                                                                                    className="text-rose-500 hover:text-rose-700"
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                },
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                                {createForm.errors.items && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            createForm.errors
                                                                .items
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between border-t pt-4">
                                                <div className="text-sm font-semibold">
                                                    Total Estimate:{' '}
                                                    <span className="text-base text-primary">
                                                        {formatCurrency(
                                                            totalEstimatedCost,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setIsCreateOpen(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            createForm.processing
                                                        }
                                                    >
                                                        Submit PR
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Proportional Workflow Metrics */}
                <ProportionalWorkflowMetrics stats={stats} />

                {/* Filter Bar */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-xs sm:flex-row"
                >
                    <div className="flex w-full gap-2 sm:flex-1">
                        <Input
                            placeholder="Search PR number, purpose, requester..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md"
                        />
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                        {(search || status !== 'all') && (
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
                        <Select
                            value={status}
                            onValueChange={(val) => {
                                setStatus(val);
                                handleFilterChange(search, val);
                            }}
                        >
                            <SelectTrigger className="w-[180px] bg-background">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">
                                    Approved
                                </SelectItem>
                                <SelectItem value="ordered">Ordered</SelectItem>
                                <SelectItem value="rejected">
                                    Rejected
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </form>

                {/* Main Table */}
                <div
                    id="pr-tour-list"
                    className="overflow-hidden rounded-lg border bg-card shadow-xs"
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PR Number</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead className="text-center">
                                    Items Count
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Filed</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseRequests.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="p-4 md:p-8"
                                    >
                                        <EmptyState
                                            icon={ClipboardCheck}
                                            title={
                                                search || status !== 'all'
                                                    ? 'No matching purchase requests found'
                                                    : 'No purchase requests filed'
                                            }
                                            description={
                                                search || status !== 'all'
                                                    ? 'Try adjusting your search terms or filters.'
                                                    : 'Get started by filing a new purchase request.'
                                            }
                                            action={
                                                canCreate &&
                                                !(
                                                    search || status !== 'all'
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
                                                        Create Purchase Request
                                                    </Button>
                                                ) : undefined
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                purchaseRequests.data.map((pr) => (
                                    <TableRow key={pr.id}>
                                        <TableCell className="font-semibold">
                                            {pr.pr_number}
                                        </TableCell>
                                        <TableCell>
                                            {pr.department?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {pr.requester?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {pr.purpose}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {pr.items?.length || 0}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`border ${getStatusColor(pr.status)}`}
                                                variant="outline"
                                            >
                                                {pr.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(pr.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedPR(pr);
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

                <SimplePagination links={purchaseRequests.links} />

                {/* Detail Modal */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-h-[90vh] w-[95vw] overflow-x-hidden overflow-y-auto p-4 sm:max-w-4xl md:p-6">
                        {selectedPR && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-xl">
                                            PR Details: {selectedPR.pr_number}
                                        </DialogTitle>
                                        <Badge
                                            className={`border ${getStatusColor(selectedPR.status)}`}
                                            variant="outline"
                                        >
                                            {selectedPR.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <DialogDescription>
                                        Filed on{' '}
                                        {formatDateTime(selectedPR.created_at)}{' '}
                                        by {selectedPR.requester?.name}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-1 gap-4 border-y py-4 text-sm md:grid-cols-2">
                                    <div>
                                        <p className="font-semibold text-muted-foreground">
                                            Department
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {selectedPR.department?.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-muted-foreground">
                                            Purpose
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {selectedPR.purpose}
                                        </p>
                                    </div>
                                    {selectedPR.approver && (
                                        <div>
                                            <p className="font-semibold text-muted-foreground">
                                                Approved By
                                            </p>
                                            <p className="font-medium text-foreground">
                                                {selectedPR.approver.name}
                                            </p>
                                        </div>
                                    )}
                                    {selectedPR.rejection_reason && (
                                        <div className="col-span-2 rounded-md border border-rose-100 bg-rose-50 p-3 dark:border-rose-900/30 dark:bg-rose-950/20">
                                            <p className="flex items-center gap-1 font-semibold text-rose-800 dark:text-rose-300">
                                                <ShieldAlert className="h-4 w-4" />{' '}
                                                Rejection Reason
                                            </p>
                                            <p className="mt-1 text-rose-700 dark:text-rose-400">
                                                {selectedPR.rejection_reason}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 py-4">
                                    <Label className="text-sm font-semibold">
                                        Requested Line Items
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
                                                        Est. Unit Cost
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Est. Total Cost
                                                    </TableHead>
                                                    <TableHead>
                                                        Remarks
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedPR.items?.map(
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
                                                                    item.estimated_unit_cost,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold">
                                                                {formatCurrency(
                                                                    item.quantity *
                                                                        item.estimated_unit_cost,
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
                                                        Total Est. Cost:
                                                    </TableCell>
                                                    <TableCell className="text-right text-primary">
                                                        {formatCurrency(
                                                            selectedPR.items?.reduce(
                                                                (sum, item) =>
                                                                    sum +
                                                                    item.quantity *
                                                                        item.estimated_unit_cost,
                                                                0,
                                                            ),
                                                        )}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Actions panel */}
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
                                                `/inventory/purchase-requests/${selectedPR.id}/print`,
                                                '_blank',
                                            );
                                        }}
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print Request (Appendix 60)
                                    </Button>
                                    {canApprove &&
                                        selectedPR.status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setIsRejectOpen(true)
                                                    }
                                                >
                                                    Reject PR
                                                </Button>
                                                <Button
                                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                    onClick={() =>
                                                        setIsApproveOpen(true)
                                                    }
                                                >
                                                    Approve PR
                                                </Button>
                                            </>
                                        )}
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Reject Reason Dialog */}
                <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Reject Purchase Request</DialogTitle>
                            <DialogDescription>
                                Please specify the reason for rejecting this
                                purchase request.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={handleRejectSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <Label htmlFor="rejection_reason">
                                    Reason for Rejection
                                </Label>
                                <textarea
                                    id="rejection_reason"
                                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) =>
                                        rejectForm.setData(
                                            'rejection_reason',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Specify why the PR is rejected..."
                                    required
                                />
                                {rejectForm.errors.rejection_reason && (
                                    <p className="text-xs text-rose-500">
                                        {rejectForm.errors.rejection_reason}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsRejectOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={rejectForm.processing}
                                >
                                    Confirm Reject
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Approve Confirmation Dialog */}
                <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Approve Purchase Request</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to approve this Purchase
                                Request? This will route the request to the next
                                stage of approval.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsApproveOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={handleApprove}
                            >
                                Confirm Approve
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
