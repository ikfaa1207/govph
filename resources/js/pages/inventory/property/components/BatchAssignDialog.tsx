import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SmartSelect } from '@/components/ui/smart-select';

interface BatchAssignDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPropIds: number[];
    setSelectedPropIds: (ids: number[]) => void;
    employees: any[];
}

export function BatchAssignDialog({
    isOpen,
    onClose,
    selectedPropIds,
    setSelectedPropIds,
    employees,
}: BatchAssignDialogProps) {
    const form = useForm({
        property_ids: selectedPropIds,
        assigned_to: '',
        is_non_system: false,
        non_system_name: '',
        non_system_department: '',
        remarks: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/inventory/properties/batch-assign`, {
            onSuccess: () => {
                onClose();
                setSelectedPropIds([]);
                toast.success(
                    'Equipment assigned. Handover document(s) generated.',
                );
            },
            onError: () => {
                toast.error('Failed to assign equipment.');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Batch Assign Equipment Accountability
                    </DialogTitle>
                    <DialogDescription>
                        Assign {selectedPropIds.length} properties to an
                        employee. PAR and ICS documents will be automatically
                        generated and grouped.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Assignee Type
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    form.setData((data) => ({
                                        ...data,
                                        is_non_system: false,
                                        non_system_name: '',
                                        non_system_department: '',
                                    }));
                                }}
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-semibold transition-all ${
                                    !form.data.is_non_system
                                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/20 dark:text-indigo-400'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                <span>Registered Employee</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    form.setData((data) => ({
                                        ...data,
                                        is_non_system: true,
                                        assigned_to: '',
                                    }));
                                }}
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-semibold transition-all ${
                                    form.data.is_non_system
                                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/20 dark:text-indigo-400'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                <span>Non-System / External User</span>
                            </button>
                        </div>
                    </div>

                    {!form.data.is_non_system ? (
                        <div className="space-y-1">
                            <Label htmlFor="batch_assignee">Employee</Label>
                            <SmartSelect
                                options={employees.map((e) => ({
                                    value: String(e.id),
                                    label: `${e.name} (${e.position})`,
                                }))}
                                value={
                                    form.data.assigned_to
                                        ? String(form.data.assigned_to)
                                        : undefined
                                }
                                onValueChange={(val) =>
                                    form.setData('assigned_to', val)
                                }
                                placeholder="Select Employee"
                                className="w-full"
                                disabled={form.data.is_non_system}
                            />
                            {form.errors.assigned_to && (
                                <p className="text-xs text-destructive">
                                    {form.errors.assigned_to}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="batch_non_system_name" required>
                                    Full Name
                                </Label>
                                <Input
                                    id="batch_non_system_name"
                                    type="text"
                                    placeholder="Juan dela Cruz"
                                    value={form.data.non_system_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'non_system_name',
                                            e.target.value,
                                        )
                                    }
                                    required={form.data.is_non_system}
                                />
                                {form.errors.non_system_name && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.non_system_name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label
                                    htmlFor="batch_non_system_department"
                                    required
                                >
                                    Department / Office / Agency
                                </Label>
                                <Input
                                    id="batch_non_system_department"
                                    type="text"
                                    placeholder="DICT Regional Office"
                                    value={form.data.non_system_department}
                                    onChange={(e) =>
                                        form.setData(
                                            'non_system_department',
                                            e.target.value,
                                        )
                                    }
                                    required={form.data.is_non_system}
                                />
                                {form.errors.non_system_department && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.non_system_department}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor="batch_rem" required>
                            Remarks
                        </Label>
                        <textarea
                            id="batch_rem"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                            value={form.data.remarks}
                            onChange={(e) =>
                                form.setData('remarks', e.target.value)
                            }
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Confirm Batch Assignment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
