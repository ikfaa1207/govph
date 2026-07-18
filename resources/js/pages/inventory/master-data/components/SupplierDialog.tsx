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

interface SupplierDialogProps {
    isOpen: boolean;
    onClose: () => void;
    supplier?: any;
}

export function SupplierDialog({
    isOpen,
    onClose,
    supplier,
}: SupplierDialogProps) {
    const isEditing = !!supplier;

    const form = useForm({
        name: '',
        tin: '',
        contact_person: '',
        contact_number: '',
        address: '',
    });

    useEffect(() => {
        if (isOpen) {
            form.reset();
            form.clearErrors();

            if (supplier) {
                form.setData({
                    name: supplier.name,
                    tin: supplier.tin,
                    contact_person: supplier.contact_person,
                    contact_number: supplier.contact_number || '',
                    address: supplier.address,
                });
            } else {
                form.setData({
                    name: '',
                    tin: '',
                    contact_person: '',
                    contact_number: '',
                    address: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, supplier]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            form.put(`/inventory/suppliers/${supplier.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Supplier updated successfully.');
                    onClose();
                },
            });
        } else {
            form.post('/inventory/suppliers', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Supplier created successfully.');
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Supplier' : 'Add Supplier'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="name">
                                Supplier Name{' '}
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

                        <div className="space-y-2">
                            <Label htmlFor="tin">
                                TIN <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="tin"
                                value={form.data.tin}
                                onChange={(e) =>
                                    form.setData('tin', e.target.value)
                                }
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.tin} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_person">
                                Contact Person{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="contact_person"
                                value={form.data.contact_person}
                                onChange={(e) =>
                                    form.setData(
                                        'contact_person',
                                        e.target.value,
                                    )
                                }
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.contact_person} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_number">
                                Contact Number
                            </Label>
                            <Input
                                id="contact_number"
                                value={form.data.contact_number}
                                onChange={(e) =>
                                    form.setData(
                                        'contact_number',
                                        e.target.value,
                                    )
                                }
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.contact_number} />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="address">
                                Address{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="address"
                                value={form.data.address}
                                onChange={(e) =>
                                    form.setData('address', e.target.value)
                                }
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.address} />
                        </div>
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
                            {form.processing ? 'Saving...' : 'Save Supplier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
