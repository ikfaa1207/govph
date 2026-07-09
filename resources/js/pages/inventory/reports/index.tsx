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
                        <div className="p-8 border-b border-border bg-muted/25 text-center space-y-2 print:border-0 print:bg-transparent print:p-4">
                            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase print:text-black">Republic of the Philippines</h2>
                            <h3 className="text-base font-bold text-foreground print:text-black">COMMISSION ON AUDIT / SUPPLY PROPERTY UNIT</h3>
                            <h4 className="text-lg font-bold tracking-tight text-primary mt-4 underline print:text-black">
                                {reportTypes.find(r => r.id === selectedType)?.name}
                            </h4>
                            
                            {selectedType === 'rpci' && (
                                <div className="mt-8 text-left text-sm print:text-black max-w-5xl mx-auto space-y-6 font-serif hidden print:block">
                                    <div className="flex justify-between">
                                        <div className="flex gap-2 items-end"><span className="font-semibold whitespace-nowrap">Type of Inventory Item:</span> <span className="border-b border-black w-64 inline-block"></span></div>
                                        <div className="flex gap-2 items-end"><span className="font-semibold">Fund Cluster:</span> <span className="border-b border-black w-48 inline-block"></span></div>
                                    </div>
                                    <div className="flex gap-2 items-end"><span className="font-semibold">As of:</span> <span className="border-b border-black w-48 inline-block"></span></div>
                                    <div className="pt-2 leading-loose">
                                        For which <span className="border-b border-black inline-block w-64"></span>, <span className="border-b border-black inline-block w-48"></span>, <span className="border-b border-black inline-block w-64"></span> is accountable, having assumed such accountability on <span className="border-b border-black inline-block w-32"></span>.
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground font-mono print:hidden mt-4">Compiled on: {formatDateTime(new Date())} at {new Date().toLocaleTimeString()}</p>
                        </div>

                        <CardContent className="p-6">
                            
                            {/* Render Report 1: RPCI */}
                            {selectedType === 'rpci' && (
                                <div className="overflow-x-auto">
                                    <Table className="text-xs border-collapse border border-muted-foreground/30 print:border-black">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 border-b border-muted-foreground/30 print:border-black font-bold">
                                                <TableHead className="border border-muted-foreground/30 print:border-black print:text-black">Article</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black print:text-black">Description</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black print:text-black">Stock Number</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black print:text-black">Unit of Measure</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black text-right print:text-black">Unit Value</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black text-right print:text-black">Balance Per Card</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black text-right print:text-black">On Hand Per Count</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black text-center print:text-black" colSpan={2}>Shortage/Overage</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black print:text-black">Remarks</TableHead>
                                            </TableRow>
                                            <TableRow className="bg-muted/20 border-b border-muted-foreground/30 print:border-black hidden print:table-row">
                                                <TableHead className="border border-muted-foreground/30 print:border-black" colSpan={7}></TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black text-right print:text-black font-semibold text-[10px]">Quantity</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black text-right print:text-black font-semibold text-[10px]">Value</TableHead>
                                                <TableHead className="border border-muted-foreground/30 print:border-black"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border print:divide-black">
                                            {reportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 font-mono print:border-black">
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black">{row.category}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black font-sans font-semibold">
                                                        {row.name}
                                                        <div className="text-[10px] text-muted-foreground print:text-black/70">Code: {row.item_code}</div>
                                                    </TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black">{row.stock_number || 'N/A'}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black font-sans">{row.unit}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black text-right">{formatCurrency(row.unit_cost)}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black text-right print:bg-gray-100/50"></TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black text-right font-bold">{row.on_hand}</TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black text-right hidden print:table-cell"></TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black text-right hidden print:table-cell"></TableCell>
                                                    <TableCell className="border border-muted-foreground/20 print:border-black print:text-black font-sans">{row.location}</TableCell>
                                                </TableRow>
                                            ))}
                                            {reportData.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No data available for physical count.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    
                                    <div className="mt-16 hidden print:grid grid-cols-3 gap-12 text-sm font-serif print:text-black max-w-5xl mx-auto break-inside-avoid">
                                        <div className="flex flex-col">
                                            <span className="mb-12 font-semibold">Certified Correct by:</span>
                                            <div className="w-full border-b border-black"></div>
                                            <span className="mt-2 text-center text-xs">Signature over Printed Name</span>
                                            <span className="text-center font-bold text-xs uppercase mt-1">Inventory Committee Chairperson and Members</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="mb-12 font-semibold">Approved by:</span>
                                            <div className="w-full border-b border-black"></div>
                                            <span className="mt-2 text-center text-xs">Signature over Printed Name</span>
                                            <span className="text-center font-bold text-xs uppercase mt-1">Head of Agency or Authorized Representative</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="mb-12 font-semibold">Verified by:</span>
                                            <div className="w-full border-b border-black"></div>
                                            <span className="mt-2 text-center text-xs">Signature over Printed Name</span>
                                            <span className="text-center font-bold text-xs uppercase mt-1">COA Representative</span>
                                        </div>
                                    </div>
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
                                                    <TableCell className="border border-muted-foreground/20">{formatDateTime(row.date_acquired)}</TableCell>
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
                                                    <TableCell className="border border-muted-foreground/20">{formatDateTime(row.date)}</TableCell>
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
