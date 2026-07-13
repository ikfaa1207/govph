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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Property } from '../index';

interface SubAssignDialogProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    employees: any[];
    current_employee: any;
}

export function SubAssignDialog({
    isOpen,
    onClose,
    property,
    employees,
    current_employee,
}: SubAssignDialogProps) {
    const form = useForm({
        issued_to: '',
        is_non_system: false,
        non_system_name: '',
        non_system_department: '',
        remarks: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/inventory/properties/${property.id}/sub-assign`, {
            onSuccess: () => {
                onClose();
                toast.success('Memorandum Receipt (MR) issued successfully.');
            },
            onError: () => {
                toast.error('Failed to issue MR.');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Issue Memorandum Receipt (MR)</DialogTitle>
                    <DialogDescription>
                        Internally track custody of this property within your
                        department.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            MR Assignee Type
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
                                        ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:border-blue-400 dark:bg-blue-950/20 dark:text-blue-400'
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
                                        issued_to: '',
                                    }));
                                }}
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-semibold transition-all ${
                                    form.data.is_non_system
                                        ? 'border-blue-600 bg-blue-50/50 text-blue-600 dark:border-blue-400 dark:bg-blue-950/20 dark:text-blue-400'
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                <span>Non-System User</span>
                            </button>
                        </div>
                    </div>

                    {!form.data.is_non_system ? (
                        <div className="space-y-1">
                            <Label htmlFor="mr_assignee">Employee</Label>
                            <Select
                                value={String(form.data.issued_to)}
                                onValueChange={(val) =>
                                    form.setData('issued_to', val)
                                }
                                required={!form.data.is_non_system}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees
                                        .filter(
                                            (e) =>
                                                current_employee &&
                                                e.department_id ===
                                                    current_employee.department_id,
                                        )
                                        .map((e) => (
                                            <SelectItem
                                                key={e.id}
                                                value={String(e.id)}
                                            >
                                                {e.name} ({e.position})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="mr_non_system_name" required>
                                    Full Name
                                </Label>
                                <Input
                                    id="mr_non_system_name"
                                    type="text"
                                    value={form.data.non_system_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'non_system_name',
                                            e.target.value,
                                        )
                                    }
                                    required={form.data.is_non_system}
                                />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                <em>
                                    Note: Department will automatically be set
                                    to your current department.
                                </em>
                            </p>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor="mr_rem">Remarks</Label>
                        <textarea
                            id="mr_rem"
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
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Issue MR
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
