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
import { SmartSelect } from '@/components/ui/smart-select';
import { Property } from '../index';

interface TransferDialogProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    employees: any[];
    offices: any[];
}

export function TransferDialog({
    isOpen,
    onClose,
    property,
    employees,
    offices,
}: TransferDialogProps) {
    const form = useForm({
        to_employee_id: '',
        office_id: '',
        reason: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/inventory/properties/${property.id}/transfer`, {
            onSuccess: () => {
                onClose();
                toast.success('Property transferred and new PAR/ICS generated.');
            },
            onError: () => {
                toast.error('Failed to complete property transfer.');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transfer Accountable Property (PTR)</DialogTitle>
                    <DialogDescription>
                        Record a Property Transfer Report (PTR) to transfer the asset.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="new_assignee">Recipient Employee</Label>
                        <SmartSelect
                            options={employees.map((e) => ({
                                value: String(e.id),
                                label: `${e.name} (${e.position})`,
                            }))}
                            value={form.data.to_employee_id ? String(form.data.to_employee_id) : undefined}
                            onValueChange={(val) => form.setData('to_employee_id', val)}
                            placeholder="Select Recipient"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="office" required>
                            Target Office
                        </Label>
                        <SmartSelect
                            options={offices.map((o) => ({
                                value: String(o.id),
                                label: o.name,
                            }))}
                            value={form.data.office_id ? String(form.data.office_id) : undefined}
                            onValueChange={(val) => form.setData('office_id', val)}
                            placeholder="Select Office"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="reason" required>
                            Reason for Transfer
                        </Label>
                        <textarea
                            id="reason"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                            value={form.data.reason}
                            onChange={(e) => form.setData('reason', e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Authorize Transfer (PTR)
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
