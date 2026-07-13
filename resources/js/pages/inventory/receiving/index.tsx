import { Head, useForm, useHttp, setLayoutProps } from '@inertiajs/react';
import {
    PlusCircle,
    X,
    Eye,
    Package2,
    ClipboardCheck,
    ArrowDownToLine,
    Calendar,
    User,
    FileText,
    Landmark,
    Plus,
    History,
    Pencil,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RowActionsMenu } from '@/components/row-actions-menu';
import { SimplePagination } from '@/components/simple-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency } from '@/lib/utils';

interface ReceivingReportItem {
    id: number;
    name: string;
    unit: string;
    quantity_received: number;
    quantity_accepted: number;
    quantity_rejected: number;
    unit_cost: number;
    batch_number: string | null;
    expiration_date: string | null;
    rejection_reason: string | null;
}

interface ReceivingReport {
    id: number;
    iar_number: string;
    invoice_number: string | null;
    delivery_receipt_number: string;
    received_date: string;
    purchase_order: {
        po_number: string;
        supplier_name: string;
    };
    receiver_name: string;
    inspector_name: string;
    items_count: number;
    remarks: string | null;
    items: ReceivingReportItem[];
}

interface ReceivingStats {
    total_reports: number;
    recent_deliveries: number;
    total_items_received: number;
    total_items_rejected: number;
}

interface ReceivingIndexProps {
    reports: {
        data: ReceivingReport[];
        links: any[];
    };
    stats: ReceivingStats;
    suppliers: any[];
    receivers: any[];
    inspectors: any[];
    items: any[];
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function ReceivingIndex({
    reports,
    stats,
    suppliers: initialSuppliers,
    receivers,
    inspectors,
    items,
}: ReceivingIndexProps) {
    const breadcrumbs = [
        { title: 'Receiving (Stock In)', href: '/inventory/receiving-reports' },
    ];
    setLayoutProps({ breadcrumbs });

    const [isOpen, setIsOpen] = useState(false);
    const [selectedReport, setSelectedReport] =
        useState<ReceivingReport | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);

    // Suppliers local state to allow inline additions
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [isConfirmFinalizeOpen, setIsConfirmFinalizeOpen] = useState(false);

    // Form logic
    const { data, setData, post, put, processing, errors, reset, transform } =
        useForm({
            status: 'draft',
            po_number: '',
            supplier_id: '',
            po_date: new Date().toISOString().slice(0, 10),
            iar_number: '',
            invoice_number: '',
            delivery_receipt_number: '',
            received_date: new Date().toISOString().slice(0, 10),
            received_by: '',
            inspected_by: '',
            remarks: '',
            items: [
                {
                    item_id: '',
                    quantity_received: 1,
                    quantity_accepted: 1,
                    unit_cost: 0.0,
                    batch_number: '',
                    expiration_date: '',
                    rejection_reason: '',
                },
            ],
        });

    const supplierHttp = useHttp({
        name: '',
        address: '',
        contact_person: '',
        contact_number: '',
        tin: '',
    });

