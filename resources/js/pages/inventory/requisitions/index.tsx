import { Head, useForm, setLayoutProps, router } from '@inertiajs/react';
import {
    PlusCircle,
    X,
    ClipboardCheck,
    Package2,
    ShieldAlert,
    Printer,
    Eye,
    ClipboardList,
    ChevronDown,
    Plus,
    Minus,
    FileText,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { SimplePagination } from '@/components/simple-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { CoachMark } from '@/components/ui/coach-mark';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { formatDateTime } from '@/lib/utils';

interface RequisitionItem {
    id: number;
    item_id: number;
    quantity_requested: number;
    quantity_approved: number;
    quantity_issued: number;
    item: {
        id: number;
        name: string;
        unit_cost: number;
        current_stock: number;
        unit?: {
            abbreviation: string;
        };
    };
}

interface Requisition {
    id: number;
    ris_number: string;
    requesting_employee_id: number;
    department_id: number;
    status:
        | 'pending_dept_head'
        | 'rejected_dept_head'
        | 'pending_supply'
        | 'issued'
        | 'partially_issued'
        | 'cancelled';
    department_head_id: number | null;
    approved_at: string | null;
    remarks: string | null;
    created_at: string;
    requester?: {
        name: string;
        department?: {
            name: string;
        };
    };
    items: RequisitionItem[];
}

interface RequisitionStats {
    total_ris: number;
    pending_approval: number;
    pending_issuance: number;
    completed: number;
}

interface RequisitionIndexProps {
    requisitions: {
        data: Requisition[];
        links: any[];
    };
    stats: RequisitionStats;
    items: any[];
    currentEmployee: any;
    filters?: {
        search?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    };
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role:
                | 'admin'
                | 'supply_officer'
                | 'property_custodian'
                | 'dept_head'
                | 'employee'
                | 'auditor';
            permissions?: string[];
        };
    };
}

