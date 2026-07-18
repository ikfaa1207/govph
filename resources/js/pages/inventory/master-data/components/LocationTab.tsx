import { router } from '@inertiajs/react';
import { Edit2, MapPin, Plus, Power, PowerOff } from 'lucide-react';
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

export default function LocationTab({
    locations,
    onEdit,
    onAdd,
}: {
    locations: any[];
    onEdit: (location: any) => void;
    onAdd?: () => void;
}) {
    const handleToggle = (id: number) => {
        router.post(
            `/inventory/locations/${id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Location status updated.'),
                onError: (err: any) => {
                    const message =
                        err.error ||
                        Object.values(err)[0] ||
                        'Failed to update location status.';
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
                        <TableHead>Code</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {locations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24">
                                <EmptyState
                                    icon={MapPin}
                                    title="No locations found"
                                    description="Get started by creating a new location."
                                    action={
                                        onAdd && (
                                            <Button onClick={onAdd} size="sm">
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Location
                                            </Button>
                                        )
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        locations.map((loc) => (
                            <TableRow key={loc.id}>
                                <TableCell className="font-medium">
                                    {loc.code}
                                </TableCell>
                                <TableCell>{loc.warehouse?.name}</TableCell>
                                <TableCell>{loc.description}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            loc.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {loc.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Edit Location',
                                                icon: Edit2,
                                                onClick: () => onEdit(loc),
                                            },
                                            {
                                                label: loc.is_active
                                                    ? 'Deactivate Location'
                                                    : 'Activate Location',
                                                icon: loc.is_active
                                                    ? PowerOff
                                                    : Power,
                                                onClick: () =>
                                                    handleToggle(loc.id),
                                                destructive: loc.is_active,
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
