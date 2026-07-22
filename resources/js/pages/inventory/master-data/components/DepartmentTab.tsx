import { Edit2, Landmark, Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { RowActionsMenu } from '@/components/row-actions-menu';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function DepartmentTab({
    departments,
    onEdit,
    onAdd,
}: {
    departments: any[];
    onEdit: (department: any) => void;
    onAdd?: () => void;
}) {
    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Office/Campus</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {departments.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24">
                                <EmptyState
                                    icon={Landmark}
                                    title="No departments found"
                                    description="Get started by creating a new department."
                                    action={
                                        onAdd && (
                                            <Button onClick={onAdd} size="sm">
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Department
                                            </Button>
                                        )
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        departments.map((dept) => (
                            <TableRow key={dept.id}>
                                <TableCell className="font-medium">
                                    {dept.code}
                                </TableCell>
                                <TableCell>{dept.name}</TableCell>
                                <TableCell>
                                    {dept.office?.name || 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Edit Department',
                                                icon: Edit2,
                                                onClick: () => onEdit(dept),
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