export default function RequisitionsIndex({
    requisitions,
    stats,
    items,
    auth,
    currentEmployee,
    filters = {},
}: RequisitionIndexProps) {
    const breadcrumbs = [
        { title: 'Requisitions (RIS)', href: '/inventory/requisitions' },
    ];
    setLayoutProps({ breadcrumbs });
    const userRole = auth.user.role;

    const permissions = auth.user.permissions || [];
    const canCreate = permissions.includes('request.create');
    const canApprove = permissions.includes('request.approve');
    const canIssue = permissions.includes('warehouse.issue');

    // Search and Filter States
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleFilterChange = (
        newSearch: string,
        newStatus: string,
        newStart: string,
        newEnd: string,
    ) => {
        router.get(
            '/inventory/requisitions',
            {
                search: newSearch || undefined,
                status: newStatus !== 'all' ? newStatus : undefined,
                start_date: newStart || undefined,
                end_date: newEnd || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange(search, status, startDate, endDate);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/inventory/requisitions',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const canUserApproveReq = (req: Requisition) => {
        if (!canApprove) {
            return false;
        }

        if (
            currentEmployee &&
            req.requesting_employee_id === currentEmployee.id
        ) {
            return false;
        }

        const isAdmin = userRole === 'admin';

        if (isAdmin) {
            return true;
        }

        return currentEmployee && req.department_head_id === currentEmployee.id;
    };

    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isIssueOpen, setIsIssueOpen] = useState(false);
    const [showSummaryPreview, setShowSummaryPreview] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Form for Request Submission
    const requestForm = useForm({
        items: [{ item_id: '', quantity: 1, isNew: false }] as Array<{
            item_id: string;
            quantity: number;
            isNew: boolean;
        }>,
        purpose: '',
    });

    // Form for Dept Head Approval
    const approveForm = useForm({
        items: [] as Array<{ id: number; quantity_approved: number }>,
    });

    // Form for Dept Head Rejection
    const rejectForm = useForm({
        remarks: '',
    });

    // Form for Supply Officer Issuance
    const issueForm = useForm({
        items: [] as Array<{ id: number; quantity_issued: number }>,
    });

    const handleAddRequestItem = () => {
        requestForm.setData('items', [
            ...requestForm.data.items,
            { item_id: '', quantity: 1, isNew: true },
        ]);
        setTimeout(() => {
            if (tableContainerRef.current) {
                tableContainerRef.current.scrollTop =
                    tableContainerRef.current.scrollHeight;
            }
        }, 50);
    };

    const handleRemoveRequestItem = (index: number) => {
        const newItems = [...requestForm.data.items];
        newItems.splice(index, 1);
        requestForm.setData('items', newItems);
    };

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestForm.post('/inventory/requisitions', {
            onSuccess: () => {
                setIsRequestOpen(false);
                requestForm.reset();
                toast.success('Requisition Slip (RIS) filed successfully!');
            },
            onError: () => {
                toast.error('Failed to submit requisition.');
            },
        });
    };

    const openApproveDialog = (req: Requisition) => {
        setSelectedReq(req);
        approveForm.setData(
            'items',
            req.items.map((item) => ({
                id: item.id,
                quantity_approved: item.quantity_requested,
            })),
        );
        setIsApproveOpen(true);
    };

    const handleApproveSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReq) {
            return;
        }

        approveForm.post(`/inventory/requisitions/${selectedReq.id}/approve`, {
            onSuccess: () => {
                setIsApproveOpen(false);
                toast.success(
                    'Requisition approved and routed to Supply Unit.',
                );
            },
            onError: () => {
                toast.error('Failed to approve requisition.');
            },
        });
    };

    const openRejectDialog = (req: Requisition) => {
        setSelectedReq(req);
        rejectForm.setData('remarks', '');
        setIsRejectOpen(true);
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReq) {
            return;
        }

        rejectForm.post(`/inventory/requisitions/${selectedReq.id}/reject`, {
            onSuccess: () => {
                setIsRejectOpen(false);
                toast.success('Requisition has been rejected.');
            },
            onError: () => {
                toast.error('Failed to reject requisition.');
            },
        });
    };

    const openIssueDialog = (req: Requisition) => {
        setSelectedReq(req);
        issueForm.setData(
            'items',
            req.items.map((item) => ({
                id: item.id,
                quantity_issued: item.quantity_approved - item.quantity_issued,
            })),
        );
        setIsIssueOpen(true);
    };

    const handleIssueSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReq) {
            return;
        }

        // Double check stock availability
        let stockOk = true;
        issueForm.data.items.forEach((issueItem) => {
            const dbItem = selectedReq.items.find((i) => i.id === issueItem.id);

            if (
                dbItem &&
                dbItem.item.current_stock < issueItem.quantity_issued
            ) {
                stockOk = false;
                toast.error(
                    `Insufficient stock for item: ${dbItem.item.name}. Available: ${dbItem.item.current_stock}`,
                );
            }
        });

        if (!stockOk) {
            return;
        }

        issueForm.post(`/inventory/requisitions/${selectedReq.id}/issue`, {
            onSuccess: () => {
                setIsIssueOpen(false);
                toast.success(
                    'Items issued out of warehouse and Stock Cards updated.',
                );
            },
            onError: () => {
                toast.error('Failed to issue items. Check balances.');
            },
        });
    };

    return (
        <>
            <Head title="Requisitions Board - GIMS" />
            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Requisitions & Issue Slips (RIS)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Submit supply requests, authorize approvals, and
                            manage handovers.
                        </p>
                    </div>

                    {canCreate && (
                        <CoachMark
                            id="requisitions-new-ris"
                            title="Welcome to Requisitions!"
                            description="Start here to request new supplies. Once submitted, your Department Head will review it."
                        >
                            <Dialog
                                open={isRequestOpen}
                                onOpenChange={(open) => {
                                    setIsRequestOpen(open);

                                    if (!open) {
                                        setShowSummaryPreview(false);
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <PlusCircle className="h-4 w-4" />
                                        New Requisition (RIS)
                                    </Button>
                                </DialogTrigger>
                                <DialogContent
                                    className="max-h-[85vh] overflow-y-auto sm:max-w-2xl sm:p-8"
                                    onPointerDownOutside={(e) =>
                                        e.preventDefault()
                                    }
                                    onInteractOutside={(e) =>
                                        e.preventDefault()
                                    }
                                >
                                    <DialogHeader className="mb-2">
                                        <DialogTitle className="text-xl">
                                            File Requisition Slip (RIS)
                                        </DialogTitle>
                                        <DialogDescription className="text-sm">
                                            Select supplies from the catalog and
                                            specify quantities requested.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form
                                        onSubmit={handleRequestSubmit}
                                        className="space-y-6"
                                    >
                                        <div
                                            ref={tableContainerRef}
                                            className="max-h-[30vh] overflow-y-auto rounded-md border border-border"
                                        >
                                            <Table className="text-xs">
                                                <TableHeader>
                                                    <TableRow className="bg-muted/50">
                                                        <TableHead className="p-3">
                                                            Item *
                                                        </TableHead>
                                                        <TableHead className="w-36 p-3">
                                                            Qty Requested *
                                                        </TableHead>
                                                        <TableHead className="w-12 p-3 text-center"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {requestForm.data.items.map(
                                                        (item, idx) => {
                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        item.isNew
                                                                            ? `new-${idx}`
                                                                            : idx
                                                                    }
                                                                >
                                                                    <TableCell className="p-2.5">
                                                                        <SmartSelect
                                                                            options={items.map(
                                                                                (
                                                                                    i,
                                                                                ) => ({
                                                                                    value: String(
                                                                                        i.id,
                                                                                    ),
                                                                                    label: `${i.name} (Qty Available: ${i.current_stock} ${i.unit})`,
                                                                                }),
                                                                            )}
                                                                            value={
                                                                                item.item_id
                                                                                    ? String(
                                                                                          item.item_id,
                                                                                      )
                                                                                    : undefined
                                                                            }
                                                                            onValueChange={(
                                                                                val,
                                                                            ) => {
                                                                                const newItems =
                                                                                    [
                                                                                        ...requestForm
                                                                                            .data
                                                                                            .items,
                                                                                    ];
                                                                                newItems[
                                                                                    idx
                                                                                ].item_id =
                                                                                    val;
                                                                                requestForm.setData(
                                                                                    'items',
                                                                                    newItems,
                                                                                );
                                                                            }}
                                                                            placeholder="Select Item"
                                                                            className="h-8 w-full bg-background text-xs"
                                                                            searchThreshold={
                                                                                0
                                                                            }
                                                                            defaultOpen={
                                                                                item.isNew
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="p-2.5">
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            value={
                                                                                item.quantity
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) => {
                                                                                const newItems =
                                                                                    [
                                                                                        ...requestForm
                                                                                            .data
                                                                                            .items,
                                                                                    ];
                                                                                newItems[
                                                                                    idx
                                                                                ].quantity =
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                    0;
                                                                                requestForm.setData(
                                                                                    'items',
                                                                                    newItems,
                                                                                );
                                                                            }}
                                                                            className="h-8 p-1.5 text-xs"
                                                                            required
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="p-2.5 text-center">
                                                                        {requestForm
                                                                            .data
                                                                            .items
                                                                            .length >
                                                                            1 && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                                                onClick={() =>
                                                                                    handleRemoveRequestItem(
                                                                                        idx,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        },
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddRequestItem}
                                            className="w-full"
                                        >
                                            Add Another Item
                                        </Button>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="purpose"
                                                className="text-xs font-semibold"
                                            >
                                                Purpose / Remarks
                                            </Label>
                                            <textarea
                                                id="purpose"
                                                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                placeholder="e.g. Office consumption for Q3"
                                                value={requestForm.data.purpose}
                                                onChange={(e) =>
                                                    requestForm.setData(
                                                        'purpose',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        {showSummaryPreview && (
                                            <div className="animate-in space-y-3 rounded-lg border border-border bg-muted/40 p-4 duration-200 fade-in">
                                                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    <ClipboardList className="h-4 w-4 text-primary" />
                                                    Requisition Summary Preview
                                                </div>
                                                <div className="space-y-1.5 text-xs text-foreground">
                                                    <div className="grid grid-cols-12 border-b border-border pb-1 font-medium text-muted-foreground">
                                                        <span className="col-span-8">
                                                            Item Name
                                                        </span>
                                                        <span className="col-span-4 text-right">
                                                            Quantity
                                                        </span>
                                                    </div>
                                                    <div className="max-h-[120px] space-y-1 overflow-y-auto pr-1">
                                                        {requestForm.data.items.map(
                                                            (item, idx) => {
                                                                const selectedItem =
                                                                    items.find(
                                                                        (i) =>
                                                                            String(
                                                                                i.id,
                                                                            ) ===
                                                                            String(
                                                                                item.item_id,
                                                                            ),
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="grid grid-cols-12 py-0.5"
                                                                    >
                                                                        <span className="col-span-8 truncate font-medium">
                                                                            {selectedItem ? (
                                                                                selectedItem.name
                                                                            ) : (
                                                                                <em className="text-muted-foreground">
                                                                                    Unselected
                                                                                </em>
                                                                            )}
                                                                        </span>
                                                                        <span className="col-span-4 text-right font-mono text-muted-foreground">
                                                                            {
                                                                                item.quantity
                                                                            }{' '}
                                                                            {selectedItem?.unit ||
                                                                                ''}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                                                        <span>
                                                            Total Items:{' '}
                                                            {
                                                                requestForm.data.items.filter(
                                                                    (i) =>
                                                                        i.item_id,
                                                                ).length
                                                            }
                                                        </span>
                                                        <span>
                                                            Total Qty:{' '}
                                                            {requestForm.data.items.reduce(
                                                                (sum, i) =>
                                                                    sum +
                                                                    (i.quantity ||
                                                                        0),
                                                                0,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 text-xs"
                                                onClick={() =>
                                                    setShowSummaryPreview(
                                                        !showSummaryPreview,
                                                    )
                                                }
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                {showSummaryPreview
                                                    ? 'Hide Preview'
                                                    : 'View Summary'}
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setIsRequestOpen(false)
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        requestForm.processing
                                                    }
                                                    className="px-5"
                                                >
                                                    Submit RIS
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CoachMark>
                    )}
                </div>

                {/* Statistics Overview */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-blue-500 bg-card bg-linear-to-tr from-transparent to-blue-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-blue-500/5">
                                <ClipboardList
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-blue-500 uppercase">
                                    Total RIS filed
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.total_ris}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-violet-500 bg-card bg-linear-to-tr from-transparent to-violet-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-violet-500/5">
                                <ClipboardCheck
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-violet-500 uppercase">
                                    Pending Approval
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.pending_approval}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-amber-500 bg-card bg-linear-to-tr from-transparent to-amber-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-amber-500/5">
                                <Package2
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-amber-500 uppercase">
                                    Pending Issuance
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.pending_issuance}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-emerald-500 bg-card bg-linear-to-tr from-transparent to-emerald-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                                <ClipboardCheck
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-emerald-500 uppercase">
                                    Completed
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.completed}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Search and Filters Bar */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Filter Requisition Board
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Search
                                </Label>
                                <form
                                    onSubmit={handleSearchSubmit}
                                    className="flex gap-2"
                                >
                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search by RIS no., requester..."
                                        className="h-9 text-xs"
                                    />
                                    <Button
                                        type="submit"
                                        className="h-9 text-xs"
                                    >
                                        Search
                                    </Button>
                                </form>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Status
                                </Label>
                                <SmartSelect
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        {
                                            value: 'pending_dept_head',
                                            label: 'Pending Dept Head',
                                        },
                                        {
                                            value: 'rejected_dept_head',
                                            label: 'Rejected Dept Head',
                                        },
                                        {
                                            value: 'pending_supply',
                                            label: 'Pending Supply',
                                        },
                                        {
                                            value: 'partially_issued',
                                            label: 'Partially Issued',
                                        },
                                        {
                                            value: 'issued',
                                            label: 'Issued / Completed',
                                        },
                                    ]}
                                    value={status}
                                    onValueChange={(val) => {
                                        setStatus(val);
                                        handleFilterChange(
                                            search,
                                            val,
                                            startDate,
                                            endDate,
                                        );
                                    }}
                                    placeholder="Select Status"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Start Date
                                </Label>
                                <DatePicker
                                    value={startDate}
                                    onChange={(val) => {
                                        setStartDate(val);
                                        handleFilterChange(
                                            search,
                                            status,
                                            val,
                                            endDate,
                                        );
                                    }}
                                    placeholder="Pick start date"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    End Date
                                </Label>
                                <DatePicker
                                    value={endDate}
                                    onChange={(val) => {
                                        setEndDate(val);
                                        handleFilterChange(
                                            search,
                                            status,
                                            startDate,
                                            val,
                                        );
                                    }}
                                    placeholder="Pick end date"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        {(search ||
                            status !== 'all' ||
                            startDate ||
                            endDate) && (
                            <div className="mt-4 flex items-center justify-between rounded-lg border border-muted bg-muted/40 p-3">
                                <div className="text-xs text-muted-foreground">
                                    Active filters are limiting the list
                                    display.
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-7 text-xs"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Requisitions List Board */}
                <div className="grid gap-6">
                    {requisitions.data.length === 0 ? (
                        <Card>
                            <CardContent className="p-4 md:p-8">
                                <EmptyState
                                    icon={FileText}
                                    title={
                                        search ||
                                        status !== 'all' ||
                                        startDate ||
                                        endDate
                                            ? 'No matching requisitions (RIS) found'
                                            : 'No requisitions (RIS) filed'
                                    }
                                    description={
                                        search ||
                                        status !== 'all' ||
                                        startDate ||
                                        endDate
                                            ? 'Try adjusting your search terms or filters.'
                                            : 'Get started by creating a new requisition for supplies or equipment.'
                                    }
                                    action={
                                        canCreate &&
                                        !(
                                            search ||
                                            status !== 'all' ||
                                            startDate ||
                                            endDate
                                        ) ? (
                                            <Button
                                                className="gap-2"
                                                onClick={() =>
                                                    setIsRequestOpen(true)
                                                }
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Create Requisition
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        requisitions.data.map((req) => (
                            <Card
                                key={req.id}
                                className="relative overflow-hidden"
                            >
                                <Collapsible>
                                    <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="font-mono text-base font-semibold text-primary">
                                                    {req.ris_number}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className={`font-medium capitalize ${
                                                        req.status ===
                                                        'pending_dept_head'
                                                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                                                            : req.status ===
                                                                'rejected_dept_head'
                                                              ? 'animate-pulse border-destructive/30 bg-destructive/10 text-destructive'
                                                              : req.status ===
                                                                  'pending_supply'
                                                                ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                                                                : req.status ===
                                                                    'issued'
                                                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                                                  : req.status ===
                                                                      'partially_issued'
                                                                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500'
                                                                    : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {req.status.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Submitted by{' '}
                                                <strong>
                                                    {req.requester?.name}
                                                </strong>{' '}
                                                (
                                                {req.requester?.department
                                                    ?.name || 'Staff'}
                                                ) on{' '}
                                                {formatDateTime(req.created_at)}
                                            </CardDescription>
                                        </div>

                                        {/* Action Buttons depending on role and status */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="gap-1"
                                            >
                                                <a
                                                    href={`/inventory/requisitions/${req.id}/print`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                    Print RIS
                                                </a>
                                            </Button>
                                            {canUserApproveReq(req) &&
                                                req.status ===
                                                    'pending_dept_head' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="gap-1 bg-indigo-600 hover:bg-indigo-700"
                                                            onClick={() =>
                                                                openApproveDialog(
                                                                    req,
                                                                )
                                                            }
                                                        >
                                                            <ClipboardCheck className="h-4 w-4" />
                                                            Approve RIS
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="gap-1"
                                                            onClick={() =>
                                                                openRejectDialog(
                                                                    req,
                                                                )
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                            Reject RIS
                                                        </Button>
                                                    </>
                                                )}
                                            {canIssue &&
                                                (req.status ===
                                                    'pending_supply' ||
                                                    req.status ===
                                                        'partially_issued') && (
                                                    <Button
                                                        size="sm"
                                                        className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() =>
                                                            openIssueDialog(req)
                                                        }
                                                    >
                                                        <Package2 className="h-4 w-4" />
                                                        Issue Supplies
                                                    </Button>
                                                )}
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 [&[data-state=open]>svg]:rotate-180"
                                                >
                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                                    <span className="sr-only">
                                                        Toggle
                                                    </span>
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>
                                    </CardHeader>

                                    <CollapsibleContent>
                                        <CardContent className="border-t border-border pt-4">
                                            <div className="space-y-4">
                                                {/* Items requested grid */}
                                                <div className="overflow-x-auto">
                                                    <Table className="text-xs">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>
                                                                    Supply Name
                                                                </TableHead>
                                                                <TableHead className="text-right">
                                                                    Requested
                                                                    Qty
                                                                </TableHead>
                                                                <TableHead className="text-right">
                                                                    Approved Qty
                                                                </TableHead>
                                                                <TableHead className="text-right">
                                                                    Issued Qty
                                                                </TableHead>
                                                                <TableHead className="text-right">
                                                                    On Hand
                                                                    Stock
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {req.items.map(
                                                                (item) => (
                                                                    <TableRow
                                                                        key={
                                                                            item.id
                                                                        }
                                                                    >
                                                                        <TableCell className="font-medium">
                                                                            {
                                                                                item
                                                                                    .item
                                                                                    .name
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            {
                                                                                item.quantity_requested
                                                                            }{' '}
                                                                            {item
                                                                                .item
                                                                                .unit
                                                                                ?.abbreviation ||
                                                                                'pcs'}
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                                                            {
                                                                                item.quantity_approved
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                            {
                                                                                item.quantity_issued
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-mono text-muted-foreground">
                                                                            {
                                                                                item
                                                                                    .item
                                                                                    .current_stock
                                                                            }
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ),
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                {req.remarks && (
                                                    <div className="rounded bg-muted/40 p-2.5 text-xs text-muted-foreground">
                                                        <strong>
                                                            Purpose:
                                                        </strong>{' '}
                                                        {req.remarks}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        ))
                    )}
                </div>

                <div className="mt-4">
                    <SimplePagination links={requisitions.links} />
                </div>

                {/* Dialog: Dept Head Approval Forms */}
                <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                    <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                Authorize Requisition Slip (RIS)
                            </DialogTitle>
                            <DialogDescription>
                                Review the requested quantities and authorize
                                the department approval.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedReq && (
                            <form
                                onSubmit={handleApproveSubmit}
                                className="space-y-4"
                            >
                                <div className="max-h-[60vh] overflow-y-auto pr-2">
                                    <div className="space-y-3">
                                        {selectedReq.items.map((item) => {
                                            const formItem =
                                                approveForm.data.items.find(
                                                    (i) => i.id === item.id,
                                                );
                                            const maxQty =
                                                item.quantity_requested;
                                            const currentQty =
                                                formItem?.quantity_approved ??
                                                0;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold">
                                                            {item.item.name}
                                                        </div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Requested:{' '}
                                                            <span className="font-medium text-foreground">
                                                                {
                                                                    item.quantity_requested
                                                                }
                                                            </span>{' '}
                                                            {item.item.unit
                                                                ?.abbreviation ||
                                                                'pcs'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Label className="hidden text-xs font-medium text-muted-foreground sm:block">
                                                            Approve Qty:
                                                        </Label>
                                                        <div className="flex items-center rounded-md border bg-background shadow-sm">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-none border-r hover:bg-muted"
                                                                onClick={() => {
                                                                    const newItems =
                                                                        [
                                                                            ...approveForm
                                                                                .data
                                                                                .items,
                                                                        ];
                                                                    const target =
                                                                        newItems.find(
                                                                            (
                                                                                i,
                                                                            ) =>
                                                                                i.id ===
                                                                                item.id,
                                                                        );

                                                                    if (
                                                                        target &&
                                                                        target.quantity_approved >
                                                                            0
                                                                    ) {
                                                                        target.quantity_approved--;
                                                                        approveForm.setData(
                                                                            'items',
                                                                            newItems,
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    currentQty <=
                                                                    0
                                                                }
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <div className="w-12 text-center text-sm font-medium">
                                                                {currentQty}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-none border-l hover:bg-muted"
                                                                onClick={() => {
                                                                    const newItems =
                                                                        [
                                                                            ...approveForm
                                                                                .data
                                                                                .items,
                                                                        ];
                                                                    const target =
                                                                        newItems.find(
                                                                            (
                                                                                i,
                                                                            ) =>
                                                                                i.id ===
                                                                                item.id,
                                                                        );

                                                                    if (
                                                                        target &&
                                                                        target.quantity_approved <
                                                                            maxQty
                                                                    ) {
                                                                        target.quantity_approved++;
                                                                        approveForm.setData(
                                                                            'items',
                                                                            newItems,
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    currentQty >=
                                                                    maxQty
                                                                }
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 border-t pt-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsApproveOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={approveForm.processing}
                                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    >
                                        Approve & Sign
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Supply Officer Issuance Forms */}
                <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
                    <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                Issue Supplies to Employee
                            </DialogTitle>
                            <DialogDescription>
                                Validate quantities and process stock-out cards.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedReq && (
                            <form
                                onSubmit={handleIssueSubmit}
                                className="space-y-4"
                            >
                                <div className="max-h-[60vh] overflow-y-auto pr-2">
                                    <div className="space-y-3">
                                        {selectedReq.items.map((item) => {
                                            const formItem =
                                                issueForm.data.items.find(
                                                    (i) => i.id === item.id,
                                                );
                                            const maxToIssue =
                                                item.quantity_approved -
                                                item.quantity_issued;
                                            const currentStock =
                                                item.item.current_stock;
                                            const currentQty =
                                                formItem?.quantity_issued ?? 0;
                                            const isInsufficient =
                                                currentStock < currentQty;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`flex flex-col justify-between gap-4 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center ${isInsufficient ? 'border-destructive bg-destructive/10' : 'bg-card'}`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold">
                                                            {item.item.name}
                                                        </div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Approved:{' '}
                                                            <span className="font-medium text-foreground">
                                                                {
                                                                    item.quantity_approved
                                                                }
                                                            </span>{' '}
                                                            {item.item.unit
                                                                ?.abbreviation ||
                                                                'pcs'}
                                                            <span className="ml-1 text-muted-foreground/80">
                                                                (Issued:{' '}
                                                                {
                                                                    item.quantity_issued
                                                                }
                                                                )
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={`mt-1 flex flex-col text-xs ${isInsufficient ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
                                                        >
                                                            <span>
                                                                Warehouse Stock:{' '}
                                                                <span className="font-bold">
                                                                    {
                                                                        currentStock
                                                                    }
                                                                </span>
                                                            </span>
                                                            {isInsufficient && (
                                                                <span className="mt-1 flex items-center gap-1 text-[10px]">
                                                                    <ShieldAlert className="h-3 w-3" />{' '}
                                                                    Insufficient
                                                                    stock in
                                                                    warehouse!
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Label
                                                            className={`hidden text-xs font-medium sm:block ${isInsufficient ? 'text-destructive' : 'text-muted-foreground'}`}
                                                        >
                                                            Issue Qty:
                                                        </Label>
                                                        <div
                                                            className={`flex items-center rounded-md border bg-background shadow-sm ${isInsufficient ? 'border-destructive' : ''}`}
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-8 w-8 rounded-none border-r hover:bg-muted ${isInsufficient ? 'border-destructive' : ''}`}
                                                                onClick={() => {
                                                                    const newItems =
                                                                        [
                                                                            ...issueForm
                                                                                .data
                                                                                .items,
                                                                        ];
                                                                    const target =
                                                                        newItems.find(
                                                                            (
                                                                                i,
                                                                            ) =>
                                                                                i.id ===
                                                                                item.id,
                                                                        );

                                                                    if (
                                                                        target &&
                                                                        target.quantity_issued >
                                                                            0
                                                                    ) {
                                                                        target.quantity_issued--;
                                                                        issueForm.setData(
                                                                            'items',
                                                                            newItems,
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    currentQty <=
                                                                    0
                                                                }
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <div
                                                                className={`w-12 text-center text-sm font-medium ${isInsufficient ? 'text-destructive' : ''}`}
                                                            >
                                                                {currentQty}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-8 w-8 rounded-none border-l hover:bg-muted ${isInsufficient ? 'border-destructive' : ''}`}
                                                                onClick={() => {
                                                                    const newItems =
                                                                        [
                                                                            ...issueForm
                                                                                .data
                                                                                .items,
                                                                        ];
                                                                    const target =
                                                                        newItems.find(
                                                                            (
                                                                                i,
                                                                            ) =>
                                                                                i.id ===
                                                                                item.id,
                                                                        );

                                                                    if (
                                                                        target &&
                                                                        target.quantity_issued <
                                                                            maxToIssue
                                                                    ) {
                                                                        target.quantity_issued++;
                                                                        issueForm.setData(
                                                                            'items',
                                                                            newItems,
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    currentQty >=
                                                                    maxToIssue
                                                                }
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 border-t pt-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsIssueOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={issueForm.processing}
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        Confirm Issuance
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
                {/* Dialog: Dept Head Rejection Forms */}
                <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                    <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                Reject Requisition Slip (RIS)
                            </DialogTitle>
                            <DialogDescription>
                                Please specify the reason for rejecting this
                                requisition.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedReq && (
                            <form
                                onSubmit={handleRejectSubmit}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="remarks">
                                        Rejection Reason
                                    </Label>
                                    <textarea
                                        id="remarks"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={rejectForm.data.remarks}
                                        onChange={(e) =>
                                            rejectForm.setData(
                                                'remarks',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter reason for rejection..."
                                        required
                                    />
                                    {rejectForm.errors.remarks && (
                                        <p className="text-xs text-destructive">
                                            {rejectForm.errors.remarks}
                                        </p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 border-t pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsRejectOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={rejectForm.processing}
                                        variant="destructive"
                                    >
                                        Reject Request
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
