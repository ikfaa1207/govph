import { Head, setLayoutProps, router, usePage } from '@inertiajs/react';
import {
    PlusCircle,
    UserCheck,
    Package,
    PhilippinePeso,
    Clock,
    CheckCircle,
    PackageOpen,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SmartSelect } from '@/components/ui/smart-select';
import { TourGuide } from '@/components/ui/tour-guide';
import type { TourStep } from '@/components/ui/tour-guide';
import { formatCurrency } from '@/lib/utils';

// Import extracted components
import { AcknowledgeDialog } from './components/AcknowledgeDialog';
import { AddPropertyDialog } from './components/AddPropertyDialog';
import { AssignDialog } from './components/AssignDialog';
import { BatchAssignDialog } from './components/BatchAssignDialog';
import { BatchEditDialog } from './components/BatchEditDialog';
import { DisposeDialog } from './components/DisposeDialog';
import { EditPropertyDialog } from './components/EditPropertyDialog';
import { PropertyTable } from './components/PropertyTable';
import { ReturnSubAssignDialog } from './components/ReturnSubAssignDialog';
import { SubAssignDialog } from './components/SubAssignDialog';
import { TransferDialog } from './components/TransferDialog';

export interface Property {
    id: number;
    property_number: string;
    serial_number: string;
    model: string;
    brand: string;
    unit_cost: number;
    date_acquired: string;
    warranty_expiration: string | null;
    condition:
        'new' | 'good' | 'fair' | 'needs_repair' | 'unserviceable' | 'disposed';
    status:
        'available' | 'assigned' | 'transferred' | 'for_disposal' | 'disposed';
    category?: {
        name: string;
    };
    active_assignment?: {
        document_number: string;
        document_type: 'PAR' | 'ICS';
        assignee?: {
            name: string;
        };
        non_system_name?: string | null;
        non_system_department?: string | null;
    };
    active_sub_assignment?: {
        id: number;
        mr_number: string;
        assignee?: {
            name: string;
        };
        non_system_name?: string | null;
    };
    receiving_report_item_id?: number | null;
    receiving_report_item?: {
        id: number;
        receiving_report?: {
            id: number;
            iar_number: string | null;
            purchase_order?: {
                po_number: string;
            };
        };
    };
}

interface PropertyIndexProps {
    properties: {
        data: Property[];
        links: any[];
    };
    employees: any[];
    categories: any[];
    offices: any[];
    auth: {
        user: {
            role:
                | 'admin'
                | 'supply_officer'
                | 'property_custodian'
                | 'dept_head'
                | 'employee'
                | 'auditor';
            roles?: string[];
        };
    };
    current_employee: any;
    stats: {
        total_items: number;
        available: number;
        assigned: number;
        total_value: number;
        recently_added: number;
    };
    filters: {
        search?: string;
        status?: string;
        category_id?: string;
        condition?: string;
    };
}

