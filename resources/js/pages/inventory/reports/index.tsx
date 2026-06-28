import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Head, usePage, setLayoutProps } from '@inertiajs/react';
import { FileText, Printer, Eye, Clipboard, HelpCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

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
    
    // For Stock Ledger specific lookup
    const [itemsList, setItemsList] = useState<any[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string>('');

    // Fetch items list when Stock Ledger is selected
    useEffect(() => {
        if (selectedType === 'stock_ledger') {
            fetch('/inventory/items?format=json')
                .then(res => res.json())
                .then(data => {
                    // Quick fallback or mapping
                    // Since /inventory/items returns Inertia by default, we can make a direct fetch to the JSON endpoint
                    // Let's fallback to querying the items list or using a mock data if the listing is Inertia-only.
                })
                .catch(() => {});
        }
    }, [selectedType]);

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
                                <select 
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                    value={selectedType}
                                    onChange={e => {
                                        setSelectedType(e.target.value);
                                        setReportData([]);
                                    }}
                                >
                                    {reportTypes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
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
                            <p className="text-xs text-muted-foreground font-mono">Compiled on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                        </div>

                        <CardContent className="p-6">
                            
                            {/* Render Report 1: RPCI */}
                            {selectedType === 'rpci' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse border border-muted-foreground/30">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <th className="p-2 border border-muted-foreground/30">Item Code</th>
                                                <th className="p-2 border border-muted-foreground/30">Stock No.</th>
                                                <th className="p-2 border border-muted-foreground/30">Item Name</th>
                                                <th className="p-2 border border-muted-foreground/30">Category</th>
                                                <th className="p-2 border border-muted-foreground/30">UOM</th>
                                                <th className="p-2 border border-muted-foreground/30 text-right">Unit Cost</th>
                                                <th className="p-2 border border-muted-foreground/30 text-right">Quantity on Hand</th>
                                                <th className="p-2 border border-muted-foreground/30 text-right">Total Cost Balance</th>
                                                <th className="p-2 border border-muted-foreground/30">Location</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10 font-mono">
                                                    <td className="p-2 border border-muted-foreground/20">{row.item_code}</td>
                                                    <td className="p-2 border border-muted-foreground/20">{row.stock_number || 'N/A'}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans font-semibold">{row.name}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans">{row.category}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans">{row.unit}</td>
                                                    <td className="p-2 border border-muted-foreground/20 text-right">₱{parseFloat(row.unit_cost).toFixed(2)}</td>
                                                    <td className="p-2 border border-muted-foreground/20 text-right font-bold">{row.on_hand}</td>
                                                    <td className="p-2 border border-muted-foreground/20 text-right font-bold text-primary">₱{parseFloat(row.total_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans">{row.location}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Render Report 2: RPCPPE */}
                            {selectedType === 'rpcppe' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse border border-muted-foreground/30">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <th className="p-2 border border-muted-foreground/30">Property No.</th>
                                                <th className="p-2 border border-muted-foreground/30">Serial No.</th>
                                                <th className="p-2 border border-muted-foreground/30">Description</th>
                                                <th className="p-2 border border-muted-foreground/30">Category</th>
                                                <th className="p-2 border border-muted-foreground/30 text-right">Acquisition Cost</th>
                                                <th className="p-2 border border-muted-foreground/30">Officer Accountable</th>
                                                <th className="p-2 border border-muted-foreground/30">Date Acquired</th>
                                                <th className="p-2 border border-muted-foreground/30">Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10 font-mono">
                                                    <td className="p-2 border border-muted-foreground/20">{row.property_number}</td>
                                                    <td className="p-2 border border-muted-foreground/20">{row.serial_number || 'N/A'}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans font-semibold">{row.description}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans">{row.category}</td>
                                                    <td className="p-2 border border-muted-foreground/20 text-right font-bold">₱{parseFloat(row.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans">{row.accountable_officer}</td>
                                                    <td className="p-2 border border-muted-foreground/20">{row.date_acquired}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans">{row.condition}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Render Report 3: Stock Ledger */}
                            {selectedType === 'stock_ledger' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse border border-muted-foreground/30">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <th className="p-2 border border-muted-foreground/30">Date / Time</th>
                                                <th className="p-2 border border-muted-foreground/30">Transaction Type</th>
                                                <th className="p-2 border border-muted-foreground/30 text-right">Quantity</th>
                                                <th className="p-2 border border-muted-foreground/30 text-right">Transaction Unit Cost</th>
                                                <th className="p-2 border border-muted-foreground/30">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10 font-mono">
                                                    <td className="p-2 border border-muted-foreground/20">{row.date}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans font-semibold">{row.type}</td>
                                                    <td className="p-2 border border-muted-foreground/20 text-right font-bold">{row.qty > 0 ? `+${row.qty}` : row.qty}</td>
                                                    <td className="p-2 border border-muted-foreground/20 text-right">₱{parseFloat(row.cost).toFixed(2)}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans text-muted-foreground">{row.remarks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Render Report 4: Audit Trails */}
                            {selectedType === 'audit_trail' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px] border-collapse border border-muted-foreground/30">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-muted-foreground/30 font-bold">
                                                <th className="p-2 border border-muted-foreground/30">ID</th>
                                                <th className="p-2 border border-muted-foreground/30">Personnel</th>
                                                <th className="p-2 border border-muted-foreground/30">Role</th>
                                                <th className="p-2 border border-muted-foreground/30">Action Type</th>
                                                <th className="p-2 border border-muted-foreground/30">Resource Ref</th>
                                                <th className="p-2 border border-muted-foreground/30">IP Address</th>
                                                <th className="p-2 border border-muted-foreground/30">Date / Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10 font-mono">
                                                    <td className="p-2 border border-muted-foreground/20">{row.id}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans font-semibold">{row.operator}</td>
                                                    <td className="p-2 border border-muted-foreground/20 font-sans capitalize">{row.role}</td>
                                                    <td className="p-2 border border-muted-foreground/20 text-indigo-500 font-bold">{row.action}</td>
                                                    <td className="p-2 border border-muted-foreground/20">{row.target}</td>
                                                    <td className="p-2 border border-muted-foreground/20">{row.ip}</td>
                                                    <td className="p-2 border border-muted-foreground/20">{row.date}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
