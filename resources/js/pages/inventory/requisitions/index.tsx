import { Head, useForm, setLayoutProps } from '@inertiajs/react';
import { PlusCircle, X, ClipboardCheck, Package2, ShieldAlert, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface RequisitionIndexProps {
    requisitions: Requisition[];
    items: any[];
    currentEmployee: any;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'admin' | 'supply_officer' | 'property_custodian' | 'dept_head' | 'employee' | 'auditor';
        };
    };
}

export default function RequisitionsIndex({ requisitions, items, auth }: RequisitionIndexProps) {
    const breadcrumbs = [{ title: 'Requisitions (RIS)', href: '/inventory/requisitions' }];
    setLayoutProps({ breadcrumbs });
    const userRole = auth.user.role;

    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isIssueOpen, setIsIssueOpen] = useState(false);

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

                    {userRole === 'employee' && (
                        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    New Requisition (RIS)
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>File Requisition Slip (RIS)</DialogTitle>
                                    <DialogDescription>Select supplies from the catalog and specify quantities requested.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleRequestSubmit} className="space-y-4">
                                    <div className="space-y-4">
                                        {requestForm.data.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-end border-b border-border pb-3 last:border-0 last:pb-0">
                                                <div className="flex-1 space-y-1">
                                                    <Label>Item *</Label>
                                                    <select
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                        value={item.item_id}
                                                        onChange={e => {
                                                            const newItems = [...requestForm.data.items];
                                                            newItems[idx].item_id = e.target.value;
                                                            requestForm.setData('items', newItems);
                                                        }}
                                                        required
                                                    >
                                                        <option value="">Select Item</option>
                                                        {items.map(i => (
                                                            <option key={i.id} value={i.id}>
                                                                {i.name} (Qty Available: {i.current_stock} {i.unit})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-24 space-y-1">
                                                    <Label>Qty *</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newItems = [...requestForm.data.items];
                                                            newItems[idx].quantity = parseInt(e.target.value);
                                                            requestForm.setData('items', newItems);
                                                        }}
                                                        required
                                                    />
                                                </div>
                                                {requestForm.data.items.length > 1 && (
                                                    <Button type="button" variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600" onClick={() => handleRemoveRequestItem(idx)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <Button type="button" variant="outline" size="sm" onClick={handleAddRequestItem} className="w-full">
                                        Add Another Item
                                    </Button>

                                    <div className="space-y-1">
                                        <Label htmlFor="purpose">Purpose / Remarks</Label>
                                        <textarea
                                            id="purpose"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            placeholder="e.g. Office consumption for Q3"
                                            value={requestForm.data.purpose}
                                            onChange={e => requestForm.setData('purpose', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={requestForm.processing}>Submit RIS</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

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
                                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base font-semibold font-mono text-primary">{req.ris_number}</CardTitle>
                                            <Badge variant="outline" className="capitalize">
                                                {req.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            Submitted by <strong>{req.requester?.name}</strong> ({req.requester?.department?.name || 'Staff'}) on {new Date(req.created_at).toLocaleDateString()}
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
                                        {userRole === 'dept_head' && req.status === 'pending_dept_head' && (
                                            <Button size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => openApproveDialog(req)}>
                                                <ClipboardCheck className="h-4 w-4" />
                                                Approve RIS
                                            </Button>
                                        )}
                                        {userRole === 'supply_officer' && (req.status === 'pending_supply' || req.status === 'partially_issued') && (
                                            <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => openIssueDialog(req)}>
                                                <Package2 className="h-4 w-4" />
                                                Issue Supplies
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="border-t border-border pt-4">
                                    <div className="space-y-4">
                                        {/* Items requested grid */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-border pb-1 text-muted-foreground font-semibold">
                                                        <th className="py-1">Supply Name</th>
                                                        <th className="py-1 text-right">Requested Qty</th>
                                                        <th className="py-1 text-right">Approved Qty</th>
                                                        <th className="py-1 text-right">Issued Qty</th>
                                                        <th className="py-1 text-right">On Hand Stock</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {req.items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="py-2 font-medium">{item.item.name}</td>
                                                            <td className="py-2 text-right">{item.quantity_requested} {item.item.unit?.abbreviation || 'pcs'}</td>
                                                            <td className="py-2 text-right text-indigo-600 dark:text-indigo-400 font-semibold">{item.quantity_approved}</td>
                                                            <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-bold">{item.quantity_issued}</td>
                                                            <td className="py-2 text-right font-mono text-muted-foreground">{item.item.current_stock}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {req.remarks && (
                                            <div className="bg-muted/40 p-2.5 rounded text-xs text-muted-foreground">
                                                <strong>Purpose:</strong> {req.remarks}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Dialog: Dept Head Approval Forms */}
                <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Authorize Requisition Slip (RIS)</DialogTitle>
                            <DialogDescription>Review the requested quantities and authorize the department approval.</DialogDescription>
                        </DialogHeader>
                        {selectedReq && (
                            <form onSubmit={handleApproveSubmit} className="space-y-4">
                                <div className="space-y-3">
                                    {selectedReq.items.map((item) => {
                                        const formItem = approveForm.data.items.find(i => i.id === item.id);

                                        return (
                                            <div key={item.id} className="flex justify-between items-center gap-4">
                                                <div className="flex-1 text-sm font-semibold">{item.item.name}</div>
                                                <div className="text-xs text-muted-foreground">Requested: {item.quantity_requested}</div>
                                                <div className="w-24">
                                                    <Label className="text-xs">Approve Qty</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={item.quantity_requested}
                                                        value={formItem?.quantity_approved ?? 0}
                                                        onChange={e => {
                                                            const newItems = [...approveForm.data.items];
                                                            const target = newItems.find(i => i.id === item.id);

                                                            if (target) {
                                                                target.quantity_approved = parseInt(e.target.value);
                                                            }

                                                            approveForm.setData('items', newItems);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={approveForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">Approve & Sign</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Supply Officer Issuance Forms */}
                <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Issue Supplies to Employee</DialogTitle>
                            <DialogDescription>Validate quantities and process stock-out cards.</DialogDescription>
                        </DialogHeader>
                        {selectedReq && (
                            <form onSubmit={handleIssueSubmit} className="space-y-4">
                                <div className="space-y-3">
                                    {selectedReq.items.map((item) => {
                                        const formItem = issueForm.data.items.find(i => i.id === item.id);
                                        const maxToIssue = item.quantity_approved - item.quantity_issued;
                                        const currentStock = item.item.current_stock;
                                        const isInsufficient = currentStock < (formItem?.quantity_issued ?? 0);

                                        return (
                                            <div key={item.id} className="border-b border-border pb-3 last:border-0 last:pb-0 space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm font-semibold">{item.item.name}</div>
                                                    <div className="text-xs text-muted-foreground">Approved: {item.quantity_approved} (Already Issued: {item.quantity_issued})</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-xs text-muted-foreground flex-1">
                                                        Warehouse Stock: <span className="font-bold">{currentStock}</span>
                                                    </div>
                                                    <div className="w-24">
                                                        <Label className="text-xs">Issue Qty</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={maxToIssue}
                                                            value={formItem?.quantity_issued ?? 0}
                                                            onChange={e => {
                                                                const newItems = [...issueForm.data.items];
                                                                const target = newItems.find(i => i.id === item.id);

                                                                if (target) {
                                                                    target.quantity_issued = parseInt(e.target.value);
                                                                }

                                                                issueForm.setData('items', newItems);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                {isInsufficient && (
                                                    <p className="text-[10px] text-rose-500 flex items-center gap-1">
                                                        <ShieldAlert className="h-3 w-3" /> Insufficient stock in warehouse!
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
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
