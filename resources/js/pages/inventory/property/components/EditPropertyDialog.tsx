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
import type { Property } from '../index';

interface EditPropertyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property | null;
}

export function EditPropertyDialog({
    isOpen,
    onClose,
    property,
}: EditPropertyDialogProps) {
    const form = useForm({
        brand: property?.brand || '',
        model: property?.model || '',
        serial_number: property?.serial_number || '',
        condition: property?.condition || 'new',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!property) {
            return;
        }

        form.put(`/inventory/properties/${property.id}`, {
            onSuccess: () => {
                onClose();
                toast.success('Equipment details updated.');
            },
            onError: () => {
                toast.error('Failed to update property.');
            },
        });
    };

    const conditions = [
        { value: 'new', label: 'New' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'needs_repair', label: 'Needs Repair' },
        { value: 'unserviceable', label: 'Unserviceable' },
        { value: 'disposed', label: 'Disposed' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Property Details</DialogTitle>
                    <DialogDescription>
                        Update the brand, model, serial number, and physical
                        condition of the equipment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="brand" required>
                                Brand
                            </Label>
                            <Input
                                id="brand"
                                value={form.data.brand}
                                onChange={(e) =>
                                    form.setData('brand', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="model" required>
                                Model
                            </Label>
                            <Input
                                id="model"
                                value={form.data.model}
                                onChange={(e) =>
                                    form.setData('model', e.target.value)
                                }
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="serial" required>
                            Serial Number
                        </Label>
                        <Input
                            id="serial"
                            value={form.data.serial_number}
                            onChange={(e) =>
                                form.setData('serial_number', e.target.value)
                            }
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="condition" required>
                            Physical Condition
                        </Label>
                        <SmartSelect
                            options={conditions}
                            value={form.data.condition}
                            onValueChange={(val) =>
                                form.setData('condition', val)
                            }
                            placeholder="Select Condition"
                            className="w-full"
                            searchThreshold={0}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
