import { Head } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface ItemUnit {
    abbreviation: string;
}

interface Item {
    id: number;
    item_code: string;
    stock_number: string | null;
    name: string;
    description: string | null;
    unit?: ItemUnit | null;
}

interface PurchaseRequestItem {
    id: number;
    item_id: number;
    quantity: number;
    unit_cost: number;
    item: Item;
}

interface Office {
    id: number;
    code: string;
    name: string;
}

interface Department {
    id: number;
    code: string;
    name: string;
    office?: Office | null;
}

interface Employee {
    id: number;
    name: string;
    position: string;
    department?: Department | null;
}

interface User {
    id: number;
    name: string;
    employee?: Employee | null;
}

interface PurchaseRequest {
    id: number;
    pr_number: string;
    requested_by: number;
    department_id: number;
    purpose: string;
    status: string;
    created_at: string;
    requester?: Employee | null;
    department?: Department | null;
    approver?: User | null;
    items: PurchaseRequestItem[];
}

interface PrintProps {
    purchaseRequest: PurchaseRequest;
}

export default function PurchaseRequestPrint({ purchaseRequest }: PrintProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) {
            return '';
        }

        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    // Calculate totals
    const totalCost = purchaseRequest.items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unit_cost),
        0,
    );

    // Padding rows to make it look like a formal government document (12 rows)
    const maxRows = 12;
    const itemsCount = purchaseRequest.items.length;
    const emptyRowsCount = Math.max(0, maxRows - itemsCount);
    const emptyRows = Array.from({ length: emptyRowsCount });

    const entityName = 'Government Agency';
    const fundCluster = '01 - General Fund';
    const officeName = purchaseRequest.department?.name || 'N/A';
    const divisionName = purchaseRequest.department?.office?.name || 'N/A';
    const responsibilityCode = purchaseRequest.department?.code || '';

    // Approver details
    const approverName =
        purchaseRequest.approver?.employee?.name ||
        purchaseRequest.approver?.name ||
        '';
    const approverPosition =
        purchaseRequest.approver?.employee?.position ||
        'Head of Procuring Entity';

    return (
        <>
            <Head title={`Print PR - ${purchaseRequest.pr_number}`} />

            {/* Print Header Controls (Hidden during print) */}
            <div className="flex items-center justify-between border-b bg-slate-900 px-6 py-3 text-slate-100 shadow-md print:hidden">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Board
                    </Button>
                    <span className="text-slate-400">|</span>
                    <span className="font-mono text-sm text-slate-300">
                        Form Viewer: {purchaseRequest.pr_number}
                    </span>
                </div>
                <Button
                    onClick={() => window.print()}
                    className="gap-2 bg-emerald-600 font-medium text-white hover:bg-emerald-500"
                >
                    <Printer className="h-4 w-4" />
                    Print / Export
                </Button>
            </div>

            {/* Official Appendix 60 layout */}
            <div className="mx-auto min-h-screen max-w-4xl bg-white p-8 font-serif text-black print:m-0 print:max-w-full print:p-0">
                <div className="mb-1 text-right font-sans text-xs italic select-none">
                    Appendix 60
                </div>

                <div className="space-y-1 border border-black p-4 text-center">
                    <h1 className="text-xl font-bold tracking-wide">
                        PURCHASE REQUEST
                    </h1>
                </div>

                {/* Meta-Information details block */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="border-r border-black">
                        <div className="flex border-b border-black p-2">
                            <span className="w-24 font-bold">Entity Name:</span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-sans">
                                {entityName}
                            </span>
                        </div>
                        <div className="flex p-2">
                            <span className="w-24 font-bold">
                                Office/Section:
                            </span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-sans">
                                {officeName}{' '}
                                {divisionName !== 'N/A' && `(${divisionName})`}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex border-b border-black p-2">
                            <span className="w-48 font-bold">
                                Fund Cluster:
                            </span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-sans">
                                {fundCluster}
                            </span>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="flex flex-col border-r border-black p-2">
                                <span className="font-bold">PR No.:</span>
                                <span className="mt-1 border-b border-slate-300 text-center font-mono font-sans font-bold">
                                    {purchaseRequest.pr_number}
                                </span>
                            </div>
                            <div className="flex flex-col p-2">
                                <span className="font-bold">Date:</span>
                                <span className="mt-1 border-b border-slate-300 text-center font-sans">
                                    {formatDate(purchaseRequest.created_at)}
                                </span>
                            </div>
                        </div>
                        <div className="flex border-t border-black p-2">
                            <span className="w-48 font-bold">
                                Responsibility Center Code:
                            </span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-mono font-sans">
                                {responsibilityCode}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items list table */}
                <table className="w-full border-collapse border-x border-b border-black text-center text-xs">
                    <thead>
                        <tr className="border-b border-black bg-slate-50 font-sans font-bold">
                            <th className="w-[15%] border-r border-black py-2">
                                Stock/Property No.
                            </th>
                            <th className="w-[10%] border-r border-black py-2">
                                Unit
                            </th>
                            <th className="w-[45%] border-r border-black py-2">
                                Item Description
                            </th>
                            <th className="w-[10%] border-r border-black py-2">
                                Quantity
                            </th>
                            <th className="w-[10%] border-r border-black py-2">
                                Unit Cost
                            </th>
                            <th className="w-[10%] py-2">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseRequest.items.map((item) => (
                            <tr
                                key={item.id}
                                className="border-b border-black/30 hover:bg-slate-50/55"
                            >
                                <td className="border-r border-black py-2 font-mono">
                                    {item.item.stock_number || 'N/A'}
                                </td>
                                <td className="border-r border-black py-2 font-sans">
                                    {item.item.unit?.abbreviation || 'pcs'}
                                </td>
                                <td className="border-r border-black px-2 py-2 text-left font-sans">
                                    <div className="font-bold">
                                        {item.item.name}
                                    </div>
                                    {item.item.description && (
                                        <div className="text-slate-550 text-[10px] leading-tight">
                                            {item.item.description}
                                        </div>
                                    )}
                                </td>
                                <td className="border-r border-black py-2 font-sans">
                                    {item.quantity}
                                </td>
                                <td className="border-r border-black px-2 py-2 text-right font-mono">
                                    {formatCurrency(item.unit_cost)}
                                </td>
                                <td className="px-2 py-2 text-right font-mono">
                                    {formatCurrency(
                                        item.quantity * Number(item.unit_cost),
                                    )}
                                </td>
                            </tr>
                        ))}

                        {/* Filler Rows for exact paper dimensions */}
                        {emptyRows.map((_, idx) => (
                            <tr
                                key={`empty-${idx}`}
                                className="border-b border-black/10 select-none"
                            >
                                <td className="border-r border-black py-4">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-4">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-4">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-4">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-4">
                                    &nbsp;
                                </td>
                                <td className="py-4">&nbsp;</td>
                            </tr>
                        ))}

                        {/* Grand Total Row */}
                        <tr className="border-t border-black bg-slate-50 font-bold">
                            <td
                                className="border-r border-black py-2.5 pr-4 text-right"
                                colSpan={3}
                            >
                                Total Estimated Cost
                            </td>
                            <td
                                className="border-r border-black py-2.5"
                                colSpan={2}
                            ></td>
                            <td className="px-2 py-2.5 text-right font-mono text-sm underline decoration-double">
                                {formatCurrency(totalCost)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Purpose footer */}
                <div className="border-x border-b border-black p-3 text-xs">
                    <div className="flex gap-2">
                        <span className="font-bold">Purpose:</span>
                        <span className="border-slate-350 flex-1 border-b font-sans">
                            {purchaseRequest.purpose}
                        </span>
                    </div>
                </div>

                {/* Signature panels */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="space-y-6 border-r border-black p-3">
                        <div className="font-bold">Requested By:</div>
                        <div className="text-center">
                            <span className="block font-sans font-bold uppercase underline">
                                {purchaseRequest.requester?.name || 'N/A'}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                                Signature over Printed Name of Requester
                            </span>
                            <span className="mt-1 block font-sans text-slate-700 italic">
                                {purchaseRequest.requester?.position || 'N/A'}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                                Designation
                            </span>
                        </div>
                    </div>
                    <div className="space-y-6 p-3">
                        <div className="font-bold">Approved By:</div>
                        <div className="text-center">
                            <span className="block font-sans font-bold uppercase underline">
                                {approverName || 'N/A'}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                                Signature over Printed Name of Approved Official
                            </span>
                            <span className="mt-1 block font-sans text-slate-700 italic">
                                {approverPosition || 'N/A'}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                                Designation
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
