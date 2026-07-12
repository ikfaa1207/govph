import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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

interface AddPropertyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    categories: any[];
}

export function AddPropertyDialog({ isOpen, onClose, categories }: AddPropertyDialogProps) {
    const form = useForm({
        brand: '',
        model: '',
        serial_number: '',
        unit_cost: 0,
        date_acquired: '',
        category_id: '',
        warranty_expiration: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/inventory/properties', {
            onSuccess: () => {
                onClose();
                form.reset();
                toast.success('Equipment registered in database.');
            },
            onError: () => {
                toast.error('Failed to register property.');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register Property (PPE)</DialogTitle>
                    <DialogDescription>
                        Register high-value assets and equipment into the registry.
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
                                onChange={(e) => form.setData('brand', e.target.value)}
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
                                onChange={(e) => form.setData('model', e.target.value)}
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
                            onChange={(e) => form.setData('serial_number', e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="cost" required>
                                Unit Cost (PHP)
                            </Label>
                            <Input
                                id="cost"
                                type="number"
                                value={form.data.unit_cost}
                                onChange={(e) => form.setData('unit_cost', parseFloat(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="cat" required>
                                Category
                            </Label>
                            <SmartSelect
                                options={categories.map((c) => ({
                                    value: String(c.id),
                                    label: c.name,
                                }))}
                                value={form.data.category_id ? String(form.data.category_id) : undefined}
                                onValueChange={(val) => form.setData('category_id', val)}
                                placeholder="Select Category"
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="acq" required>
                                Acquisition Date
                            </Label>
                            <DatePicker
                                value={form.data.date_acquired}
                                onChange={(val) => form.setData('date_acquired', val)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="war" required>
                                Warranty Expiration
                            </Label>
                            <DatePicker
                                value={form.data.warranty_expiration}
                                onChange={(val) => form.setData('warranty_expiration', val)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Register Asset
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
