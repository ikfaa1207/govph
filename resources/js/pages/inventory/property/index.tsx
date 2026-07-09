import { Head, useForm, setLayoutProps } from '@inertiajs/react';
import { PlusCircle, UserCheck, RefreshCw, Trash2, ShieldCheck, Clipboard, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/can';
import { SimplePagination } from '@/components/simple-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SmartSelect } from '@/components/ui/smart-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '@/lib/utils';

interface Property {
    id: number;
    property_number: string;
    serial_number: string;
    model: string;
    brand: string;
    unit_cost: number;
    date_acquired: string;
    warranty_expiration: string | null;
    condition: 'new' | 'good' | 'fair' | 'needs_repair' | 'unserviceable' | 'disposed';
    status: 'available' | 'assigned' | 'transferred' | 'for_disposal' | 'disposed';
    category?: {
        name: string;
    };
    active_assignment?: {
        document_number: string;
        document_type: 'PAR' | 'ICS';
        assignee?: {
            name: string;
        };
        non_system_name?: string | null;
        non_system_department?: string | null;
    };
}

interface PropertyIndexProps {
    properties: {
        data: Property[];
        links: any[];
    };
    employees: any[];
    categories: any[];
    offices: any[];
    auth: {
        user: {
            role: 'admin' | 'supply_officer' | 'property_custodian' | 'dept_head' | 'employee' | 'auditor';
            roles?: string[];
        };
    };
    current_employee: any;
}

export default function PropertyIndex({ properties, employees, categories, offices, auth, current_employee }: PropertyIndexProps) {
    const breadcrumbs = [{ title: 'Property Registry (PPE)', href: '/inventory/properties' }];
    setLayoutProps({ breadcrumbs });
    
    const { hasAnyPermission } = usePermissions();
    const isDeptHead = auth.user.roles?.includes('Department Head');
    const canManage = hasAnyPermission(['property.assign', 'property.transfer', 'property.dispose']) || isDeptHead;

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isDisposeOpen, setIsDisposeOpen] = useState(false);
    const [isSubAssignOpen, setIsSubAssignOpen] = useState(false);
    const [isReturnSubAssignOpen, setIsReturnSubAssignOpen] = useState(false);

    // Form for Adding Property
    const addForm = useForm({
        brand: '',
        model: '',
        serial_number: '',
        unit_cost: 0,
        date_acquired: '',
        category_id: '',
        warranty_expiration: '',
    });

    // Form for Assignment
    const assignForm = useForm({
        assigned_to: '',
        is_non_system: false,
        non_system_name: '',
        non_system_department: '',
        remarks: '',
    });

    // Form for Transfer
    const transferForm = useForm({
        to_employee_id: '',
        office_id: '',
        reason: '',
    });

    // Form for Disposal
    const disposeForm = useForm({
        disposal_method: 'destruction',
        reason: 'broken',
        appraised_value: 0,
        proceeds: 0,
    });

    // Form for Sub-Assignment (MR)
    const subAssignForm = useForm({
        issued_to: '',
        is_non_system: false,
        non_system_name: '',
        non_system_department: '',
        remarks: '',
    });

    // Form for Return Sub-Assignment
    const returnSubAssignForm = useForm({
        remarks: '',
    });

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/inventory/properties', {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
                toast.success('Equipment registered in database.');
            },
            onError: () => {
                toast.error('Failed to register property.');
            }
        });
    };

    const openAssignModal = (prop: Property) => {
        setSelectedProp(prop);
        assignForm.reset();
        setIsAssignOpen(true);
    };

    const handleAssignSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProp) {
return;
}

        assignForm.post(`/inventory/properties/${selectedProp.id}/assign`, {
            onSuccess: () => {
                setIsAssignOpen(false);
                toast.success('Equipment assigned. Handover document generated.');
            },
            onError: () => {
                toast.error('Failed to assign equipment.');
            }
        });
    };

    const openTransferModal = (prop: Property) => {
        setSelectedProp(prop);
        transferForm.reset();
        setIsTransferOpen(true);
    };

    const handleTransferSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProp) {
return;
}

        transferForm.post(`/inventory/properties/${selectedProp.id}/transfer`, {
            onSuccess: () => {
                setIsTransferOpen(false);
                toast.success('Property transferred and new PAR/ICS generated.');
            },
            onError: () => {
                toast.error('Failed to complete property transfer.');
            }
        });
    };

    const openDisposeModal = (prop: Property) => {
        setSelectedProp(prop);
        disposeForm.reset();
        setIsDisposeOpen(true);
    };

    const handleDisposeSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProp) {
return;
}

        disposeForm.post(`/inventory/properties/${selectedProp.id}/dispose`, {
            onSuccess: () => {
                setIsDisposeOpen(false);
                toast.success('Property condemned / disposed. IIRUP report completed.');
            },
            onError: () => {
                toast.error('Failed to dispose property.');
            }
        });
    };

    const openSubAssignModal = (prop: Property) => {
        setSelectedProp(prop);
        subAssignForm.reset();
        setIsSubAssignOpen(true);
    };

    const handleSubAssignSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProp) {
return;
}

        subAssignForm.post(`/inventory/properties/${selectedProp.id}/sub-assign`, {
            onSuccess: () => {
                setIsSubAssignOpen(false);
                toast.success('Memorandum Receipt (MR) issued successfully.');
            },
            onError: () => {
                toast.error('Failed to issue MR.');
            }
        });
    };

    const openReturnSubAssignModal = (prop: Property) => {
        setSelectedProp(prop);
        returnSubAssignForm.reset();
        setIsReturnSubAssignOpen(true);
    };

    const handleReturnSubAssignSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProp || !selectedProp.active_sub_assignment) {
return;
}

        returnSubAssignForm.post(`/inventory/properties/sub-assignments/${selectedProp.active_sub_assignment.id}/return`, {
            onSuccess: () => {
                setIsReturnSubAssignOpen(false);
                toast.success('Memorandum Receipt returned successfully.');
            },
            onError: () => {
                toast.error('Failed to return MR.');
            }
        });
    };

    return (
        <>
            <Head title="Property Registry - GIMS" />
            <div className="space-y-6 p-6">
                
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Property, Plant, and Equipment (PPE)</h1>
                        <p className="text-sm text-muted-foreground">Manage capitalized properties, serial codes, and handovers.</p>
                    </div>

                    <Can permission="property.assign">
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Register Equipment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Register Property (PPE)</DialogTitle>
                                    <DialogDescription>Register high-value assets and equipment into the registry.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="brand" required>Brand</Label>
                                            <Input id="brand" value={addForm.data.brand} onChange={e => addForm.setData('brand', e.target.value)} required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="model" required>Model</Label>
                                            <Input id="model" value={addForm.data.model} onChange={e => addForm.setData('model', e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="serial" required>Serial Number</Label>
                                        <Input id="serial" value={addForm.data.serial_number} onChange={e => addForm.setData('serial_number', e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="cost" required>Unit Cost (PHP)</Label>
                                            <Input id="cost" type="number" value={addForm.data.unit_cost} onChange={e => addForm.setData('unit_cost', parseFloat(e.target.value))} required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="cat" required>Category</Label>
                                            <SmartSelect 
                                                options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                                                value={addForm.data.category_id ? String(addForm.data.category_id) : undefined}
                                                onValueChange={val => addForm.setData('category_id', val)}
                                                placeholder="Select Category"
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="acq" required>Acquisition Date</Label>
                                            <DatePicker 
                                                value={addForm.data.date_acquired} 
                                                onChange={val => addForm.setData('date_acquired', val)} 
                                                required 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="war" required>Warranty Expiration</Label>
                                            <DatePicker 
                                                value={addForm.data.warranty_expiration} 
                                                onChange={val => addForm.setData('warranty_expiration', val)} 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={addForm.processing}>Register Asset</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </Can>
                </div>

                {/* Properties Registry Board */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Tracked Properties & Accountabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {properties.data.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No properties registered in the system.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="text-xs">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">Property No.</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="w-[180px]">Equipment Details</TableHead>
                                            <TableHead className="text-right whitespace-nowrap">Cost</TableHead>
                                            <TableHead>Accountable Officer</TableHead>
                                            <TableHead className="whitespace-nowrap">Doc Reference</TableHead>
                                            <TableHead className="text-center whitespace-nowrap">Condition</TableHead>
                                            <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                                            {canManage && <TableHead className="text-right whitespace-nowrap">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {properties.data.map((prop) => (
                                            <TableRow key={prop.id}>
                                                <TableCell className="font-mono text-[11px] whitespace-nowrap">{prop.property_number}</TableCell>
                                                <TableCell className="text-muted-foreground text-[11px]">{prop.category?.name}</TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <div className="font-semibold truncate" title={`${prop.brand} - ${prop.model}`}>{prop.brand} - {prop.model}</div>
                                                    <div className="text-[11px] text-muted-foreground font-mono truncate" title={`S/N: ${prop.serial_number}`}>S/N: {prop.serial_number}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(prop.unit_cost)}</TableCell>
                                                <TableCell className="font-medium text-[11px] leading-tight">
                                                    {prop.active_assignment ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span>
                                                                {prop.active_assignment.assignee?.name || (
                                                                    <span className="font-semibold">{prop.active_assignment.non_system_name}</span>
                                                                )}
                                                            </span>
                                                            {!prop.active_assignment.assignee && (
                                                                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.5 rounded border border-amber-200/50 w-fit">
                                                                    External ({prop.active_assignment.non_system_department})
                                                                </span>
                                                            )}
                                                            {prop.active_sub_assignment && (
                                                                <div className="mt-1 flex flex-col gap-0.5 p-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 rounded-md">
                                                                    <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Sub-Assigned To (MR)</span>
                                                                    <span className="text-xs text-blue-900 dark:text-blue-300">
                                                                        {prop.active_sub_assignment.assignee?.name || prop.active_sub_assignment.non_system_name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">None Assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-[10px] text-indigo-500 whitespace-nowrap">
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
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-center capitalize">
                                                    <Badge variant={prop.condition === 'new' || prop.condition === 'good' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                                                        {prop.condition.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center capitalize">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {prop.status}
                                                    </Badge>
                                                </TableCell>
                                                {canManage && (
                                                    <TableCell className="text-right whitespace-nowrap">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <Can permission="property.assign">
                                                                    {prop.status === 'available' && (
                                                                        <DropdownMenuItem onClick={() => openAssignModal(prop)}>
                                                                            <UserCheck className="mr-2 h-4 w-4 text-sky-500" /> Assign Equipment
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </Can>
                                                                <Can permission="property.transfer">
                                                                    {(prop.status === 'assigned' || prop.status === 'transferred') && (
                                                                        <DropdownMenuItem onClick={() => openTransferModal(prop)}>
                                                                            <RefreshCw className="mr-2 h-4 w-4 text-amber-500" /> Transfer Property (PTR)
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </Can>
                                                                {(hasAnyPermission(['property.transfer']) || isDeptHead) && (
                                                                    <>
                                                                        {(prop.status === 'assigned' || prop.status === 'transferred') && !prop.active_sub_assignment && (
                                                                            <DropdownMenuItem onClick={() => openSubAssignModal(prop)}>
                                                                                <UserCheck className="mr-2 h-4 w-4 text-blue-500" /> Issue Memo Receipt (MR)
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {prop.active_sub_assignment && (
                                                                            <DropdownMenuItem onClick={() => openReturnSubAssignModal(prop)}>
                                                                                <RefreshCw className="mr-2 h-4 w-4 text-emerald-500" /> Return Memo Receipt
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </>
                                                                )}
                                                                <Can permission="property.dispose">
                                                                    {prop.status !== 'disposed' && (
                                                                        <>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDisposeModal(prop)}>
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Dispose Property
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                </Can>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                        )}
                    </CardContent>
                </Card>

                {/* Dialog: Assign Property */}
                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Equipment Accountability</DialogTitle>
                            <DialogDescription>Assign this equipment to an employee. The document routing is determined automatically.</DialogDescription>
                        </DialogHeader>
                        {selectedProp && (
                            <form onSubmit={handleAssignSubmit} className="space-y-4">
                                <div className="p-3 bg-muted/40 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground mb-2">
                                    <ShieldCheck className="h-4 w-4 text-indigo-500 mt-0.5" />
                                    <div>
                                        <strong>Automatic Document Determination:</strong>
                                        <p className="mt-0.5">
                                            Cost: <strong>{formatCurrency(selectedProp.unit_cost)}</strong>.
                                            {selectedProp.unit_cost >= 50000 ? (
                                                <span className="text-emerald-600 font-semibold block mt-0.5">
                                                    Cost is ≥ ₱50k. System will generate a Property Acknowledgment Receipt (PAR) for PPE.
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 font-semibold block mt-0.5">
                                                    Cost is &lt; ₱50k. System will generate an Inventory Custodian Slip (ICS) for semi-expendables.
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                assignForm.setData(data => ({
                                                    ...data,
                                                    is_non_system: false,
                                                    non_system_name: '',
                                                    non_system_department: '',
                                                }));
                                            }}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                                                !assignForm.data.is_non_system
                                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/20 dark:text-indigo-400'
                                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <span>Registered Employee</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                assignForm.setData(data => ({
                                                    ...data,
                                                    is_non_system: true,
                                                    assigned_to: '',
                                                }));
                                            }}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                                                assignForm.data.is_non_system
                                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/20 dark:text-indigo-400'
                                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <span>Non-System / External User</span>
                                        </button>
                                    </div>
                                </div>

                                {!assignForm.data.is_non_system ? (
                                    <div className="space-y-1">
                                        <Label htmlFor="assignee">Employee</Label>
                                        <SmartSelect 
                                            options={employees.map(e => ({ value: String(e.id), label: `${e.name} (${e.position})` }))}
                                            value={assignForm.data.assigned_to ? String(assignForm.data.assigned_to) : undefined}
                                            onValueChange={val => assignForm.setData('assigned_to', val)}
                                            placeholder="Select Employee"
                                            className="w-full"
                                            disabled={assignForm.data.is_non_system}
                                        />
                                        {assignForm.errors.assigned_to && (
                                            <p className="text-xs text-destructive">{assignForm.errors.assigned_to}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="non_system_name" required>Full Name</Label>
                                            <Input
                                                id="non_system_name"
                                                type="text"
                                                placeholder="e.g., Juan dela Cruz"
                                                value={assignForm.data.non_system_name}
                                                onChange={e => assignForm.setData('non_system_name', e.target.value)}
                                                required={assignForm.data.is_non_system}
                                            />
                                            {assignForm.errors.non_system_name && (
                                                <p className="text-xs text-destructive">{assignForm.errors.non_system_name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="non_system_department" required>Department / Office / Agency</Label>
                                            <Input
                                                id="non_system_department"
                                                type="text"
                                                placeholder="e.g., DICT Regional Office"
                                                value={assignForm.data.non_system_department}
                                                onChange={e => assignForm.setData('non_system_department', e.target.value)}
                                                required={assignForm.data.is_non_system}
                                            />
                                            {assignForm.errors.non_system_department && (
                                                <p className="text-xs text-destructive">{assignForm.errors.non_system_department}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <Label htmlFor="rem" required>Remarks</Label>
                                    <textarea id="rem" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden" value={assignForm.data.remarks} onChange={e => assignForm.setData('remarks', e.target.value)} />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={assignForm.processing}>Confirm Assignment</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Transfer Property */}
                <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Transfer Accountable Property (PTR)</DialogTitle>
                            <DialogDescription>Record a Property Transfer Report (PTR) to transfer the asset.</DialogDescription>
                        </DialogHeader>
                        {selectedProp && (
                            <form onSubmit={handleTransferSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="new_assignee">Recipient Employee</Label>
                                    <SmartSelect 
                                        options={employees.map(e => ({ value: String(e.id), label: `${e.name} (${e.position})` }))}
                                        value={transferForm.data.to_employee_id ? String(transferForm.data.to_employee_id) : undefined}
                                        onValueChange={val => transferForm.setData('to_employee_id', val)}
                                        placeholder="Select Recipient"
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="office" required>Target Office</Label>
                                    <SmartSelect 
                                        options={offices.map(o => ({ value: String(o.id), label: o.name }))}
                                        value={transferForm.data.office_id ? String(transferForm.data.office_id) : undefined}
                                        onValueChange={val => transferForm.setData('office_id', val)}
                                        placeholder="Select Office"
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="reason" required>Reason for Transfer</Label>
                                    <textarea id="reason" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden" value={transferForm.data.reason} onChange={e => transferForm.setData('reason', e.target.value)} required />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={transferForm.processing}>Authorize Transfer (PTR)</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Dispose Property */}
                <Dialog open={isDisposeOpen} onOpenChange={setIsDisposeOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Dispose / Condemn Equipment (IIRUP)</DialogTitle>
                            <DialogDescription>Declare this property as unserviceable and execute disposal protocols.</DialogDescription>
                        </DialogHeader>
                        {selectedProp && (
                            <form onSubmit={handleDisposeSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="method" required>Disposal Method</Label>
                                        <Select value={String(disposeForm.data.disposal_method)} onValueChange={val => disposeForm.setData('disposal_method', val as any)} required>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="destruction">Destruction</SelectItem>
                                                <SelectItem value="auction">Public Auction</SelectItem>
                                                <SelectItem value="transfer">Transfer to other Agency</SelectItem>
                                                <SelectItem value="donation">Donation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="disp_reason" required>Reason</Label>
                                        <Select value={String(disposeForm.data.reason)} onValueChange={val => disposeForm.setData('reason', val as any)} required>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Reason" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="broken">Broken / Unrepairable</SelectItem>
                                                <SelectItem value="obsolete">Obsolete / Outdated</SelectItem>
                                                <SelectItem value="lost">Lost / Stolen</SelectItem>
                                                <SelectItem value="condemned">Condemned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="appraise" required>Appraised Value</Label>
                                        <Input id="appraise" type="number" value={disposeForm.data.appraised_value} onChange={e => disposeForm.setData('appraised_value', parseFloat(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="proc">Sales Proceeds (if Auctioned)</Label>
                                        <Input id="proc" type="number" value={disposeForm.data.proceeds} onChange={e => disposeForm.setData('proceeds', parseFloat(e.target.value))} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDisposeOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={disposeForm.processing} className="bg-rose-600 hover:bg-rose-700 text-white">Execute Disposal</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Issue Memorandum Receipt (Sub-Assign) */}
                <Dialog open={isSubAssignOpen} onOpenChange={setIsSubAssignOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Issue Memorandum Receipt (MR)</DialogTitle>
                            <DialogDescription>Internally track custody of this property within your department.</DialogDescription>
                        </DialogHeader>
                        {selectedProp && (
                            <form onSubmit={handleSubAssignSubmit} className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">MR Assignee Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                subAssignForm.setData(data => ({
                                                    ...data,
                                                    is_non_system: false,
                                                    non_system_name: '',
                                                    non_system_department: '',
                                                }));
                                            }}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                                                !subAssignForm.data.is_non_system
                                                    ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:border-blue-400 dark:bg-blue-950/20 dark:text-blue-400'
                                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <span>Registered Employee</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                subAssignForm.setData(data => ({
                                                    ...data,
                                                    is_non_system: true,
                                                    issued_to: '',
                                                }));
                                            }}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                                                subAssignForm.data.is_non_system
                                                    ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:border-blue-400 dark:bg-blue-950/20 dark:text-blue-400'
                                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <span>Non-System User</span>
                                        </button>
                                    </div>
                                </div>

                                {!subAssignForm.data.is_non_system ? (
                                    <div className="space-y-1">
                                        <Label htmlFor="mr_assignee">Employee</Label>
                                        <Select value={String(subAssignForm.data.issued_to)} onValueChange={val => subAssignForm.setData('issued_to', val)} required={!subAssignForm.data.is_non_system}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees
                                                    .filter(e => current_employee && e.department_id === current_employee.department_id)
                                                    .map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.position})</SelectItem>)
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="mr_non_system_name" required>Full Name</Label>
                                            <Input
                                                id="mr_non_system_name"
                                                type="text"
                                                value={subAssignForm.data.non_system_name}
                                                onChange={e => subAssignForm.setData('non_system_name', e.target.value)}
                                                required={subAssignForm.data.is_non_system}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            <em>Note: Department will automatically be set to your current department.</em>
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <Label htmlFor="mr_rem">Remarks</Label>
                                    <textarea id="mr_rem" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden" value={subAssignForm.data.remarks} onChange={e => subAssignForm.setData('remarks', e.target.value)} />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsSubAssignOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={subAssignForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white">Issue MR</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Return Memorandum Receipt */}
                <Dialog open={isReturnSubAssignOpen} onOpenChange={setIsReturnSubAssignOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Return Memorandum Receipt (MR)</DialogTitle>
                            <DialogDescription>Mark the property as returned to the Department Custodian.</DialogDescription>
                        </DialogHeader>
                        {selectedProp && selectedProp.active_sub_assignment && (
                            <form onSubmit={handleReturnSubAssignSubmit} className="space-y-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200/50 mb-2">
                                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Returning MR from:</p>
                                    <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
                                        {selectedProp.active_sub_assignment.assignee?.name || selectedProp.active_sub_assignment.non_system_name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="ret_mr_rem">Return Remarks / Condition Notes</Label>
                                    <textarea id="ret_mr_rem" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden" value={returnSubAssignForm.data.remarks} onChange={e => returnSubAssignForm.setData('remarks', e.target.value)} />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsReturnSubAssignOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={returnSubAssignForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm Return</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
