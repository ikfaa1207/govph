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
import { SmartSelect } from '@/components/ui/smart-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Property } from '../index';

interface BatchEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProperties: Property[];
    setSelectedPropIds: (ids: number[]) => void;
}

export function BatchEditDialog({
    isOpen,
    onClose,
    selectedProperties,
    setSelectedPropIds,
}: BatchEditDialogProps) {
    const form = useForm({
        properties: selectedProperties.map((p) => ({
            id: p.id,
            property_number: p.property_number,
            brand: p.brand === 'Pending Procurement Handoff' ? '' : p.brand,
            model: p.model === 'Pending Procurement Handoff' ? '' : p.model,
            serial_number: p.serial_number.startsWith('PENDING-SN-')
                ? ''
                : p.serial_number,
            condition: p.condition,
        })),
    });

    const [bulkBrand, setBulkBrand] = useState('');
    const [bulkModel, setBulkModel] = useState('');
    const [bulkCondition, setBulkCondition] = useState('');

    const applyBulkFill = () => {
        form.setData(
            'properties',
            form.data.properties.map((p) => ({
                ...p,
                brand: bulkBrand || p.brand,
                model: bulkModel || p.model,
                condition: bulkCondition || p.condition,
            })),
        );
        toast.info('Applied bulk values to all items in the list.');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.post('/inventory/properties/batch-update', {
            onSuccess: () => {
                onClose();
                setSelectedPropIds([]);
                toast.success('Selected properties updated successfully.');
            },
            onError: () => {
                toast.error('Failed to update properties.');
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
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Batch Setup Equipment Details</DialogTitle>
                    <DialogDescription>
                        Set the brands, models, serial numbers, and physical
                        conditions for {selectedProperties.length} selected
                        items.
                    </DialogDescription>
                </DialogHeader>

                {/* Bulk Fill Helper Card */}
                <div className="rounded-lg border border-indigo-200/50 bg-indigo-50/50 p-4 dark:border-indigo-950/30 dark:bg-indigo-950/20">
                    <h4 className="mb-3 text-xs font-semibold tracking-wider text-indigo-700 uppercase dark:text-indigo-400">
                        Bulk Fill Column Values (Optional)
                    </h4>
                    <div className="grid grid-cols-4 items-end gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Bulk Brand</Label>
                            <Input
                                value={bulkBrand}
                                onChange={(e) => setBulkBrand(e.target.value)}
                                placeholder="e.g. Toyota"
                                className="bg-background text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Bulk Model</Label>
                            <Input
                                value={bulkModel}
                                onChange={(e) => setBulkModel(e.target.value)}
                                placeholder="e.g. Hilux 2.8"
                                className="bg-background text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Bulk Condition</Label>
                            <SmartSelect
                                options={conditions}
                                value={bulkCondition}
                                onValueChange={setBulkCondition}
                                placeholder="Select"
                                className="bg-background text-xs"
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={applyBulkFill}
                            variant="secondary"
                            className="text-xs"
                        >
                            Apply Bulk Values
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="overflow-x-auto rounded-md border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px] text-xs">
                                        Prop No.
                                    </TableHead>
                                    <TableHead className="w-[180px] text-xs">
                                        Brand
                                    </TableHead>
                                    <TableHead className="w-[180px] text-xs">
                                        Model
                                    </TableHead>
                                    <TableHead className="w-[200px] text-xs">
                                        Serial Number
                                    </TableHead>
                                    <TableHead className="w-[140px] text-xs">
                                        Condition
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {form.data.properties.map((row, idx) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                                            {row.property_number}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={row.brand}
                                                onChange={(e) => {
                                                    const newProperties = [
                                                        ...form.data.properties,
                                                    ];
                                                    newProperties[idx].brand =
                                                        e.target.value;
                                                    form.setData(
                                                        'properties',
                                                        newProperties,
                                                    );
                                                }}
                                                required
                                                placeholder="Brand"
                                                className="h-8 text-xs"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={row.model}
                                                onChange={(e) => {
                                                    const newProperties = [
                                                        ...form.data.properties,
                                                    ];
                                                    newProperties[idx].model =
                                                        e.target.value;
                                                    form.setData(
                                                        'properties',
                                                        newProperties,
                                                    );
                                                }}
                                                required
                                                placeholder="Model"
                                                className="h-8 text-xs"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={row.serial_number}
                                                onChange={(e) => {
                                                    const newProperties = [
                                                        ...form.data.properties,
                                                    ];
                                                    newProperties[
                                                        idx
                                                    ].serial_number =
                                                        e.target.value;
                                                    form.setData(
                                                        'properties',
                                                        newProperties,
                                                    );
                                                }}
                                                required
                                                placeholder="Real Serial Number"
                                                className="h-8 font-mono text-xs"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <SmartSelect
                                                options={conditions}
                                                value={row.condition}
                                                onValueChange={(val) => {
                                                    const newProperties = [
                                                        ...form.data.properties,
                                                    ];
                                                    newProperties[
                                                        idx
                                                    ].condition = val;
                                                    form.setData(
                                                        'properties',
                                                        newProperties,
                                                    );
                                                }}
                                                placeholder="Condition"
                                                className="h-8 text-xs"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
                            {form.processing
                                ? 'Saving...'
                                : `Save All ${selectedProperties.length} Properties`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
