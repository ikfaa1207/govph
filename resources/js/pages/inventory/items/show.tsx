import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
    id: number;
    transaction_type: string;
    quantity: number;
    unit_cost: number;
    reference: string;
    remarks: string;
    date: string;
}

interface ItemShowProps {
    item: {
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
    };
    transactions: Transaction[];
}

export default function ItemShow({ item, transactions }: ItemShowProps) {
    const breadcrumbs = [
        { title: 'Supplies Catalog', href: '/inventory/items' },
        { title: item.name, href: `/inventory/items/${item.id}` },
    ];
    setLayoutProps({ breadcrumbs });

    return (
        <>
            <Head title={`Ledger - ${item.name}`} />
            <div className="space-y-6 p-6">
                
                {/* Back button */}
                <div>
                    <Button size="sm" variant="ghost" className="gap-2" asChild>
                        <Link href="/inventory/items">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Catalog
                        </Link>
                    </Button>
                </div>

                {/* Details Section */}
                <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Item Details */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Badge className="uppercase">{item.category?.name}</Badge>
                                <span className="font-mono text-xs text-muted-foreground">Item Code: {item.item_code}</span>
                            </div>
                            <CardTitle className="text-xl mt-2">{item.name}</CardTitle>
                            <CardDescription>{item.description || 'No description provided.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
                            <div>
                                <span className="text-muted-foreground block text-xs">COA Stock Number</span>
                                <span className="font-semibold font-mono">{item.stock_number || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs">Unit of Measure</span>
                                <span className="font-semibold">{item.unit?.name} ({item.unit?.abbreviation})</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs">Moving Average Cost</span>
                                <span className="font-semibold text-primary">{formatCurrency(item.unit_cost)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs">Storage Location</span>
                                <span className="font-semibold">{item.location}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock status board */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Stock Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b border-border pb-2">
                                <span className="text-sm text-muted-foreground">Current Stock Balance:</span>
                                <span className="text-lg font-bold">{item.current_stock}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border pb-2">
                                <span className="text-sm text-muted-foreground">Reorder Level:</span>
                                <span className="text-sm font-semibold">{item.reorder_level}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <span className="capitalize">
                                    <Badge variant={item.status === 'active' ? 'default' : 'outline'}>
                                        {item.status}
                                    </Badge>
                                </span>
                            </div>

                            {item.current_stock <= item.reorder_level && (
                                <div className="mt-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex gap-2">
                                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Low stock notification!</strong> Reorder level reached. Please submit a Purchase Request (PR).
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Stock Card Ledger */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            Stock Card Ledger
                        </CardTitle>
                        <CardDescription>Historical receipts and issuances for compiling COA Reports.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date / Time</TableHead>
                                            <TableHead className="text-center">Type</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Unit Cost</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                                                No stock transactions recorded for this item.
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date / Time</TableHead>
                                            <TableHead className="text-center">Type</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Unit Cost</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                                                <TableCell className="text-center">
                                                    {tx.transaction_type === 'in' ? (
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium capitalize">
                                                            Stock In
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50/50 dark:bg-rose-500/10 font-medium capitalize">
                                                            Stock Out
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(tx.unit_cost)}</TableCell>
                                                <TableCell className="text-muted-foreground font-medium">{tx.reference}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={tx.remarks}>
                                                    {tx.remarks || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </>
    );
}
