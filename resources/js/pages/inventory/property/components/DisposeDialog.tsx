import { useForm } from '@inertiajs/react';
import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Property } from '../index';

interface DisposeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property;
    employees: Array<{ id: number; name: string; position?: string }>;
    current_employee: { id: number; name: string } | null;
}

export function DisposeDialog({ isOpen, onClose, property, employees, current_employee }: DisposeDialogProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const form = useForm({
        disposal_method: 'destruction',
        reason: 'broken',
        appraised_value: 0,
        proceeds: 0,
        approved_by: '',
        witness_by: '',
        inspected_by: '',
        jev_reference: '',
    });

    const eligibleApprovers = employees.filter((emp) => emp.id !== current_employee?.id);

    const handleSubmitClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.data.approved_by || !form.data.witness_by) {
            toast.error('Approver and Witnessed By fields are required.');
            return;
        }
        setIsConfirmOpen(true);
    };

    const confirmAndExecute = () => {
        setIsConfirmOpen(false);
        form.post(`/inventory/properties/${property.id}/dispose`, {
            onSuccess: () => {
                onClose();
                toast.success('Property condemned / disposed. IIRUP report completed.');
            },
            onError: () => {
                toast.error('Failed to dispose property.');
            },
        });
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Dispose / Condemn Equipment (IIRUP)</DialogTitle>
                        <DialogDescription>
                            Declare this property as unserviceable and execute disposal protocols.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitClick} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="method" required>
                                    Disposal Method
                                </Label>
                                <Select
                                    value={String(form.data.disposal_method)}
                                    onValueChange={(val) => form.setData('disposal_method', val as any)}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="destruction">Destruction</SelectItem>
                                        <SelectItem value="auction">Public Auction</SelectItem>
                                        <SelectItem value="transfer">Transfer to other Agency</SelectItem>
                                        <SelectItem value="donation">Donation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="disp_reason" required>
                                    Reason
                                </Label>
                                <Select
                                    value={String(form.data.reason)}
                                    onValueChange={(val) => form.setData('reason', val as any)}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="broken">Broken / Unrepairable</SelectItem>
                                        <SelectItem value="obsolete">Obsolete / Outdated</SelectItem>
                                        <SelectItem value="lost">Lost / Stolen</SelectItem>
                                        <SelectItem value="condemned">Condemned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="appraise" required>
                                    Appraised Value
                                </Label>
                                <Input
                                    id="appraise"
                                    type="number"
                                    value={form.data.appraised_value}
                                    onChange={(e) => form.setData('appraised_value', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="proc">Sales Proceeds (if Auctioned)</Label>
                                <Input
                                    id="proc"
                                    type="number"
                                    value={form.data.proceeds}
                                    onChange={(e) => form.setData('proceeds', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="approved_by" required>
                                    Approved By (Segregation Check)
                                </Label>
                                <Select
                                    value={String(form.data.approved_by)}
                                    onValueChange={(val) => form.setData('approved_by', val)}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Approver" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleApprovers.map((emp) => (
                                            <SelectItem key={emp.id} value={String(emp.id)}>
                                                {emp.name} ({emp.position || 'Staff'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.approved_by && (
                                    <p className="text-xs text-destructive">{form.errors.approved_by}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="witness_by" required>
                                    Witnessed By
                                </Label>
                                <Input
                                    id="witness_by"
                                    type="text"
                                    placeholder="COA Auditor / Officer name"
                                    value={form.data.witness_by}
                                    onChange={(e) => form.setData('witness_by', e.target.value)}
                                    required
                                />
                                {form.errors.witness_by && (
                                    <p className="text-xs text-destructive">{form.errors.witness_by}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="inspected_by">
                                    Technical Inspector
                                </Label>
                                <Select
                                    value={String(form.data.inspected_by)}
                                    onValueChange={(val) => form.setData('inspected_by', val)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Inspector" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={String(emp.id)}>
                                                {emp.name} ({emp.position || 'Staff'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.inspected_by && (
                                    <p className="text-xs text-destructive">{form.errors.inspected_by}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="jev_reference">
                                    Accounting JEV Reference
                                </Label>
                                <Input
                                    id="jev_reference"
                                    type="text"
                                    placeholder="JEV-2026-XXXX"
                                    value={form.data.jev_reference}
                                    onChange={(e) => form.setData('jev_reference', e.target.value)}
                                />
                                {form.errors.jev_reference && (
                                    <p className="text-xs text-destructive">{form.errors.jev_reference}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="bg-rose-600 text-white hover:bg-rose-700"
                            >
                                Execute Disposal
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog: Confirm Permanent Disposal */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Permanent Disposal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently dispose of this property? This action is irreversible and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmAndExecute}
                            className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                            Confirm Permanent Disposal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
