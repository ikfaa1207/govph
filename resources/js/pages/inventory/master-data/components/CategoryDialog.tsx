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

interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    category?: any;
}

export function CategoryDialog({
    isOpen,
    onClose,
    category,
}: CategoryDialogProps) {
    const isEditing = !!category;

    const form = useForm({
        code: '',
        name: '',
        is_ppe: false,
    });

    useEffect(() => {
        if (isOpen) {
            form.reset();
            form.clearErrors();

            if (category) {
                form.setData({
                    code: category.code,
                    name: category.name,
                    is_ppe: category.is_ppe,
                });
            } else {
                form.setData({
                    code: '',
                    name: '',
                    is_ppe: false,
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            form.put(`/inventory/categories/${category.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Category updated successfully.');
                    onClose();
                },
            });
        } else {
            form.post('/inventory/categories', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Category created successfully.');
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
                        {isEditing ? 'Edit Category' : 'Add Category'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Category Code{' '}
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
                            Category Name{' '}
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

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="is_ppe"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={form.data.is_ppe}
                            onChange={(e) =>
                                form.setData('is_ppe', e.target.checked)
                            }
                            disabled={form.processing}
                        />
                        <Label htmlFor="is_ppe">Is this a PPE Category?</Label>
                        <InputError message={form.errors.is_ppe} />
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
                            {form.processing ? 'Saving...' : 'Save Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
