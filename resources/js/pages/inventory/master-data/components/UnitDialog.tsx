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

interface UnitDialogProps {
    isOpen: boolean;
    onClose: () => void;
    unit?: any;
}

export function UnitDialog({ isOpen, onClose, unit }: UnitDialogProps) {
    const isEditing = !!unit;

    const form = useForm({
        abbreviation: '',
        name: '',
    });

    useEffect(() => {
        if (isOpen) {
            form.reset();
            form.clearErrors();

            if (unit) {
                form.setData({
                    abbreviation: unit.abbreviation,
                    name: unit.name,
                });
            } else {
                form.setData({
                    abbreviation: '',
                    name: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, unit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            form.put(`/inventory/units/${unit.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Unit updated successfully.');
                    onClose();
                },
            });
        } else {
            form.post('/inventory/units', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Unit created successfully.');
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
                        {isEditing ? 'Edit Unit' : 'Add Unit'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="abbreviation">
                            Unit Abbreviation{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="abbreviation"
                            value={form.data.abbreviation}
                            onChange={(e) =>
                                form.setData('abbreviation', e.target.value)
                            }
                            disabled={form.processing}
                        />
                        <InputError message={form.errors.abbreviation} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Unit Name{' '}
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
                            {form.processing ? 'Saving...' : 'Save Unit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
