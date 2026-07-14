import { Head, useForm, usePage, router } from '@inertiajs/react';
import {
    PlusCircle,
    FileSpreadsheet,
    ListChecks,
    UserPlus,
    Trash2,
    Box,
    Package,
    ClipboardList,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/can';
import { RowActionsMenu } from '@/components/row-actions-menu';
import { SimplePagination } from '@/components/simple-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DatePicker } from '@/components/ui/date-picker';
import { SmartSelect } from '@/components/ui/smart-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    filters?: {
        search?: string;
        type?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory/properties' },
    { title: 'Physical Counts', href: '/inventory/physical-counts' },
];

export default function PhysicalCountsIndex({
    counts,
    employees,
    filters = {},
}: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newMemberIndex, setNewMemberIndex] = useState<number | null>(null);
    const [countToDelete, setCountToDelete] = useState<PhysicalCount | null>(
        null,
    );

    // Search and Filter States
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const handleFilterChange = (
        newSearch: string,
        newType: string,
        newStatus: string,
    ) => {
        router.get(
            '/inventory/physical-counts',
            {
                search: newSearch || undefined,
                type: newType !== 'all' ? newType : undefined,
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
        handleFilterChange(search, typeFilter, statusFilter);
    };

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('all');
        setStatusFilter('all');
        router.get(
            '/inventory/physical-counts',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const { auth } = usePage<any>().props;
    const currentEmployee = employees.find((e) => e.user_id === auth.user?.id);

    const employeeOptions = employees.map((emp) => ({
        value: emp.id.toString(),
        label: emp.name + (emp.position ? ` (${emp.position})` : ''),
    }));

    const form = useForm({
        type: 'RPCPPE',
        as_of_date: new Date().toISOString().split('T')[0],
        chairperson_id: '',
        head_of_agency_id: '',
        member_ids: [''],
        coa_representative_id: '',
        coa_representative_absent_reason: '',
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
                Object.values(errors).forEach((err) => toast.error(err));
            },
        });
    };

    return (
        <>
            <Head title="Physical Counts" />

            <Dialog
                open={countToDelete !== null}
                onOpenChange={(open) => !open && setCountToDelete(null)}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Draft Physical Count</DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to delete the draft physical
                            count for{' '}
                            {countToDelete &&
                                new Date(
                                    countToDelete.as_of_date,
                                ).toLocaleDateString()}
                            ? This action is permanent and will delete all
                            encoded quantities and remarks.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setCountToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Confirm Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Physical Counts & COA Reporting
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage and conduct RPCPPE and RPCI inventory counts.
                        </p>
                    </div>

                    <Can permission="reports.view">
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Initiate Physical Count
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        Initiate New Physical Count
                                    </DialogTitle>
                                    <DialogDescription>
                                        This will take a snapshot of the current
                                        inventory for reporting.
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={submit}
                                    className="mt-4 space-y-6"
                                >
                                    <Card className="border-muted/60 shadow-sm overflow-hidden">
                                        <CardHeader className="border-b bg-muted/20 pb-3">
                                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                Report Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-5 pt-4">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Count Type / Report Type</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => form.setData('type', 'RPCPPE')}
                                                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                                                            form.data.type === 'RPCPPE'
                                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                                : 'hover:border-border/80 hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className={`mt-0.5 rounded-lg p-2 ${
                                                            form.data.type === 'RPCPPE' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            <Box className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold">RPCPPE</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">Property, Plant & Equipment</p>
                                                        </div>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => form.setData('type', 'RPCI')}
                                                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                                                            form.data.type === 'RPCI'
                                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                                : 'hover:border-border/80 hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className={`mt-0.5 rounded-lg p-2 ${
                                                            form.data.type === 'RPCI' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            <Package className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold">RPCI</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">Inventories & Consumables</p>
                                                        </div>
                                                    </button>
                                                </div>
                                                {form.errors.type && <p className="text-xs text-destructive">{form.errors.type}</p>}
                                            </div>

                                            <div className="space-y-2 flex flex-col">
                                                <Label htmlFor="as_of_date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">As of Date</Label>
                                                <DatePicker
                                                    value={form.data.as_of_date}
                                                    onChange={(v) => form.setData('as_of_date', v)}
                                                    required
                                                />
                                                {form.errors.as_of_date && <p className="text-xs text-destructive">{form.errors.as_of_date}</p>}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-muted/60 shadow-sm overflow-hidden">
                                        <CardHeader className="border-b bg-muted/20 pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                                    <Users className="h-4 w-4 text-primary" />
                                                    Committee Assignment
                                                </CardTitle>
                                                <Button type="button" variant="outline" size="sm" onClick={addMemberSlot} className="h-7 text-xs">
                                                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                                    Add Member
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-5 pt-4">
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

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>COA Representative (Optional)</Label>
                                                    <SmartSelect
                                                        options={employeeOptions}
                                                        value={form.data.coa_representative_id}
                                                        onValueChange={(v) => {
                                                            form.setData('coa_representative_id', v);
                                                            if (v) {
                                                                form.setData('coa_representative_absent_reason', '');
                                                            }
                                                        }}
                                                        placeholder="Select COA Representative"
                                                        searchPlaceholder="Search employees..."
                                                    />
                                                    {form.errors.coa_representative_id && <p className="text-xs text-destructive">{form.errors.coa_representative_id}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>COA Absent Reason</Label>
                                                    <Input
                                                        placeholder="e.g. Schedule conflict"
                                                        value={form.data.coa_representative_absent_reason}
                                                        onChange={(e) => form.setData('coa_representative_absent_reason', e.target.value)}
                                                        disabled={!!form.data.coa_representative_id}
                                                    />
                                                    {form.errors.coa_representative_absent_reason && <p className="text-xs text-destructive">{form.errors.coa_representative_absent_reason}</p>}
                                                </div>
                                            </div>

                                            {form.data.member_ids.length > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Committee Members</Label>
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
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={() => removeMemberSlot(index)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span className="sr-only">Remove</span>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="mr-2"
                                            onClick={() => setIsCreateOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={form.processing}
                                        >
                                            Start Count
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </Can>
                </div>

                {/* Search and Filters Bar */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">
                            Filter Physical Counts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
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
                                        placeholder="Search type, date, creator..."
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
                                    Count Type
                                </Label>
                                <SmartSelect
                                    options={[
                                        { value: 'all', label: 'All Types' },
                                        {
                                            value: 'RPCPPE',
                                            label: 'RPCPPE (PPE Assets)',
                                        },
                                        {
                                            value: 'RPCI',
                                            label: 'RPCI (Supplies)',
                                        },
                                    ]}
                                    value={typeFilter}
                                    onValueChange={(val) => {
                                        setTypeFilter(val);
                                        handleFilterChange(
                                            search,
                                            val,
                                            statusFilter,
                                        );
                                    }}
                                    placeholder="Select Type"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Status
                                </Label>
                                <SmartSelect
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'draft', label: 'Draft' },
                                        {
                                            value: 'pending_review',
                                            label: 'Pending Review',
                                        },
                                        {
                                            value: 'finalized',
                                            label: 'Finalized',
                                        },
                                    ]}
                                    value={statusFilter}
                                    onValueChange={(val) => {
                                        setStatusFilter(val);
                                        handleFilterChange(
                                            search,
                                            typeFilter,
                                            val,
                                        );
                                    }}
                                    placeholder="Select Status"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        {(search ||
                            typeFilter !== 'all' ||
                            statusFilter !== 'all') && (
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

                <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Report Type</TableHead>
                                <TableHead>As of Date</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {counts.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {search ||
                                        typeFilter !== 'all' ||
                                        statusFilter !== 'all'
                                            ? 'No matching physical counts found.'
                                            : 'No physical counts initiated yet.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                counts.data.map((count) => {
                                    const isDraft = count.status === 'draft';
                                    const isCreator =
                                        currentEmployee &&
                                        count.created_by === currentEmployee.id;
                                    const canDelete = isDraft && isCreator;

                                    return (
                                        <TableRow key={count.id}>
                                            <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">
                                                {count.type}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    count.as_of_date,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {count.creator?.name}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                        count.status === 'draft'
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}
                                                >
                                                    {count.status.toUpperCase()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(
                                                    count.created_at,
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <RowActionsMenu
                                                    actions={[
                                                        {
                                                            label: 'View / Edit',
                                                            icon: ListChecks,
                                                            href: `/inventory/physical-counts/${count.id}`,
                                                        },
                                                        {
                                                            label: 'Export CSV',
                                                            icon: FileSpreadsheet,
                                                            href: `/inventory/physical-counts/${count.id}/export`,
                                                            external: true,
                                                            show:
                                                                count.status ===
                                                                'finalized',
                                                        },
                                                        {
                                                            label: 'Delete',
                                                            icon: Trash2,
                                                            onClick: () =>
                                                                setCountToDelete(
                                                                    count,
                                                                ),
                                                            show: canDelete,
                                                            destructive: true,
                                                        },
                                                    ]}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4">
                    <SimplePagination links={counts.links} />
                </div>
            </div>
        </>
    );
}

PhysicalCountsIndex.layout = {
    breadcrumbs,
};
