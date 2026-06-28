import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm, setLayoutProps } from '@inertiajs/react';
import { PlusCircle, UserCheck, RefreshCw, Trash2, ShieldCheck, Clipboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

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
    properties: Property[];
    employees: any[];
    categories: any[];
    offices: any[];
    auth: {
        user: {
            role: 'admin' | 'supply_officer' | 'property_custodian' | 'dept_head' | 'employee' | 'auditor';
        };
    };
}

export default function PropertyIndex({ properties, employees, categories, offices, auth }: PropertyIndexProps) {
    const breadcrumbs = [{ title: 'Property Registry (PPE)', href: '/inventory/properties' }];
    setLayoutProps({ breadcrumbs });
    const userRole = auth.user.role;
    const canManage = userRole === 'property_custodian' || userRole === 'admin';

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isDisposeOpen, setIsDisposeOpen] = useState(false);

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
        if (!selectedProp) return;
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
        if (!selectedProp) return;
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
        if (!selectedProp) return;
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

                    {canManage && (
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
                                            <Label htmlFor="brand">Brand *</Label>
                                            <Input id="brand" value={addForm.data.brand} onChange={e => addForm.setData('brand', e.target.value)} required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="model">Model *</Label>
                                            <Input id="model" value={addForm.data.model} onChange={e => addForm.setData('model', e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="serial">Serial Number *</Label>
                                        <Input id="serial" value={addForm.data.serial_number} onChange={e => addForm.setData('serial_number', e.target.value)} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="cost">Unit Cost (PHP) *</Label>
                                            <Input id="cost" type="number" value={addForm.data.unit_cost} onChange={e => addForm.setData('unit_cost', parseFloat(e.target.value))} required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="cat">Category *</Label>
                                            <select 
                                                id="cat" 
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                value={addForm.data.category_id} 
                                                onChange={e => addForm.setData('category_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="acq">Acquisition Date *</Label>
                                            <Input id="acq" type="date" value={addForm.data.date_acquired} onChange={e => addForm.setData('date_acquired', e.target.value)} required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="war">Warranty Expiration</Label>
                                            <Input id="war" type="date" value={addForm.data.warranty_expiration} onChange={e => addForm.setData('warranty_expiration', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={addForm.processing}>Register Asset</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Properties Registry Board */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Tracked Properties & Accountabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {properties.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No properties registered in the system.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border pb-2 text-muted-foreground font-medium">
                                            <th className="py-2">Property No.</th>
                                            <th className="py-2">Category</th>
                                            <th className="py-2">Equipment Details</th>
                                            <th className="py-2">Cost</th>
                                            <th className="py-2">Accountable Officer</th>
                                            <th className="py-2">Doc Reference</th>
                                            <th className="py-2">Condition</th>
                                            <th className="py-2">Status</th>
                                            {canManage && <th className="py-2 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {properties.map((prop) => (
                                            <tr key={prop.id} className="hover:bg-muted/50">
                                                <td className="py-3 font-mono text-xs">{prop.property_number}</td>
                                                <td className="py-3 text-muted-foreground">{prop.category?.name}</td>
                                                <td className="py-3">
                                                    <div className="font-semibold">{prop.brand} - {prop.model}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">S/N: {prop.serial_number}</div>
                                                </td>
                                                <td className="py-3">₱{prop.unit_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-3 font-medium">
                                                    {prop.active_assignment ? (
                                                        prop.active_assignment.assignee?.name || (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-semibold">{prop.active_assignment.non_system_name}</span>
                                                                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.5 rounded border border-amber-200/50 w-fit">
                                                                    External ({prop.active_assignment.non_system_department})
                                                                </span>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <span className="text-muted-foreground italic">None Assigned</span>
                                                    )}
                                                </td>
                                                <td className="py-3 font-mono text-xs text-indigo-500">
                                                    {prop.active_assignment ? (
                                                        <div className="flex items-center gap-1">
                                                            <Clipboard className="h-3.5 w-3.5 text-indigo-500" />
                                                            {prop.active_assignment.document_number}
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-3 capitalize">
                                                    <Badge variant={prop.condition === 'new' || prop.condition === 'good' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                                                        {prop.condition.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 capitalize">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {prop.status}
                                                    </Badge>
                                                </td>
                                                {canManage && (
                                                    <td className="py-3 text-right space-x-1 whitespace-nowrap">
                                                        {prop.status === 'available' && (
                                                            <Button size="icon" variant="outline" title="Assign Equipment" onClick={() => openAssignModal(prop)}>
                                                                <UserCheck className="h-4 w-4 text-sky-500" />
                                                            </Button>
                                                        )}
                                                        {(prop.status === 'assigned' || prop.status === 'transferred') && (
                                                            <Button size="icon" variant="outline" title="Transfer Property (PTR)" onClick={() => openTransferModal(prop)}>
                                                                <RefreshCw className="h-4 w-4 text-amber-500" />
                                                            </Button>
                                                        )}
                                                        {prop.status !== 'disposed' && (
                                                            <Button size="icon" variant="outline" title="Dispose Property (IIRUP)" onClick={() => openDisposeModal(prop)}>
                                                                <Trash2 className="h-4 w-4 text-rose-500" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                            Cost: <strong>₱{selectedProp.unit_cost.toLocaleString()}</strong>.
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
                                        <Label htmlFor="assignee">Employee *</Label>
                                        <select 
                                            id="assignee" 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            value={assignForm.data.assigned_to} 
                                            onChange={e => assignForm.setData('assigned_to', e.target.value)}
                                            required={!assignForm.data.is_non_system}
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
                                        </select>
                                        {assignForm.errors.assigned_to && (
                                            <p className="text-xs text-destructive">{assignForm.errors.assigned_to}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="non_system_name">Full Name *</Label>
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
                                            <Label htmlFor="non_system_department">Department / Office / Agency *</Label>
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
                                    <Label htmlFor="rem">Remarks</Label>
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
                                    <Label htmlFor="new_assignee">Recipient Employee *</Label>
                                    <select 
                                        id="new_assignee" 
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                        value={transferForm.data.to_employee_id} 
                                        onChange={e => transferForm.setData('to_employee_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Recipient</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.position})</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="office">Target Office *</Label>
                                    <select 
                                        id="office" 
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                        value={transferForm.data.office_id} 
                                        onChange={e => transferForm.setData('office_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Office</option>
                                        {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="reason">Reason for Transfer *</Label>
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
                                        <Label htmlFor="method">Disposal Method *</Label>
                                        <select 
                                            id="method" 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            value={disposeForm.data.disposal_method} 
                                            onChange={e => disposeForm.setData('disposal_method', e.target.value)}
                                            required
                                        >
                                            <option value="destruction">Destruction</option>
                                            <option value="auction">Public Auction</option>
                                            <option value="transfer">Transfer to other Agency</option>
                                            <option value="donation">Donation</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="disp_reason">Reason *</Label>
                                        <select 
                                            id="disp_reason" 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            value={disposeForm.data.reason} 
                                            onChange={e => disposeForm.setData('reason', e.target.value)}
                                            required
                                        >
                                            <option value="broken">Broken / Unrepairable</option>
                                            <option value="obsolete">Obsolete / Outdated</option>
                                            <option value="lost">Lost / Stolen</option>
                                            <option value="condemned">Condemned</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="appraise">Appraised Value</Label>
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

            </div>
        </>
    );
}
