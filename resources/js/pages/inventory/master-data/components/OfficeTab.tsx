import { Edit2, Building2, Plus } from 'lucide-react';
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

export default function OfficeTab({
    offices,
    onEdit,
    onAdd,
}: {
    offices: any[];
    onEdit: (office: any) => void;
    onAdd?: () => void;
}) {
    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {offices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24">
                                <EmptyState
                                    icon={Building2}
                                    title="No offices found"
                                    description="Get started by creating a new office/campus."
                                    action={
                                        onAdd && (
                                            <Button onClick={onAdd} size="sm">
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Office
                                            </Button>
                                        )
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        offices.map((office) => (
                            <TableRow key={office.id}>
                                <TableCell className="font-medium">
                                    {office.code}
                                </TableCell>
                                <TableCell>{office.name}</TableCell>
                                <TableCell className="text-right">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Edit Office',
                                                icon: Edit2,
                                                onClick: () => onEdit(office),
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
