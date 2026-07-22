import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Property {
    id: number;
    property_number: string;
    serial_number: string;
    model: string;
    brand: string;
    unit_cost: number | string;
    date_acquired: string;
    condition: string;
    status: string;
    category?: {
        name: string;
    } | null;
    active_assignment?: {
        is_non_system: boolean;
        non_system_name?: string;
        assignee?: {
            name: string;
        } | null;
    } | null;
    active_sub_assignment?: {
        is_non_system: boolean;
        non_system_name?: string;
        assignee?: {
            name: string;
        } | null;
    } | null;
}

interface PrintStickersProps {
    properties: Property[];
}

export default function PrintStickers({ properties }: PrintStickersProps) {
    const { agency } = usePage<any>().props;
    const agencyName =
        agency?.name || 'Department of Interior and Local Government';
    const agencyProvince =
        agency?.province || 'Provincial Government of Romblon';

    const [cols, setCols] = useState<2 | 3 | 4>(2);
    const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [showAuditGrid, setShowAuditGrid] = useState(true);

    useEffect(() => {
        // Trigger auto-print after assets load
        const timer = setTimeout(() => {
            window.print();
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) {
            return '';
        }

        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const getCustodianName = (prop: Property) => {
        if (prop.active_sub_assignment) {
            return prop.active_sub_assignment.is_non_system
                ? prop.active_sub_assignment.non_system_name
                : prop.active_sub_assignment.assignee?.name || 'N/A';
        }

        if (prop.active_assignment) {
            return prop.active_assignment.is_non_system
                ? prop.active_assignment.non_system_name
                : prop.active_assignment.assignee?.name || 'N/A';
        }

        return 'None Assigned (In Storage)';
    };

    const getClassification = (prop: Property) => {
        const cost = Number(prop.unit_cost || 0);

        return cost >= 50000 ? 'PPE' : 'Semi-Expendable';
    };

    const getCategoryColorClass = (categoryName: string | null | undefined) => {
        if (!categoryName) {
            return 'bg-slate-900 print:bg-slate-900';
        }

        const name = categoryName.toLowerCase();

        if (
            name.includes('ict') ||
            name.includes('computer') ||
            name.includes('it ') ||
            name.includes('information') ||
            name.includes('communication') ||
            name.includes('technology') ||
            name.includes('software') ||
            name.includes('hardware')
        ) {
            return 'bg-blue-700 print:bg-blue-700';
        }

        if (
            name.includes('furniture') ||
            name.includes('fixture') ||
            name.includes('chair') ||
            name.includes('table') ||
            name.includes('cabinet') ||
            name.includes('desk')
        ) {
            return 'bg-green-700 print:bg-green-700';
        }

        if (
            name.includes('office') ||
            name.includes('equipment') ||
            name.includes('supply') ||
            name.includes('supplies') ||
            name.includes('stationery')
        ) {
            return 'bg-amber-600 print:bg-amber-600';
        }

        if (
            name.includes('vehicle') ||
            name.includes('transport') ||
            name.includes('car') ||
            name.includes('motor') ||
            name.includes('truck')
        ) {
            return 'bg-red-700 print:bg-red-700';
        }

        if (
            name.includes('building') ||
            name.includes('structure') ||
            name.includes('land') ||
            name.includes('real estate') ||
            name.includes('house')
        ) {
            return 'bg-purple-750 print:bg-purple-750';
        }

        return 'bg-slate-900 print:bg-slate-900';
    };

    const shouldShowModel = (prop: Property) => {
        if (!prop.brand && !prop.model) {
            return false;
        }

        const categoryName = (prop.category?.name || '').toLowerCase();
        const modelStr = (prop.model || '').toLowerCase();

        if (
            categoryName.includes('furniture') ||
            categoryName.includes('fixture') ||
            categoryName.includes('chair') ||
            categoryName.includes('table') ||
            categoryName.includes('cabinet')
        ) {
            const isGeneric = [
                'n/a',
                'none',
                '-',
                'generic',
                'standard',
                'office chair',
                'office table',
            ].includes(modelStr);

            return !isGeneric && modelStr.length > 0;
        }

        return true;
    };

    // Sticker size classes
    const sizeClasses = {
        sm: {
            card: 'w-[3.25in] min-h-[2.0in] p-2 text-[9px] leading-tight',
            qr: 'w-14 h-14',
            title: 'text-[8px]',
            warning: 'text-[7px]',
            logo: 'h-7 w-7',
            headerText: 'text-[7px]',
        },
        md: {
            card: 'w-[4.0in] min-h-[2.5in] p-3 text-xs leading-normal',
            qr: 'w-20 h-20',
            title: 'text-[9px]',
            warning: 'text-[8px]',
            logo: 'h-9 w-9',
            headerText: 'text-[8px]',
        },
        lg: {
            card: 'w-[5.0in] min-h-[3.25in] p-4 text-sm leading-relaxed',
            qr: 'w-28 h-28',
            title: 'text-[10px]',
            warning: 'text-[9px]',
            logo: 'h-12 w-12',
            headerText: 'text-[9px]',
        },
    };

    // Grid column CSS maps
    const gridColsClassMap = {
        2: 'grid-cols-1 md:grid-cols-2 print:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3 print:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-4 print:grid-cols-4',
    };

    return (
        <>
            <Head title={`Print Property Stickers (${properties.length})`} />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    @page {
                        size: letter;
                        margin: 0.5in;
                    }
                    body {
                        margin: 0;
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .sticker-grid {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        justify-content: flex-start !important;
                        align-content: flex-start !important;
                        gap: 16px !important;
                    }
                    .sticker-card {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `,
                }}
            />

            {/* Print Header Controls (Hidden during print) */}
            <div className="flex flex-col gap-4 border-b bg-slate-900 px-6 py-4 text-slate-100 shadow-md md:flex-row md:items-center md:justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <Link
                        href="/inventory/properties"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        title="Back to Registry"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-white">
                            Property Stickers Generator
                        </h1>
                        <p className="text-xs text-slate-400">
                            Configure layout and sizes for the label printer.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">
                            Stickers Row:
                        </span>
                        <div className="flex rounded-md border border-slate-700 bg-slate-800 p-0.5">
                            {([2, 3, 4] as const).map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setCols(n)}
                                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                                        cols === n
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">
                            Size:
                        </span>
                        <div className="flex rounded-md border border-slate-700 bg-slate-800 p-0.5">
                            {(['sm', 'md', 'lg'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSize(s)}
                                    className={`rounded px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                                        size === s
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-l border-slate-700 pl-4">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300 select-none hover:text-white">
                            <input
                                type="checkbox"
                                checked={showAuditGrid}
                                onChange={(e) =>
                                    setShowAuditGrid(e.target.checked)
                                }
                                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                            />
                            <span>Include Audit Grid</span>
                        </label>
                    </div>

                    <Button
                        onClick={() => window.print()}
                        className="bg-indigo-600 text-xs hover:bg-indigo-700"
                        size="sm"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Labels
                    </Button>
                </div>
            </div>

            {/* Stickers Grid */}
            <div className="bg-slate-100 p-6 print:bg-white print:p-0">
                {properties.length === 0 ? (
                    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xs print:hidden">
                        <p className="text-sm text-slate-500">
                            No properties selected for printing stickers.
                        </p>
                        <Link
                            href="/inventory/properties"
                            className="mt-4 inline-flex items-center text-xs font-medium text-indigo-600 hover:underline"
                        >
                            Return to Property Registry
                        </Link>
                    </div>
                ) : (
                    <div
                        className={`sticker-grid grid ${gridColsClassMap[cols]} justify-items-center gap-6 print:gap-4`}
                    >
                        {properties.map((property) => (
                            <div
                                key={property.id}
                                className={`sticker-card flex flex-col justify-between border-2 border-black bg-white shadow-sm print:shadow-none ${sizeClasses[size].card}`}
                                style={{
                                    borderStyle: 'double',
                                    borderWidth: '3px',
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center gap-2 border-b border-black pb-1 text-left font-sans tracking-wide">
                                    <img
                                        src="/favicon.png"
                                        alt="Logo"
                                        className={`${sizeClasses[size].logo} shrink-0 object-contain`}
                                    />
                                    <div className="min-w-0 flex-1 leading-none">
                                        <div
                                            className={`font-extrabold tracking-wider text-slate-900 uppercase ${sizeClasses[size].headerText}`}
                                        >
                                            Republic of the Philippines
                                        </div>
                                        <div
                                            className={`font-extrabold tracking-wider text-slate-800 uppercase ${sizeClasses[size].headerText}`}
                                        >
                                            {agencyName}
                                        </div>
                                        <div
                                            className={`font-extrabold tracking-wider text-slate-800 uppercase ${sizeClasses[size].headerText}`}
                                        >
                                            {agencyProvince}
                                        </div>
                                        <div
                                            className={`text-indigo-750 mt-0.5 font-black uppercase ${sizeClasses[size].title}`}
                                        >
                                            PROPERTY IDENTIFICATION TAG
                                        </div>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="flex flex-1 items-center gap-2 py-2">
                                    {/* QR Code Column */}
                                    <div className="flex shrink-0 flex-col items-center justify-center border border-slate-300 bg-slate-50 p-0.5">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                                `https://assets.agency.gov.ph/ppe/${property.property_number}`,
                                            )}`}
                                            alt="QR Inventory Tag"
                                            className={`${sizeClasses[size].qr} object-contain`}
                                        />
                                    </div>

                                    {/* Property details Column */}
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="mb-1 font-mono">
                                            <div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                PROPERTY NO.
                                            </div>
                                            <div className="text-sm leading-tight font-black text-slate-900 md:text-base">
                                                {property.property_number}
                                            </div>
                                        </div>
                                        <div className="truncate">
                                            <span className="font-semibold">
                                                Category:
                                            </span>{' '}
                                            {property.category?.name || 'N/A'}
                                        </div>
                                        <div className="truncate">
                                            <span className="font-semibold">
                                                Classification:
                                            </span>{' '}
                                            {getClassification(property)}
                                        </div>
                                        {property.serial_number &&
                                            property.serial_number !==
                                                'None/No tag' && (
                                                <div className="truncate">
                                                    <span className="font-semibold">
                                                        Serial No:
                                                    </span>{' '}
                                                    {property.serial_number}
                                                </div>
                                            )}
                                        {shouldShowModel(property) && (
                                            <div className="truncate">
                                                <span className="font-semibold">
                                                    Model:
                                                </span>{' '}
                                                {[
                                                    property.brand,
                                                    property.model,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            </div>
                                        )}
                                        <div className="truncate">
                                            <span className="font-semibold">
                                                Acquired:
                                            </span>{' '}
                                            {formatDate(property.date_acquired)}
                                        </div>
                                    </div>
                                </div>

                                {/* Custodian information */}
                                <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-800">
                                    <div className="truncate">
                                        <span className="font-semibold">
                                            Custodian:
                                        </span>{' '}
                                        {getCustodianName(property)}
                                    </div>

                                    {showAuditGrid && (
                                        <div className="mt-1 flex items-center gap-1 border-t border-slate-200 pt-1 text-[7px] text-slate-500">
                                            <span className="text-[7px] font-semibold tracking-wider text-slate-400 uppercase">
                                                Manual Audit:
                                            </span>
                                            <span className="flex gap-1.5 font-mono text-slate-400">
                                                {Array.from({ length: 5 }).map(
                                                    (_, idx) => {
                                                        const year =
                                                            new Date().getFullYear() +
                                                            idx;

                                                        return (
                                                            <span
                                                                key={year}
                                                                className="whitespace-nowrap"
                                                            >
                                                                {year} [ ]
                                                            </span>
                                                        );
                                                    },
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Warning/Auditing mark */}
                                <div
                                    className={`mt-1 py-0.5 text-center font-semibold tracking-wider text-white uppercase ${sizeClasses[size].warning} ${getCategoryColorClass(property.category?.name)}`}
                                >
                                    GOVERNMENT PROPERTY - DO NOT REMOVE
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
