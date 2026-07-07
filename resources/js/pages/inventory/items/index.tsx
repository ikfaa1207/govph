import { Head, Link, useForm, useHttp, setLayoutProps } from '@inertiajs/react';
import { PlusCircle, Search, Eye, AlertCircle, Plus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/can';
import { SimplePagination } from '@/components/simple-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
interface Item {
    id: number;
    item_code: string;
    stock_number: string;
    name: string;
    description: string;
    category: any;
    unit: any;
    unit_cost: number;
    current_stock: number;
    reorder_level: number;
    status: string;
    location: string;
}

interface ItemsIndexProps {
    items: {
        data: Item[];
        links: any[];
    };
    categories: any[];
    units: any[];
    locations: any[];
    warehouses: any[];
    filters: {
        search?: string;
        category_id?: string;
    };
}

export default function ItemsIndex({ items, categories: initialCategories, units: initialUnits, locations: initialLocations, warehouses: initialWarehouses, filters }: ItemsIndexProps) {
    const breadcrumbs = [{ title: 'Supplies Catalog', href: '/inventory/items' }];
    setLayoutProps({ breadcrumbs });
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchVal, setSearchVal] = useState(filters.search || '');

    const [categories, setCategories] = useState(initialCategories);
    const [units, setUnits] = useState(initialUnits);
    const [locations, setLocations] = useState(initialLocations);
    const [warehouses, setWarehouses] = useState(initialWarehouses);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
    const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
    const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        category_id: '',
        unit_id: '',
        reorder_level: 10,
        maximum_stock: 100,
        location_id: '',
        stock_number: '',
        barcode: '',
        expiration_date: '',
    });

    const categoryHttp = useHttp({
        name: '',
        code: '',
        is_ppe: false,
    });

    const unitHttp = useHttp({
        name: '',
        abbreviation: '',
    });

    const locationHttp = useHttp({
        warehouse_id: warehouses.length > 0 ? String(warehouses[0].id) : '',
        code: '',
        description: '',
    });

    const warehouseHttp = useHttp({
        name: '',
        address: '',
    });

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        categoryHttp.post('/inventory/categories', {
            onSuccess: (newCategory: any) => {
                setCategories([...categories, newCategory]);
                setData('category_id', String(newCategory.id));
                setIsAddCategoryOpen(false);
                categoryHttp.reset();
                toast.success('Category created successfully.');
            },
            onError: () => {
                toast.error('Failed to create category. Check unique constraints.');
            }
        });
    };

    const handleUnitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        unitHttp.post('/inventory/units', {
            onSuccess: (newUnit: any) => {
                setUnits([...units, newUnit]);
                setData('unit_id', String(newUnit.id));
                setIsAddUnitOpen(false);
                unitHttp.reset();
                toast.success('Unit of measurement created successfully.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Failed to create unit of measurement. Check unique constraints.');
            }
        });
    };


    const handleLocationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        locationHttp.post('/inventory/locations', {
            onSuccess: (newLocation: any) => {
                setLocations([...locations, newLocation]);
                setData('location_id', String(newLocation.id));
                setIsAddLocationOpen(false);
                locationHttp.reset();
                toast.success('Storage location created successfully.');
            },
            onError: () => {
                toast.error('Failed to create storage location. Check unique constraints.');
            }
        });
    };

    const handleWarehouseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        warehouseHttp.post('/inventory/warehouses', {
            onSuccess: (newWarehouse: any) => {
                setWarehouses([...warehouses, newWarehouse]);
                locationHttp.setData('warehouse_id', String(newWarehouse.id));
                setIsAddWarehouseOpen(false);
                warehouseHttp.reset();
                toast.success('Warehouse created successfully.');
            },
            onError: () => {
                toast.error('Failed to create warehouse. Check unique constraints.');
            }
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Trigger Inertia search visit
        const queryParams = new URLSearchParams();

        if (searchVal) {
queryParams.set('search', searchVal);
}

        window.location.search = queryParams.toString();
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/items', {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
                toast.success('Supply item added successfully.');
            },
            onError: () => {
                toast.error('Failed to create supply item. Check validation errors.');
            }
        });
    };

    return (
        <>
            <Head title="Supplies Catalog - GIMS" />
            <div className="space-y-6 p-6">
                
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Supplies & Materials Catalog</h1>
                        <p className="text-sm text-muted-foreground">Manage active inventories, stock numbers, and storage shelves.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Add Item Dialog */}
                        <Can permission="inventory.create">
                            <Dialog 
                                open={isAddOpen} 
                            onOpenChange={(open) => {
                                if (!open) {
                                    if (!isAddCategoryOpen && !isAddLocationOpen) {
                                        setIsAddOpen(false);
                                    }
                                } else {
                                    setIsAddOpen(true);
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Add Supply Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent 
                                className="max-w-md max-h-[85vh] overflow-y-auto"
                                onPointerDownOutside={(e) => {
                                    // Prevent closing on clicking outside the parent dialog
                                    e.preventDefault();
                                }}
                                onInteractOutside={(e) => {
                                    // Prevent interaction outside from closing the parent dialog
                                    e.preventDefault();
                                }}
                                onEscapeKeyDown={(e) => {
                                    // Prevent escape key from closing the parent if a sub-modal is open
                                    if (isAddCategoryOpen || isAddLocationOpen) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <DialogHeader>
                                    <DialogTitle>Add New Supply Item</DialogTitle>
                                    <DialogDescription>Register a new supply item into the system database.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="name">Item Name *</Label>
                                        <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                        {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="stock_number">COA Stock Number</Label>
                                        <Input id="stock_number" placeholder="e.g. 501-02-01" value={data.stock_number} onChange={e => setData('stock_number', e.target.value)} />
                                        {errors.stock_number && <p className="text-xs text-rose-500">{errors.stock_number}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="category">Category *</Label>
                                            <div className="flex gap-1.5">
                                                <Select value={String(data.category_id)} onValueChange={val => setData('category_id', val)} required>
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-9 w-9 shrink-0"
                                                    onClick={() => setIsAddCategoryOpen(true)}
                                                    title="Add New Category"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {errors.category_id && <p className="text-xs text-rose-500">{errors.category_id}</p>}
                                        </div>
                                        <div className="space-y-1">
                                             <Label htmlFor="unit">Unit of Measure *</Label>
                                             <div className="flex gap-1.5">
                                                 <Select value={String(data.unit_id)} onValueChange={val => setData('unit_id', val)} required>
                                                     <SelectTrigger className="flex-1">
                                                         <SelectValue placeholder="Select Unit" />
                                                     </SelectTrigger>
                                                     <SelectContent>
                                                         {units.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.abbreviation})</SelectItem>)}
                                                     </SelectContent>
                                                 </Select>
                                                 <Button 
                                                     type="button" 
                                                     variant="outline" 
                                                     size="icon" 
                                                     className="h-9 w-9 shrink-0"
                                                     onClick={() => setIsAddUnitOpen(true)}
                                                     title="Add New Unit of Measure"
                                                 >
                                                     <Plus className="h-4 w-4" />
                                                 </Button>
                                             </div>
                                             {errors.unit_id && <p className="text-xs text-rose-500">{errors.unit_id}</p>}
                                         </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="reorder_level">Reorder Level *</Label>
                                            <Input id="reorder_level" type="number" value={data.reorder_level} onChange={e => setData('reorder_level', parseInt(e.target.value))} required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="maximum_stock">Max Stock Level *</Label>
                                            <Input id="maximum_stock" type="number" value={data.maximum_stock} onChange={e => setData('maximum_stock', parseInt(e.target.value))} required />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="location">Storage Location</Label>
                                        <div className="flex gap-1.5">
                                            <Select value={String(data.location_id)} onValueChange={val => setData('location_id', val)}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select Location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map(l => (
                                                        <SelectItem key={l.id} value={String(l.id)}>
                                                            {l.warehouse?.name || 'Warehouse'} - {l.code}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-9 w-9 shrink-0"
                                                onClick={() => setIsAddLocationOpen(true)}
                                                title="Add New Storage Location"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="description">Description</Label>
                                        <textarea id="description" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden" value={data.description} onChange={e => setData('description', e.target.value)} />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={processing}>Save Item</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                        </Can>

                        {/* Inline Category Creation Dialog */}
                        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Add New Category</DialogTitle>
                                    <DialogDescription>Create a new supply category for the catalog.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCategorySubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="cat_name">Category Name *</Label>
                                        <Input 
                                            id="cat_name" 
                                            value={categoryHttp.data.name} 
                                            onChange={e => categoryHttp.setData('name', e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="cat_code">Category Code *</Label>
                                        <Input 
                                            id="cat_code" 
                                            placeholder="e.g. OFF-SUPP"
                                            value={categoryHttp.data.code} 
                                            onChange={e => categoryHttp.setData('code', e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="cat_is_ppe" 
                                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                            checked={categoryHttp.data.is_ppe}
                                            onChange={e => categoryHttp.setData('is_ppe', e.target.checked)}
                                        />
                                        <Label htmlFor="cat_is_ppe" className="cursor-pointer select-none">
                                            Is PPE (Capitalized Asset)
                                        </Label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={categoryHttp.processing}>Save Category</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Inline Unit Creation Dialog */}
                        <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Add New Unit of Measure</DialogTitle>
                                    <DialogDescription>Create a new unit of measurement for supplies.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUnitSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="unit_name">Unit Name *</Label>
                                        <Input 
                                            id="unit_name" 
                                            value={unitHttp.data.name} 
                                            onChange={e => unitHttp.setData('name', e.target.value)} 
                                            required 
                                            placeholder="e.g. Piece, Box, Roll"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="unit_abbrev">Abbreviation *</Label>
                                        <Input 
                                            id="unit_abbrev" 
                                            placeholder="e.g. pc, box, roll"
                                            value={unitHttp.data.abbreviation} 
                                            onChange={e => unitHttp.setData('abbreviation', e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAddUnitOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={unitHttp.processing}>Save Unit</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Inline Location Creation Dialog */}
                        <Dialog 
                            open={isAddLocationOpen} 
                            onOpenChange={(open) => {
                                if (!open) {
                                    if (!isAddWarehouseOpen) {
                                        setIsAddLocationOpen(false);
                                    }
                                } else {
                                    setIsAddLocationOpen(true);
                                }
                            }}
                        >
                            <DialogContent 
                                className="max-w-sm"
                                onPointerDownOutside={(e) => {
                                    if (isAddWarehouseOpen) {
                                        e.preventDefault();
                                    }
                                }}
                                onInteractOutside={(e) => {
                                    if (isAddWarehouseOpen) {
                                        e.preventDefault();
                                    }
                                }}
                                onEscapeKeyDown={(e) => {
                                    if (isAddWarehouseOpen) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <DialogHeader>
                                    <DialogTitle>Add Storage Location</DialogTitle>
                                    <DialogDescription>Define a new shelf or storage section.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleLocationSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="loc_warehouse">Warehouse *</Label>
                                        <div className="flex gap-1.5">
                                            <Select value={String(locationHttp.data.warehouse_id)} onValueChange={val => locationHttp.setData('warehouse_id', val)} required>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select Warehouse" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-9 w-9 shrink-0"
                                                onClick={() => setIsAddWarehouseOpen(true)}
                                                title="Add New Warehouse"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="loc_code">Shelf/Location Code *</Label>
                                        <Input 
                                            id="loc_code" 
                                            placeholder="e.g. SHELF-C-03"
                                            value={locationHttp.data.code} 
                                            onChange={e => locationHttp.setData('code', e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="loc_description">Description</Label>
                                        <textarea 
                                            id="loc_description" 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            placeholder="e.g. Third tier, row C"
                                            value={locationHttp.data.description} 
                                            onChange={e => locationHttp.setData('description', e.target.value)} 
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAddLocationOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={locationHttp.processing}>Save Location</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Inline Warehouse Creation Dialog */}
                        <Dialog open={isAddWarehouseOpen} onOpenChange={setIsAddWarehouseOpen}>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Add New Warehouse</DialogTitle>
                                    <DialogDescription>Create a new warehouse for location assignment.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="wh_name">Warehouse Name *</Label>
                                        <Input 
                                            id="wh_name" 
                                            value={warehouseHttp.data.name} 
                                            onChange={e => warehouseHttp.setData('name', e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="wh_address">Address</Label>
                                        <textarea 
                                            id="wh_address" 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            placeholder="e.g. Building B, Main Campus"
                                            value={warehouseHttp.data.address} 
                                            onChange={e => warehouseHttp.setData('address', e.target.value)} 
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsAddWarehouseOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={warehouseHttp.processing}>Save Warehouse</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Filters Board */}
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search supplies by name, stock number, code or barcode..." 
                                    className="pl-9"
                                    value={searchVal}
                                    onChange={e => setSearchVal(e.target.value)}
                                />
                            </div>
                            <Button type="submit">Search</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Supplies List Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Active Supply Ledger</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {items.data.length === 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Code</TableHead>
                                            <TableHead>Stock No.</TableHead>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>UOM</TableHead>
                                            <TableHead className="text-right">Unit Cost</TableHead>
                                            <TableHead className="text-center">Stock Balance</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground space-y-2">
                                                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                                                <p>No supplies found. Register new items or adjust search query.</p>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="text-xs">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">Item Code</TableHead>
                                            <TableHead className="whitespace-nowrap">Stock No.</TableHead>
                                            <TableHead className="w-[200px]">Item Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>UOM</TableHead>
                                            <TableHead className="text-right whitespace-nowrap">Unit Cost</TableHead>
                                            <TableHead className="text-center whitespace-nowrap">Stock Balance</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.data.map((item) => {
                                            const isLow = item.current_stock <= item.reorder_level;
                                            const isOut = item.current_stock === 0;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-[11px] whitespace-nowrap">{item.item_code}</TableCell>
                                                    <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">{item.stock_number || 'N/A'}</TableCell>
                                                    <TableCell className="max-w-[200px]">
                                                        <div className="font-semibold truncate" title={item.name}>{item.name}</div>
                                                        <div className="text-[11px] text-muted-foreground truncate" title={item.description}>{item.description}</div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-[11px] leading-tight">{item.category?.name}</TableCell>
                                                    <TableCell className="text-[11px]">{item.unit?.abbreviation}</TableCell>
                                                    <TableCell className="text-right whitespace-nowrap">₱{Number(item.unit_cost).toFixed(2)}</TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="font-bold">{item.current_stock}</span>
                                                            {isOut ? (
                                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out of Stock</Badge>
                                                            ) : isLow ? (
                                                                <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 py-0 text-white">Low Stock</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-200 bg-emerald-50/50">Normal</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-muted-foreground leading-tight">{item.location}</TableCell>
                                                    <TableCell className="text-right whitespace-nowrap">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/inventory/items/${item.id}`} className="cursor-pointer">
                                                                        <Eye className="mr-2 h-4 w-4 text-sky-500" /> View Ledger Card
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <div className="mt-4">
                                    <SimplePagination links={items.links} />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </>
    );
}
