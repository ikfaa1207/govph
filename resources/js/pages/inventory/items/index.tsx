import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { PlusCircle, Search, FileSpreadsheet, Eye, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

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
    items: Item[];
    categories: any[];
    units: any[];
    locations: any[];
    filters: {
        search?: string;
        category_id?: string;
    };
}

export default function ItemsIndex({ items, categories, units, locations, filters }: ItemsIndexProps) {
    const breadcrumbs = [{ title: 'Supplies Catalog', href: '/inventory/items' }];
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchVal, setSearchVal] = useState(filters.search || '');

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Trigger Inertia search visit
        const queryParams = new URLSearchParams();
        if (searchVal) queryParams.set('search', searchVal);
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
        <AppLayout breadcrumbs={breadcrumbs}>
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
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Add Supply Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
                                            <select 
                                                id="category" 
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                value={data.category_id} 
                                                onChange={e => setData('category_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {errors.category_id && <p className="text-xs text-rose-500">{errors.category_id}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="unit">Unit of Measure *</Label>
                                            <select 
                                                id="unit" 
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                value={data.unit_id} 
                                                onChange={e => setData('unit_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Unit</option>
                                                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                                            </select>
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
                                        <select 
                                            id="location" 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                            value={data.location_id} 
                                            onChange={e => setData('location_id', e.target.value)}
                                        >
                                            <option value="">Select Location</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.warehouse.name} - {l.code}</option>)}
                                        </select>
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
                        {items.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground space-y-2">
                                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
                                <p>No supplies found. Register new items or adjust search query.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border pb-2 text-muted-foreground font-medium">
                                            <th className="py-2">Item Code</th>
                                            <th className="py-2">Stock No.</th>
                                            <th className="py-2">Item Name</th>
                                            <th className="py-2">Category</th>
                                            <th className="py-2">UOM</th>
                                            <th className="py-2">Unit Cost</th>
                                            <th className="py-2">Stock Balance</th>
                                            <th className="py-2">Location</th>
                                            <th className="py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item) => {
                                            const isLow = item.current_stock <= item.reorder_level;
                                            const isOut = item.current_stock === 0;

                                            return (
                                                <tr key={item.id} className="hover:bg-muted/50">
                                                    <td className="py-3 font-mono text-xs">{item.item_code}</td>
                                                    <td className="py-3 font-mono text-xs text-muted-foreground">{item.stock_number || 'N/A'}</td>
                                                    <td className="py-3">
                                                        <div className="font-semibold">{item.name}</div>
                                                        <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                                                    </td>
                                                    <td className="py-3 text-muted-foreground">{item.category?.name}</td>
                                                    <td className="py-3">{item.unit?.abbreviation}</td>
                                                    <td className="py-3">₱{item.unit_cost.toFixed(2)}</td>
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{item.current_stock}</span>
                                                            {isOut ? (
                                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out of Stock</Badge>
                                                            ) : isLow ? (
                                                                <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 py-0 text-white">Low Stock</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-200 bg-emerald-50/50">Normal</Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-xs text-muted-foreground">{item.location}</td>
                                                    <td className="py-3 text-right">
                                                        <Button size="sm" variant="outline" className="gap-1" asChild>
                                                            <Link href={`/inventory/items/${item.id}`}>
                                                                <Eye className="h-3 w-3" />
                                                                Ledger Card
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
