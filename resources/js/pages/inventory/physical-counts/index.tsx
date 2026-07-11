import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { PlusCircle, FileSpreadsheet, ListChecks, UserPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SmartSelect } from '@/components/ui/smart-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissions } from '@/hooks/use-permissions';
import type { BreadcrumbItem } from '@/types';

interface PhysicalCount {
    id: number;
    type: string;
    as_of_date: string;
    status: string;
    created_at: string;
    created_by: number;
    creator?: {
        id: number;
        name: string;
    };
}

interface Props {
    counts: {
        data: PhysicalCount[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    employees: { id: number; name: string; position: string | null }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory/properties' },
    { title: 'Physical Counts', href: '/inventory/physical-counts' },
];

export default function PhysicalCountsIndex({ counts, employees }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newMemberIndex, setNewMemberIndex] = useState<number | null>(null);
    const [countToDelete, setCountToDelete] = useState<PhysicalCount | null>(null);

    const { hasPermission } = usePermissions();
    const { auth } = usePage<any>().props;
    const currentEmployee = employees.find(e => e.user_id === auth.user?.id);

    const employeeOptions = employees.map(emp => ({
        value: emp.id.toString(),
        label: emp.name + (emp.position ? ` (${emp.position})` : '')
    }));

    const form = useForm({
        type: 'RPCPPE',
        as_of_date: new Date().toISOString().split('T')[0],
        chairperson_id: '',
        head_of_agency_id: '',
        member_ids: [''],
    });

    const addMemberSlot = () => {
        const nextIndex = form.data.member_ids.length;
        form.setData('member_ids', [...form.data.member_ids, '']);
        setNewMemberIndex(nextIndex);
    };
    
    const removeMemberSlot = (index: number) => {
        const newMembers = [...form.data.member_ids];
        newMembers.splice(index, 1);
        form.setData('member_ids', newMembers);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/inventory/physical-counts', {
            onSuccess: () => setIsCreateOpen(false),
        });
    };

    const confirmDelete = () => {
        if (!countToDelete) {
return;
}
        
        router.delete(`/inventory/physical-counts/${countToDelete.id}`, {
            onSuccess: () => setCountToDelete(null),
            onError: (errors) => {
                Object.values(errors).forEach(err => toast.error(err));
            }
        });
    };

    return (
        <>
            <Head title="Physical Counts" />

            <Dialog open={countToDelete !== null} onOpenChange={(open) => !open && setCountToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Draft Physical Count</DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to delete the draft physical count for {countToDelete && new Date(countToDelete.as_of_date).toLocaleDateString()}? This action is permanent and will delete all encoded quantities and remarks.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setCountToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Confirm Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Physical Counts & COA Reporting</h1>
                        <p className="text-sm text-muted-foreground">Manage and conduct RPCPPE and RPCI inventory counts.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Initiate Physical Count
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Initiate New Physical Count</DialogTitle>
                                <DialogDescription>This will take a snapshot of the current inventory for reporting.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>Count Type / Report Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => form.setData('type', 'RPCPPE')}
                                            className={`flex flex-col items-center justify-center p-4 border rounded-md transition-all ${
                                                form.data.type === 'RPCPPE' 
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' 
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <span className="font-bold">RPCPPE</span>
                                            <span className="text-xs opacity-70">Property, Plant & Equipment</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => form.setData('type', 'RPCI')}
                                            className={`flex flex-col items-center justify-center p-4 border rounded-md transition-all ${
                                                form.data.type === 'RPCI' 
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' 
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <span className="font-bold">RPCI</span>
                                            <span className="text-xs opacity-70">Inventories / Consumables</span>
                                        </button>
                                    </div>
                                    {form.errors.type && <p className="text-xs text-destructive">{form.errors.type}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="as_of_date">As of Date</Label>
                                    <Input
                                        id="as_of_date"
                                        type="date"
                                        value={form.data.as_of_date}
                                        onChange={(e) => form.setData('as_of_date', e.target.value)}
                                        required
                                    />
                                    {form.errors.as_of_date && <p className="text-xs text-destructive">{form.errors.as_of_date}</p>}
                                </div>
                                <div className="space-y-4 rounded-lg border bg-muted/30 p-4 mt-4">
                                    <div>
                                        <h4 className="text-sm font-semibold tracking-tight">Committee Assignment</h4>
                                        <p className="text-xs text-muted-foreground">Assign personnel to oversee the physical count.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>Chairperson</Label>
                                            <SmartSelect 
                                                options={employeeOptions}
                                                value={form.data.chairperson_id} 
                                                onValueChange={(v) => form.setData('chairperson_id', v)}
                                                placeholder="Select Chairperson"
                                                searchPlaceholder="Search employees..."
                                            />
                                            {form.errors.chairperson_id && <p className="text-xs text-destructive">{form.errors.chairperson_id}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Head of Agency</Label>
                                            <SmartSelect 
                                                options={employeeOptions}
                                                value={form.data.head_of_agency_id} 
                                                onValueChange={(v) => form.setData('head_of_agency_id', v)}
                                                placeholder="Select Head of Agency"
                                                searchPlaceholder="Search employees..."
                                            />
                                            {form.errors.head_of_agency_id && <p className="text-xs text-destructive">{form.errors.head_of_agency_id}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Committee Members</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addMemberSlot}>
                                                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Member
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {form.data.member_ids.map((memberId, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <SmartSelect 
                                                        options={employeeOptions}
                                                        value={memberId} 
                                                        onValueChange={(v) => {
                                                            const newMembers = [...form.data.member_ids];
                                                            newMembers[index] = v;
                                                            form.setData('member_ids', newMembers);
                                                        }}
                                                        placeholder="Select Member"
                                                        searchPlaceholder="Search employees..."
                                                        defaultOpen={newMemberIndex === index}
                                                    />
                                                    {form.data.member_ids.length > 1 && (
                                                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removeMemberSlot(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Remove</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="button" variant="outline" className="mr-2" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={form.processing}>Start Count</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Report Type</TableHead>
                                <TableHead>As of Date</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {counts.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No physical counts initiated yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                counts.data.map((count) => {
                                    const isDraft = count.status === 'draft';
                                    const isCreator = currentEmployee && count.created_by === currentEmployee.id;
                                    const canDelete = isDraft && (hasPermission('reports.view') || isCreator);

                                    return (
                                        <TableRow key={count.id}>
                                            <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">
                                                {count.type}
                                            </TableCell>
                                            <TableCell>{new Date(count.as_of_date).toLocaleDateString()}</TableCell>
                                            <TableCell>{count.creator?.name}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    count.status === 'draft' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                }`}>
                                                    {count.status.toUpperCase()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{new Date(count.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canDelete && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                                                            onClick={() => setCountToDelete(count)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    )}
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/inventory/physical-counts/${count.id}`}>
                                                            <ListChecks className="mr-2 h-4 w-4" />
                                                            View / Edit
                                                        </Link>
                                                    </Button>
                                                    {count.status === 'finalized' && (
                                                        <Button variant="secondary" size="sm" asChild>
                                                            <a href={`/inventory/physical-counts/${count.id}/export`} target="_blank" rel="noopener noreferrer">
                                                                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                                                                Export CSV
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

PhysicalCountsIndex.layout = {
    breadcrumbs,
};
