import { router } from '@inertiajs/react';
import { Edit2, Package, Plus, Power, PowerOff } from 'lucide-react';
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

export default function CategoryTab({
    categories,
    onEdit,
    onAdd,
}: {
    categories: any[];
    onEdit: (category: any) => void;
    onAdd?: () => void;
}) {
    const handleToggle = (id: number) => {
        router.post(
            `/inventory/categories/${id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Category status updated.'),
                onError: (err: any) => {
                    const message =
                        err.error ||
                        Object.values(err)[0] ||
                        'Failed to update category status.';
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
                        <TableHead>Name</TableHead>
                        <TableHead>PPE Category?</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24">
                                <EmptyState
                                    icon={Package}
                                    title="No categories found"
                                    description="Get started by creating a new category."
                                    action={
                                        onAdd && (
                                            <Button onClick={onAdd} size="sm">
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Category
                                            </Button>
                                        )
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        categories.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell className="font-medium">
                                    {cat.code}
                                </TableCell>
                                <TableCell>{cat.name}</TableCell>
                                <TableCell>
                                    {cat.is_ppe ? 'Yes' : 'No'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            cat.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {cat.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Edit Category',
                                                icon: Edit2,
                                                onClick: () => onEdit(cat),
                                            },
                                            {
                                                label: cat.is_active
                                                    ? 'Deactivate Category'
                                                    : 'Activate Category',
                                                icon: cat.is_active
                                                    ? PowerOff
                                                    : Power,
                                                onClick: () =>
                                                    handleToggle(cat.id),
                                                destructive: cat.is_active,
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
