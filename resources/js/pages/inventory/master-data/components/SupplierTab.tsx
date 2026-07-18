import { router } from '@inertiajs/react';
import { Edit2, Plus, Power, PowerOff, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { RowActionsMenu } from '@/components/row-actions-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function SupplierTab({
    suppliers,
    onEdit,
    onAdd,
}: {
    suppliers: any[];
    onEdit: (supplier: any) => void;
    onAdd?: () => void;
}) {
    const handleToggle = (id: number) => {
        router.post(
            `/inventory/suppliers/${id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Supplier status updated.'),
                onError: (err: any) => {
                    const message =
                        err.error ||
                        Object.values(err)[0] ||
                        'Failed to update supplier status.';
                    toast.error(message as string);
                },
            },
        );
    };

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>TIN</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24">
                                <EmptyState
                                    icon={Truck}
                                    title="No suppliers found"
                                    description="Get started by creating a new supplier."
                                    action={
                                        onAdd && (
                                            <Button onClick={onAdd} size="sm">
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Supplier
                                            </Button>
                                        )
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        suppliers.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">
                                    {supplier.name}
                                </TableCell>
                                <TableCell>{supplier.tin}</TableCell>
                                <TableCell>
                                    <div>{supplier.contact_person}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {supplier.contact_number}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            supplier.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {supplier.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Edit Supplier',
                                                icon: Edit2,
                                                onClick: () => onEdit(supplier),
                                            },
                                            {
                                                label: supplier.is_active
                                                    ? 'Deactivate Supplier'
                                                    : 'Activate Supplier',
                                                icon: supplier.is_active
                                                    ? PowerOff
                                                    : Power,
                                                onClick: () =>
                                                    handleToggle(supplier.id),
                                                destructive: supplier.is_active,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
