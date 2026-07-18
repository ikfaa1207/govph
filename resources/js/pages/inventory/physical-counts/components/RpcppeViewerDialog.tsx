import { Printer, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

interface RpcppeData {
    report_title: string;
    as_of_date: string;
    type: string;
    status: string;
    prepared_by: string;
    coa_representative: string;
    items: {
        article: string;
        description: string;
        property_number: string;
        unit_measure: string;
        unit_value: number;
        balance_per_card: number;
        on_hand_per_count: number;
        shortage_overage: number;
        remarks: string | null;
    }[];
    committees: {
        name: string;
        role: string;
    }[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    physicalCountId: number | null;
}

export function RpcppeViewerDialog({
    isOpen,
    onClose,
    physicalCountId,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<RpcppeData | null>(null);

    useEffect(() => {
        if (isOpen && physicalCountId) {
            const loadData = async () => {
                setLoading(true);

                try {
                    const res = await fetch(
                        `/inventory/physical-counts/${physicalCountId}/rpcppe`,
                    );

                    if (!res.ok) {
                        throw new Error('Failed to fetch RPCPPE data');
                    }

                    const json = await res.json();
                    setData(json.data);
                } catch (err: any) {
                    toast.error(err.message || 'Failed to fetch RPCPPE data');
                    onClose();
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setData(null);
        }
    }, [isOpen, physicalCountId, onClose]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto bg-white print:m-0 print:h-full print:w-full print:max-w-none print:overflow-visible print:border-none print:p-0 print:shadow-none">
                <DialogHeader className="print:hidden">
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle>RPCPPE Report Preview</DialogTitle>
                        <Button
                            onClick={handlePrint}
                            className="gap-2"
                            disabled={loading || !data}
                        >
                            <Printer className="h-4 w-4" />
                            Print / Save PDF
                        </Button>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : data ? (
                    <div className="print-area bg-white p-8 font-sans text-sm text-black print:p-0">
                        {/* Report Header */}
                        <div className="mb-6 text-center font-bold">
                            <h2 className="text-lg uppercase">
                                {data.report_title}
                            </h2>
                            <p className="mt-1">As of {data.as_of_date}</p>
                        </div>

                        {/* Report Meta */}
                        <div className="mb-4 flex justify-between text-xs font-semibold">
                            <div>
                                <p>Type: {data.type}</p>
                            </div>
                        </div>

                        {/* Report Table */}
                        <table className="mb-8 w-full border-collapse border border-black text-xs">
                            <thead>
                                <tr>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        Article
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        Description
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        Property Number
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        Unit of Measure
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        Unit Value
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        Balance Per Card
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        On Hand Per Count
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        colSpan={2}
                                    >
                                        Shortage/Overage
                                    </th>
                                    <th
                                        className="border border-black bg-gray-50 p-2 text-center print:bg-transparent"
                                        rowSpan={2}
                                    >
                                        Remarks
                                    </th>
                                </tr>
                                <tr>
                                    <th className="border border-black bg-gray-50 p-2 text-center print:bg-transparent">
                                        Qty
                                    </th>
                                    <th className="border border-black bg-gray-50 p-2 text-center print:bg-transparent">
                                        Value
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border border-black p-2">
                                            {item.article}
                                        </td>
                                        <td className="border border-black p-2">
                                            {item.description}
                                        </td>
                                        <td className="border border-black p-2 text-center">
                                            {item.property_number}
                                        </td>
                                        <td className="border border-black p-2 text-center">
                                            {item.unit_measure}
                                        </td>
                                        <td className="border border-black p-2 text-right">
                                            {formatCurrency(item.unit_value)}
                                        </td>
                                        <td className="border border-black p-2 text-center">
                                            {item.balance_per_card}
                                        </td>
                                        <td className="border border-black p-2 text-center">
                                            {item.on_hand_per_count}
                                        </td>
                                        <td className="border border-black p-2 text-center">
                                            {item.shortage_overage !== 0
                                                ? item.shortage_overage
                                                : ''}
                                        </td>
                                        <td className="border border-black p-2 text-right">
                                            {item.shortage_overage !== 0
                                                ? formatCurrency(
                                                      Math.abs(
                                                          item.shortage_overage,
                                                      ) * item.unit_value,
                                                  )
                                                : ''}
                                        </td>
                                        <td className="border border-black p-2">
                                            {item.remarks}
                                        </td>
                                    </tr>
                                ))}
                                {data.items.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="border border-black p-4 text-center text-gray-500 italic"
                                        >
                                            No items recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Signatures */}
                        <div className="mt-12 grid break-inside-avoid grid-cols-2 gap-8 text-xs">
                            <div>
                                <p className="mb-8 font-semibold">
                                    Prepared By:
                                </p>
                                <div className="mb-1 w-3/4 border-b border-black pb-1 text-center font-bold uppercase">
                                    {data.prepared_by}
                                </div>
                                <p>Inventory Committee / Custodian</p>
                            </div>
                            <div>
                                <p className="mb-8 font-semibold">
                                    Verified By:
                                </p>
                                <div className="mb-1 w-3/4 border-b border-black pb-1 text-center font-bold uppercase">
                                    {data.coa_representative}
                                </div>
                                <p>COA Representative</p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
