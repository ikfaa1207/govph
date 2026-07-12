import { Head } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

interface ItemUnit {
    abbreviation: string;
}

interface Item {
    id: number;
    item_code: string;
    name: string;
    unit_cost: number;
    current_stock: number;
    unit?: ItemUnit | null;
}

interface RequisitionItem {
    id: number;
    item_id: number;
    quantity_requested: number;
    quantity_approved: number;
    quantity_issued: number;
    item: Item;
}

interface Department {
    id: number;
    code: string;
    name: string;
    office?: {
        id: number;
        code: string;
        name: string;
    } | null;
}

interface Employee {
    id: number;
    name: string;
    position: string;
    department?: Department | null;
}

interface Issuance {
    id: number;
    issue_number: string;
    issued_date: string;
    issued_by: number;
    received_by: number;
    created_at: string;
    issuer?: Employee | null;
    receiver?: Employee | null;
}

interface Requisition {
    id: number;
    ris_number: string;
    requesting_employee_id: number;
    department_id: number;
    status: string;
    remarks: string | null;
    created_at: string;
    approved_at: string | null;
    requester?: Employee | null;
    departmentHead?: Employee | null;
    items: RequisitionItem[];
    issuances?: Issuance[];
}

interface PrintProps {
    requisition: Requisition;
}