export default function PropertyIndex({
    properties,
    employees,
    categories,
    offices,

    current_employee,
    stats,
    filters,
}: PropertyIndexProps) {
    const breadcrumbs = [
        { title: 'Property Registry (PPE)', href: '/inventory/properties' },
    ];
    setLayoutProps({ breadcrumbs });

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const [selectedPropIds, setSelectedPropIds] = useState<number[]>([]);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    // Search and Filter States
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [categoryId, setCategoryId] = useState(filters.category_id || 'all');
    const [condition, setCondition] = useState(filters.condition || 'all');

    const handleFilterChange = (
        newSearch: string,
        newStatus: string,
        newCategory: string,
        newCondition: string,
    ) => {
        router.get(
            '/inventory/properties',
            {
                search: newSearch || undefined,
                status: newStatus !== 'all' ? newStatus : undefined,
                category_id: newCategory !== 'all' ? newCategory : undefined,
                condition: newCondition !== 'all' ? newCondition : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const onStatusChange = (val: string) => {
        setStatus(val);
        handleFilterChange(search, val, categoryId, condition);
    };

    const onCategoryChange = (val: string) => {
        setCategoryId(val);
        handleFilterChange(search, status, val, condition);
    };

    const onConditionChange = (val: string) => {
        setCondition(val);
        handleFilterChange(search, status, categoryId, val);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setCategoryId('all');
        setCondition('all');
        router.get(
            '/inventory/properties',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };
    const [isBatchAssignOpen, setIsBatchAssignOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isDisposeOpen, setIsDisposeOpen] = useState(false);
    const [isSubAssignOpen, setIsSubAssignOpen] = useState(false);
    const [isReturnSubAssignOpen, setIsReturnSubAssignOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
    const [isAcknowledgeOpen, setIsAcknowledgeOpen] = useState(false);

    const openEditModal = (prop: Property) => {
        setSelectedProp(prop);
        setIsEditOpen(true);
    };

    const openAssignModal = (prop: Property) => {
        setSelectedProp(prop);
        setIsAssignOpen(true);
    };

    const openTransferModal = (prop: Property) => {
        setSelectedProp(prop);
        setIsTransferOpen(true);
    };

    const openDisposeModal = (prop: Property) => {
        setSelectedProp(prop);
        setIsDisposeOpen(true);
    };

    const openSubAssignModal = (prop: Property) => {
        setSelectedProp(prop);
        setIsSubAssignOpen(true);
    };

    const openReturnSubAssignModal = (prop: Property) => {
        setSelectedProp(prop);
        setIsReturnSubAssignOpen(true);
    };

    const openAcknowledgeModal = (prop: Property) => {
        setSelectedProp(prop);
        setIsAcknowledgeOpen(true);
    };

    const { auth } = usePage().props as any;
    const canAssign = auth?.user?.permissions?.includes('property.assign');
    const tourSteps: TourStep[] = [
        {
            target: '#properties-tour-header',
            title: 'Property Registry (PPE)',
            description:
                'This is the government assets and capitalized equipment registry where you manage inventory tags, serials, and condition states.',
        },
    ];

    if (canAssign) {
        tourSteps.push({
            target: '#properties-tour-create',
            title: 'Register Equipment',
            description:
                'Click here to catalog a new property unit or physical asset into the repository.',
        });
    }

    tourSteps.push(
        {
            target: '#properties-tour-filters',
            title: 'Filters & Search',
            description:
                'Search properties by serial numbers or filter by physical condition and availability.',
        },
        {
            target: '#properties-tour-list',
            title: 'Properties List',
            description:
                'View property tags, current assignees, edit details, or trigger transfer handovers (PAR/ICS).',
        },
    );

    return (
        <>
            <Head title="Property Registry - GIMS" />
            <TourGuide tourId="property-index" steps={tourSteps} />
            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div id="properties-tour-header">
                        <h1 className="text-xl font-bold tracking-tight">
                            Property, Plant, and Equipment (PPE)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage capitalized properties, serial codes, and
                            handovers.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Can permission="property.assign">
                            {selectedPropIds.length > 0 && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/20"
                                        onClick={() => setIsBatchEditOpen(true)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Batch Edit ({selectedPropIds.length})
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="gap-2"
                                        onClick={() =>
                                            setIsBatchAssignOpen(true)
                                        }
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        Batch Assign ({selectedPropIds.length})
                                    </Button>
                                </>
                            )}
                            <Button
                                id="properties-tour-create"
                                className="gap-2"
                                onClick={() => setIsAddOpen(true)}
                            >
                                <PlusCircle className="h-4 w-4" />
                                Register Equipment
                            </Button>
                        </Can>
                    </div>
                </div>

                {/* Statistics Overview */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-blue-500 bg-card bg-linear-to-tr from-transparent to-blue-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-blue-500/5">
                                <Package
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-blue-500 uppercase">
                                    Total PPEs
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.total_items}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-emerald-500 bg-card bg-linear-to-tr from-transparent to-emerald-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                                <PhilippinePeso
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-emerald-500 uppercase">
                                    Total Value
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {formatCurrency(stats.total_value)}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-violet-500 bg-card bg-linear-to-tr from-transparent to-violet-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-violet-500/5">
                                <Clock
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-violet-500 uppercase">
                                    Recently Added
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.recently_added}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-amber-500 bg-card bg-linear-to-tr from-transparent to-amber-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-amber-500/5">
                                <CheckCircle
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-amber-500 uppercase">
                                    Assigned
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.assigned}
                                </p>
                            </div>
                        </Card>

                        <Card className="relative z-0 flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-rose-500 bg-card bg-linear-to-tr from-transparent to-rose-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-rose-500/5">
                                <PackageOpen
                                    className="h-28 w-28"
                                    strokeWidth={1.5}
                                />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[11px] font-medium tracking-wider text-rose-500 uppercase">
                                    Available
                                </p>
                                <p className="truncate text-2xl font-bold text-foreground">
                                    {stats.available}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Properties Registry Board */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Tracked Properties & Accountabilities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Search and Filters Bar */}
                        <div
                            id="properties-tour-filters"
                            className="mb-6 grid grid-cols-1 items-end gap-4 md:grid-cols-5"
                        >
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Search Registry
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            handleFilterChange(
                                                search,
                                                status,
                                                categoryId,
                                                condition,
                                            )
                                        }
                                        placeholder="Search by Property No., S/N, Brand, Model, Assignee..."
                                        className="h-9 text-xs"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="h-9 text-xs"
                                        onClick={() =>
                                            handleFilterChange(
                                                search,
                                                status,
                                                categoryId,
                                                condition,
                                            )
                                        }
                                    >
                                        Search
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Status
                                </Label>
                                <SmartSelect
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        {
                                            value: 'available',
                                            label: 'Available',
                                        },
                                        {
                                            value: 'assigned',
                                            label: 'Assigned',
                                        },
                                        {
                                            value: 'transferred',
                                            label: 'Transferred',
                                        },
                                        {
                                            value: 'for_disposal',
                                            label: 'For Disposal',
                                        },
                                        {
                                            value: 'disposed',
                                            label: 'Disposed',
                                        },
                                    ]}
                                    value={status}
                                    onValueChange={onStatusChange}
                                    placeholder="Status"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Category
                                </Label>
                                <SmartSelect
                                    options={[
                                        {
                                            value: 'all',
                                            label: 'All Categories',
                                        },
                                        ...categories.map((c) => ({
                                            value: String(c.id),
                                            label: c.name,
                                        })),
                                    ]}
                                    value={categoryId}
                                    onValueChange={onCategoryChange}
                                    placeholder="Category"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="flex flex-col justify-end gap-1.5 space-y-1.5">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Physical Condition
                                    </Label>
                                    <SmartSelect
                                        options={[
                                            {
                                                value: 'all',
                                                label: 'All Conditions',
                                            },
                                            { value: 'new', label: 'New' },
                                            { value: 'good', label: 'Good' },
                                            { value: 'fair', label: 'Fair' },
                                            {
                                                value: 'needs_repair',
                                                label: 'Needs Repair',
                                            },
                                            {
                                                value: 'unserviceable',
                                                label: 'Unserviceable',
                                            },
                                            {
                                                value: 'disposed',
                                                label: 'Disposed',
                                            },
                                        ]}
                                        value={condition}
                                        onValueChange={onConditionChange}
                                        placeholder="Condition"
                                        className="h-9 w-full text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {(search ||
                            status !== 'all' ||
                            categoryId !== 'all' ||
                            condition !== 'all') && (
                            <div className="mb-4 flex items-center justify-between rounded-lg border border-muted bg-muted/40 p-3">
                                <div className="text-xs text-muted-foreground">
                                    Active filters are limiting the list
                                    display.
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-7 text-xs"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                        {properties.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <PackageOpen className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold">
                                    {search ||
                                    status !== 'all' ||
                                    categoryId !== 'all' ||
                                    condition !== 'all'
                                        ? 'No matching properties found'
                                        : 'No properties registered'}
                                </h3>
                                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                    {search ||
                                    status !== 'all' ||
                                    categoryId !== 'all' ||
                                    condition !== 'all'
                                        ? 'Try adjusting your search terms or filters.'
                                        : 'Get started by registering high-value assets and equipment into the registry.'}
                                </p>
                                {!(
                                    search ||
                                    status !== 'all' ||
                                    categoryId !== 'all' ||
                                    condition !== 'all'
                                ) ? (
                                    <Can permission="property.assign">
                                        <Button
                                            className="mt-4 gap-2"
                                            onClick={() => setIsAddOpen(true)}
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                            Register Equipment
                                        </Button>
                                    </Can>
                                ) : (
                                    <Button
                                        className="mt-4 gap-2"
                                        variant="outline"
                                        onClick={clearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div id="properties-tour-list">
                                <PropertyTable
                                    properties={properties}
                                    selectedPropIds={selectedPropIds}
                                    setSelectedPropIds={setSelectedPropIds}
                                    openAssignModal={openAssignModal}
                                    openTransferModal={openTransferModal}
                                    openSubAssignModal={openSubAssignModal}
                                    openReturnSubAssignModal={
                                        openReturnSubAssignModal
                                    }
                                    openDisposeModal={openDisposeModal}
                                    openEditModal={openEditModal}
                                    openAcknowledgeModal={openAcknowledgeModal}
                                    currentEmployee={current_employee}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modals & Dialogs */}
                {isAddOpen && (
                    <AddPropertyDialog
                        isOpen={isAddOpen}
                        onClose={() => setIsAddOpen(false)}
                        categories={categories}
                    />
                )}

                {isAssignOpen && selectedProp && (
                    <AssignDialog
                        isOpen={isAssignOpen}
                        onClose={() => setIsAssignOpen(false)}
                        property={selectedProp}
                        employees={employees}
                    />
                )}

                {isBatchAssignOpen && (
                    <BatchAssignDialog
                        isOpen={isBatchAssignOpen}
                        onClose={() => setIsBatchAssignOpen(false)}
                        selectedPropIds={selectedPropIds}
                        setSelectedPropIds={setSelectedPropIds}
                        employees={employees}
                    />
                )}

                {isTransferOpen && selectedProp && (
                    <TransferDialog
                        isOpen={isTransferOpen}
                        onClose={() => setIsTransferOpen(false)}
                        property={selectedProp}
                        employees={employees}
                        offices={offices}
                    />
                )}

                {isDisposeOpen && selectedProp && (
                    <DisposeDialog
                        isOpen={isDisposeOpen}
                        onClose={() => setIsDisposeOpen(false)}
                        property={selectedProp}
                        employees={employees}
                        current_employee={current_employee}
                    />
                )}

                {isSubAssignOpen && selectedProp && (
                    <SubAssignDialog
                        isOpen={isSubAssignOpen}
                        onClose={() => setIsSubAssignOpen(false)}
                        property={selectedProp}
                        employees={employees}
                        current_employee={current_employee}
                    />
                )}

                {isReturnSubAssignOpen && selectedProp && (
                    <ReturnSubAssignDialog
                        isOpen={isReturnSubAssignOpen}
                        onClose={() => setIsReturnSubAssignOpen(false)}
                        property={selectedProp}
                    />
                )}

                {isEditOpen && selectedProp && (
                    <EditPropertyDialog
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        property={selectedProp}
                    />
                )}

                {isBatchEditOpen && (
                    <BatchEditDialog
                        isOpen={isBatchEditOpen}
                        onClose={() => setIsBatchEditOpen(false)}
                        selectedProperties={properties.data.filter((p) =>
                            selectedPropIds.includes(p.id),
                        )}
                        setSelectedPropIds={setSelectedPropIds}
                    />
                )}
            </div>
            <AcknowledgeDialog
                isOpen={isAcknowledgeOpen}
                onClose={() => {
                    setIsAcknowledgeOpen(false);
                    setSelectedProp(null);
                }}
                property={selectedProp}
            />
        </>
    );
}
