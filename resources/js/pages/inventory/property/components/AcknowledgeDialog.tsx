import { useForm } from '@inertiajs/react';
import { ShieldAlert, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import type { Property } from '../index';

interface AcknowledgeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    property: Property | null;
}

export function AcknowledgeDialog({
    isOpen,
    onClose,
    property,
}: AcknowledgeDialogProps) {
    const form = useForm({});

    if (!property) {
        return null;
    }

    const isAssignment = !!property.active_assignment;
    const documentId = isAssignment
        ? property.active_assignment?.id
        : property.active_sub_assignment?.id;

    const endpoint = isAssignment
        ? `/inventory/property-assignments/${documentId}/acknowledge`
        : `/inventory/property-transfers/${documentId}/acknowledge`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(endpoint, {
            onSuccess: () => {
                onClose();
                toast.success('Property digitally signed and acknowledged.', {
                    icon: <Fingerprint className="h-4 w-4" />,
                });
            },
            onError: () => {
                toast.error('Failed to acknowledge property.');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-blue-600" />
                            Acknowledge Receipt
                        </DialogTitle>
                        <DialogDescription className="pt-3">
                            You are about to acknowledge the receipt and assume
                            accountability for the following property:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-6 rounded-md border bg-muted/40 p-4 shadow-inner">
                        <div className="flex flex-col space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">
                                    Property No:
                                </span>
                                <span className="font-semibold">
                                    {property.property_number}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">
                                    Article:
                                </span>
                                <span className="font-semibold">
                                    {property.article}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
                        <p className="flex items-start gap-2">
                            <Fingerprint className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                            <span>
                                By clicking <strong>Acknowledge</strong>, you
                                are digitally signing this document. The system
                                will generate an unalterable timestamp and
                                cryptographic hash tying your account to this
                                receipt.
                            </span>
                        </p>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            <Fingerprint className="mr-2 h-4 w-4" />
                            Acknowledge & Sign
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
