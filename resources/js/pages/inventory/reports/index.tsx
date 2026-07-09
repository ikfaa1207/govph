import { Head, usePage, setLayoutProps } from '@inertiajs/react';
import { FileText, Printer, Eye, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { SmartSelect } from '@/components/ui/smart-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface ReportType {
    id: string;
    name: string;
}

interface ReportsIndexProps {
    reportTypes: ReportType[];
}

export default function ReportsIndex({ reportTypes }: ReportsIndexProps) {
    const { auth } = usePage<any>().props;
    const breadcrumbs = [{ title: 'COA Reports Centre', href: '/inventory/reports' }];
    setLayoutProps({ breadcrumbs });
    const [selectedType, setSelectedType] = useState<string>('rpci');
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    
    const [selectedItemId, setSelectedItemId] = useState<string>('');

    const handleGenerate = () => {
        setLoading(true);
        let url = `/inventory/reports/${selectedType}`;

        if (selectedType === 'stock_ledger') {
            if (!selectedItemId) {
                toast.error('Please select an item first.');
                setLoading(false);

                return;
            }

            url += `?item_id=${selectedItemId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setReportData(data);
                setLoading(false);
                toast.success('Report data compiled successfully.');
            })
            .catch(() => {
                setLoading(false);
                toast.error('Failed to compile report.');
            });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title="COA Reports Centre - GIMS" />
            <div className="space-y-6 p-6 print:p-0 print:m-0">
                
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">COA Reports & Auditing Centre</h1>
                        <p className="text-sm text-muted-foreground">Compile physical inventory counts, asset ledgers, and secure action trails.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={reportData.length === 0}>
                            <Printer className="h-4 w-4" />
                            Print Report
                        </Button>
                    </div>
                </div>

                {/* Configurations Card */}
                <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Report Parameters</CardTitle>
                        <CardDescription>Select standard government report layouts and query parameters.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3 items-end">
                            <div className="space-y-1">
                                <Label>Report Template</Label>
                                <SmartSelect 
                                    options={reportTypes.map(r => ({ value: String(r.id), label: r.name }))}
                                    value={selectedType}
                                    onValueChange={val => {
                                        setSelectedType(val);
                                        setReportData([]);
                                    }}
                                    placeholder="Select Report Type"
                                    className="w-full"
                                />
                            </div>

                            {selectedType === 'stock_ledger' && (
                                <div className="space-y-1">
                                    <Label>Item Stock Number / Code</Label>
                                    <input 
                                        type="number"
                                        placeholder="Enter Item ID"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                        value={selectedItemId}
                                        onChange={e => setSelectedItemId(e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <Button className="w-full gap-2" onClick={handleGenerate} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                    Compile Data
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Printable Report Output Area */}
                {reportData.length > 0 ? (
                    <Card className="border shadow-xs overflow-hidden print:border-0 print:shadow-none">
                        
                        {/* Report Heading Header (for print) */}
                        <div className="p-8 border-b border-border bg-muted/25 text-center space-y-2 print:border-0 print:bg-transparent">
                            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Republic of the Philippines</h2>
                            <h3 className="text-base font-bold text-foreground">COMMISSION ON AUDIT / SUPPLY PROPERTY UNIT</h3>
                            <h4 className="text-lg font-bold tracking-tight text-primary mt-4 underline">
                                {reportTypes.find(r => r.id === selectedType)?.name}
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono">Compiled on: {formatDateTime(new Date())} at {new Date().toLocaleTimeString()}</p>
                        </div>

                        <CardContent className="p-6">
                            
                            {/* Render Report 1: RPCI */}
                            {selectedType === 'rpci' && (
                                <div className="overflow-x-auto">
                                    <Table className="text-xs border-collapse border border-muted-foreground/30">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <TableHead className="border border-muted-foreground/30">Item Code</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Stock No.</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Item Name</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Category</TableHead>
                                                <TableHead className="border border-muted-foreground/30">UOM</TableHead>
                                                <TableHead className="border border-muted-foreground/30 text-right">Unit Cost</TableHead>
                                                <TableHead className="border border-muted-foreground/30 text-right">Quantity on Hand</TableHead>
                                                <TableHead className="border border-muted-foreground/30 text-right">Total Cost Balance</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Location</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 font-mono">
                                                    <TableCell className="border border-muted-foreground/20">{row.item_code}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20">{row.stock_number || 'N/A'}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans font-semibold">{row.name}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans">{row.category}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans">{row.unit}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 text-right">{formatCurrency(row.unit_cost)}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 text-right font-bold">{row.on_hand}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 text-right font-bold text-primary">{formatCurrency(row.total_cost)}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans">{row.location}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Render Report 2: RPCPPE */}
                            {selectedType === 'rpcppe' && (
                                <div className="overflow-x-auto">
                                    <Table className="text-xs border-collapse border border-muted-foreground/30">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <TableHead className="border border-muted-foreground/30">Property No.</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Serial No.</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Description</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Category</TableHead>
                                                <TableHead className="border border-muted-foreground/30 text-right">Acquisition Cost</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Officer Accountable</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Date Acquired</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Condition</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 font-mono">
                                                    <TableCell className="border border-muted-foreground/20">{row.property_number}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20">{row.serial_number || 'N/A'}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans font-semibold">{row.description}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans">{row.category}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 text-right font-bold">{formatCurrency(row.unit_cost)}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans">{row.accountable_officer}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20">{row.date_acquired}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans">{row.condition}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Render Report 3: Stock Ledger */}
                            {selectedType === 'stock_ledger' && (
                                <div className="overflow-x-auto">
                                    <Table className="text-xs border-collapse border border-muted-foreground/30">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <TableHead className="border border-muted-foreground/30">Date / Time</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Transaction Type</TableHead>
                                                <TableHead className="border border-muted-foreground/30 text-right">Quantity</TableHead>
                                                <TableHead className="border border-muted-foreground/30 text-right">Transaction Unit Cost</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 font-mono">
                                                    <TableCell className="border border-muted-foreground/20">{row.date}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans font-semibold">{row.type}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 text-right font-bold">{row.qty > 0 ? `+${row.qty}` : row.qty}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 text-right">{formatCurrency(row.cost)}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans text-muted-foreground">{row.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Render Report 4: Audit Trails */}
                            {selectedType === 'audit_trail' && (
                                <div className="overflow-x-auto">
                                    <Table className="text-[11px] border-collapse border border-muted-foreground/30">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <TableHead className="border border-muted-foreground/30">ID</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Personnel</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Role</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Action Type</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Resource Ref</TableHead>
                                                <TableHead className="border border-muted-foreground/30">IP Address</TableHead>
                                                <TableHead className="border border-muted-foreground/30">Recorded At</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 font-mono">
                                                    <TableCell className="border border-muted-foreground/20">{row.id}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans font-semibold">{row.user_name}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 font-sans text-muted-foreground">{row.user_role}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20">{row.action}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20">
                                                        {row.auditable_type.split('\\').pop()} #{row.auditable_id}
                                                    </TableCell>
                                                    <TableCell className="border border-muted-foreground/20">{row.ip_address}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20">{row.created_at}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Print Footers (Signatures section) */}
                            <div className="mt-12 grid grid-cols-2 text-center text-xs pt-12 print:mt-16 print:pt-16">
                                <div className="space-y-12">
                                    <p>Prepared by:</p>
                                    <div>
                                        <p className="font-bold underline uppercase">{auth.user.name}</p>
                                        <p className="text-[10px] text-muted-foreground">Supply / Property Custodian Representative</p>
                                    </div>
                                </div>
                                <div className="space-y-12">
                                    <p>Approved / Verified by:</p>
                                    <div>
                                        <p className="font-bold border-b border-foreground/30 inline-block w-48 h-5"></p>
                                        <p className="text-[10px] text-muted-foreground">COA Auditor / Authorized Signatory</p>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                ) : (
                    <Card className="text-center py-16 text-muted-foreground space-y-3 print:hidden">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground/75" />
                        <div>
                            <h3 className="text-base font-semibold">No Report Compiled</h3>
                            <p className="text-xs text-muted-foreground">Select a report template and click "Compile Data" to review government records.</p>
                        </div>
                    </Card>
                )}

            </div>
        </>
    );
}