    useEffect(() => {
        if (isOpen && !editMode && !data.iar_number) {
            const dateStr = new Date()
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, '');
            const rand = Math.floor(1000 + Math.random() * 9000);
            setData('iar_number', `IAR-${dateStr}-${rand}`);
        }
    }, [isOpen, editMode, data.iar_number, setData]);

    const handleAddItemRow = () => {
        setData('items', [
            ...data.items,
            {
                item_id: '',
                quantity_received: 1,
                quantity_accepted: 1,
                unit_cost: 0.0,
                batch_number: '',
                expiration_date: '',
                rejection_reason: '',
                isNew: true,
            },
        ]);
    };

    const handleRemoveItemRow = (index: number) => {
        if (data.items.length === 1) {
            toast.error('You must receive at least one item.');

            return;
        }

        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...data.items] as any[];
        newItems[index][field] = value;

        // Auto-sync accepted quantity to received quantity if we are updating received quantity
        if (
            field === 'quantity_received' &&
            newItems[index].quantity_accepted > value
        ) {
            newItems[index].quantity_accepted = value;
        }

        setData('items', newItems);
    };

    const handleSupplierSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        supplierHttp.post('/inventory/suppliers', {
            onSuccess: (newSupplier: any) => {
                setSuppliers([...suppliers, newSupplier]);
                setData('supplier_id', String(newSupplier.id));
                setIsAddSupplierOpen(false);
                supplierHttp.reset();
                toast.success('Supplier registered successfully.');
            },
            onError: () => {
                toast.error('Failed to add supplier. Ensure TIN is unique.');
            },
        });
    };

    const submitForm = (targetStatus: 'draft' | 'finalized') => {
        if (targetStatus === 'finalized') {
            if (!data.received_by || !data.inspected_by) {
                toast.error(
                    'Receiver and Inspector are required to finalize the delivery.',
                );

                return;
            }

            if (data.received_by === data.inspected_by) {
                toast.error(
                    'The Receiver and Inspector cannot be the same person. This violates segregation of duties.',
                );

                return;
            }

            setIsConfirmFinalizeOpen(true);
        } else {
            executeSubmit('draft');
        }
    };

    const confirmFinalize = () => {
        setIsConfirmFinalizeOpen(false);
        executeSubmit('finalized');
    };

    const executeSubmit = (targetStatus: 'draft' | 'finalized') => {
        transform((data) => ({
            ...data,
            status: targetStatus,
        }));

        if (editMode && selectedReport) {
            put(`/inventory/receiving-reports/${selectedReport.id}`, {
                onSuccess: () => {
                    setIsOpen(false);
                    reset();
                    toast.success(
                        targetStatus === 'finalized'
                            ? 'Receiving Report finalized and stock quantities updated successfully.'
                            : 'Receiving Report draft updated successfully.',
                    );
                },
                onError: () => {
                    toast.error(
                        'Failed to update receiving report. Check validation errors.',
                    );
                },
            });
        } else {
            post('/inventory/receiving-reports', {
                onSuccess: () => {
                    setIsOpen(false);
                    reset();
                    toast.success(
                        targetStatus === 'finalized'
                            ? 'Receiving Report saved and stock quantities updated successfully.'
                            : 'Receiving Report saved as draft.',
                    );
                },
                onError: () => {
                    toast.error(
                        'Failed to save receiving report. Check validation errors.',
                    );
                },
            });
        }
    };

    const openDetails = (report: ReceivingReport) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    const openEdit = (report: ReceivingReport) => {
        setEditMode(true);
        setSelectedReport(report);

        setData({
            status: report.status || 'draft',
            po_number: report.purchase_order?.po_number || '',
            supplier_id: String(
                suppliers.find(
                    (s) => s.name === report.purchase_order?.supplier_name,
                )?.id || '',
            ),
            po_date: new Date().toISOString().slice(0, 10), // Defaulting
            iar_number: report.iar_number || '',
            invoice_number: report.invoice_number || '',
            delivery_receipt_number: report.delivery_receipt_number || '',
            received_date:
                report.received_date || new Date().toISOString().slice(0, 10),
            received_by: String(
                receivers.find((r) => r.name === report.receiver_name)?.id ||
                    '',
            ),
            inspected_by: String(
                inspectors.find((i) => i.name === report.inspector_name)?.id ||
                    '',
            ),
            remarks: report.remarks || '',
            items: report.items.map((item) => ({
                id: item.id,
                item_id: String(
                    items.find((i) => i.name === item.name)?.id || '',
                ),
                quantity_received: item.quantity_received,
                quantity_accepted: item.quantity_accepted,
                unit_cost: item.unit_cost,
                batch_number: item.batch_number || '',
                expiration_date: item.expiration_date || '',
                rejection_reason: item.rejection_reason || '',
                isNew: false,
            })) as any,
        });

        setIsOpen(true);
    };

    const openHistory = (report: ReceivingReport) => {
        setSelectedReport(report);
        fetch(`/inventory/receiving-reports/${report.id}/history`)
            .then((res) => res.json())
            .then((data) => {
                setHistoryLogs(data);
                setIsHistoryOpen(true);
            })
            .catch(() => toast.error('Failed to fetch history logs.'));
    };

    const totalReceivedValue = data.items.reduce((sum, item) => {
        return (
            sum +
            (Number(item.quantity_received) || 0) *
                (Number(item.unit_cost) || 0)
        );
    }, 0);

    const totalAcceptedValue = data.items.reduce((sum, item) => {
        return (
            sum +
            (Number(item.quantity_accepted) || 0) *
                (Number(item.unit_cost) || 0)
        );
    }, 0);

    return (
        <>
            <Head title="Receiving Reports - GIMS" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Receiving & Inspection Reports
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Record incoming supplier deliveries, accept
                            inspected stocks, and update moving average
                            valuations.
                        </p>
                    </div>

                    <div>
                        <Dialog
                            open={isOpen}
                            onOpenChange={(open) => {
                                setIsOpen(open);

                                if (!open) {
                                    reset();
                                    setEditMode(false);
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    className="gap-2"
                                    onClick={() => setEditMode(false)}
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Receive Delivery
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className="max-h-[90vh] overflow-y-auto sm:max-w-4xl sm:p-8"
                                onPointerDownOutside={(e) => e.preventDefault()}
                                onInteractOutside={(e) => e.preventDefault()}
                            >
                                <DialogHeader className="mb-2">
                                    <DialogTitle className="text-xl">
                                        {editMode
                                            ? 'Edit Receiving Report'
                                            : 'Record New Receiving Report'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm">
                                        {editMode
                                            ? 'Update an existing receiving report.'
                                            : 'Log a supplier delivery PO shipment, inspect accepted stocks, and increase unit balances.'}
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    onSubmit={(e) => e.preventDefault()}
                                    className="space-y-8"
                                >
                                    {/* Section 1: PO & Reference Details */}
                                    <div className="space-y-4">
                                        <div className="mb-1 flex items-center gap-2.5 text-sm font-semibold text-primary">
                                            <Landmark className="h-4.5 w-4.5 text-primary" />
                                            <span>Purchase Order Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="po_number"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    Purchase Order No.
                                                </Label>
                                                <Input
                                                    id="po_number"
                                                    placeholder="e.g. PO-2026-0032"
                                                    value={data.po_number}
                                                    onChange={(e) =>
                                                        setData(
                                                            'po_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {errors.po_number && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.po_number}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="supplier"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    Supplier
                                                </Label>
                                                <div className="flex gap-1.5">
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
                                                            data.supplier_id
                                                                ? String(
                                                                      data.supplier_id,
                                                                  )
                                                                : undefined
                                                        }
                                                        onValueChange={(val) =>
                                                            setData(
                                                                'supplier_id',
                                                                val,
                                                            )
                                                        }
                                                        placeholder="Select Supplier"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 shrink-0"
                                                        onClick={() =>
                                                            setIsAddSupplierOpen(
                                                                true,
                                                            )
                                                        }
                                                        title="Add New Supplier"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {errors.supplier_id && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.supplier_id}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="po_date"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    Purchase Order Date
                                                </Label>
                                                <DatePicker
                                                    value={data.po_date}
                                                    onChange={(val) =>
                                                        setData('po_date', val)
                                                    }
                                                    required
                                                />
                                                {errors.po_date && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.po_date}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-6 border-border/50" />

                                    {/* Section 2: Delivery & Inspection Details */}
                                    <div className="space-y-6">
                                        <div className="mb-1 flex items-center gap-2.5 text-sm font-semibold text-primary">
                                            <Calendar className="h-4.5 w-4.5 text-primary" />
                                            <span>
                                                Logistics Reference & Crew
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="iar_number"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    IAR Number
                                                </Label>
                                                <Input
                                                    id="iar_number"
                                                    value={data.iar_number}
                                                    onChange={(e) =>
                                                        setData(
                                                            'iar_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {errors.iar_number && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.iar_number}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="delivery_receipt"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    Delivery Receipt No.
                                                </Label>
                                                <Input
                                                    id="delivery_receipt"
                                                    placeholder="e.g. DR-88219"
                                                    value={
                                                        data.delivery_receipt_number
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'delivery_receipt_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {errors.delivery_receipt_number && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            errors.delivery_receipt_number
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="invoice_number"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    Invoice Number
                                                </Label>
                                                <Input
                                                    id="invoice_number"
                                                    placeholder="e.g. INV-9902"
                                                    value={data.invoice_number}
                                                    onChange={(e) =>
                                                        setData(
                                                            'invoice_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                {errors.invoice_number && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.invoice_number}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="received_date"
                                                    className="text-xs font-semibold"
                                                >
                                                    Received Date
                                                </Label>
                                                <DatePicker
                                                    value={data.received_date}
                                                    onChange={(val) =>
                                                        setData(
                                                            'received_date',
                                                            val,
                                                        )
                                                    }
                                                    required
                                                />
                                                {errors.received_date && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.received_date}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="received_by"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    Received By (Supply Unit)
                                                </Label>
                                                <SmartSelect
                                                    options={receivers.map(
                                                        (e) => ({
                                                            value: String(e.id),
                                                            label: `${e.name} (${e.position})`,
                                                        }),
                                                    )}
                                                    value={
                                                        data.received_by
                                                            ? String(
                                                                  data.received_by,
                                                              )
                                                            : undefined
                                                    }
                                                    onValueChange={(val) =>
                                                        setData(
                                                            'received_by',
                                                            val,
                                                        )
                                                    }
                                                    placeholder="Select Receiver"
                                                />
                                                {errors.received_by && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.received_by}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="inspected_by"
                                                    className="text-xs font-semibold"
                                                    required
                                                >
                                                    Inspected By
                                                </Label>
                                                <SmartSelect
                                                    options={inspectors.map(
                                                        (e) => ({
                                                            value: String(e.id),
                                                            label: `${e.name} (${e.position})`,
                                                        }),
                                                    )}
                                                    value={
                                                        data.inspected_by
                                                            ? String(
                                                                  data.inspected_by,
                                                              )
                                                            : undefined
                                                    }
                                                    onValueChange={(val) =>
                                                        setData(
                                                            'inspected_by',
                                                            val,
                                                        )
                                                    }
                                                    placeholder="Select Inspector"
                                                />
                                                {errors.inspected_by && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.inspected_by}
                                                    </p>
                                                )}
                                                {data.received_by &&
                                                    data.inspected_by &&
                                                    data.received_by ===
                                                        data.inspected_by && (
                                                        <p className="text-xs font-medium text-rose-500">
                                                            Receiver and
                                                            Inspector must be
                                                            different.
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="my-6 border-border/50" />

                                    {/* Section 3: Supplies List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-primary">
                                                <Package2 className="h-4.5 w-4.5 text-primary" />
                                                <span>
                                                    Delivered Supplies List
                                                </span>
                                            </div>
                                        </div>

                                        <div className="max-h-[30vh] overflow-y-auto rounded-md border border-border">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-border bg-muted/50 font-medium text-muted-foreground">
                                                        <th className="p-3">
                                                            Item *
                                                        </th>
                                                        <th className="w-20 p-3">
                                                            Qty Recv *
                                                        </th>
                                                        <th className="w-20 p-3">
                                                            Qty Acpt *
                                                        </th>
                                                        <th className="w-32 p-3">
                                                            Unit Cost (₱) *
                                                        </th>
                                                        <th className="w-32 p-3">
                                                            Batch No.
                                                        </th>
                                                        <th className="w-36 p-3">
                                                            Expiration
                                                        </th>
                                                        <th className="w-10 p-3 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {data.items.map(
                                                        (row, idx) => (
                                                            <tr
                                                                key={idx}
                                                                className="hover:bg-muted/30"
                                                            >
                                                                <td className="p-2.5">
                                                                    <SmartSelect
                                                                        options={items.map(
                                                                            (
                                                                                it,
                                                                            ) => ({
                                                                                value: String(
                                                                                    it.id,
                                                                                ),
                                                                                label: `${it.name} (${it.unit?.abbreviation || 'unit'})`,
                                                                            }),
                                                                        )}
                                                                        value={
                                                                            row.item_id
                                                                                ? String(
                                                                                      row.item_id,
                                                                                  )
                                                                                : undefined
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
                                                                        placeholder="Select Item"
                                                                        className="h-8 bg-background text-xs"
                                                                        defaultOpen={
                                                                            row.isNew
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="p-2.5">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={
                                                                            row.quantity_received
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleItemChange(
                                                                                idx,
                                                                                'quantity_received',
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    0,
                                                                            )
                                                                        }
                                                                        className="h-8 p-1.5 text-xs"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td className="p-2.5">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={
                                                                            row.quantity_received
                                                                        }
                                                                        value={
                                                                            row.quantity_accepted
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleItemChange(
                                                                                idx,
                                                                                'quantity_accepted',
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    0,
                                                                            )
                                                                        }
                                                                        className="h-8 p-1.5 text-xs"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td className="p-2.5">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
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
                                                                                    0.0,
                                                                            )
                                                                        }
                                                                        className="h-8 p-1.5 text-xs"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td className="p-2.5">
                                                                    <Input
                                                                        placeholder="e.g. B-012"
                                                                        value={
                                                                            row.batch_number
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleItemChange(
                                                                                idx,
                                                                                'batch_number',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="h-8 p-1.5 text-xs"
                                                                    />
                                                                </td>
                                                                <td className="p-2.5">
                                                                    <DatePicker
                                                                        value={
                                                                            row.expiration_date
                                                                        }
                                                                        onChange={(
                                                                            val,
                                                                        ) =>
                                                                            handleItemChange(
                                                                                idx,
                                                                                'expiration_date',
                                                                                val,
                                                                            )
                                                                        }
                                                                        className="h-8 text-xs font-medium"
                                                                    />
                                                                </td>
                                                                <td className="p-2.5 text-center">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                                        onClick={() =>
                                                                            handleRemoveItemRow(
                                                                                idx,
                                                                            )
                                                                        }
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-2 flex flex-col gap-4 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleAddItemRow}
                                                className="-ml-2 gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Add Item
                                            </Button>
                                            <div className="flex flex-wrap gap-4 text-xs font-semibold">
                                                <div className="rounded-md border border-muted-foreground/10 bg-muted/30 px-3 py-1.5 text-muted-foreground">
                                                    Total Received:{' '}
                                                    <span className="font-bold text-foreground">
                                                        {formatCurrency(
                                                            totalReceivedValue,
                                                        )}
                                                    </span>
                                                </div>
                                                {data.status ===
                                                    'finalized' && (
                                                    <div className="rounded-md border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-muted-foreground">
                                                        Total Accepted:{' '}
                                                        <span className="font-bold text-emerald-600">
                                                            {formatCurrency(
                                                                totalAcceptedValue,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="remarks"
                                            className="text-xs font-semibold"
                                            required
                                        >
                                            Remarks / Delivery Notes
                                        </Label>
                                        <textarea
                                            id="remarks"
                                            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            placeholder="e.g. Items delivered complete and in good condition."
                                            value={data.remarks}
                                            onChange={(e) =>
                                                setData(
                                                    'remarks',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        {(!editMode ||
                                            data.status === 'draft') && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={processing}
                                                onClick={() =>
                                                    submitForm('draft')
                                                }
                                                className="border border-amber-500/20 bg-amber-500/10 px-5 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
                                            >
                                                Save Draft
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            disabled={processing}
                                            onClick={() =>
                                                submitForm('finalized')
                                            }
                                            className="px-5"
                                        >
                                            {data.status === 'finalized'
                                                ? 'Save Updates'
                                                : 'Finalize & Stock In'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Dialog: Confirm Finalization */}
                        <Dialog
                            open={isConfirmFinalizeOpen}
                            onOpenChange={setIsConfirmFinalizeOpen}
                        >
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>
                                        Confirm Finalization
                                    </DialogTitle>
                                    <DialogDescription>
                                        This will finalize the Receiving Report
                                        and instantly update warehouse stock
                                        quantities. This action is irreversible
                                        and cannot be reverted to draft.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2 border-t pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsConfirmFinalizeOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={confirmFinalize}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Confirm & Stock In
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Statistics Overview */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-blue-500 bg-card bg-linear-to-tr from-transparent to-blue-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-blue-500/5">
                                <FileText
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-blue-500 uppercase">
                                    Total IAR Reports
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.total_reports}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-violet-500 bg-card bg-linear-to-tr from-transparent to-violet-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-violet-500/5">
                                <Calendar
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-violet-500 uppercase">
                                    Recent Deliveries
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.recent_deliveries}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-emerald-500 bg-card bg-linear-to-tr from-transparent to-emerald-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                                <Package2
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-emerald-500 uppercase">
                                    Items Received
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.total_items_received}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-rose-500 bg-card bg-linear-to-tr from-transparent to-rose-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-rose-500/5">
                                <X className="h-28 w-28" strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-rose-500 uppercase">
                                    Items Rejected
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.total_items_rejected}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Table list of Receiving Reports */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Inspection & Acceptance Registry
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reports.data.length === 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>IAR Number</TableHead>
                                            <TableHead>PO Number</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>DR / Invoice</TableHead>
                                            <TableHead>Date Received</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Items Count</TableHead>
                                            <TableHead>Receiver</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="space-y-2 py-12 text-center text-muted-foreground"
                                            >
                                                <ArrowDownToLine className="mx-auto h-8 w-8 text-muted-foreground" />
                                                <p>
                                                    No receiving reports
                                                    recorded yet. Click "Receive
                                                    Delivery" above.
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>IAR Number</TableHead>
                                            <TableHead>PO Number</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>DR / Invoice</TableHead>
                                            <TableHead>Date Received</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Items Count</TableHead>
                                            <TableHead>Receiver</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reports.data.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="font-semibold">
                                                    {report.iar_number || (
                                                        <span className="text-muted-foreground italic">
                                                            Draft (No IAR)
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {report.purchase_order
                                                        ?.po_number || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {report.purchase_order
                                                        ?.supplier_name ||
                                                        'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        DR:{' '}
                                                        {report.delivery_receipt_number ||
                                                            'N/A'}
                                                    </div>
                                                    {report.invoice_number && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            INV:{' '}
                                                            {
                                                                report.invoice_number
                                                            }
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {report.received_date ||
                                                        'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {report.status ===
                                                    'draft' ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
                                                        >
                                                            Draft
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                                                        >
                                                            Finalized
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {report.items_count}{' '}
                                                        items
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {report.receiver_name ||
                                                        'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <RowActionsMenu
                                                        actions={[
                                                            {
                                                                label: 'View Details',
                                                                icon: Eye,
                                                                onClick: () =>
                                                                    openDetails(
                                                                        report,
                                                                    ),
                                                            },
                                                            {
                                                                label: 'Edit Report',
                                                                icon: Pencil,
                                                                onClick: () =>
                                                                    openEdit(
                                                                        report,
                                                                    ),
                                                            },
                                                            {
                                                                label: 'View History',
                                                                icon: History,
                                                                onClick: () =>
                                                                    openHistory(
                                                                        report,
                                                                    ),
                                                            },
                                                        ]}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4">
                                    <SimplePagination links={reports.links} />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog: Detail View */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-x-hidden overflow-y-auto p-4 md:p-6">
                        <DialogHeader className="mb-2 pr-6">
                            <DialogTitle className="flex items-start gap-2 text-left leading-tight break-words md:items-center">
                                <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 md:mt-0" />
                                <span>
                                    Inspection & Acceptance Report:{' '}
                                    {selectedReport?.iar_number || 'Draft'}
                                </span>
                                {selectedReport && (
                                    <Badge
                                        className={
                                            selectedReport.status === 'draft'
                                                ? 'bg-amber-500 hover:bg-amber-600'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                        }
                                    >
                                        {selectedReport.status === 'draft'
                                            ? 'Draft'
                                            : 'Finalized'}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-left">
                                Details and accepted quantities for this
                                delivery record.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedReport && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="mb-1 flex items-center gap-1.5 font-semibold text-muted-foreground">
                                            <Landmark className="h-3.5 w-3.5" />{' '}
                                            Procurement
                                        </div>
                                        <div>
                                            <strong>PO Number:</strong>{' '}
                                            {
                                                selectedReport.purchase_order
                                                    ?.po_number
                                            }
                                        </div>
                                        <div>
                                            <strong>Supplier:</strong>{' '}
                                            {
                                                selectedReport.purchase_order
                                                    ?.supplier_name
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="mb-1 flex items-center gap-1.5 font-semibold text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />{' '}
                                            Logistics References
                                        </div>
                                        <div>
                                            <strong>DR Number:</strong>{' '}
                                            {selectedReport.delivery_receipt_number ||
                                                'N/A'}
                                        </div>
                                        {selectedReport.invoice_number && (
                                            <div>
                                                <strong>Invoice Number:</strong>{' '}
                                                {selectedReport.invoice_number}
                                            </div>
                                        )}
                                        <div>
                                            <strong>Received Date:</strong>{' '}
                                            {selectedReport.received_date ||
                                                'N/A'}
                                        </div>
                                    </div>
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="mb-1 flex items-center gap-1.5 font-semibold text-muted-foreground">
                                            <User className="h-3.5 w-3.5" />{' '}
                                            Inspection Crew
                                        </div>
                                        <div>
                                            <strong>Inspected By:</strong>{' '}
                                            {selectedReport.inspector_name ||
                                                'N/A'}
                                        </div>
                                        <div>
                                            <strong>Received By:</strong>{' '}
                                            {selectedReport.receiver_name ||
                                                'N/A'}
                                        </div>
                                    </div>
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="mb-1 flex items-center gap-1.5 font-semibold text-muted-foreground">
                                            <FileText className="h-3.5 w-3.5" />{' '}
                                            Notes
                                        </div>
                                        <div className="line-clamp-2 text-muted-foreground italic">
                                            {selectedReport.remarks ||
                                                'No remarks recorded.'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="border-b pb-2 text-sm font-semibold tracking-tight">
                                        Delivered Line Items
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedReport.items.map(
                                            (line, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center"
                                                >
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="text-base leading-tight font-semibold">
                                                            {line.name}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                            <span>
                                                                <strong>
                                                                    Cost:
                                                                </strong>{' '}
                                                                {formatCurrency(
                                                                    line.unit_cost,
                                                                )}
                                                            </span>
                                                            {line.batch_number && (
                                                                <span>
                                                                    <strong>
                                                                        Batch:
                                                                    </strong>{' '}
                                                                    {
                                                                        line.batch_number
                                                                    }
                                                                </span>
                                                            )}
                                                            {line.expiration_date && (
                                                                <span>
                                                                    <strong>
                                                                        Expiry:
                                                                    </strong>{' '}
                                                                    {
                                                                        line.expiration_date
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        {line.rejection_reason && (
                                                            <div className="mt-2 inline-block w-full rounded border border-rose-200 bg-rose-50 p-2 text-xs font-medium text-rose-600 sm:w-auto dark:bg-rose-950/30">
                                                                Reason for
                                                                Rejection:{' '}
                                                                {
                                                                    line.rejection_reason
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex min-w-[140px] shrink-0 flex-col gap-1.5 text-xs">
                                                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                            <span className="font-medium text-muted-foreground">
                                                                Received:
                                                            </span>{' '}
                                                            <span className="font-medium text-foreground">
                                                                {
                                                                    line.quantity_received
                                                                }{' '}
                                                                {line.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                            <span className="font-medium text-muted-foreground">
                                                                Accepted:
                                                            </span>{' '}
                                                            <span className="font-bold text-emerald-600">
                                                                {
                                                                    line.quantity_accepted
                                                                }{' '}
                                                                {line.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                            <span className="font-medium text-muted-foreground">
                                                                Rejected:
                                                            </span>{' '}
                                                            <span className="font-semibold text-rose-600">
                                                                {
                                                                    line.quantity_rejected
                                                                }{' '}
                                                                {line.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={() => setIsDetailOpen(false)}
                                    >
                                        Close View
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Inline Supplier Creation Dialog */}
                <Dialog
                    open={isAddSupplierOpen}
                    onOpenChange={setIsAddSupplierOpen}
                >
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Add New Supplier</DialogTitle>
                            <DialogDescription>
                                Register a new vendor/supplier in the database.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={handleSupplierSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <Label htmlFor="sup_name">Supplier Name</Label>
                                <Input
                                    id="sup_name"
                                    value={supplierHttp.data.name}
                                    onChange={(e) =>
                                        supplierHttp.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {supplierHttp.errors.name && (
                                    <p className="text-xs text-rose-500">
                                        {supplierHttp.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_tin" required>
                                    TIN (Taxpayer Identification No.)
                                </Label>
                                <Input
                                    id="sup_tin"
                                    placeholder="e.g. 123-456-789-000"
                                    value={supplierHttp.data.tin}
                                    onChange={(e) =>
                                        supplierHttp.setData(
                                            'tin',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {supplierHttp.errors.tin && (
                                    <p className="text-xs text-rose-500">
                                        {supplierHttp.errors.tin}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_contact_person" required>
                                    Contact Person
                                </Label>
                                <Input
                                    id="sup_contact_person"
                                    value={supplierHttp.data.contact_person}
                                    onChange={(e) =>
                                        supplierHttp.setData(
                                            'contact_person',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_contact_number" required>
                                    Contact Number
                                </Label>
                                <Input
                                    id="sup_contact_number"
                                    value={supplierHttp.data.contact_number}
                                    onChange={(e) =>
                                        supplierHttp.setData(
                                            'contact_number',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_address">
                                    Office Address
                                </Label>
                                <textarea
                                    id="sup_address"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                    value={supplierHttp.data.address}
                                    onChange={(e) =>
                                        supplierHttp.setData(
                                            'address',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddSupplierOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={supplierHttp.processing}
                                >
                                    Save Supplier
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Revision History */}
                <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                Revision History: {selectedReport?.iar_number}
                            </DialogTitle>
                            <DialogDescription>
                                Audit trail of all modifications made to this
                                Receiving Report.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-2 space-y-4">
                            {historyLogs.length === 0 ? (
                                <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                                    No revisions found for this report.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="rounded-md border border-border bg-card p-4 text-sm shadow-sm"
                                        >
                                            <div className="mb-2 flex items-start justify-between border-b pb-2">
                                                <div>
                                                    <p className="font-semibold text-primary">
                                                        {log.action}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        by {log.user?.name} (
                                                        {log.user_role})
                                                    </p>
                                                </div>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {new Date(
                                                        log.created_at,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                            {log.old_values &&
                                                log.new_values && (
                                                    <div className="mt-2 overflow-x-auto rounded bg-muted/30 p-2 text-xs">
                                                        <table className="w-full text-left">
                                                            <thead>
                                                                <tr className="border-b border-border/50 text-muted-foreground">
                                                                    <th className="pb-1 font-medium">
                                                                        Field
                                                                    </th>
                                                                    <th className="pb-1 font-medium">
                                                                        Previous
                                                                    </th>
                                                                    <th className="pb-1 font-medium">
                                                                        Updated
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {Object.keys(
                                                                    log.new_values,
                                                                ).map((key) => {
                                                                    const oldVal =
                                                                        JSON.stringify(
                                                                            log
                                                                                .old_values[
                                                                                key
                                                                            ],
                                                                        );
                                                                    const newVal =
                                                                        JSON.stringify(
                                                                            log
                                                                                .new_values[
                                                                                key
                                                                            ],
                                                                        );

                                                                    if (
                                                                        oldVal !==
                                                                            newVal &&
                                                                        key !==
                                                                            'updated_at'
                                                                    ) {
                                                                        return (
                                                                            <tr
                                                                                key={
                                                                                    key
                                                                                }
                                                                                className="border-b border-border/30 last:border-0"
                                                                            >
                                                                                <td className="py-1 pr-2 font-mono text-muted-foreground">
                                                                                    {
                                                                                        key
                                                                                    }
                                                                                </td>
                                                                                <td className="max-w-[150px] truncate py-1 pr-2 text-rose-600 line-through">
                                                                                    {
                                                                                        oldVal
                                                                                    }
                                                                                </td>
                                                                                <td className="max-w-[150px] truncate py-1 font-medium text-emerald-600">
                                                                                    {
                                                                                        newVal
                                                                                    }
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    }

                                                                    return null;
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
