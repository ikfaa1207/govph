import { Head, useForm, router } from '@inertiajs/react';
import { Save, CheckCircle, FileSpreadsheet, User, Send, ListChecks, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
    created_by: number;
    creator?: {
        name: string;
    };
    committees?: {
        id: number;
        employee_id: number;
        role: string;
        status: string;
        remarks: string | null;
        approved_at: string | null;
        employee?: {
            id: number;
            name: string;
            position: string | null;
        }
    }[];
}

interface Props {
    physicalCount: PhysicalCount;
    employees: { id: number; name: string; position: string | null; user_id?: number | null }[];
    auth: { user: { id: number; name: string } };
}

export default function PhysicalCountShow({ physicalCount, employees, auth }: Props) {
    const isRPCPPE = physicalCount.type === 'RPCPPE';
    const isDraft = physicalCount.status === 'draft';
    const isPendingReview = physicalCount.status === 'pending_review';
    const isFinalized = physicalCount.status === 'finalized';

    const getCommitteeByRole = (role: string) => physicalCount.committees?.filter(c => c.role === role) || [];
    
    const { hasPermission } = usePermissions();
    const currentEmployee = employees.find(e => e.user_id === auth.user?.id);
    const isCreator = currentEmployee && physicalCount.created_by === currentEmployee.id;
    const canDelete = isDraft && (hasPermission('reports.view') || isCreator);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    
    // We try to populate from existing DB committees if they exist
    const defaultChairperson = getCommitteeByRole('chairperson')[0]?.employee_id?.toString() || '';
    const defaultHead = getCommitteeByRole('head_of_agency')[0]?.employee_id?.toString() || '';
    const defaultMembers = getCommitteeByRole('member').map(c => c.employee_id?.toString());
    if (defaultMembers.length === 0) defaultMembers.push(''); // Start with at least one empty member slot

    const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);
    const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localItems]);

    const handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();

        if (localItems.length === 0) {
            toast.error('Cannot submit a physical count with no items.');
            return;
        }

        const allBlank = localItems.every(item => item.form_actual_qty === '' || item.form_actual_qty === null);
        if (allBlank) {
            toast.error('Cannot submit for review when all actual quantities are blank. Please encode at least one quantity.');
            return;
        }

        setIsSubmitConfirmOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDeleteConfirmOpen(false);

        router.delete(`/inventory/physical-counts/${physicalCount.id}`, {
            onError: (errors) => {
                Object.values(errors).forEach(err => toast.error(err));
            }
        });
    };

    const submit = (e: React.FormEvent | React.MouseEvent, action: 'save' | 'submit_for_review') => {
        e.preventDefault();
        setIsSubmitConfirmOpen(false);

        form.transform((data) => ({
            ...data,
            action,
        }));

        form.put(`/inventory/physical-counts/${physicalCount.id}`, {
            onError: (errors) => {
                Object.values(errors).forEach(err => toast.error(err));
            }
        });
    };

    const reviewForm = useForm({
        status: '',
        remarks: '',
    });

    const handleReviewSubmit = (e: React.FormEvent, status: 'approved' | 'rejected') => {
        e.preventDefault();
        reviewForm.transform(data => ({ ...data, status }));
        
        reviewForm.put(`/inventory/physical-counts/${physicalCount.id}/approve`, {
            onSuccess: () => setIsApprovalsOpen(false)
        });
    };

    const calcDiscrepancy = (recorded: string, actual: string | null) => {
        if (actual === null || actual === '') {
return { s: null, o: null };
}

        const rec = parseFloat(recorded);
        const act = parseFloat(actual);

        if (act < rec) {
return { s: rec - act, o: 0 };
}

        if (act > rec) {
return { s: 0, o: act - rec };
}

        return { s: 0, o: 0 };
    };

    return (
        <>
            <Head title={`Physical Count - ${physicalCount.type}`} />

            <Dialog open={isSubmitConfirmOpen} onOpenChange={setIsSubmitConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Submit for Review</DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to submit this count for committee review? The item quantities will be locked from further editing.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsSubmitConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={(e) => submit(e, 'submit_for_review')} disabled={form.processing}>
                            Confirm Submit
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Draft Physical Count</DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to delete this draft physical count? This action is permanent and will delete all encoded quantities and remarks.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={form.processing}>
                            Confirm Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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

            {Object.keys(form.errors).length > 0 && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6 border border-destructive/20">
                    <h3 className="font-semibold mb-2">Please correct the following errors:</h3>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {Object.entries(form.errors).map(([key, error]) => (
                            <li key={key}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

                    <div className="flex gap-2">
                        {(isFinalized || isPendingReview) && physicalCount.committees && physicalCount.committees.length > 0 && (
                            <Dialog open={isApprovalsOpen} onOpenChange={setIsApprovalsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <ListChecks className="mr-2 h-4 w-4" />
                                        Approvals
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Committee Approvals</DialogTitle>
                                        <DialogDescription>Signatures and approval status for this physical count.</DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-4 mt-6">
                                        {physicalCount.committees.map(committee => {
                                            const isCurrentUser = employees.find(e => e.id === committee.employee_id)?.user_id === auth.user?.id || 
                                                                employees.find(e => e.id === committee.employee_id)?.name === auth.user?.name;
                                            
                                            return (
                                                <div key={committee.id} className="rounded-xl border bg-card p-4 shadow-xs flex flex-col gap-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg shrink-0">
                                                                <User className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-base text-foreground leading-tight">
                                                                    {committee.employee?.name}
                                                                </div>
                                                                <div className="text-xs font-semibold text-muted-foreground uppercase mt-1 tracking-wider">
                                                                    {committee.role.replace(/_/g, ' ')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col sm:items-end gap-1 shrink-0">
                                                            <Badge className="font-semibold capitalize px-2.5 py-0.5" variant={
                                                                committee.status === 'approved' ? 'default' : 
                                                                committee.status === 'rejected' ? 'destructive' : 
                                                                'secondary'
                                                            }>
                                                                {committee.status}
                                                            </Badge>
                                                            {committee.approved_at && (
                                                                <div className="text-[10px] text-muted-foreground">
                                                                    Signed: {new Date(committee.approved_at).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    
                                                    {committee.remarks && (
                                                        <div className="bg-muted/40 text-sm text-muted-foreground rounded-lg p-3 italic border-l-2 border-indigo-500/30">
                                                            "{committee.remarks}"
                                                        </div>
                                                    )}
                                                    
                                                    {isPendingReview && isCurrentUser && committee.status === 'pending' && (
                                                        <div className="space-y-3 border-t pt-4 mt-2">
                                                            <Label className="text-xs font-semibold text-foreground">Your Review & Action</Label>
                                                            <textarea 
                                                                placeholder="Enter your review remarks (optional)..." 
                                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                                                                value={reviewForm.data.remarks}
                                                                onChange={(e) => reviewForm.setData('remarks', e.target.value)}
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant="outline" onClick={() => setIsApprovalsOpen(false)}>
                                                                    Cancel
                                                                </Button>
                                                                <Button size="sm" variant="destructive" onClick={(e) => handleReviewSubmit(e, 'rejected')} disabled={reviewForm.processing}>
                                                                    Reject Count
                                                                </Button>
                                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={(e) => handleReviewSubmit(e, 'approved')} disabled={reviewForm.processing}>
                                                                    Approve Count
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                        {(isFinalized || isPendingReview) && (
                            <Button variant="secondary" asChild>
                                <a href={`/inventory/physical-counts/${physicalCount.id}/export`} target="_blank" rel="noopener noreferrer">
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                                    Export CSV Report
                                </a>
                            </Button>
                        )}
                        {isDraft && (
                            <>
                                {canDelete && (
                                    <Button variant="destructive" onClick={handleDeleteClick} disabled={form.processing}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Draft
                                    </Button>
                                )}
                                <Button variant="outline" onClick={(e) => submit(e, 'save')} disabled={form.processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Draft
                                </Button>
                                <Button onClick={handleSubmitClick} disabled={form.processing}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit for Review
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
                                            {isDraft ? (
                                                <Input 
                                                    type="number" 
                                                    min="0"
                                                    step="1"
                                                    className="h-8 text-center"
                                                    value={item.form_actual_qty}
                                                    onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                />
                                            ) : (
                                                <span className="font-bold">{item.actual_qty ?? '-'}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center text-red-500 font-semibold">
                                            {disc.s !== null && disc.s > 0 ? disc.s : '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-green-500 font-semibold">
                                            {disc.o !== null && disc.o > 0 ? disc.o : '-'}
                                        </TableCell>
                                        <TableCell className="p-1">
                                            {isDraft ? (
                                                <Input 
                                                    className="h-8 text-xs"
                                                    placeholder="Enter remarks..."
                                                    value={item.form_remarks}
                                                    onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-xs">{item.remarks}</span>
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
