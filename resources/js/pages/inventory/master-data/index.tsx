import { Head, setLayoutProps, router } from '@inertiajs/react';
import { Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BreadcrumbItem } from '@/types';
import { CategoryDialog } from './components/CategoryDialog';
import CategoryTab from './components/CategoryTab';
import { DepartmentDialog } from './components/DepartmentDialog';
import DepartmentTab from './components/DepartmentTab';
import { LocationDialog } from './components/LocationDialog';
import LocationTab from './components/LocationTab';
import { OfficeDialog } from './components/OfficeDialog';
import OfficeTab from './components/OfficeTab';
import { SupplierDialog } from './components/SupplierDialog';
import SupplierTab from './components/SupplierTab';
import { UnitDialog } from './components/UnitDialog';
import UnitTab from './components/UnitTab';
import { WarehouseDialog } from './components/WarehouseDialog';
import WarehouseTab from './components/WarehouseTab';

interface MasterDataProps {
    categories: any[];
    units: any[];
    locations: any[];
    warehouses: any[];
    suppliers: any[];
    departments: any[];
    offices: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '#' },
    { title: 'System Libraries', href: '/inventory/master-data' },
];

export default function MasterDataIndex({
    categories,
    units,
    locations,
    warehouses,
    suppliers,
    departments,
    offices,
}: MasterDataProps) {
    setLayoutProps({ breadcrumbs });

    // State for Categories
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    // State for Units
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);

    // State for Locations
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);

    // State for Warehouses
    const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

    // State for Suppliers
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

    // State for Departments
    const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<any>(null);

    // State for Offices
    const [isOfficeDialogOpen, setIsOfficeDialogOpen] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState<any>(null);

    // Handlers
    const openCategoryDialog = (category = null) => {
        setSelectedCategory(category);
        setIsCategoryDialogOpen(true);
    };

    const openUnitDialog = (unit = null) => {
        setSelectedUnit(unit);
        setIsUnitDialogOpen(true);
    };

    const openLocationDialog = (location = null) => {
        setSelectedLocation(location);
        setIsLocationDialogOpen(true);
    };

    const openWarehouseDialog = (warehouse = null) => {
        setSelectedWarehouse(warehouse);
        setIsWarehouseDialogOpen(true);
    };

    const openSupplierDialog = (supplier = null) => {
        setSelectedSupplier(supplier);
        setIsSupplierDialogOpen(true);
    };

    const openDepartmentDialog = (department = null) => {
        setSelectedDepartment(department);
        setIsDepartmentDialogOpen(true);
    };

    const openOfficeDialog = (office = null) => {
        setSelectedOffice(office);
        setIsOfficeDialogOpen(true);
    };

    const handleSeedDefaultCategories = () => {
        router.post(
            '/inventory/categories/seed-defaults',
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        'Standard COA categories loaded successfully.',
                    ),
                onError: () =>
                    toast.error('Failed to load default categories.'),
            },
        );
    };

    const handleSeedDefaultUnits = () => {
        router.post(
            '/inventory/units/seed-defaults',
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        'Standard COA units of measurement loaded successfully.',
                    ),
                onError: () => toast.error('Failed to load default units.'),
            },
        );
    };

    const handleSeedDefaultDepartments = () => {
        router.post(
            '/inventory/master-data/departments/seed-defaults',
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        'Standard agency departments loaded successfully.',
                    ),
                onError: () =>
                    toast.error('Failed to load default departments.'),
            },
        );
    };

    const handleSeedDefaultOffices = () => {
        router.post(
            '/inventory/master-data/offices/seed-defaults',
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        'Standard agency offices loaded successfully.',
                    ),
                onError: () => toast.error('Failed to load default offices.'),
            },
        );
    };

    return (
        <>
            <Head title="System Libraries" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        System Libraries
                    </h1>
                    <p className="text-muted-foreground">
                        Manage Master Data for the inventory system.
                    </p>
                </div>

                <Tabs defaultValue="offices" className="w-full">
                    <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-7">
                        <TabsTrigger value="offices">Offices</TabsTrigger>
                        <TabsTrigger value="departments">
                            Departments
                        </TabsTrigger>
                        <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
                        <TabsTrigger value="locations">Locations</TabsTrigger>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                        <TabsTrigger value="units">Units</TabsTrigger>
                        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="offices">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Offices</CardTitle>
                                        <CardDescription>
                                            Manage agency offices and campuses.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {offices.length === 0 && (
                                            <Button
                                                variant="outline"
                                                onClick={
                                                    handleSeedDefaultOffices
                                                }
                                                className="text-indigo-650 border-indigo-200 hover:bg-indigo-50/50 dark:border-indigo-900/50 dark:text-indigo-400"
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />{' '}
                                                Load Defaults
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => openOfficeDialog()}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                            Add Office
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <OfficeTab
                                        offices={offices}
                                        onEdit={openOfficeDialog}
                                        onAdd={() => openOfficeDialog()}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="departments">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Departments</CardTitle>
                                        <CardDescription>
                                            Manage agency departments and
                                            sections.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {departments.length === 0 && (
                                            <Button
                                                variant="outline"
                                                onClick={
                                                    handleSeedDefaultDepartments
                                                }
                                                className="text-indigo-650 border-indigo-200 hover:bg-indigo-50/50 dark:border-indigo-900/50 dark:text-indigo-400"
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />{' '}
                                                Load Defaults
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() =>
                                                openDepartmentDialog()
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                            Add Department
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <DepartmentTab
                                        departments={departments}
                                        onEdit={openDepartmentDialog}
                                        onAdd={() => openDepartmentDialog()}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="warehouses">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Warehouses</CardTitle>
                                        <CardDescription>
                                            Manage warehouses and offices.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => openWarehouseDialog()}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add
                                        Warehouse
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <WarehouseTab
                                        warehouses={warehouses}
                                        onEdit={openWarehouseDialog}
                                        onAdd={() => openWarehouseDialog()}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="locations">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Locations</CardTitle>
                                        <CardDescription>
                                            Manage physical locations within
                                            warehouses.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => openLocationDialog()}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add
                                        Location
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <LocationTab
                                        locations={locations}
                                        onEdit={openLocationDialog}
                                        onAdd={() => openLocationDialog()}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="categories">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Categories</CardTitle>
                                        <CardDescription>
                                            Manage item categories.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {categories.length === 0 && (
                                            <Button
                                                variant="outline"
                                                onClick={
                                                    handleSeedDefaultCategories
                                                }
                                                className="text-indigo-650 border-indigo-200 hover:bg-indigo-50/50 dark:border-indigo-900/50 dark:text-indigo-400"
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />{' '}
                                                Load COA Defaults
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => openCategoryDialog()}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                            Add Category
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CategoryTab
                                        categories={categories}
                                        onEdit={openCategoryDialog}
                                        onAdd={() => openCategoryDialog()}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="units">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            Units of Measurement
                                        </CardTitle>
                                        <CardDescription>
                                            Manage units used for items.
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {units.length === 0 && (
                                            <Button
                                                variant="outline"
                                                onClick={handleSeedDefaultUnits}
                                                className="text-indigo-650 border-indigo-200 hover:bg-indigo-50/50 dark:border-indigo-900/50 dark:text-indigo-400"
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />{' '}
                                                Load COA Defaults
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => openUnitDialog()}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                            Add Unit
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <UnitTab
                                        units={units}
                                        onEdit={openUnitDialog}
                                        onAdd={() => openUnitDialog()}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="suppliers">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Suppliers</CardTitle>
                                        <CardDescription>
                                            Manage suppliers for procurement.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => openSupplierDialog()}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add
                                        Supplier
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <SupplierTab
                                        suppliers={suppliers}
                                        onEdit={openSupplierDialog}
                                        onAdd={() => openSupplierDialog()}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <CategoryDialog
                isOpen={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
                category={selectedCategory}
            />

            <UnitDialog
                isOpen={isUnitDialogOpen}
                onClose={() => setIsUnitDialogOpen(false)}
                unit={selectedUnit}
            />

            <LocationDialog
                isOpen={isLocationDialogOpen}
                onClose={() => setIsLocationDialogOpen(false)}
                location={selectedLocation}
                warehouses={warehouses}
            />

            <WarehouseDialog
                isOpen={isWarehouseDialogOpen}
                onClose={() => setIsWarehouseDialogOpen(false)}
                warehouse={selectedWarehouse}
            />

            <SupplierDialog
                isOpen={isSupplierDialogOpen}
                onClose={() => setIsSupplierDialogOpen(false)}
                supplier={selectedSupplier}
            />

            <DepartmentDialog
                isOpen={isDepartmentDialogOpen}
                onClose={() => setIsDepartmentDialogOpen(false)}
                department={selectedDepartment}
                offices={offices}
            />

            <OfficeDialog
                isOpen={isOfficeDialogOpen}
                onClose={() => setIsOfficeDialogOpen(false)}
                office={selectedOffice}
            />
        </>
    );
}
