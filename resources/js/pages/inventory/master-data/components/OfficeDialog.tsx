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

interface OfficeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    office?: any;
}

export function OfficeDialog({ isOpen, onClose, office }: OfficeDialogProps) {
    const isEditing = !!office;

    const form = useForm({
        code: '',
        name: '',
    });

    useEffect(() => {
        if (isOpen) {
            form.reset();
            form.clearErrors();

            if (office) {
                form.setData({
                    code: office.code,
                    name: office.name,
                });
            } else {
                form.setData({
                    code: '',
                    name: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, office]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            form.put(`/inventory/master-data/offices/${office.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Office updated successfully.');
                    onClose();
                },
            });
        } else {
            form.post('/inventory/master-data/offices', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Office created successfully.');
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
                        {isEditing ? 'Edit Office' : 'Add Office'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Office Code{' '}
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
                            Office Name{' '}
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
                            {form.processing ? 'Saving...' : 'Save Office'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
