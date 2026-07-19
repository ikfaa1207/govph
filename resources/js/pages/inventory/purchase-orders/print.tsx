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

interface PurchaseOrderItem {
    id: number;
    item_id: number;
    quantity: number;
    unit_cost: number;
    remarks: string | null;
    item: Item;
}

interface Supplier {
    id: number;
    name: string;
    address: string;
    contact_person: string;
    contact_number: string | null;
    tin: string;
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

interface PurchaseRequest {
    id: number;
    pr_number: string;
    requester?: Employee | null;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    po_date: string;
    delivery_date: string | null;
    status: string;
    supplier_id: number;
    purchase_request_id: number;
    purchase_request?: PurchaseRequest | null;
    supplier?: Supplier | null;
    items: PurchaseOrderItem[];
}

interface PrintProps {
    purchaseOrder: PurchaseOrder;
}

export default function PurchaseOrderPrint({ purchaseOrder }: PrintProps) {
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

    // Calculate total cost
    const totalCost = purchaseOrder.items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unit_cost),
        0,
    );

    // Padding rows to make it look like a formal government document (12 rows)
    const maxRows = 12;
    const itemsCount = purchaseOrder.items.length;
    const emptyRowsCount = Math.max(0, maxRows - itemsCount);
    const emptyRows = Array.from({ length: emptyRowsCount });

    const entityName = 'Government Agency';
    const modeOfProcurement = 'NP-53.9 Small Value Procurement';
    const deliveryTerm = 'FOB Destination';
    const paymentTerm = 'LDDAP-ADA / Charge';

    return (
        <>
            <Head title={`Print PO - ${purchaseOrder.po_number}`} />

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
                        Form Viewer: {purchaseOrder.po_number}
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

            {/* Official Appendix 61 layout */}
            <div className="mx-auto min-h-screen max-w-4xl bg-white p-8 font-serif text-black print:m-0 print:max-w-full print:p-0">
                <div className="mb-1 text-right font-sans text-xs italic select-none">
                    Appendix 61
                </div>

                <div className="space-y-1 border border-black p-4 text-center">
                    <h1 className="text-xl font-bold tracking-wide">
                        PURCHASE ORDER
                    </h1>
                    <p className="font-sans text-sm font-semibold tracking-wider text-slate-700 uppercase">
                        {entityName}
                    </p>
                </div>

                {/* Supplier & PO details */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="space-y-1 border-r border-black p-2">
                        <div>
                            <span className="font-bold">Supplier :</span>{' '}
                            <span className="font-sans font-semibold">
                                {purchaseOrder.supplier?.name}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">Address :</span>{' '}
                            <span className="font-sans text-slate-700">
                                {purchaseOrder.supplier?.address}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">TIN :</span>{' '}
                            <span className="font-mono font-sans">
                                {purchaseOrder.supplier?.tin}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1 p-2">
                        <div>
                            <span className="font-bold">P.O. No. :</span>{' '}
                            <span className="font-mono font-sans font-bold">
                                {purchaseOrder.po_number}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">Date :</span>{' '}
                            <span className="font-sans">
                                {formatDate(purchaseOrder.po_date)}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">
                                Mode of Procurement :
                            </span>{' '}
                            <span className="font-sans">
                                {modeOfProcurement}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-x border-b border-black p-2 font-sans text-xs text-slate-700 italic">
                    Gentlemen: Please furnish this Office the following articles
                    subject to the terms and conditions contained herein:
                </div>

                {/* Delivery parameters */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="space-y-1 border-r border-black p-2">
                        <div>
                            <span className="font-bold">
                                Place of Delivery :
                            </span>{' '}
                            <span className="font-sans">
                                Office Warehouse / Supply Office
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">
                                Date of Delivery :
                            </span>{' '}
                            <span className="font-sans">
                                {purchaseOrder.delivery_date
                                    ? formatDate(purchaseOrder.delivery_date)
                                    : 'Within 30 Calendar Days'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1 p-2">
                        <div>
                            <span className="font-bold">Delivery Term :</span>{' '}
                            <span className="font-sans">{deliveryTerm}</span>
                        </div>
                        <div>
                            <span className="font-bold">Payment Term :</span>{' '}
                            <span className="font-sans">{paymentTerm}</span>
                        </div>
                    </div>
                </div>

                {/* PO Items Table */}
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
                                Description
                            </th>
                            <th className="w-[10%] border-r border-black py-2">
                                Quantity
                            </th>
                            <th className="w-[10%] border-r border-black py-2">
                                Unit Cost
                            </th>
                            <th className="w-[10%] py-2">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrder.items.map((item) => (
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
                                    {item.remarks && (
                                        <div className="text-[10px] leading-tight text-indigo-500 italic">
                                            ({item.remarks})
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

                        {/* Filler Rows */}
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

                        {/* Total Cost Row */}
                        <tr className="border-t border-black bg-slate-50 font-bold">
                            <td
                                className="border-r border-black py-2.5 pr-4 text-right"
                                colSpan={3}
                            >
                                Total Amount
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

                {/* Terms of delay penalty */}
                <div className="border-x border-b border-black p-3 font-sans text-xs leading-relaxed text-slate-700">
                    In case of failure to make the full delivery within the time
                    specified above, a penalty of one-tenth (1/10) of one
                    percent for every day of delay shall be imposed on the
                    undelivered item/s.
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="space-y-6 border-r border-black p-3">
                        <div>Conforme:</div>
                        <div className="text-center">
                            <div className="mx-auto w-3/4 border-b border-black py-1">
                                &nbsp;
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                                Signature over Printed Name of Supplier
                            </span>
                            <div className="mx-auto mt-4 w-1/2 border-b border-black py-1">
                                &nbsp;
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                                Date
                            </span>
                        </div>
                    </div>
                    <div className="space-y-6 p-3">
                        <div>Very truly yours,</div>
                        <div className="text-center">
                            <div className="mx-auto w-3/4 border-b border-black py-1 font-sans font-bold">
                                Agency Head / Authorized Representative
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                                Signature over Printed Name of Authorized
                                Official
                            </span>
                            <div className="mx-auto mt-4 w-1/2 border-b border-black py-1 font-sans italic">
                                Authorized Official
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                                Designation
                            </span>
                        </div>
                    </div>
                </div>

                {/* Funding block */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="space-y-4 border-r border-black p-3">
                        <div>
                            <span className="font-bold">Fund Cluster :</span>{' '}
                            <span className="border-slate-350 border-b px-1 font-sans">
                                01 - General Fund
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">Funds Available :</span>{' '}
                            <span className="border-slate-350 border-b px-1 font-sans">
                                {formatCurrency(totalCost)}
                            </span>
                        </div>
                        <div className="pt-2 text-center">
                            <div className="mx-auto w-3/4 border-b border-black py-1 font-sans font-bold">
                                Chief Accountant
                            </div>
                            <span className="mt-1 block text-[10px] text-slate-500">
                                Signature over Printed Name of Chief Accountant
                                / Head of Accounting Division
                            </span>
                        </div>
                    </div>
                    <div className="space-y-3 p-3">
                        <div>
                            <span className="font-bold">ORS/BURS No. :</span>{' '}
                            <span className="border-slate-350 border-b px-1 font-mono">
                                ORS-2026-07-0001
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">
                                Date of the ORS/BURS :
                            </span>{' '}
                            <span className="border-slate-350 border-b px-1 font-sans">
                                {formatDate(purchaseOrder.po_date)}
                            </span>
                        </div>
                        <div>
                            <span className="font-bold">Amount :</span>{' '}
                            <span className="border-slate-350 border-b px-1 font-mono">
                                {formatCurrency(totalCost)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
