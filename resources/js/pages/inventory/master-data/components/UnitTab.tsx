import { router } from '@inertiajs/react';
import { Edit2, Plus, Power, PowerOff, Ruler } from 'lucide-react';
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

export default function UnitTab({
    units,
    onEdit,
    onAdd,
}: {
    units: any[];
    onEdit: (unit: any) => void;
    onAdd?: () => void;
}) {
    const handleToggle = (id: number) => {
        router.post(
            `/inventory/units/${id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Unit status updated.'),
                onError: (err: any) => {
                    const message =
                        err.error ||
                        Object.values(err)[0] ||
                        'Failed to update unit status.';
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
                        <TableHead>Abbreviation</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {units.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24">
                                <EmptyState
                                    icon={Ruler}
                                    title="No units found"
                                    description="Get started by creating a new unit of measurement."
                                    action={
                                        onAdd && (
                                            <Button onClick={onAdd} size="sm">
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Unit
                                            </Button>
                                        )
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        units.map((unit) => (
                            <TableRow key={unit.id}>
                                <TableCell className="font-medium">
                                    {unit.abbreviation}
                                </TableCell>
                                <TableCell>{unit.name}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            unit.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {unit.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Edit Unit',
                                                icon: Edit2,
                                                onClick: () => onEdit(unit),
                                            },
                                            {
                                                label: unit.is_active
                                                    ? 'Deactivate Unit'
                                                    : 'Activate Unit',
                                                icon: unit.is_active
                                                    ? PowerOff
                                                    : Power,
                                                onClick: () =>
                                                    handleToggle(unit.id),
                                                destructive: unit.is_active,
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
