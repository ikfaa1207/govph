import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

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
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    // Get primary office/division and department details
    const divisionName = requisition.requester?.department?.office?.name || 'Administrative Division';
    const officeName = requisition.requester?.department?.name || 'Supply Section';
    const responsibilityCode = requisition.requester?.department?.code || '';

    // Get the latest issuance details if available
    const latestIssuance = requisition.issuances && requisition.issuances.length > 0
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
            <div className="print:hidden flex items-center justify-between bg-slate-900 text-slate-100 px-6 py-3 border-b shadow-md">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-300 hover:text-white gap-1 hover:bg-slate-800"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Board
                    </Button>
                    <span className="text-slate-400">|</span>
                    <span className="text-sm font-mono text-slate-300">Form Viewer: {requisition.ris_number}</span>
                </div>
                <Button
                    onClick={() => window.print()}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                    <Printer className="h-4 w-4" />
                    Print / Export
                </Button>
            </div>

            {/* Main Government Form Print Container */}
            <div className="bg-white text-black min-h-screen p-8 mx-auto font-serif print:p-0 print:m-0 max-w-4xl print:max-w-full">
                
                {/* GAM Appendix Tag */}
                <div className="text-right text-xs italic font-sans mb-1 select-none">
                    Appendix 63
                </div>

                {/* Form Title & Header */}
                <div className="border border-black p-4 text-center space-y-1">
                    <h1 className="text-xl font-bold tracking-wide">REQUISITION AND ISSUE SLIP</h1>
                    <p className="text-sm font-bold uppercase tracking-wider font-sans text-slate-700">Republic of the Philippines</p>
                    <p className="text-xs uppercase font-sans tracking-wide">Government Inventory & Materials System</p>
                </div>

                {/* Meta-Information Block */}
                <div className="grid grid-cols-2 border-x border-b border-black text-xs">
                    <div className="border-r border-black">
                        <div className="p-2 border-b border-black flex">
                            <span className="font-bold w-24">Entity Name:</span>
                            <span className="font-sans border-b border-slate-300 flex-1 px-1">Government Agency</span>
                        </div>
                        <div className="p-2 border-b border-black flex">
                            <span className="font-bold w-24">Division:</span>
                            <span className="font-sans border-b border-slate-300 flex-1 px-1">{divisionName}</span>
                        </div>
                        <div className="p-2 flex">
                            <span className="font-bold w-24">Office/Section:</span>
                            <span className="font-sans border-b border-slate-300 flex-1 px-1">{officeName}</span>
                        </div>
                    </div>
                    <div>
                        <div className="p-2 border-b border-black flex">
                            <span className="font-bold w-48">Fund Cluster:</span>
                            <span className="font-sans border-b border-slate-300 flex-1 px-1">01 - General Fund</span>
                        </div>
                        <div className="p-2 border-b border-black flex">
                            <span className="font-bold w-48">Responsibility Center Code:</span>
                            <span className="font-sans border-b border-slate-300 flex-1 px-1 font-mono">{responsibilityCode}</span>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="p-2 border-r border-black flex flex-col">
                                <span className="font-bold">RIS No.:</span>
                                <span className="font-sans font-mono font-bold text-center mt-1 border-b border-slate-300">{requisition.ris_number}</span>
                            </div>
                            <div className="p-2 flex flex-col">
                                <span className="font-bold">Date:</span>
                                <span className="font-sans text-center mt-1 border-b border-slate-300">{formatDate(requisition.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items & Quantities Grid */}
                <table className="w-full border-x border-b border-black text-center text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-black font-sans font-bold bg-slate-50">
                            <th className="border-r border-black py-2 w-[35%] colspan-4" colSpan={4}>Requisition</th>
                            <th className="border-r border-black py-2 w-[18%] colspan-2" colSpan={2}>Stock Available?</th>
                            <th className="py-2 w-[47%] colspan-2" colSpan={2}>Issue</th>
                        </tr>
                        <tr className="border-b border-black font-sans font-semibold bg-slate-50/50">
                            <th className="border-r border-black py-1.5 w-[12%]">Stock No.</th>
                            <th className="border-r border-black py-1.5 w-[8%]">Unit</th>
                            <th className="border-r border-black py-1.5 w-[22%]">Description</th>
                            <th className="border-r border-black py-1.5 w-[8%]">Quantity</th>
                            <th className="border-r border-black py-1.5 w-[9%]">Yes</th>
                            <th className="border-r border-black py-1.5 w-[9%]">No</th>
                            <th className="border-r border-black py-1.5 w-[10%]">Quantity</th>
                            <th className="py-1.5 w-[22%]">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="font-sans divide-y divide-black">
                        {requisition.items.map((item, index) => {
                            const available = item.item.current_stock > 0;
                            return (
                                <tr key={item.id} className="h-8">
                                    <td className="border-r border-black font-mono px-1 py-1 align-middle">{item.item.item_code}</td>
                                    <td className="border-r border-black px-1 py-1 align-middle">{item.item.unit?.abbreviation || 'pcs'}</td>
                                    <td className="border-r border-black text-left px-2 py-1 align-middle font-serif">{item.item.name}</td>
                                    <td className="border-r border-black px-1 py-1 align-middle text-right">{item.quantity_requested}</td>
                                    <td className="border-r border-black px-1 py-1 align-middle font-bold text-center">
                                        {available ? '✓' : ''}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 align-middle font-bold text-center">
                                        {!available ? '✓' : ''}
                                    </td>
                                    <td className="border-r border-black px-1 py-1 align-middle text-right font-semibold">
                                        {requisition.status === 'issued' || requisition.status === 'partially_issued'
                                            ? item.quantity_issued
                                            : ''}
                                    </td>
                                    <td className="px-2 py-1 text-left text-[10px] text-slate-700 align-middle">
                                        {item.quantity_requested !== item.quantity_approved && item.quantity_approved > 0
                                            ? `Approved ${item.quantity_approved}`
                                            : ''}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Pad out table with empty rows */}
                        {emptyRows.map((_, idx) => (
                            <tr key={`empty-${idx}`} className="h-8 select-none">
                                <td className="border-r border-black py-1">&nbsp;</td>
                                <td className="border-r border-black py-1">&nbsp;</td>
                                <td className="border-r border-black py-1">&nbsp;</td>
                                <td className="border-r border-black py-1">&nbsp;</td>
                                <td className="border-r border-black py-1">&nbsp;</td>
                                <td className="border-r border-black py-1">&nbsp;</td>
                                <td className="border-r border-black py-1">&nbsp;</td>
                                <td className="py-1">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Purpose Block */}
                <div className="border-x border-b border-black p-3 text-xs flex items-start gap-2">
                    <span className="font-bold font-sans">Purpose:</span>
                    <span className="font-serif italic border-b border-slate-300 flex-1 pb-1">
                        {requisition.remarks || 'No remarks provided.'}
                    </span>
                </div>

                {/* Signatures Grid */}
                <table className="w-full border-x border-b border-black text-xs text-left border-collapse">
                    <thead>
                        <tr className="border-b border-black font-sans font-bold bg-slate-50 text-center">
                            <th className="border-r border-black py-1.5 w-[8%]">&nbsp;</th>
                            <th className="border-r border-black py-1.5 w-[23%]">Requisitioned By:</th>
                            <th className="border-r border-black py-1.5 w-[23%]">Approved By:</th>
                            <th className="border-r border-black py-1.5 w-[23%]">Issued By:</th>
                            <th className="py-1.5 w-[23%]">Received By:</th>
                        </tr>
                    </thead>
                    <tbody className="font-sans">
                        <tr className="h-12 border-b border-slate-200">
                            <td className="border-r border-black p-2 font-bold bg-slate-50 text-center align-middle">Signature</td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="border-r border-black p-2"></td>
                            <td className="p-2"></td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="border-r border-black p-2 font-bold bg-slate-50 text-center align-middle">Printed Name</td>
                            <td className="border-r border-black p-2 font-semibold font-serif text-center uppercase">
                                {requisition.requester?.name || 'N/A'}
                            </td>
                            <td className="border-r border-black p-2 font-semibold font-serif text-center uppercase">
                                {requisition.departmentHead?.name || ''}
                            </td>
                            <td className="border-r border-black p-2 font-semibold font-serif text-center uppercase">
                                {latestIssuance?.issuer?.name || ''}
                            </td>
                            <td className="p-2 font-semibold font-serif text-center uppercase">
                                {latestIssuance?.receiver?.name || requisition.requester?.name || ''}
                            </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="border-r border-black p-2 font-bold bg-slate-50 text-center align-middle">Designation</td>
                            <td className="border-r border-black p-2 text-slate-700 text-center">
                                {requisition.requester?.position || ''}
                            </td>
                            <td className="border-r border-black p-2 text-slate-700 text-center">
                                {requisition.departmentHead ? requisition.departmentHead.position : (requisition.approved_at ? 'Department Head' : '')}
                            </td>
                            <td className="border-r border-black p-2 text-slate-700 text-center">
                                {latestIssuance?.issuer ? latestIssuance.issuer.position : (requisition.status === 'issued' || requisition.status === 'partially_issued' ? 'Supply Officer' : '')}
                            </td>
                            <td className="p-2 text-slate-700 text-center">
                                {latestIssuance?.receiver ? latestIssuance.receiver.position : (latestIssuance ? (requisition.requester?.position || '') : '')}
                            </td>
                        </tr>
                        <tr>
                            <td className="border-r border-black p-2 font-bold bg-slate-50 text-center align-middle">Date</td>
                            <td className="border-r border-black p-2 text-center">{formatDate(requisition.created_at)}</td>
                            <td className="border-r border-black p-2 text-center">{formatDate(requisition.approved_at)}</td>
                            <td className="border-r border-black p-2 text-center">{formatDate(latestIssuance?.issued_date)}</td>
                            <td className="p-2 text-center">{formatDate(latestIssuance?.created_at)}</td>
                        </tr>
                    </tbody>
                </table>

            </div>
        </>
    );
}
