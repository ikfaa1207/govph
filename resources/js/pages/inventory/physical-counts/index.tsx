import { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { PlusCircle, FileSpreadsheet, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PhysicalCount {
    id: number;
    type: string;
    as_of_date: string;
    status: string;
    created_at: string;
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory/properties' },
    { title: 'Physical Counts', href: '/inventory/physical-counts' },
];

export default function PhysicalCountsIndex({ counts }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const form = useForm({
        type: 'RPCPPE',
        as_of_date: new Date().toISOString().split('T')[0],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/inventory/physical-counts', {
            onSuccess: () => setIsCreateOpen(false),
        });
    };

    return (
        <>
            <Head title="Physical Counts" />

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
                        <DialogContent>
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
                                counts.data.map((count) => (
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
                                ))
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
