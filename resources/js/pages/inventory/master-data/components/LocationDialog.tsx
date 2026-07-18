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

interface LocationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    location?: any;
    warehouses: any[];
}

export function LocationDialog({
    isOpen,
    onClose,
    location,
    warehouses,
}: LocationDialogProps) {
    const isEditing = !!location;

    const form = useForm({
        code: '',
        warehouse_id: '',
        description: '',
    });

    useEffect(() => {
        if (isOpen) {
            form.reset();
            form.clearErrors();

            if (location) {
                form.setData({
                    code: location.code,
                    warehouse_id: location.warehouse_id?.toString() || '',
                    description: location.description || '',
                });
            } else {
                form.setData({
                    code: '',
                    warehouse_id: '',
                    description: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, location]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            form.put(`/inventory/locations/${location.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Location updated successfully.');
                    onClose();
                },
            });
        } else {
            form.post('/inventory/locations', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Location created successfully.');
                    onClose();
                },
            });
        }
    };

    const warehouseOptions = warehouses.map((w) => ({
        label: w.name,
        value: w.id.toString(),
    }));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Location' : 'Add Location'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Location Code{' '}
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
                        <Label htmlFor="warehouse_id">
                            Warehouse{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <SmartSelect
                            options={warehouseOptions}
                            value={form.data.warehouse_id}
                            onValueChange={(val) =>
                                form.setData('warehouse_id', val)
                            }
                            placeholder="Select warehouse..."
                        />
                        <InputError message={form.errors.warehouse_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.description} />
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
                            {form.processing ? 'Saving...' : 'Save Location'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
