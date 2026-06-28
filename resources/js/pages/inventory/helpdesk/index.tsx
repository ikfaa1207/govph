import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Head, useForm, usePage } from '@inertiajs/react';
import { 
    HelpCircle, Phone, Mail, FileText, PlusCircle, CheckCircle2, 
    Clock, AlertTriangle, User, Calendar, MessageSquare, Shield,
    UserCheck, ChevronDown, Check, ArrowRight, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { store as helpdeskStore, update as helpdeskUpdate } from '@/routes/helpdesk';

// FAQ list
const faqs = [
    {
        q: "What are the password complexity requirements?",
        a: "Under DICT/NPC policies, passwords must contain at least 12 characters, including an uppercase letter, a lowercase letter, a number, and a special character. Additionally, you cannot reuse any of your last 5 passwords."
    },
    {
        q: "How often do passwords expire?",
        a: "Passwords automatically expire every 60 days. The system will alert you starting 7 days before your password is set to expire to prompt a secure update."
    },
    {
        q: "Why am I locked out of my account?",
        a: "Accounts are locked out for 30 minutes after 5 consecutive failed login attempts to protect against brute-force attacks. If you require immediate access, please contact your local system administrator to unlock it manually."
    },
    {
        q: "How do I set up Two-Factor Authentication (2FA)?",
        a: "Go to your Profile settings -> Security tab. Follow the prompt to scan the QR code with an authenticator app (such as Google Authenticator) and enter the 6-digit code to enable it."
    },
    {
        q: "What is an RIS slip and how is it processed?",
        a: "A Requisition and Issue Slip (RIS) is used to request inventory items. Once submitted, it must be approved by your Department Head and then processed by the Supply Office to release items."
    }
];

// Support contacts list
const contacts = [
    { name: "Juan Dela Cruz", role: "Lead Systems Administrator", email: "juan.dc@gov.ph", phone: "Local 111" },
    { name: "Maria Clara", role: "Supply & Property Custodian Representative", email: "m.clara@gov.ph", phone: "Local 109" },
    { name: "John Doe", role: "Helpdesk IT Support Desk", email: "j.doe@gov.ph", phone: "Local 104" }
];

interface Ticket {
    id: number;
    user_id: number;
    title: string;
    category: 'technical' | 'discrepancy' | 'request' | 'other';
    priority: 'low' | 'medium' | 'high';
    description: string;
    status: 'open' | 'in_progress' | 'resolved';
    admin_notes: string | null;
    attachment_path: string | null;
    attachment_url: string | null;
    created_at: string;
    user?: {
        name: string;
        email: string;
        employee?: {
            department?: {
                name: string;
            }
        }
    };
}

interface Props {
    tickets: Ticket[];
    isAdmin: boolean;
}

const isImage = (path: string | null) => {
    if (!path) return false;
    const ext = path.split('.').pop()?.toLowerCase();
    return ['jpeg', 'jpg', 'png', 'gif'].includes(ext || '');
};

export default function HelpdeskIndex({ tickets, isAdmin }: Props) {
    const { auth } = usePage<any>().props;
    const breadcrumbs = [{ title: 'System Helpdesk', href: '/inventory/helpdesk' }];
    const [activeTab, setActiveTab] = useState<'support' | 'tickets' | 'admin'>('support');
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Form for ticket creation
    const { 
        data: ticketData, 
        setData: setTicketData, 
        post: postTicket, 
        processing: submittingTicket, 
        errors: ticketErrors, 
        reset: resetTicketForm 
    } = useForm<{
        title: string;
        category: 'technical' | 'discrepancy' | 'request' | 'other';
        priority: 'low' | 'medium' | 'high';
        description: string;
        attachment: File | null;
    }>({
        title: '',
        category: 'technical',
        priority: 'medium',
        description: '',
        attachment: null,
    });

    // Form for admin ticket updates
    const { 
        data: adminData, 
        setData: setAdminData, 
        patch: patchTicket, 
        processing: updatingTicket, 
        errors: adminErrors 
    } = useForm({
        status: 'open',
        admin_notes: '',
    });

    const handleCreateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        postTicket(helpdeskStore.url(), {
            onSuccess: () => {
                resetTicketForm();
                toast.success('Your support ticket has been submitted successfully.');
            },
            onError: () => {
                toast.error('Please correct the validation errors below.');
            }
        });
    };

    const handleUpdateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;

        patchTicket(helpdeskUpdate.url(selectedTicket.id), {
            onSuccess: () => {
                setSelectedTicket(null);
                toast.success('Ticket updated successfully.');
            },
            onError: () => {
                toast.error('Unable to update the ticket.');
            }
        });
    };

    const selectTicketForEdit = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setAdminData({
            status: ticket.status,
            admin_notes: ticket.admin_notes || '',
        });
    };

    const getStatusBadge = (status: Ticket['status']) => {
        switch (status) {
            case 'resolved':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400 ring-1 ring-green-600/20 ring-inset"><CheckCircle2 className="size-3.5" /> Resolved</span>;
            case 'in_progress':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 ring-1 ring-amber-600/20 ring-inset"><Clock className="size-3.5" /> In Progress</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 ring-1 ring-blue-600/20 ring-inset"><AlertTriangle className="size-3.5" /> Open</span>;
        }
    };

    const getPriorityBadge = (priority: Ticket['priority']) => {
        switch (priority) {
            case 'high':
                return <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-red-600/10 ring-inset">High</span>;
            case 'medium':
                return <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-400 ring-1 ring-amber-600/10 ring-inset">Medium</span>;
            default:
                return <span className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-900/30 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-slate-600/10 ring-inset">Low</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Helpdesk" />

            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Summary */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">GIMS Support Centre</h1>
                    <p className="text-sm text-muted-foreground">Access system document guides, view support desks contacts, and submit technical/property registry reports.</p>
                </div>

                {/* Custom Tabs Navigation */}
                <div className="flex border-b border-border gap-2">
                    <button 
                        onClick={() => { setActiveTab('support'); setSelectedTicket(null); }}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] transition-all duration-150 ${activeTab === 'support' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Guides & Contacts
                    </button>
                    <button 
                        onClick={() => { setActiveTab('tickets'); setSelectedTicket(null); }}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] transition-all duration-150 ${activeTab === 'tickets' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        My Tickets ({isAdmin ? 'Self' : tickets.length})
                    </button>
                    {isAdmin && (
                        <button 
                            onClick={() => { setActiveTab('admin'); setSelectedTicket(null); }}
                            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] transition-all duration-150 ${activeTab === 'admin' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            Manage Tickets Registry ({tickets.length})
                        </button>
                    )}
                </div>

                {/* Content Panel */}
                <div className="grid gap-6">
                    {activeTab === 'support' && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* FAQ Section */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <HelpCircle className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Frequently Asked Questions
                                </h3>

                                <div className="space-y-3">
                                    {faqs.map((faq, index) => (
                                        <div key={index} className="border border-border bg-card rounded-lg overflow-hidden transition-all duration-200">
                                            <button 
                                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                                className="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-foreground hover:bg-muted/30 focus-visible:outline-hidden"
                                            >
                                                <span>{faq.q}</span>
                                                <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openFaq === index && (
                                                <div className="p-4 pt-0 text-xs text-muted-foreground border-t border-border/40 leading-relaxed bg-muted/10">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contacts Section */}
                            <div className="space-y-4">
                                <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <Phone className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Support Desks Directory
                                </h3>

                                <div className="grid gap-4">
                                    {contacts.map((contact, index) => (
                                        <Card key={index} className="border bg-card">
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-sm font-bold">{contact.name}</CardTitle>
                                                <CardDescription className="text-xs text-indigo-600 dark:text-indigo-400">{contact.role}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-1.5 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="size-3.5" />
                                                    <span>{contact.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="size-3.5" />
                                                    <span>{contact.phone}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tickets' && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Submit Ticket Form */}
                            <div className="space-y-4">
                                <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <PlusCircle className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    File a Support Request
                                </h3>

                                <Card className="border bg-card">
                                    <CardHeader className="p-5 pb-3">
                                        <CardTitle className="text-sm">Submit New Ticket</CardTitle>
                                        <CardDescription className="text-xs">Describe your technical problem or record discrepancy.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0">
                                        <form onSubmit={handleCreateTicket} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="title" className="text-xs">Ticket Subject</Label>
                                                <input 
                                                    id="title"
                                                    type="text"
                                                    required
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                    placeholder="Short summary of the issue"
                                                    value={ticketData.title}
                                                    onChange={e => setTicketData('title', e.target.value)}
                                                />
                                                <InputError message={ticketErrors.title} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="category" className="text-xs">Category</Label>
                                                    <select 
                                                        id="category"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                        value={ticketData.category}
                                                        onChange={e => setTicketData('category', e.target.value)}
                                                    >
                                                        <option value="technical">Technical</option>
                                                        <option value="discrepancy">Discrepancy</option>
                                                        <option value="request">Request</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                    <InputError message={ticketErrors.category} />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor="priority" className="text-xs">Priority</Label>
                                                    <select 
                                                        id="priority"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                        value={ticketData.priority}
                                                        onChange={e => setTicketData('priority', e.target.value)}
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                    </select>
                                                    <InputError message={ticketErrors.priority} />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="description" className="text-xs">Description</Label>
                                                <textarea 
                                                    id="description"
                                                    required
                                                    rows={4}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                    placeholder="Describe the issue in detail"
                                                    value={ticketData.description}
                                                    onChange={e => setTicketData('description', e.target.value)}
                                                />
                                                <InputError message={ticketErrors.description} />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="attachment" className="text-xs">File Attachment (Optional, max 5MB)</Label>
                                                <input 
                                                    id="attachment"
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-hidden file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-neutral-800 dark:file:text-indigo-400"
                                                    onChange={e => setTicketData('attachment', e.target.files ? e.target.files[0] : null)}
                                                />
                                                <InputError message={ticketErrors.attachment} />
                                            </div>

                                            <Button type="submit" className="w-full" disabled={submittingTicket}>
                                                {submittingTicket ? <Loader2 className="size-4 animate-spin mr-2" /> : <PlusCircle className="size-4 mr-2" />}
                                                Submit Ticket
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* My Tickets List */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Your Filed Tickets
                                </h3>

                                <div className="space-y-4">
                                    {tickets.filter(t => !isAdmin || t.user_id === auth.user.id).length === 0 ? (
                                        <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground text-xs">
                                            No support tickets submitted yet.
                                        </div>
                                    ) : (
                                        tickets
                                            .filter(t => !isAdmin || t.user_id === auth.user.id)
                                            .map(ticket => (
                                                <Card key={ticket.id} className="border bg-card">
                                                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <CardTitle className="text-sm font-bold">{ticket.title}</CardTitle>
                                                                {getPriorityBadge(ticket.priority)}
                                                            </div>
                                                            <CardDescription className="text-xs flex items-center gap-1.5">
                                                                <span>ID: #{ticket.id}</span>
                                                                <span>•</span>
                                                                <span className="capitalize">{ticket.category}</span>
                                                                <span>•</span>
                                                                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                            </CardDescription>
                                                        </div>
                                                        <div>
                                                            {getStatusBadge(ticket.status)}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-4 pt-2 space-y-3 text-xs leading-relaxed text-foreground">
                                                        <p className="whitespace-pre-wrap">{ticket.description}</p>
                                                        
                                                        {ticket.attachment_url && (
                                                            <div className="mt-3">
                                                                <p className="font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Attachment:</p>
                                                                {isImage(ticket.attachment_path) ? (
                                                                    <div className="relative group max-w-xs overflow-hidden rounded-lg border border-border bg-neutral-100 dark:bg-neutral-900">
                                                                        <img 
                                                                            src={ticket.attachment_url} 
                                                                            alt="Attachment Preview" 
                                                                            className="object-cover max-h-48 w-full cursor-zoom-in transition-transform duration-200 group-hover:scale-105"
                                                                            onClick={() => setZoomedImage(ticket.attachment_url)}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <a 
                                                                        href={ticket.attachment_url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-2 rounded-md bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                                                    >
                                                                        <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                                                                        <span>View / Download PDF Document</span>
                                                                        <ArrowRight className="size-3 text-muted-foreground" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                        {ticket.admin_notes && (
                                                            <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 p-3 mt-2">
                                                                <p className="font-semibold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
                                                                    <MessageSquare className="size-3.5" />
                                                                    Resolution Notes from IT / Admin:
                                                                </p>
                                                                <p className="text-muted-foreground leading-normal">{ticket.admin_notes}</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin' && isAdmin && (
                        <div className="grid gap-6 lg:grid-cols-3 items-start">
                            {/* Tickets Data List */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <Shield className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Manage Support Queue
                                </h3>

                                <div className="space-y-4">
                                    {tickets.length === 0 ? (
                                        <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground text-xs">
                                            No support tickets submitted in GIMS.
                                        </div>
                                    ) : (
                                        tickets.map(ticket => (
                                            <Card 
                                                key={ticket.id} 
                                                className={`border cursor-pointer transition-all duration-150 ${selectedTicket?.id === ticket.id ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 bg-indigo-50/5 dark:bg-indigo-950/5' : 'bg-card hover:bg-muted/10'}`}
                                                onClick={() => selectTicketForEdit(ticket)}
                                            >
                                                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <CardTitle className="text-sm font-bold">{ticket.title}</CardTitle>
                                                            {getPriorityBadge(ticket.priority)}
                                                        </div>
                                                        <CardDescription className="text-xs flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-semibold text-foreground">{ticket.user?.name}</span>
                                                            {ticket.user?.employee?.department?.name && (
                                                                <span>({ticket.user.employee.department.name})</span>
                                                            )}
                                                            <span>•</span>
                                                            <span>Category: <span className="capitalize font-medium">{ticket.category}</span></span>
                                                            <span>•</span>
                                                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                        </CardDescription>
                                                    </div>
                                                    <div>
                                                        {getStatusBadge(ticket.status)}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-2 text-xs leading-relaxed text-muted-foreground">
                                                    <p className="line-clamp-2">{ticket.description}</p>
                                                    {ticket.admin_notes && (
                                                        <div className="text-[11px] text-green-600 dark:text-green-400 font-medium mt-1 flex items-center gap-1">
                                                            <Check className="size-3.5" /> Notes attached
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Resolution Details Form */}
                            <div className="space-y-4 sticky top-6">
                                <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <UserCheck className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Ticket Action Panel
                                </h3>

                                {selectedTicket ? (
                                    <Card className="border bg-card">
                                        <CardHeader className="p-5 pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">Modify Ticket #{selectedTicket.id}</CardTitle>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="h-7 text-xs text-muted-foreground"
                                                    onClick={() => setSelectedTicket(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                            <CardDescription className="text-xs">Assign a resolution status and add internal/public notes.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-0">
                                            <form onSubmit={handleUpdateTicket} className="space-y-4">
                                                <div className="space-y-1 mt-1 text-xs">
                                                    <p className="font-bold text-foreground">Subject: <span className="font-normal text-muted-foreground">{selectedTicket.title}</span></p>
                                                    <p className="font-bold text-foreground">Submitted by: <span className="font-normal text-muted-foreground">{selectedTicket.user?.name} ({selectedTicket.user?.email})</span></p>
                                                </div>

                                                {selectedTicket.attachment_url && (
                                                    <div className="mt-3 text-xs">
                                                        <p className="font-bold text-foreground mb-1">Attachment:</p>
                                                        {isImage(selectedTicket.attachment_path) ? (
                                                            <div className="relative group max-w-full overflow-hidden rounded-lg border border-border bg-neutral-100 dark:bg-neutral-900">
                                                                <img 
                                                                    src={selectedTicket.attachment_url} 
                                                                    alt="Attachment Preview" 
                                                                    className="object-cover max-h-32 w-full cursor-zoom-in transition-transform duration-200 group-hover:scale-105"
                                                                    onClick={() => setZoomedImage(selectedTicket.attachment_url)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <a 
                                                                href={selectedTicket.attachment_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-between w-full rounded-md bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                                                                    <span>View / Download PDF</span>
                                                                </span>
                                                                <ArrowRight className="size-3 text-muted-foreground" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="border-t border-border/40 my-3"></div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor="admin-status" className="text-xs">Resolution Status</Label>
                                                    <select 
                                                        id="admin-status"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                        value={adminData.status}
                                                        onChange={e => setAdminData('status', e.target.value)}
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                    </select>
                                                    <InputError message={adminErrors.status} />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor="admin-notes" className="text-xs">Internal / Resolution Notes</Label>
                                                    <textarea 
                                                        id="admin-notes"
                                                        rows={5}
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                        placeholder="Provide help desk response or resolution steps..."
                                                        value={adminData.admin_notes}
                                                        onChange={e => setAdminData('admin_notes', e.target.value)}
                                                    />
                                                    <InputError message={adminErrors.admin_notes} />
                                                </div>

                                                <Button type="submit" className="w-full" disabled={updatingTicket}>
                                                    {updatingTicket ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
                                                    Update Ticket Status
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="text-center py-12 border border-dashed rounded-lg bg-card text-muted-foreground text-xs p-6">
                                        Select a support ticket from the list to review details and perform updates.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {zoomedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 transition-opacity duration-300 animate-in fade-in"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-h-full max-w-5xl overflow-hidden rounded-lg bg-black p-1 shadow-2xl">
                        <img 
                            src={zoomedImage} 
                            alt="Attachment Fullscreen" 
                            className="max-h-[85vh] max-w-full object-contain rounded" 
                        />
                        <button 
                            className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black transition-colors focus:outline-hidden"
                            onClick={() => setZoomedImage(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
