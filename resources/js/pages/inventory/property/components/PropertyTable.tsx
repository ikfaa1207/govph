import { Clipboard, MoreHorizontal, UserCheck, RefreshCw, Trash2, Check, User, AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { Can } from '@/components/can';
import { RowActionsMenu, RowAction } from '@/components/row-actions-menu';
import { SimplePagination } from '@/components/simple-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Property } from '../index';

interface PropertyTableProps {
    properties: {
        data: Property[];
        links: any[];
    };
    selectedPropIds: number[];
    setSelectedPropIds: React.Dispatch<React.SetStateAction<number[]>>;
    canManage: boolean;
    isDeptHead: boolean;
    openAssignModal: (prop: Property) => void;
    openTransferModal: (prop: Property) => void;
    openSubAssignModal: (prop: Property) => void;
    openReturnSubAssignModal: (prop: Property) => void;
    openDisposeModal: (prop: Property) => void;
}

export function PropertyTable({
    properties,
    selectedPropIds,
    setSelectedPropIds,
    canManage,
    isDeptHead,
    openAssignModal,
    openTransferModal,
    openSubAssignModal,
    openReturnSubAssignModal,
    openDisposeModal,
}: PropertyTableProps) {
    const { hasPermission } = usePermissions();
    const canManageSubAssign = hasPermission('property.subassign') || isDeptHead;

    const renderStatusBadge = (status: Property['status']) => {
        switch (status) {
            case 'available':
                return (
                    <Badge variant="outline" className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30">
                        <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                        <span>Available</span>
                    </Badge>
                );
            case 'assigned':
                return (
                    <Badge variant="outline" className="inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/30">
                        <User className="h-3 w-3 text-blue-500" aria-hidden="true" />
                        <span>Assigned</span>
                    </Badge>
                );
            case 'transferred':
                return (
                    <Badge variant="outline" className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30">
                        <RefreshCw className="h-2.5 w-2.5 text-indigo-500" aria-hidden="true" />
                        <span>Transferred</span>
                    </Badge>
                );
            case 'disposed':
                return (
                    <Badge variant="outline" className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 border-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-400 dark:border-neutral-800/50">
                        <Trash2 className="h-3 w-3 text-neutral-500" aria-hidden="true" />
                        <span>Disposed</span>
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px] capitalize">
                        {status.replace(/_/g, ' ')}
                    </Badge>
                );
        }
    };

    const renderConditionBadge = (condition: Property['condition']) => {
        const isGood = condition === 'new' || condition === 'good';
        const label = condition.replace(/_/g, ' ');

        if (isGood) {
            return (
                <Badge variant="outline" className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30">
                    <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                    <span className="capitalize">{label}</span>
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/30">
                <AlertTriangle className="h-3 w-3 text-rose-500" aria-hidden="true" />
                <span className="capitalize">{label}</span>
            </Badge>
        );
    };

    return (
        <div className="overflow-x-auto">
            <Table className="text-xs">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10 text-center">
                            <input
                                type="checkbox"
                                aria-label="Select all available properties"
                                className="rounded border-gray-300"
                                checked={
                                    properties.data.length > 0 &&
                                    properties.data.every(
                                        (p) =>
                                            selectedPropIds.includes(p.id) ||
                                            p.status !== 'available',
                                    )
                                }
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        const availableIds = properties.data
                                            .filter((p) => p.status === 'available')
                                            .map((p) => p.id);
                                        setSelectedPropIds((prev) =>
                                            Array.from(new Set([...prev, ...availableIds])),
                                        );
                                    } else {
                                        const idsToRemove = properties.data.map((p) => p.id);
                                        setSelectedPropIds((prev) =>
                                            prev.filter((id) => !idsToRemove.includes(id)),
                                        );
                                    }
                                }}
                            />
                        </TableHead>
                        <TableHead className="whitespace-nowrap">Property No.</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="w-[180px]">Equipment Details</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Cost</TableHead>
                        <TableHead className="hidden md:table-cell">Accountable Officer</TableHead>
                        <TableHead className="hidden lg:table-cell whitespace-nowrap">Doc Reference</TableHead>
                        <TableHead className="hidden lg:table-cell text-center whitespace-nowrap">Condition</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                        {(canManage || canManageSubAssign) && (
                            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {properties.data.map((prop) => (
                        <TableRow key={prop.id}>
                            <TableCell className="text-center">
                                {prop.status === 'available' && (
                                    <input
                                        type="checkbox"
                                        aria-label={`Select property ${prop.property_number}`}
                                        className="rounded border-gray-300"
                                        checked={selectedPropIds.includes(prop.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedPropIds((prev) => [...prev, prop.id]);
                                            } else {
                                                setSelectedPropIds((prev) =>
                                                    prev.filter((id) => id !== prop.id),
                                                );
                                            }
                                        }}
                                    />
                                )}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] whitespace-nowrap">
                                {prop.property_number}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-[11px] text-muted-foreground">
                                {prop.category?.name}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                                <div
                                    className="truncate font-semibold"
                                    title={`${prop.brand} - ${prop.model}`}
                                >
                                    {prop.brand} - {prop.model}
                                </div>
                                <div
                                    className="truncate font-mono text-[11px] text-muted-foreground"
                                    title={`S/N: ${prop.serial_number}`}
                                >
                                    S/N: {prop.serial_number}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium whitespace-nowrap">
                                {formatCurrency(prop.unit_cost)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-[11px] leading-tight font-medium">
                                {prop.active_assignment ? (
                                    <div className="flex flex-col gap-0.5">
                                        <span>
                                            {prop.active_assignment.assignee?.name || (
                                                <span className="font-semibold">
                                                    {prop.active_assignment.non_system_name}
                                                </span>
                                            )}
                                        </span>
                                        {!prop.active_assignment.assignee && (
                                            <span className="w-fit rounded border border-amber-200/50 bg-amber-50 px-1 py-0.5 text-[10px] text-amber-600 dark:bg-amber-950/30">
                                                External ({prop.active_assignment.non_system_department})
                                            </span>
                                        )}
                                        {prop.active_sub_assignment && (
                                            <div className="mt-1 flex flex-col gap-0.5 rounded-md border border-blue-200/50 bg-blue-50 p-1.5 dark:bg-blue-950/30">
                                                <span className="text-[10px] font-semibold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                                                    Sub-Assigned To (MR)
                                                </span>
                                                <span className="text-xs text-blue-900 dark:text-blue-300">
                                                    {prop.active_sub_assignment.assignee?.name ||
                                                        prop.active_sub_assignment.non_system_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground italic">None Assigned</span>
                                )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-[10px] whitespace-nowrap text-indigo-500">
                                {prop.active_assignment ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                            <Clipboard className="h-3.5 w-3.5 text-indigo-500" />
                                            {prop.active_assignment.document_number}
                                        </div>
                                        {prop.active_sub_assignment && (
                                            <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                                                <Clipboard className="h-3 w-3" />
                                                {prop.active_sub_assignment.mr_number}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-center capitalize">
                                {renderConditionBadge(prop.condition)}
                            </TableCell>
                            <TableCell className="text-center capitalize">
                                {renderStatusBadge(prop.status)}
                            </TableCell>
                            {(canManage || canManageSubAssign) && (
                                <TableCell className="text-right whitespace-nowrap">
                                    <RowActionsMenu
                                        actions={[
                                            {
                                                label: 'Assign Equipment',
                                                icon: UserCheck,
                                                onClick: () => openAssignModal(prop),
                                                permission: 'property.assign',
                                                show: prop.status === 'available',
                                            },
                                            {
                                                label: 'Transfer Property (PTR)',
                                                icon: RefreshCw,
                                                onClick: () => openTransferModal(prop),
                                                permission: 'property.transfer',
                                                show:
                                                    prop.status === 'assigned' ||
                                                    prop.status === 'transferred',
                                            },
                                            {
                                                label: 'Issue Memo Receipt (MR)',
                                                icon: UserCheck,
                                                onClick: () => openSubAssignModal(prop),
                                                permission: 'property.subassign',
                                                show:
                                                    (prop.status === 'assigned' ||
                                                        prop.status === 'transferred') &&
                                                    !prop.active_sub_assignment,
                                            },
                                            {
                                                label: 'Return Memo Receipt',
                                                icon: RefreshCw,
                                                onClick: () => openReturnSubAssignModal(prop),
                                                permission: 'property.subassign',
                                                show:
                                                    !!prop.active_sub_assignment,
                                            },
                                            {
                                                label: 'Dispose Property',
                                                icon: Trash2,
                                                onClick: () => openDisposeModal(prop),
                                                permission: 'property.dispose',
                                                show: prop.status !== 'disposed',
                                                destructive: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="mt-4">
                <SimplePagination links={properties.links} />
            </div>
        </div>
    );
}
