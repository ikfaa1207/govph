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
}

export function DisposeDialog({ isOpen, onClose, property }: DisposeDialogProps) {
    const form = useForm({
        disposal_method: 'destruction',
        reason: 'broken',
        appraised_value: 0,
        proceeds: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dispose / Condemn Equipment (IIRUP)</DialogTitle>
                    <DialogDescription>
                        Declare this property as unserviceable and execute disposal protocols.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
    );
}
