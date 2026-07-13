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
import { Label } from '@/components/ui/label';
import type { Property } from '../index';

interface ReturnSubAssignDialogProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
}

export function ReturnSubAssignDialog({
    isOpen,
    onClose,
    property,
}: ReturnSubAssignDialogProps) {
    const form = useForm({
        remarks: '',
    });

    const activeSubAssignment = property.active_sub_assignment;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeSubAssignment) {
            return;
        }

        form.post(
            `/inventory/properties/sub-assignments/${activeSubAssignment.id}/return`,
            {
                onSuccess: () => {
                    onClose();
                    toast.success('Memorandum Receipt returned successfully.');
                },
                onError: () => {
                    toast.error('Failed to return MR.');
                },
            },
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Return Memorandum Receipt (MR)</DialogTitle>
                    <DialogDescription>
                        Mark the property as returned to the Department
                        Custodian.
                    </DialogDescription>
                </DialogHeader>
                {activeSubAssignment && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="mb-2 rounded border border-blue-200/50 bg-blue-50 p-3 dark:bg-blue-950/30">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                                Returning MR from:
                            </p>
                            <p className="mt-1 text-xs text-blue-800 dark:text-blue-400">
                                {activeSubAssignment.assignee?.name ||
                                    activeSubAssignment.non_system_name}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="ret_mr_rem">
                                Return Remarks / Condition Notes
                            </Label>
                            <textarea
                                id="ret_mr_rem"
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
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                Confirm Return
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
