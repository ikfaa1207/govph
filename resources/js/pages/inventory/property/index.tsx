import { Head, setLayoutProps } from '@inertiajs/react';
import {
    PlusCircle,
    UserCheck,
    Package,
    PhilippinePeso,
    Clock,
    CheckCircle,
    PackageOpen,
} from 'lucide-react';
import { useState } from 'react';
import { Can } from '@/components/can';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '@/lib/utils';

// Import extracted components
import { AddPropertyDialog } from './components/AddPropertyDialog';
import { AssignDialog } from './components/AssignDialog';
import { BatchAssignDialog } from './components/BatchAssignDialog';
import { DisposeDialog } from './components/DisposeDialog';
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
        | 'new'
        | 'good'
        | 'fair'
        | 'needs_repair'
        | 'unserviceable'
        | 'disposed';
    status:
        | 'available'
        | 'assigned'
        | 'transferred'
        | 'for_disposal'
        | 'disposed';
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
}

export default function PropertyIndex({
    properties,
    employees,
    categories,
    offices,
    auth,
    current_employee,
    stats,
}: PropertyIndexProps) {
    const breadcrumbs = [
        { title: 'Property Registry (PPE)', href: '/inventory/properties' },
    ];
    setLayoutProps({ breadcrumbs });

    const { hasAnyPermission } = usePermissions();
    const isDeptHead = auth.user.roles?.includes('Department Head');
    const canManage =
        hasAnyPermission([
            'property.assign',
            'property.transfer',
            'property.dispose',
        ]) || isDeptHead;

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const [selectedPropIds, setSelectedPropIds] = useState<number[]>([]);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isBatchAssignOpen, setIsBatchAssignOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isDisposeOpen, setIsDisposeOpen] = useState(false);
    const [isSubAssignOpen, setIsSubAssignOpen] = useState(false);
    const [isReturnSubAssignOpen, setIsReturnSubAssignOpen] = useState(false);

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

    return (
        <>
            <Head title="Property Registry - GIMS" />
            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Property, Plant, and Equipment (PPE)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage capitalized properties, serial codes, and handovers.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Can permission="property.assign">
                            {selectedPropIds.length > 0 && (
                                <Button
                                    variant="secondary"
                                    className="gap-2"
                                    onClick={() => setIsBatchAssignOpen(true)}
                                >
                                    <UserCheck className="h-4 w-4" />
                                    Batch Assign ({selectedPropIds.length})
                                </Button>
                            )}
                            <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
                                <PlusCircle className="h-4 w-4" />
                                Register Equipment
                            </Button>
                        </Can>
                    </div>
                </div>

                {/* Statistics Overview */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-blue-500 bg-card bg-linear-to-tr from-transparent to-blue-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-blue-500/5">
                                <Package className="h-28 w-28" strokeWidth={1.5} />
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

                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-emerald-500 bg-card bg-linear-to-tr from-transparent to-emerald-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-emerald-500/5">
                                <PhilippinePeso className="h-28 w-28" strokeWidth={1.5} />
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

                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-violet-500 bg-card bg-linear-to-tr from-transparent to-violet-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-violet-500/5">
                                <Clock className="h-28 w-28" strokeWidth={1.5} />
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

                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-amber-500 bg-card bg-linear-to-tr from-transparent to-amber-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-amber-500/5">
                                <CheckCircle className="h-28 w-28" strokeWidth={1.5} />
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

                        <Card className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-t-4 border-border border-t-rose-500 bg-card bg-linear-to-tr from-transparent to-rose-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
                            <div className="absolute -right-4 -bottom-4 text-rose-500/5">
                                <PackageOpen className="h-28 w-28" strokeWidth={1.5} />
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
                        {properties.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <PackageOpen className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold">No properties registered</h3>
                                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                                    Get started by registering high-value assets and equipment into the registry.
                                </p>
                                <Can permission="property.assign">
                                    <Button className="mt-4 gap-2" onClick={() => setIsAddOpen(true)}>
                                        <PlusCircle className="h-4 w-4" />
                                        Register Equipment
                                    </Button>
                                </Can>
                            </div>
                        ) : (
                            <PropertyTable
                                properties={properties}
                                selectedPropIds={selectedPropIds}
                                setSelectedPropIds={setSelectedPropIds}
                                canManage={canManage}
                                isDeptHead={isDeptHead}
                                openAssignModal={openAssignModal}
                                openTransferModal={openTransferModal}
                                openSubAssignModal={openSubAssignModal}
                                openReturnSubAssignModal={openReturnSubAssignModal}
                                openDisposeModal={openDisposeModal}
                            />
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
            </div>
        </>
    );
}
