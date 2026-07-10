import { Head, useForm, setLayoutProps } from '@inertiajs/react';
import { PlusCircle, X, ClipboardCheck, Package2, ShieldAlert, Printer, Eye, ClipboardList, ChevronDown, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CoachMark } from '@/components/ui/coach-mark';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { SmartSelect } from '@/components/ui/smart-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    status: 'pending_dept_head' | 'rejected_dept_head' | 'pending_supply' | 'issued' | 'partially_issued' | 'cancelled';
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
    requisitions: Requisition[];
    stats: RequisitionStats;
    items: any[];
    currentEmployee: any;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'admin' | 'supply_officer' | 'property_custodian' | 'dept_head' | 'employee' | 'auditor';
            permissions?: string[];
        };
    };
}

export default function RequisitionsIndex({ requisitions, stats, items, auth, currentEmployee }: RequisitionIndexProps) {
    const breadcrumbs = [{ title: 'Requisitions (RIS)', href: '/inventory/requisitions' }];
    setLayoutProps({ breadcrumbs });
    const userRole = auth.user.role;

    const permissions = auth.user.permissions || [];
    const canCreate = permissions.includes('request.create');
    const canApprove = permissions.includes('request.approve');
    const canIssue = permissions.includes('warehouse.issue');

    const canUserApproveReq = (req: Requisition) => {
        if (!canApprove) {
            return false;
        }

        if (currentEmployee && req.requesting_employee_id === currentEmployee.id) {
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
    const [isIssueOpen, setIsIssueOpen] = useState(false);
    const [showSummaryPreview, setShowSummaryPreview] = useState(false);

    // Form for Request Submission
    const requestForm = useForm({
        items: [{ item_id: '', quantity: 1 }],
        purpose: '',
    });

    // Form for Dept Head Approval
    const approveForm = useForm({
        items: [] as Array<{ id: number; quantity_approved: number }>,
    });

    // Form for Supply Officer Issuance
    const issueForm = useForm({
        items: [] as Array<{ id: number; quantity_issued: number }>,
    });

    const handleAddRequestItem = () => {
        requestForm.setData('items', [...requestForm.data.items, { item_id: '', quantity: 1 }]);
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
            }
        });
    };

    const openApproveDialog = (req: Requisition) => {
        setSelectedReq(req);
        approveForm.setData('items', req.items.map(item => ({
            id: item.id,
            quantity_approved: item.quantity_requested,
        })));
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
                toast.success('Requisition approved and routed to Supply Unit.');
            },
            onError: () => {
                toast.error('Failed to approve requisition.');
            }
        });
    };

    const openIssueDialog = (req: Requisition) => {
        setSelectedReq(req);
        issueForm.setData('items', req.items.map(item => ({
            id: item.id,
            quantity_issued: item.quantity_approved - item.quantity_issued,
        })));
        setIsIssueOpen(true);
    };

    const handleIssueSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReq) {
return;
}
        
        // Double check stock availability
        let stockOk = true;
        issueForm.data.items.forEach(issueItem => {
            const dbItem = selectedReq.items.find(i => i.id === issueItem.id);

            if (dbItem && dbItem.item.current_stock < issueItem.quantity_issued) {
                stockOk = false;
                toast.error(`Insufficient stock for item: ${dbItem.item.name}. Available: ${dbItem.item.current_stock}`);
            }
        });

        if (!stockOk) {
return;
}

        issueForm.post(`/inventory/requisitions/${selectedReq.id}/issue`, {
            onSuccess: () => {
                setIsIssueOpen(false);
                toast.success('Items issued out of warehouse and Stock Cards updated.');
            },
            onError: () => {
                toast.error('Failed to issue items. Check balances.');
            }
        });
    };

    return (
        <>
            <Head title="Requisitions Board - GIMS" />
            <div className="space-y-6 p-6">
                
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Requisitions & Issue Slips (RIS)</h1>
                        <p className="text-sm text-muted-foreground">Submit supply requests, authorize approvals, and manage handovers.</p>
                    </div>

                    {canCreate && (
                        <CoachMark 
                            id="requisitions-new-ris"
                            title="Welcome to Requisitions!" 
                            description="Start here to request new supplies. Once submitted, your Department Head will review it."
                        >
                            <Dialog open={isRequestOpen} onOpenChange={(open) => {
                                setIsRequestOpen(open);

                                if (!open) {
                                    setShowSummaryPreview(false);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <PlusCircle className="h-4 w-4" />
                                        New Requisition (RIS)
                                    </Button>
                                </DialogTrigger>
                            <DialogContent 
                                className="sm:max-w-2xl sm:p-8 max-h-[85vh] overflow-y-auto"
                                onPointerDownOutside={(e) => e.preventDefault()}
                                onInteractOutside={(e) => e.preventDefault()}
                            >
                                <DialogHeader className="mb-2">
                                    <DialogTitle className="text-xl">File Requisition Slip (RIS)</DialogTitle>
                                    <DialogDescription className="text-sm">Select supplies from the catalog and specify quantities requested.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleRequestSubmit} className="space-y-6">
                                    <div className="max-h-[30vh] overflow-y-auto rounded-md border border-border">
                                        <Table className="text-xs">
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="p-3">Item *</TableHead>
                                                    <TableHead className="p-3 w-36">Qty Requested *</TableHead>
                                                    <TableHead className="p-3 text-center w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {requestForm.data.items.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="p-2.5">
                                                            <SmartSelect
                                                                options={items.map(i => ({
                                                                    value: String(i.id),
                                                                    label: `${i.name} (Qty Available: ${i.current_stock} ${i.unit})`
                                                                }))}
                                                                value={item.item_id ? String(item.item_id) : undefined}
                                                                onValueChange={val => {
                                                                    const newItems = [...requestForm.data.items];
                                                                    newItems[idx].item_id = val;
                                                                    requestForm.setData('items', newItems);
                                                                }}
                                                                placeholder="Select Item"
                                                                className="w-full h-8 text-xs bg-background"
                                                                searchThreshold={20}
                                                                defaultOpen={!item.item_id}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2.5">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={e => {
                                                                    const newItems = [...requestForm.data.items];
                                                                    newItems[idx].quantity = parseInt(e.target.value) || 0;
                                                                    requestForm.setData('items', newItems);
                                                                }}
                                                                className="h-8 p-1.5 text-xs"
                                                                required
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-2.5 text-center">
                                                            {requestForm.data.items.length > 1 && (
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600" 
                                                                    onClick={() => handleRemoveRequestItem(idx)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <Button type="button" variant="outline" size="sm" onClick={handleAddRequestItem} className="w-full">
                                        Add Another Item
                                    </Button>

                                    <div className="space-y-2">
                                        <Label htmlFor="purpose" className="text-xs font-semibold">Purpose / Remarks</Label>
                                        <textarea
                                            id="purpose"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden min-h-[80px]"
                                            placeholder="e.g. Office consumption for Q3"
                                            value={requestForm.data.purpose}
                                            onChange={e => requestForm.setData('purpose', e.target.value)}
                                        />
                                    </div>

                                    {showSummaryPreview && (
                                        <div className="rounded-lg bg-muted/40 p-4 border border-border space-y-3 animate-in fade-in duration-200">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                Requisition Summary Preview
                                            </div>
                                            <div className="space-y-1.5 text-xs text-foreground">
                                                <div className="grid grid-cols-12 font-medium border-b border-border pb-1 text-muted-foreground">
                                                    <span className="col-span-8">Item Name</span>
                                                    <span className="col-span-4 text-right">Quantity</span>
                                                </div>
                                                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                                                    {requestForm.data.items.map((item, idx) => {
                                                        const selectedItem = items.find(i => String(i.id) === String(item.item_id));

                                                        return (
                                                            <div key={idx} className="grid grid-cols-12 py-0.5">
                                                                <span className="col-span-8 truncate font-medium">
                                                                    {selectedItem ? selectedItem.name : <em className="text-muted-foreground">Unselected</em>}
                                                                </span>
                                                                <span className="col-span-4 text-right text-muted-foreground font-mono">
                                                                    {item.quantity} {selectedItem?.unit || ''}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
                                                    <span>Total Items: {requestForm.data.items.filter(i => i.item_id).length}</span>
                                                    <span>Total Qty: {requestForm.data.items.reduce((sum, i) => sum + (i.quantity || 0), 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t border-border mt-6">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="gap-2 text-xs"
                                            onClick={() => setShowSummaryPreview(!showSummaryPreview)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            {showSummaryPreview ? 'Hide Preview' : 'View Summary'}
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={requestForm.processing} className="px-5">Submit RIS</Button>
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
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <Card className="relative overflow-hidden p-5 flex flex-col justify-center border border-border border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-[2px] bg-card bg-linear-to-tr from-transparent to-blue-500/5 rounded-xl">
                            <div className="absolute -right-4 -bottom-4 text-blue-500/5">
                                <ClipboardList className="w-28 h-28" strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-blue-500">Total RIS filed</p>
                                <p className="text-2xl font-bold text-foreground truncate">{stats.total_ris}</p>
                            </div>
                        </Card>
                        
                        <Card className="relative overflow-hidden p-5 flex flex-col justify-center border border-border border-t-4 border-t-violet-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-[2px] bg-card bg-linear-to-tr from-transparent to-violet-500/5 rounded-xl">
                            <div className="absolute -right-4 -bottom-4 text-violet-500/5">
                                <ClipboardCheck className="w-28 h-28" strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-violet-500">Pending Approval</p>
                                <p className="text-2xl font-bold text-foreground truncate">{stats.pending_approval}</p>
                            </div>
                        </Card>
                        
                        <Card className="relative overflow-hidden p-5 flex flex-col justify-center border border-border border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-[2px] bg-card bg-linear-to-tr from-transparent to-amber-500/5 rounded-xl">
                            <div className="absolute -right-4 -bottom-4 text-amber-500/5">
                                <Package2 className="w-28 h-28" strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-amber-500">Pending Issuance</p>
                                <p className="text-2xl font-bold text-foreground truncate">{stats.pending_issuance}</p>
                            </div>
                        </Card>
                        
                        <Card className="relative overflow-hidden p-5 flex flex-col justify-center border border-border border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-[2px] bg-card bg-linear-to-tr from-transparent to-emerald-500/5 rounded-xl">
                            <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                                <ClipboardCheck className="w-28 h-28" strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-500">Completed</p>
                                <p className="text-2xl font-bold text-foreground truncate">{stats.completed}</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Requisitions List Board */}
                <div className="grid gap-6">
                    {requisitions.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12 text-muted-foreground">
                                No requisitions (RIS) found on the board.
                            </CardContent>
                        </Card>
                    ) : (
                        requisitions.map((req) => (
                            <Card key={req.id} className="relative overflow-hidden">
                                <Collapsible>
                                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base font-semibold font-mono text-primary">{req.ris_number}</CardTitle>
                                                <Badge variant="outline" className="capitalize">
                                                    {req.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Submitted by <strong>{req.requester?.name}</strong> ({req.requester?.department?.name || 'Staff'}) on {formatDateTime(req.created_at)}
                                            </CardDescription>
                                        </div>

                                        {/* Action Buttons depending on role and status */}
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="outline" size="sm" className="gap-1">
                                                <a href={`/inventory/requisitions/${req.id}/print`} target="_blank" rel="noopener noreferrer">
                                                    <Printer className="h-4 w-4" />
                                                    Print RIS
                                                </a>
                                            </Button>
                                            {canUserApproveReq(req) && req.status === 'pending_dept_head' && (
                                                <Button size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => openApproveDialog(req)}>
                                                    <ClipboardCheck className="h-4 w-4" />
                                                    Approve RIS
                                                </Button>
                                            )}
                                            {canIssue && (req.status === 'pending_supply' || req.status === 'partially_issued') && (
                                                <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => openIssueDialog(req)}>
                                                    <Package2 className="h-4 w-4" />
                                                    Issue Supplies
                                                </Button>
                                            )}
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 [&[data-state=open]>svg]:rotate-180">
                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                                    <span className="sr-only">Toggle</span>
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
                                                                <TableHead>Supply Name</TableHead>
                                                                <TableHead className="text-right">Requested Qty</TableHead>
                                                                <TableHead className="text-right">Approved Qty</TableHead>
                                                                <TableHead className="text-right">Issued Qty</TableHead>
                                                                <TableHead className="text-right">On Hand Stock</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {req.items.map((item) => (
                                                                <TableRow key={item.id}>
                                                                    <TableCell className="font-medium">{item.item.name}</TableCell>
                                                                    <TableCell className="text-right">{item.quantity_requested} {item.item.unit?.abbreviation || 'pcs'}</TableCell>
                                                                    <TableCell className="text-right text-indigo-600 dark:text-indigo-400 font-semibold">{item.quantity_approved}</TableCell>
                                                                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-bold">{item.quantity_issued}</TableCell>
                                                                    <TableCell className="text-right font-mono text-muted-foreground">{item.item.current_stock}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                {req.remarks && (
                                                    <div className="bg-muted/40 p-2.5 rounded text-xs text-muted-foreground">
                                                        <strong>Purpose:</strong> {req.remarks}
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

                {/* Dialog: Dept Head Approval Forms */}
                <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Authorize Requisition Slip (RIS)</DialogTitle>
                            <DialogDescription>Review the requested quantities and authorize the department approval.</DialogDescription>
                        </DialogHeader>
                        {selectedReq && (
                            <form onSubmit={handleApproveSubmit} className="space-y-4">
                                <div className="max-h-[60vh] overflow-y-auto pr-2">
                                    <div className="space-y-3">
                                        {selectedReq.items.map((item) => {
                                            const formItem = approveForm.data.items.find(i => i.id === item.id);
                                            const maxQty = item.quantity_requested;
                                            const currentQty = formItem?.quantity_approved ?? 0;

                                            return (
                                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card shadow-sm">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold">{item.item.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">Requested: <span className="font-medium text-foreground">{item.quantity_requested}</span> {item.item.unit?.abbreviation || 'pcs'}</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Label className="text-xs font-medium text-muted-foreground hidden sm:block">Approve Qty:</Label>
                                                        <div className="flex items-center border rounded-md shadow-sm bg-background">
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className="h-8 w-8 rounded-none border-r hover:bg-muted"
                                                                onClick={() => {
                                                                    const newItems = [...approveForm.data.items];
                                                                    const target = newItems.find(i => i.id === item.id);

                                                                    if (target && target.quantity_approved > 0) {
                                                                        target.quantity_approved--;
                                                                        approveForm.setData('items', newItems);
                                                                    }
                                                                }}
                                                                disabled={currentQty <= 0}
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
                                                                    const newItems = [...approveForm.data.items];
                                                                    const target = newItems.find(i => i.id === item.id);

                                                                    if (target && target.quantity_approved < maxQty) {
                                                                        target.quantity_approved++;
                                                                        approveForm.setData('items', newItems);
                                                                    }
                                                                }}
                                                                disabled={currentQty >= maxQty}
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
                                <div className="flex justify-end gap-2 pt-2 border-t pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={approveForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">Approve & Sign</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Supply Officer Issuance Forms */}
                <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Issue Supplies to Employee</DialogTitle>
                            <DialogDescription>Validate quantities and process stock-out cards.</DialogDescription>
                        </DialogHeader>
                        {selectedReq && (
                            <form onSubmit={handleIssueSubmit} className="space-y-4">
                                <div className="max-h-[60vh] overflow-y-auto pr-2">
                                    <div className="space-y-3">
                                        {selectedReq.items.map((item) => {
                                            const formItem = issueForm.data.items.find(i => i.id === item.id);
                                            const maxToIssue = item.quantity_approved - item.quantity_issued;
                                            const currentStock = item.item.current_stock;
                                            const currentQty = formItem?.quantity_issued ?? 0;
                                            const isInsufficient = currentStock < currentQty;

                                            return (
                                                <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg shadow-sm ${isInsufficient ? 'bg-destructive/10 border-destructive' : 'bg-card'}`}>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold">{item.item.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Approved: <span className="font-medium text-foreground">{item.quantity_approved}</span> {item.item.unit?.abbreviation || 'pcs'} 
                                                            <span className="text-muted-foreground/80 ml-1">(Issued: {item.quantity_issued})</span>
                                                        </div>
                                                        <div className={`text-xs mt-1 flex flex-col ${isInsufficient ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                                            <span>Warehouse Stock: <span className="font-bold">{currentStock}</span></span>
                                                            {isInsufficient && (
                                                                <span className="text-[10px] flex items-center gap-1 mt-1">
                                                                    <ShieldAlert className="h-3 w-3" /> Insufficient stock in warehouse!
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Label className={`text-xs font-medium hidden sm:block ${isInsufficient ? 'text-destructive' : 'text-muted-foreground'}`}>Issue Qty:</Label>
                                                        <div className={`flex items-center border rounded-md shadow-sm bg-background ${isInsufficient ? 'border-destructive' : ''}`}>
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className={`h-8 w-8 rounded-none border-r hover:bg-muted ${isInsufficient ? 'border-destructive' : ''}`}
                                                                onClick={() => {
                                                                    const newItems = [...issueForm.data.items];
                                                                    const target = newItems.find(i => i.id === item.id);

                                                                    if (target && target.quantity_issued > 0) {
                                                                        target.quantity_issued--;
                                                                        issueForm.setData('items', newItems);
                                                                    }
                                                                }}
                                                                disabled={currentQty <= 0}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <div className={`w-12 text-center text-sm font-medium ${isInsufficient ? 'text-destructive' : ''}`}>
                                                                {currentQty}
                                                            </div>
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon"
                                                                className={`h-8 w-8 rounded-none border-l hover:bg-muted ${isInsufficient ? 'border-destructive' : ''}`}
                                                                onClick={() => {
                                                                    const newItems = [...issueForm.data.items];
                                                                    const target = newItems.find(i => i.id === item.id);

                                                                    if (target && target.quantity_issued < maxToIssue) {
                                                                        target.quantity_issued++;
                                                                        issueForm.setData('items', newItems);
                                                                    }
                                                                }}
                                                                disabled={currentQty >= maxToIssue}
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
                                <div className="flex justify-end gap-2 pt-2 border-t pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsIssueOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={issueForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm Issuance</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
