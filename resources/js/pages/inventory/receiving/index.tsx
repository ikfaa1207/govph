import { Head, useForm, useHttp, setLayoutProps } from '@inertiajs/react';
import { PlusCircle, X, Eye, Package2, ClipboardCheck, ArrowDownToLine, Calendar, User, FileText, Landmark, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface ReceivingIndexProps {
    reports: ReceivingReport[];
    suppliers: any[];
    employees: any[];
    items: any[];
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function ReceivingIndex({ reports, suppliers: initialSuppliers, employees, items, auth }: ReceivingIndexProps) {
    const breadcrumbs = [{ title: 'Receiving (Stock In)', href: '/inventory/receiving-reports' }];
    setLayoutProps({ breadcrumbs });

    const [isOpen, setIsOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReceivingReport | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Suppliers local state to allow inline additions
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

    // Form logic
    const { data, setData, post, processing, errors, reset } = useForm({
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
                unit_cost: 0.00,
                batch_number: '',
                expiration_date: '',
                rejection_reason: '',
            }
        ],
    });

    const supplierHttp = useHttp({
        name: '',
        address: '',
        contact_person: '',
        contact_number: '',
        tin: '',
    });

    // Auto-generate suggested IAR number when dialog opens
    useEffect(() => {
        if (isOpen && !data.iar_number) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const rand = Math.floor(1000 + Math.random() * 9000);
            setData('iar_number', `IAR-${dateStr}-${rand}`);
        }
    }, [isOpen]);

    const handleAddItemRow = () => {
        setData('items', [
            ...data.items,
            {
                item_id: '',
                quantity_received: 1,
                quantity_accepted: 1,
                unit_cost: 0.00,
                batch_number: '',
                expiration_date: '',
                rejection_reason: '',
            }
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
        if (field === 'quantity_received' && newItems[index].quantity_accepted > value) {
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
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/receiving-reports', {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success('Receiving Report saved and stock quantities updated successfully.');
            },
            onError: () => {
                toast.error('Failed to create receiving report. Check validation errors.');
            }
        });
    };

    const openDetails = (report: ReceivingReport) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    return (
        <>
            <Head title="Receiving Reports - GIMS" />
            <div className="space-y-6 p-6">
                
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Receiving & Inspection Reports</h1>
                        <p className="text-sm text-muted-foreground">Record incoming supplier deliveries, accept inspected stocks, and update moving average valuations.</p>
                    </div>

                    <div>
                        <Dialog open={isOpen} onOpenChange={(open) => {
                            setIsOpen(open);
                            if (!open) {
                                reset();
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Receive Delivery
                                </Button>
                            </DialogTrigger>
                            <DialogContent 
                                className="sm:max-w-4xl sm:p-8 max-h-[90vh] overflow-y-auto"
                                onPointerDownOutside={(e) => e.preventDefault()}
                                onInteractOutside={(e) => e.preventDefault()}
                            >
                                <DialogHeader className="mb-2">
                                    <DialogTitle className="text-xl">Record New Receiving Report</DialogTitle>
                                    <DialogDescription className="text-sm">
                                        Log a supplier delivery PO shipment, inspect accepted stocks, and increase unit balances.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Section 1: PO & Reference Details */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2.5 text-sm font-semibold text-primary mb-1">
                                            <Landmark className="h-4.5 w-4.5 text-primary" />
                                            <span>Purchase Order Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="po_number" className="text-xs font-semibold">Purchase Order No. *</Label>
                                                <Input 
                                                    id="po_number" 
                                                    placeholder="e.g. PO-2026-0032" 
                                                    value={data.po_number}
                                                    onChange={e => setData('po_number', e.target.value)}
                                                    required
                                                />
                                                {errors.po_number && <p className="text-xs text-rose-500">{errors.po_number}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="supplier" className="text-xs font-semibold">Supplier *</Label>
                                                <div className="flex gap-1.5">
                                                    <select
                                                        id="supplier"
                                                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                        value={data.supplier_id}
                                                        onChange={e => setData('supplier_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Supplier</option>
                                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 shrink-0"
                                                        onClick={() => setIsAddSupplierOpen(true)}
                                                        title="Add New Supplier"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {errors.supplier_id && <p className="text-xs text-rose-500">{errors.supplier_id}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="po_date" className="text-xs font-semibold">Purchase Order Date *</Label>
                                                <Input 
                                                    id="po_date" 
                                                    type="date" 
                                                    value={data.po_date}
                                                    onChange={e => setData('po_date', e.target.value)}
                                                    required
                                                />
                                                {errors.po_date && <p className="text-xs text-rose-500">{errors.po_date}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-border/50 my-6" />

                                    {/* Section 2: Delivery & Inspection Details */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2.5 text-sm font-semibold text-primary mb-1">
                                            <Calendar className="h-4.5 w-4.5 text-primary" />
                                            <span>Logistics Reference & Crew</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="iar_number" className="text-xs font-semibold">IAR Number *</Label>
                                                <Input 
                                                    id="iar_number" 
                                                    value={data.iar_number}
                                                    onChange={e => setData('iar_number', e.target.value)}
                                                    required
                                                />
                                                {errors.iar_number && <p className="text-xs text-rose-500">{errors.iar_number}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="delivery_receipt" className="text-xs font-semibold">Delivery Receipt No. *</Label>
                                                <Input 
                                                    id="delivery_receipt" 
                                                    placeholder="e.g. DR-88219" 
                                                    value={data.delivery_receipt_number}
                                                    onChange={e => setData('delivery_receipt_number', e.target.value)}
                                                    required
                                                />
                                                {errors.delivery_receipt_number && <p className="text-xs text-rose-500">{errors.delivery_receipt_number}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="invoice_number" className="text-xs font-semibold">Invoice Number</Label>
                                                <Input 
                                                    id="invoice_number" 
                                                    placeholder="e.g. INV-9902" 
                                                    value={data.invoice_number}
                                                    onChange={e => setData('invoice_number', e.target.value)}
                                                />
                                                {errors.invoice_number && <p className="text-xs text-rose-500">{errors.invoice_number}</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="received_date" className="text-xs font-semibold">Received Date *</Label>
                                                <Input 
                                                    id="received_date" 
                                                    type="date" 
                                                    value={data.received_date}
                                                    onChange={e => setData('received_date', e.target.value)}
                                                    required
                                                />
                                                {errors.received_date && <p className="text-xs text-rose-500">{errors.received_date}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="received_by" className="text-xs font-semibold">Received By (Supply Unit) *</Label>
                                                <select
                                                    id="received_by"
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                    value={data.received_by}
                                                    onChange={e => setData('received_by', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Employee</option>
                                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
                                                </select>
                                                {errors.received_by && <p className="text-xs text-rose-500">{errors.received_by}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="inspected_by" className="text-xs font-semibold">Inspected By *</Label>
                                                <select
                                                    id="inspected_by"
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                    value={data.inspected_by}
                                                    onChange={e => setData('inspected_by', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Employee</option>
                                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
                                                </select>
                                                {errors.inspected_by && <p className="text-xs text-rose-500">{errors.inspected_by}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-border/50 my-6" />

                                    {/* Section 3: Supplies List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 text-sm font-semibold text-primary">
                                                <Package2 className="h-4.5 w-4.5 text-primary" />
                                                <span>Delivered Supplies List</span>
                                            </div>
                                            <Button type="button" size="sm" variant="outline" onClick={handleAddItemRow}>
                                                Add Item Line
                                            </Button>
                                        </div>

                                        <div className="max-h-[30vh] overflow-y-auto rounded-md border border-border">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-border bg-muted/50 font-medium text-muted-foreground">
                                                        <th className="p-3">Item *</th>
                                                        <th className="p-3 w-20">Qty Recv *</th>
                                                        <th className="p-3 w-20">Qty Acpt *</th>
                                                        <th className="p-3 w-32">Unit Cost (₱) *</th>
                                                        <th className="p-3 w-32">Batch No.</th>
                                                        <th className="p-3 w-36">Expiration</th>
                                                        <th className="p-3 text-center w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {data.items.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-muted/30">
                                                            <td className="p-2.5">
                                                                <select
                                                                    className="w-full rounded border border-input bg-background p-1.5 text-xs focus-visible:outline-hidden"
                                                                    value={row.item_id}
                                                                    onChange={e => handleItemChange(idx, 'item_id', e.target.value)}
                                                                    required
                                                                >
                                                                    <option value="">Select Item</option>
                                                                    {items.map(it => (
                                                                        <option key={it.id} value={it.id}>
                                                                            {it.name} ({it.unit?.abbreviation || 'unit'})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td className="p-2.5">
                                                                <Input 
                                                                    type="number"
                                                                    min="1"
                                                                    value={row.quantity_received}
                                                                    onChange={e => handleItemChange(idx, 'quantity_received', parseInt(e.target.value) || 0)}
                                                                    className="h-8 p-1.5 text-xs"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="p-2.5">
                                                                <Input 
                                                                    type="number"
                                                                    min="0"
                                                                    max={row.quantity_received}
                                                                    value={row.quantity_accepted}
                                                                    onChange={e => handleItemChange(idx, 'quantity_accepted', parseInt(e.target.value) || 0)}
                                                                    className="h-8 p-1.5 text-xs"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="p-2.5">
                                                                <Input 
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={row.unit_cost}
                                                                    onChange={e => handleItemChange(idx, 'unit_cost', parseFloat(e.target.value) || 0.00)}
                                                                    className="h-8 p-1.5 text-xs"
                                                                    required
                                                                />
                                                            </td>
                                                            <td className="p-2.5">
                                                                <Input 
                                                                    placeholder="e.g. B-012"
                                                                    value={row.batch_number}
                                                                    onChange={e => handleItemChange(idx, 'batch_number', e.target.value)}
                                                                    className="h-8 p-1.5 text-xs"
                                                                />
                                                            </td>
                                                            <td className="p-2.5">
                                                                <Input 
                                                                    type="date"
                                                                    value={row.expiration_date}
                                                                    onChange={e => handleItemChange(idx, 'expiration_date', e.target.value)}
                                                                    className="h-8 p-1.5 text-xs"
                                                                />
                                                            </td>
                                                            <td className="p-2.5 text-center">
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                                    onClick={() => handleRemoveItemRow(idx)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-2">
                                        <Label htmlFor="remarks" className="text-xs font-semibold">Remarks / Delivery Notes</Label>
                                        <textarea 
                                            id="remarks" 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden min-h-[80px]"
                                            placeholder="e.g. Items delivered complete and in good condition."
                                            value={data.remarks}
                                            onChange={e => setData('remarks', e.target.value)}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={processing} className="px-5">Save and Stock In</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Table list of Receiving Reports */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Inspection & Acceptance Registry</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reports.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground space-y-2">
                                <ArrowDownToLine className="h-8 w-8 mx-auto text-muted-foreground" />
                                <p>No receiving reports recorded yet. Click "Receive Delivery" above.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border pb-2 text-muted-foreground font-medium">
                                            <th className="py-2">IAR Number</th>
                                            <th className="py-2">PO Number</th>
                                            <th className="py-2">Supplier</th>
                                            <th className="py-2">DR / Invoice</th>
                                            <th className="py-2">Date Received</th>
                                            <th className="py-2">Items Count</th>
                                            <th className="py-2">Receiver</th>
                                            <th className="py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {reports.map((report) => (
                                            <tr key={report.id} className="hover:bg-muted/50">
                                                <td className="py-3 font-semibold">{report.iar_number}</td>
                                                <td className="py-3 font-mono text-xs">{report.purchase_order?.po_number || 'N/A'}</td>
                                                <td className="py-3 text-muted-foreground">{report.purchase_order?.supplier_name || 'N/A'}</td>
                                                <td className="py-3">
                                                    <div className="text-xs">DR: {report.delivery_receipt_number}</div>
                                                    {report.invoice_number && <div className="text-[10px] text-muted-foreground">INV: {report.invoice_number}</div>}
                                                </td>
                                                <td className="py-3 text-xs">{report.received_date}</td>
                                                <td className="py-3">
                                                    <Badge variant="outline">{report.items_count} items</Badge>
                                                </td>
                                                <td className="py-3 text-xs text-muted-foreground">{report.receiver_name}</td>
                                                <td className="py-3 text-right">
                                                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openDetails(report)}>
                                                        <Eye className="h-3 w-3" />
                                                        Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog: Detail View */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                                Inspection & Acceptance Report: {selectedReport?.iar_number}
                            </DialogTitle>
                            <DialogDescription>
                                Details and accepted quantities for this delivery record.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedReport && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="font-semibold text-muted-foreground flex items-center gap-1.5 mb-1"><Landmark className="h-3.5 w-3.5" /> Procurement</div>
                                        <div><strong>PO Number:</strong> {selectedReport.purchase_order?.po_number}</div>
                                        <div><strong>Supplier:</strong> {selectedReport.purchase_order?.supplier_name}</div>
                                    </div>
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="font-semibold text-muted-foreground flex items-center gap-1.5 mb-1"><Calendar className="h-3.5 w-3.5" /> Logistics References</div>
                                        <div><strong>DR Number:</strong> {selectedReport.delivery_receipt_number}</div>
                                        {selectedReport.invoice_number && <div><strong>Invoice Number:</strong> {selectedReport.invoice_number}</div>}
                                        <div><strong>Received Date:</strong> {selectedReport.received_date}</div>
                                    </div>
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="font-semibold text-muted-foreground flex items-center gap-1.5 mb-1"><User className="h-3.5 w-3.5" /> Inspection Crew</div>
                                        <div><strong>Inspected By:</strong> {selectedReport.inspector_name}</div>
                                        <div><strong>Received By:</strong> {selectedReport.receiver_name}</div>
                                    </div>
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="font-semibold text-muted-foreground flex items-center gap-1.5 mb-1"><FileText className="h-3.5 w-3.5" /> Notes</div>
                                        <div className="italic text-muted-foreground line-clamp-2">{selectedReport.remarks || 'No remarks recorded.'}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-muted-foreground tracking-tight">Delivered Line Items</h3>
                                    <div className="rounded-md border border-border overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-muted/50 border-b border-border font-medium text-muted-foreground">
                                                    <th className="p-2">Item Name</th>
                                                    <th className="p-2 text-right">Received</th>
                                                    <th className="p-2 text-right font-semibold text-emerald-600">Accepted</th>
                                                    <th className="p-2 text-right text-rose-600">Rejected</th>
                                                    <th className="p-2 text-right font-mono">Unit Cost</th>
                                                    <th className="p-2">Batch / Expiry</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {selectedReport.items.map((line, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/20">
                                                        <td className="p-2">
                                                            <div className="font-medium">{line.name}</div>
                                                            {line.rejection_reason && <div className="text-[10px] text-rose-500 italic mt-0.5">Reason: {line.rejection_reason}</div>}
                                                        </td>
                                                        <td className="p-2 text-right">{line.quantity_received} {line.unit}</td>
                                                        <td className="p-2 text-right font-semibold text-emerald-600">{line.quantity_accepted} {line.unit}</td>
                                                        <td className="p-2 text-right font-medium text-rose-600">{line.quantity_rejected} {line.unit}</td>
                                                        <td className="p-2 text-right font-mono">₱{line.unit_cost.toFixed(2)}</td>
                                                        <td className="p-2 text-muted-foreground">
                                                            {line.batch_number && <div className="text-[10px]">Batch: {line.batch_number}</div>}
                                                            {line.expiration_date && <div className="text-[10px]">Expiry: {line.expiration_date}</div>}
                                                            {!line.batch_number && !line.expiration_date && '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button onClick={() => setIsDetailOpen(false)}>Close View</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Inline Supplier Creation Dialog */}
                <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Add New Supplier</DialogTitle>
                            <DialogDescription>Register a new vendor/supplier in the database.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSupplierSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="sup_name">Supplier Name *</Label>
                                <Input 
                                    id="sup_name" 
                                    value={supplierHttp.data.name} 
                                    onChange={e => supplierHttp.setData('name', e.target.value)} 
                                    required 
                                />
                                {supplierHttp.errors.name && <p className="text-xs text-rose-500">{supplierHttp.errors.name}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_tin">TIN (Taxpayer Identification No.) *</Label>
                                <Input 
                                    id="sup_tin" 
                                    placeholder="e.g. 123-456-789-000"
                                    value={supplierHttp.data.tin} 
                                    onChange={e => supplierHttp.setData('tin', e.target.value)} 
                                    required 
                                />
                                {supplierHttp.errors.tin && <p className="text-xs text-rose-500">{supplierHttp.errors.tin}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_contact_person">Contact Person *</Label>
                                <Input 
                                    id="sup_contact_person" 
                                    value={supplierHttp.data.contact_person} 
                                    onChange={e => supplierHttp.setData('contact_person', e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_contact_number">Contact Number</Label>
                                <Input 
                                    id="sup_contact_number" 
                                    value={supplierHttp.data.contact_number} 
                                    onChange={e => supplierHttp.setData('contact_number', e.target.value)} 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sup_address">Office Address *</Label>
                                <textarea 
                                    id="sup_address" 
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                    value={supplierHttp.data.address} 
                                    onChange={e => supplierHttp.setData('address', e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsAddSupplierOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={supplierHttp.processing}>Save Supplier</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
