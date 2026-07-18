import { router } from '@inertiajs/react';
import { Building, Edit2, Plus, Power, PowerOff } from 'lucide-react';
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

export default function WarehouseTab({
    warehouses,
    onEdit,
    onAdd,
}: {
    warehouses: any[];
    onEdit: (warehouse: any) => void;
    onAdd?: () => void;
}) {
    const handleToggle = (id: number) => {
        router.post(
            `/inventory/warehouses/${id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Warehouse status updated.'),
                onError: (err: any) => {
                    const message =
                        err.error ||
                        Object.values(err)[0] ||
                        'Failed to update warehouse status.';
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
                        <TableHead>Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {warehouses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24">
                                <EmptyState
                                    icon={Building}
                                    title="No warehouses found"
                                    description="Get started by creating a new warehouse."
                                    action={
                                        onAdd && (
                                            <Button onClick={onAdd} size="sm">
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Warehouse
                                            </Button>
                                        )
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        warehouses.map((warehouse) => (
                            <TableRow key={warehouse.id}>
                                <TableCell className="font-medium">
                                    {warehouse.name}
                                </TableCell>
                                <TableCell>
                                    {warehouse.address || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            warehouse.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {warehouse.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Edit Warehouse',
                                                icon: Edit2,
                                                onClick: () =>
                                                    onEdit(warehouse),
                                            },
                                            {
                                                label: warehouse.is_active
                                                    ? 'Deactivate Warehouse'
                                                    : 'Activate Warehouse',
                                                icon: warehouse.is_active
                                                    ? PowerOff
                                                    : Power,
                                                onClick: () =>
                                                    handleToggle(warehouse.id),
                                                destructive:
                                                    warehouse.is_active,
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
