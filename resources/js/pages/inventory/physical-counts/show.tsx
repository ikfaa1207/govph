import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Save, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PhysicalCountItem {
    id: number;
    recorded_qty: string;
    actual_qty: string | null;
    shortage_qty: string | null;
    overage_qty: string | null;
    remarks: string | null;
    property?: {
        property_number: string;
        model: string;
        brand: string;
        unit_cost: string;
        category?: { name: string };
    };
    item?: {
        stock_number: string;
        name: string;
        unit_cost: string;
        category?: { name: string };
    };
}

interface PhysicalCount {
    id: number;
    type: string;
    as_of_date: string;
    status: string;
    items: PhysicalCountItem[];
    creator?: {
        name: string;
    };
}

interface Props {
    physicalCount: PhysicalCount;
}

export default function PhysicalCountShow({ physicalCount }: Props) {
    const isRPCPPE = physicalCount.type === 'RPCPPE';
    const isFinalized = physicalCount.status === 'finalized';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory/properties' },
        { title: 'Physical Counts', href: '/inventory/physical-counts' },
        { title: `${physicalCount.type} - ${new Date(physicalCount.as_of_date).toLocaleDateString()}`, href: `/inventory/physical-counts/${physicalCount.id}` },
    ];

    const form = useForm({
        action: 'save',
        items: physicalCount.items.map(item => ({
            id: item.id,
            actual_qty: item.actual_qty ?? '',
            remarks: item.remarks ?? '',
        })),
    });

    const [localItems, setLocalItems] = useState(physicalCount.items.map(item => ({
        ...item,
        form_actual_qty: item.actual_qty ?? '',
        form_remarks: item.remarks ?? '',
    })));

    const handleQtyChange = (id: number, value: string) => {
        setLocalItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, form_actual_qty: value };
            }
            return item;
        }));
    };

    const handleRemarksChange = (id: number, value: string) => {
        setLocalItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, form_remarks: value };
            }
            return item;
        }));
    };

    useEffect(() => {
        form.setData('items', localItems.map(item => ({
            id: item.id,
            actual_qty: item.form_actual_qty,
            remarks: item.form_remarks,
        })));
    }, [localItems]);

    const submit = (e: React.FormEvent, action: 'save' | 'finalize') => {
        e.preventDefault();
        if (action === 'finalize') {
            if (!confirm('Are you sure you want to finalize this count? This will lock it from further edits.')) {
                return;
            }
        }
        form.transform((data) => ({
            ...data,
            action,
        })).put(`/inventory/physical-counts/${physicalCount.id}`);
    };

    const calcDiscrepancy = (recorded: string, actual: string | null) => {
        if (actual === null || actual === '') return { s: null, o: null };
        const rec = parseFloat(recorded);
        const act = parseFloat(actual);
        if (act < rec) return { s: rec - act, o: 0 };
        if (act > rec) return { s: 0, o: act - rec };
        return { s: 0, o: 0 };
    };

    return (
        <>
            <Head title={`Physical Count - ${physicalCount.type}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {isRPCPPE ? 'Report of Physical Count of PPE (RPCPPE)' : 'Report of Physical Count of Inventories (RPCI)'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            As of {new Date(physicalCount.as_of_date).toLocaleDateString()} &middot; Created by {physicalCount.creator?.name} &middot; 
                            <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                isFinalized ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {physicalCount.status.toUpperCase()}
                            </span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {isFinalized && (
                            <Button variant="secondary" asChild>
                                <a href={`/inventory/physical-counts/${physicalCount.id}/export`} target="_blank" rel="noopener noreferrer">
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                                    Export CSV Report
                                </a>
                            </Button>
                        )}
                        {!isFinalized && (
                            <>
                                <Button variant="outline" onClick={(e) => submit(e, 'save')} disabled={form.processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Draft
                                </Button>
                                <Button onClick={(e) => submit(e, 'finalize')} disabled={form.processing}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Finalize Count
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Article</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>{isRPCPPE ? 'Property No.' : 'Stock No.'}</TableHead>
                                <TableHead className="text-right">Unit Value</TableHead>
                                <TableHead className="text-center">Recorded Qty</TableHead>
                                <TableHead className="w-[120px] text-center">Actual Qty</TableHead>
                                <TableHead className="text-center text-red-500">Shortage</TableHead>
                                <TableHead className="text-center text-green-500">Overage</TableHead>
                                <TableHead className="w-[200px]">Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {localItems.map((item) => {
                                const entity = isRPCPPE ? item.property : item.item;
                                const identifier = isRPCPPE ? item.property?.property_number : item.item?.stock_number;
                                const desc = isRPCPPE ? `${item.property?.brand} ${item.property?.model}` : item.item?.name;
                                const disc = calcDiscrepancy(item.recorded_qty, item.form_actual_qty);

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-xs">{entity?.category?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-xs font-medium">{desc}</TableCell>
                                        <TableCell className="text-xs font-mono">{identifier}</TableCell>
                                        <TableCell className="text-xs text-right">₱{entity?.unit_cost}</TableCell>
                                        <TableCell className="text-center font-bold">{parseFloat(item.recorded_qty)}</TableCell>
                                        <TableCell className="text-center p-1">
                                            {isFinalized ? (
                                                <span className="font-bold">{item.actual_qty ?? '-'}</span>
                                            ) : (
                                                <Input 
                                                    type="number" 
                                                    min="0"
                                                    step="1"
                                                    className="h-8 text-center"
                                                    value={item.form_actual_qty}
                                                    onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center text-red-500 font-semibold">
                                            {disc.s !== null && disc.s > 0 ? disc.s : '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-green-500 font-semibold">
                                            {disc.o !== null && disc.o > 0 ? disc.o : '-'}
                                        </TableCell>
                                        <TableCell className="p-1">
                                            {isFinalized ? (
                                                <span className="text-xs">{item.remarks}</span>
                                            ) : (
                                                <Input 
                                                    className="h-8 text-xs"
                                                    placeholder="Enter remarks..."
                                                    value={item.form_remarks}
                                                    onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {localItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        No items found for this physical count.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

PhysicalCountShow.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/properties' },
        { title: 'Physical Counts', href: '/inventory/physical-counts' },
    ]
};