export default function RequisitionPrint({ requisition }: PrintProps) {
    useEffect(() => {
        // Trigger browser print dialog shortly after component mount
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
            return formatDateTime(dateString);
        } catch {
            return dateString;
        }
    };

    // Get primary office/division and department details
    const divisionName =
        requisition.requester?.department?.office?.name ||
        'Administrative Division';
    const officeName =
        requisition.requester?.department?.name || 'Supply Section';
    const responsibilityCode = requisition.requester?.department?.code || '';

    // Get the latest issuance details if available
    const latestIssuance =
        requisition.issuances && requisition.issuances.length > 0
            ? requisition.issuances[requisition.issuances.length - 1]
            : null;

    // Fill table up to 10 rows for clean government alignment
    const maxRows = 10;
    const itemsCount = requisition.items.length;
    const emptyRowsCount = Math.max(0, maxRows - itemsCount);
    const emptyRows = Array.from({ length: emptyRowsCount });

    return (
        <>
            <Head title={`Print RIS - ${requisition.ris_number}`} />

            {/* Screen Top Navigation Bar (Hidden during Print) */}
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
                        Form Viewer: {requisition.ris_number}
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

            {/* Main Government Form Print Container */}
            <div className="mx-auto min-h-screen max-w-4xl bg-white p-8 font-serif text-black print:m-0 print:max-w-full print:p-0">
                {/* GAM Appendix Tag */}
                <div className="mb-1 text-right font-sans text-xs italic select-none">
                    Appendix 63
                </div>

                {/* Form Title & Header */}
                <div className="space-y-1 border border-black p-4 text-center">
                    <h1 className="text-xl font-bold tracking-wide">
                        REQUISITION AND ISSUE SLIP
                    </h1>
                    <p className="font-sans text-sm font-bold tracking-wider text-slate-700 uppercase">
                        Republic of the Philippines
                    </p>
                    <p className="font-sans text-xs tracking-wide uppercase">
                        Government Inventory & Materials System
                    </p>
                </div>

                {/* Meta-Information Block */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="border-r border-black">
                        <div className="flex border-b border-black p-2">
                            <span className="w-24 font-bold">Entity Name:</span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-sans">
                                Government Agency
                            </span>
                        </div>
                        <div className="flex border-b border-black p-2">
                            <span className="w-24 font-bold">Division:</span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-sans">
                                {divisionName}
                            </span>
                        </div>
                        <div className="flex p-2">
                            <span className="w-24 font-bold">
                                Office/Section:
                            </span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-sans">
                                {officeName}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex border-b border-black p-2">
                            <span className="w-48 font-bold">
                                Fund Cluster:
                            </span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-sans">
                                01 - General Fund
                            </span>
                        </div>
                        <div className="flex border-b border-black p-2">
                            <span className="w-48 font-bold">
                                Responsibility Center Code:
                            </span>
                            <span className="flex-1 border-b border-slate-300 px-1 font-mono font-sans">
                                {responsibilityCode}
                            </span>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="flex flex-col border-r border-black p-2">
                                <span className="font-bold">RIS No.:</span>
                                <span className="mt-1 border-b border-slate-300 text-center font-mono font-sans font-bold">
                                    {requisition.ris_number}
                                </span>
                            </div>
                            <div className="flex flex-col p-2">
                                <span className="font-bold">Date:</span>
                                <span className="mt-1 border-b border-slate-300 text-center font-sans">
                                    {formatDate(requisition.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items & Quantities Grid */}
                <table className="w-full border-collapse border-x border-b border-black text-center text-xs">
                    <thead>
                        <tr className="border-b border-black bg-slate-50 font-sans font-bold">
                            <th
                                className="colspan-4 w-[35%] border-r border-black py-2"
                                colSpan={4}
                            >
                                Requisition
                            </th>
                            <th
                                className="colspan-2 w-[18%] border-r border-black py-2"
                                colSpan={2}
                            >
                                Stock Available?
                            </th>
                            <th className="colspan-2 w-[47%] py-2" colSpan={2}>
                                Issue
                            </th>
                        </tr>
                        <tr className="border-b border-black bg-slate-50/50 font-sans font-semibold">
                            <th className="w-[12%] border-r border-black py-1.5">
                                Stock No.
                            </th>
                            <th className="w-[8%] border-r border-black py-1.5">
                                Unit
                            </th>
                            <th className="w-[22%] border-r border-black py-1.5">
                                Description
                            </th>
                            <th className="w-[8%] border-r border-black py-1.5">
                                Quantity
                            </th>
                            <th className="w-[9%] border-r border-black py-1.5">
                                Yes
                            </th>
                            <th className="w-[9%] border-r border-black py-1.5">
                                No
                            </th>
                            <th className="w-[10%] border-r border-black py-1.5">
                                Quantity
                            </th>
                            <th className="w-[22%] py-1.5">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-sans">
                        {requisition.items.map((item) => {
                            const available = item.item.current_stock > 0;

                            return (
                                <tr key={item.id} className="h-8">
                                    <td className="border-r border-black px-1 py-1 align-middle font-mono">
                                        {item.item.item_code}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 align-middle">
                                        {item.item.unit?.abbreviation || 'pcs'}
                                    </td>
                                    <td className="border-r border-black px-2 py-1 text-left align-middle font-serif">
                                        {item.item.name}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 text-right align-middle">
                                        {item.quantity_requested}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 text-center align-middle font-bold">
                                        {available ? '✓' : ''}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 text-center align-middle font-bold">
                                        {!available ? '✓' : ''}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 text-right align-middle font-semibold">
                                        {requisition.status === 'issued' ||
                                        requisition.status ===
                                            'partially_issued'
                                            ? item.quantity_issued
                                            : ''}
                                    </td>
                                    <td className="px-2 py-1 text-left align-middle text-[10px] text-slate-700">
                                        {item.quantity_requested !==
                                            item.quantity_approved &&
                                        item.quantity_approved > 0
                                            ? `Approved ${item.quantity_approved}`
                                            : ''}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Pad out table with empty rows */}
                        {emptyRows.map((_, idx) => (
                            <tr
                                key={`empty-${idx}`}
                                className="h-8 select-none"
                            >
                                <td className="border-r border-black py-1">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-1">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-1">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-1">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-1">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-1">
                                    &nbsp;
                                </td>
                                <td className="border-r border-black py-1">
                                    &nbsp;
                                </td>
                                <td className="py-1">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Purpose Block */}
                <div className="flex items-start gap-2 border-x border-b border-black p-3 text-xs">
                    <span className="font-sans font-bold">Purpose:</span>
                    <span className="flex-1 border-b border-slate-300 pb-1 font-serif italic">
                        {requisition.remarks || 'No remarks provided.'}
                    </span>
                </div>

                {/* Signatures Grid */}
                <table className="w-full border-collapse border-x border-b border-black text-left text-xs">
                    <thead>
                        <tr className="border-b border-black bg-slate-50 text-center font-sans font-bold">
                            <th className="w-[8%] border-r border-black py-1.5">
                                &nbsp;
                            </th>
                            <th className="w-[23%] border-r border-black py-1.5">
                                Requisitioned By:
                            </th>
                            <th className="w-[23%] border-r border-black py-1.5">
                                Approved By:
                            </th>
                            <th className="w-[23%] border-r border-black py-1.5">
                                Issued By:
                            </th>
                            <th className="w-[23%] py-1.5">Received By:</th>
                        </tr>
                    </thead>
                    <tbody className="font-sans">
                        <tr className="h-12 border-b border-slate-200">
                            <td className="border-r border-black bg-slate-50 p-2 text-center align-middle font-bold">
                                Signature
                            </td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="p-2"></td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="border-r border-black bg-slate-50 p-2 text-center align-middle font-bold">
                                Printed Name
                            </td>
                            <td className="border-r border-black p-2 text-center font-serif font-semibold uppercase">
                                {requisition.requester?.name || 'N/A'}
                            </td>
                            <td className="border-r border-black p-2 text-center font-serif font-semibold uppercase">
                                {requisition.departmentHead?.name || ''}
                            </td>
                            <td className="border-r border-black p-2 text-center font-serif font-semibold uppercase">
                                {latestIssuance?.issuer?.name || ''}
                            </td>
                            <td className="p-2 text-center font-serif font-semibold uppercase">
                                {latestIssuance?.receiver?.name ||
                                    requisition.requester?.name ||
                                    ''}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="border-r border-black bg-slate-50 p-2 text-center align-middle font-bold">
                                Designation
                            </td>
                            <td className="border-r border-black p-2 text-center text-slate-700">
                                {requisition.requester?.position || ''}
                            </td>
                            <td className="border-r border-black p-2 text-center text-slate-700">
                                {requisition.departmentHead
                                    ? requisition.departmentHead.position
                                    : requisition.approved_at
                                      ? 'Department Head'
                                      : ''}
                            </td>
                            <td className="border-r border-black p-2 text-center text-slate-700">
                                {latestIssuance?.issuer
                                    ? latestIssuance.issuer.position
                                    : requisition.status === 'issued' ||
                                        requisition.status ===
                                            'partially_issued'
                                      ? 'Supply Officer'
                                      : ''}
                            </td>
                            <td className="p-2 text-center text-slate-700">
                                {latestIssuance?.receiver
                                    ? latestIssuance.receiver.position
                                    : latestIssuance
                                      ? requisition.requester?.position || ''
                                      : ''}
                            </td>
                        </tr>
                        <tr>
                            <td className="border-r border-black bg-slate-50 p-2 text-center align-middle font-bold">
                                Date
                            </td>
                            <td className="border-r border-black p-2 text-center">
                                {formatDate(requisition.created_at)}
                            </td>
                            <td className="border-r border-black p-2 text-center">
                                {formatDate(requisition.approved_at)}
                            </td>
                            <td className="border-r border-black p-2 text-center">
                                {formatDate(latestIssuance?.issued_date)}
                            </td>
                            <td className="p-2 text-center">
                                {formatDate(latestIssuance?.created_at)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}
