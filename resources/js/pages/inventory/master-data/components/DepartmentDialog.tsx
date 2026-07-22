import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SmartSelect } from '@/components/ui/smart-select';

interface DepartmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    department?: any;
    offices: any[];
}

export function DepartmentDialog({
    isOpen,
    onClose,
    department,
    offices,
}: DepartmentDialogProps) {
    const isEditing = !!department;

    const form = useForm({
        office_id: '',
        code: '',
        name: '',
    });

    useEffect(() => {
        if (isOpen) {
            form.reset();
            form.clearErrors();

            if (department) {
                form.setData({
                    office_id: String(department.office_id),
                    code: department.code,
                    name: department.name,
                });
            } else {
                form.setData({
                    office_id: offices.length > 0 ? String(offices[0].id) : '',
                    code: '',
                    name: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, department, offices]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            form.put(`/inventory/master-data/departments/${department.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Department updated successfully.');
                    onClose();
                },
            });
        } else {
            form.post('/inventory/master-data/departments', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Department created successfully.');
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Department' : 'Add Department'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="office_id">
                            Office / Campus{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <SmartSelect
                            options={offices.map((o) => ({
                                value: String(o.id),
                                label: o.name,
                            }))}
                            value={form.data.office_id}
                            onValueChange={(val) =>
                                form.setData('office_id', val)
                            }
                            placeholder="Select office/campus..."
                            searchThreshold={0}
                        />
                        <InputError message={form.errors.office_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Department Code{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="code"
                            value={form.data.code}
                            onChange={(e) =>
                                form.setData('code', e.target.value)
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.code} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Department Name{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : 'Save Department'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
