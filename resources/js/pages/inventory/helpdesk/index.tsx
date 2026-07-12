import {
    Head,
    useForm,
    usePage,
    setLayoutProps,
    InfiniteScroll,
} from '@inertiajs/react';
import {
    HelpCircle,
    Phone,
    Mail,
    FileText,
    PlusCircle,
    CheckCircle2,
    Clock,
    AlertTriangle,
    MessageSquare,
    Shield,
    UserCheck,
    ChevronDown,
    Check,
    ArrowRight,
    Loader2,
    Paperclip,
    X,
    Inbox,
    FileX,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

import {
    store as helpdeskStore,
    update as helpdeskUpdate,
} from '@/routes/helpdesk';

// FAQ list
const faqs = [
    {
        q: 'What are the password complexity requirements?',
        a: 'Under DICT/NPC policies, passwords must contain at least 12 characters, including an uppercase letter, a lowercase letter, a number, and a special character. Additionally, you cannot reuse any of your last 5 passwords.',
    },
    {
        q: 'How often do passwords expire?',
        a: 'Passwords automatically expire every 60 days. The system will alert you starting 7 days before your password is set to expire to prompt a secure update.',
    },
    {
        q: 'Why am I locked out of my account?',
        a: 'Accounts are locked out for 30 minutes after 5 consecutive failed login attempts to protect against brute-force attacks. If you require immediate access, please contact your local system administrator to unlock it manually.',
    },
    {
        q: 'How do I set up Two-Factor Authentication (2FA)?',
        a: 'Go to your Profile settings -> Security tab. Follow the prompt to scan the QR code with an authenticator app (such as Google Authenticator) and enter the 6-digit code to enable it.',
    },
    {
        q: 'What is an RIS slip and how is it processed?',
        a: 'A Requisition and Issue Slip (RIS) is used to request inventory items. Once submitted, it must be approved by your Department Head and then processed by the Supply Office to release items.',
    },
];

// Support contacts list
const contacts = [
    {
        name: 'Juan Dela Cruz',
        role: 'Lead Systems Administrator',
        email: 'juan.dc@gov.ph',
        phone: 'Local 111',
    },
    {
        name: 'Maria Clara',
        role: 'Supply & Property Custodian Representative',
        email: 'm.clara@gov.ph',
        phone: 'Local 109',
    },
    {
        name: 'John Doe',
        role: 'Helpdesk IT Support Desk',
        email: 'j.doe@gov.ph',
        phone: 'Local 104',
    },
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
            };
        };
    };
}

interface Props {
    tickets: {
        data: Ticket[];
        meta?: {
            total: number;
        };
    };
    isAdmin: boolean;
}

const isImage = (path: string | null) => {
    if (!path) {
        return false;
    }

    const ext = path.split('.').pop()?.toLowerCase();

    return ['jpeg', 'jpg', 'png', 'gif'].includes(ext || '');
};

const getTicketAge = (createdAt: string): string => {
    if (!createdAt) {
        return '';
    }

    try {
        const created = new Date(createdAt);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();

        if (diffMs < 0) {
            return 'just now';
        }

        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) {
            return `${diffMins}m`;
        }

        const diffHours = Math.floor(diffMins / 60);

        if (diffHours < 24) {
            return `${diffHours}h`;
        }

        const diffDays = Math.floor(diffHours / 24);

        return `${diffDays}d`;
    } catch {
        return '';
    }
};

const getInitials = (name: string): string => {
    if (!name) {
        return 'YO';
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 0) {
        return 'YO';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function HelpdeskIndex({ tickets, isAdmin }: Props) {
    const { auth } = usePage<any>().props;
    const breadcrumbs = [
        { title: 'System Helpdesk', href: '/inventory/helpdesk' },
    ];
    setLayoutProps({ breadcrumbs });
    const [activeTab, setActiveTab] = useState<'support' | 'tickets' | 'admin'>(
        'support',
    );
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [scrollKey, setScrollKey] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Form for ticket creation
    const {
        data: ticketData,
        setData: setTicketData,
        post: postTicket,
        processing: submittingTicket,
        errors: ticketErrors,
        reset: resetTicketForm,
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
        errors: adminErrors,
    } = useForm({
        status: 'open',
        admin_notes: '',
    });

    const handleCreateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        postTicket(helpdeskStore.url(), {
            onSuccess: () => {
                resetTicketForm();
                toast.success(
                    'Your support ticket has been submitted successfully.',
                );
            },
            onError: () => {
                toast.error('Please correct the validation errors below.');
            },
        });
    };

    const handleUpdateTicket = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTicket) {
            return;
        }

        patchTicket(helpdeskUpdate.url(selectedTicket.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSelectedTicket(null);
                setScrollKey((prev) => prev + 1);
                toast.success('Ticket updated successfully.');
            },
            onError: () => {
                toast.error('Unable to update the ticket.');
            },
        });
    };

    const selectTicketForEdit = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setAdminData({
            status: ticket.status,
            admin_notes: ticket.admin_notes || '',
        });
    };

    const renderActionPanel = () => {
        if (!selectedTicket) {
            return (
                <div className="rounded-lg border border-dashed bg-card p-6 py-12 text-center text-xs text-muted-foreground">
                    Select a support ticket from the list to review details and perform updates.
                </div>
            );
        }

        return (
            <Card className="border bg-card">
                <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                            Modify Ticket #{selectedTicket.id}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => setSelectedTicket(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                    <CardDescription className="text-xs">
                        Assign a resolution status and add internal/public notes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                    <form onSubmit={handleUpdateTicket} className="space-y-4">
                        <div className="mt-1 space-y-1 text-xs">
                            <p className="font-bold text-foreground">
                                Subject:{' '}
                                <span className="font-normal text-muted-foreground">
                                    {selectedTicket.title}
                                </span>
                            </p>
                            <p className="font-bold text-foreground">
                                Submitted by:{' '}
                                <span className="font-normal text-muted-foreground">
                                    {selectedTicket.user?.name} ({selectedTicket.user?.email})
                                </span>
                            </p>
                        </div>

                        {selectedTicket.attachment_url && (
                            <div className="mt-3 text-xs">
                                <p className="mb-1 font-bold text-foreground">
                                    Attachment:
                                </p>
                                {isImage(selectedTicket.attachment_path) ? (
                                    <div className="group relative max-w-full overflow-hidden rounded-lg border border-border bg-neutral-100 dark:bg-neutral-900">
                                        <img
                                            src={selectedTicket.attachment_url}
                                            alt="Attachment Preview"
                                            className="max-h-32 w-full cursor-zoom-in object-cover transition-transform duration-200 group-hover:scale-105"
                                            onClick={() => setZoomedImage(selectedTicket.attachment_url)}
                                        />
                                    </div>
                                ) : (
                                    <a
                                        href={selectedTicket.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-full items-center justify-between rounded-md bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                                            <span>View / Download PDF Document</span>
                                        </span>
                                        <ArrowRight className="size-3 text-muted-foreground" />
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="my-3 border-t border-border/40"></div>

                        <div className="space-y-1.5">
                            <Label htmlFor="admin-status" className="text-xs">
                                Resolution Status
                            </Label>
                            <Select
                                value={adminData.status}
                                onValueChange={(val) => setAdminData('status', val)}
                            >
                                <SelectTrigger id="admin-status" className="w-full">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={adminErrors.status} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="admin-notes" className="text-xs">
                                Internal / Resolution Notes
                            </Label>
                            <textarea
                                id="admin-notes"
                                rows={5}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                placeholder="Provide help desk response or resolution steps..."
                                value={adminData.admin_notes}
                                onChange={(e) => setAdminData('admin_notes', e.target.value)}
                            />
                            <InputError message={adminErrors.admin_notes} />
                        </div>

                        <Button type="submit" className="w-full" disabled={updatingTicket}>
                            {updatingTicket ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 size-4" />
                            )}
                            Update Ticket Status
                        </Button>
                    </form>
                </CardContent>
            </Card>
        );
    };

    const getStatusBadge = (status: Ticket['status']) => {
        switch (status) {
            case 'resolved':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-600/20 ring-inset dark:bg-green-950/30 dark:text-green-400">
                        <CheckCircle2 className="size-3.5" /> Resolved
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-950/30 dark:text-amber-400">
                        <Clock className="size-3.5" /> In Progress
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20 ring-inset dark:bg-blue-950/30 dark:text-blue-400">
                        <AlertTriangle className="size-3.5" /> Open
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="System Helpdesk" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
                {/* Header Summary */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        GIMS Support Centre
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Access system document guides, view support desks
                        contacts, and submit technical/property registry
                        reports.
                    </p>
                </div>

                {/* Custom Tabs Navigation */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => {
                            setActiveTab('support');
                            setSelectedTicket(null);
                        }}
                        className={`-mb-[2px] border-b-2 px-4 py-2 text-sm font-semibold transition-all duration-150 ${activeTab === 'support' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Guides & Contacts
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('tickets');
                            setSelectedTicket(null);
                        }}
                        className={`-mb-[2px] border-b-2 px-4 py-2 text-sm font-semibold transition-all duration-150 ${activeTab === 'tickets' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        My Tickets (
                        {isAdmin
                            ? 'Self'
                            : (tickets.meta?.total ?? tickets.data.length)}
                        )
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setActiveTab('admin');
                                setSelectedTicket(null);
                            }}
                            className={`-mb-[2px] border-b-2 px-4 py-2 text-sm font-semibold transition-all duration-150 ${activeTab === 'admin' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            Manage Tickets Registry (
                            {tickets.meta?.total ?? tickets.data.length})
                        </button>
                    )}
                </div>

                {/* Content Panel */}
                <div className="grid gap-6">
                    {activeTab === 'support' && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* FAQ Section */}
                            <div className="space-y-4 lg:col-span-2">
                                <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    <HelpCircle className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Frequently Asked Questions
                                </h3>

                                <div className="space-y-3">
                                    {faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-200"
                                        >
                                            <button
                                                onClick={() =>
                                                    setOpenFaq(
                                                        openFaq === index
                                                            ? null
                                                            : index,
                                                    )
                                                }
                                                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-foreground hover:bg-muted/30 focus-visible:outline-hidden"
                                            >
                                                <span>{faq.q}</span>
                                                <ChevronDown
                                                    className={`size-4 text-muted-foreground transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            {openFaq === index && (
                                                <div className="border-t border-border/40 bg-muted/10 p-4 pt-0 text-xs leading-relaxed text-muted-foreground">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contacts Section */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    <Phone className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Support Desks Directory
                                </h3>

                                <div className="grid gap-4">
                                    {contacts.map((contact, index) => (
                                        <Card
                                            key={index}
                                            className="border bg-card"
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-sm font-bold">
                                                    {contact.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    {contact.role}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-1.5 p-4 pt-0 text-xs text-muted-foreground">
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
                        <div className="grid items-start gap-6 lg:grid-cols-3">
                            {/* Submit Ticket Form */}
                            <div className="sticky top-6 space-y-4">
                                <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    <PlusCircle className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    File a Support Request
                                </h3>

                                <Card className="border bg-card">
                                    <CardHeader className="p-5 pb-3">
                                        <CardTitle className="text-sm">
                                            Submit New Ticket
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Describe your technical problem or
                                            record discrepancy.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0">
                                        <form
                                            onSubmit={handleCreateTicket}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="title"
                                                    className="text-xs"
                                                >
                                                    Ticket Subject
                                                </Label>
                                                <input
                                                    id="title"
                                                    type="text"
                                                    required
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                    placeholder="Short summary of the issue"
                                                    value={ticketData.title}
                                                    onChange={(e) =>
                                                        setTicketData(
                                                            'title',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={ticketErrors.title}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="category"
                                                        className="text-xs"
                                                    >
                                                        Category
                                                    </Label>
                                                    <Select
                                                        value={
                                                            ticketData.category
                                                        }
                                                        onValueChange={(
                                                            val: any,
                                                        ) =>
                                                            setTicketData(
                                                                'category',
                                                                val,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id="category"
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Select Category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="technical">
                                                                Technical
                                                            </SelectItem>
                                                            <SelectItem value="discrepancy">
                                                                Discrepancy
                                                            </SelectItem>
                                                            <SelectItem value="request">
                                                                Request
                                                            </SelectItem>
                                                            <SelectItem value="other">
                                                                Other
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            ticketErrors.category
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="priority"
                                                        className="text-xs"
                                                    >
                                                        Priority
                                                    </Label>
                                                    <Select
                                                        value={
                                                            ticketData.priority
                                                        }
                                                        onValueChange={(
                                                            val: any,
                                                        ) =>
                                                            setTicketData(
                                                                'priority',
                                                                val,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id="priority"
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Select Priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">
                                                                Low
                                                            </SelectItem>
                                                            <SelectItem value="medium">
                                                                Medium
                                                            </SelectItem>
                                                            <SelectItem value="high">
                                                                High
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            ticketErrors.priority
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="description"
                                                    className="text-xs"
                                                >
                                                    Description
                                                </Label>
                                                <textarea
                                                    id="description"
                                                    required
                                                    rows={4}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                    placeholder="Describe the issue in detail"
                                                    value={
                                                        ticketData.description
                                                    }
                                                    onChange={(e) =>
                                                        setTicketData(
                                                            'description',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        ticketErrors.description
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="attachment"
                                                    className="text-xs"
                                                >
                                                    File Attachment (Optional,
                                                    max 5MB)
                                                </Label>
                                                <div className="flex flex-col gap-2">
                                                    {!ticketData.attachment ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-10 w-full border-dashed bg-muted/20 transition-colors hover:bg-muted/50"
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        'attachment',
                                                                    )
                                                                    ?.click()
                                                            }
                                                        >
                                                            <Paperclip className="mr-2 h-4 w-4" />
                                                            Choose File...
                                                        </Button>
                                                    ) : (
                                                        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5 text-xs">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <FileText className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                                                <span className="max-w-[200px] truncate font-medium text-foreground">
                                                                    {
                                                                        ticketData
                                                                            .attachment
                                                                            .name
                                                                    }
                                                                </span>
                                                                <span className="shrink-0 text-muted-foreground">
                                                                    (
                                                                    {(
                                                                        ticketData
                                                                            .attachment
                                                                            .size /
                                                                        1024 /
                                                                        1024
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{' '}
                                                                    MB)
                                                                </span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="ml-2 h-6 w-6 shrink-0 p-0 hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() =>
                                                                    setTicketData(
                                                                        'attachment',
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <input
                                                        id="attachment"
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        className="hidden"
                                                        onChange={(e) =>
                                                            setTicketData(
                                                                'attachment',
                                                                e.target.files
                                                                    ? e.target
                                                                          .files[0]
                                                                    : null,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <InputError
                                                    message={
                                                        ticketErrors.attachment
                                                    }
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={submittingTicket}
                                            >
                                                {submittingTicket ? (
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                ) : (
                                                    <PlusCircle className="mr-2 size-4" />
                                                )}
                                                Submit Ticket
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* My Tickets List */}
                            <div className="space-y-4 lg:col-span-2">
                                <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Your Filed Tickets
                                </h3>

                                <div className="space-y-4">
                                    {tickets.data.filter(
                                        (t) =>
                                            !isAdmin ||
                                            t.user_id === auth.user.id,
                                    ).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed bg-card/50 p-6">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <Inbox className="h-6 w-6" />
                                            </div>
                                            <h3 className="mt-4 text-sm font-semibold">No support tickets</h3>
                                            <p className="mt-2 text-xs text-muted-foreground max-w-sm">
                                                You have not submitted any helpdesk support requests yet.
                                            </p>
                                        </div>
                                    ) : (
                                        <InfiniteScroll
                                            key={scrollKey}
                                            data="tickets"
                                            className="space-y-4"
                                        >
                                            {tickets.data
                                                .filter(
                                                    (t) =>
                                                        !isAdmin ||
                                                        t.user_id ===
                                                            auth.user.id,
                                                )
                                                .map((ticket) => (
                                                    <div
                                                        key={ticket.id}
                                                        className="vintage-ticket"
                                                    >
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="vintage-ticket-id">
                                                                ID: #{ticket.id}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`vintage-priority-tag ${
                                                                        ticket.priority ===
                                                                        'high'
                                                                            ? 'vintage-priority-critical'
                                                                            : ticket.priority ===
                                                                                'medium'
                                                                              ? 'vintage-priority-high'
                                                                              : 'vintage-priority-low'
                                                                    }`}
                                                                >
                                                                    {
                                                                        ticket.priority
                                                                    }
                                                                </span>
                                                                {getStatusBadge(
                                                                    ticket.status,
                                                                )}
                                                            </div>
                                                        </div>

                                                        <h3 className="vintage-ticket-title mb-2">
                                                            {ticket.title}
                                                        </h3>

                                                        <div className="mt-3 rounded-sm border border-[var(--ticket-line)]/50 bg-[var(--ticket-paper-deep)] p-3 text-xs leading-relaxed text-[var(--ticket-ink-soft)]">
                                                            <p className="whitespace-pre-wrap">
                                                                {
                                                                    ticket.description
                                                                }
                                                            </p>

                                                            {ticket.attachment_url && (
                                                                <div className="mt-3">
                                                                    <p className="mb-1 font-semibold text-[var(--ticket-ink)]">
                                                                        Attachment:
                                                                    </p>
                                                                    {isImage(
                                                                        ticket.attachment_path,
                                                                    ) ? (
                                                                        <div className="group relative max-w-xs overflow-hidden rounded-md border border-[var(--ticket-line)] bg-background">
                                                                            <img
                                                                                src={
                                                                                    ticket.attachment_url
                                                                                }
                                                                                alt="Attachment Preview"
                                                                                className="max-h-48 w-full cursor-zoom-in object-cover transition-transform duration-200 group-hover:scale-105"
                                                                                onClick={() =>
                                                                                    setZoomedImage(
                                                                                        ticket.attachment_url,
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <a
                                                                            href={
                                                                                ticket.attachment_url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-2 rounded-md border border-[var(--ticket-line)] bg-[var(--ticket-paper)] px-3 py-2 text-xs font-semibold text-[var(--ticket-ink)] transition-colors hover:bg-[var(--ticket-paper-deep)]"
                                                                        >
                                                                            <FileText className="size-4 text-[var(--ticket-ink)]" />
                                                                            <span>
                                                                                View
                                                                                /
                                                                                Download
                                                                                PDF
                                                                                Document
                                                                            </span>
                                                                            <ArrowRight className="size-3 text-[var(--ticket-steel-light)]" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {ticket.admin_notes && (
                                                                <div className="mt-3 rounded-md border border-[var(--ticket-line)] bg-[var(--ticket-paper)] p-3">
                                                                    <p className="mb-1 flex items-center gap-1.5 font-semibold text-[var(--ticket-ink)]">
                                                                        <MessageSquare className="size-3.5" />
                                                                        Resolution
                                                                        Notes
                                                                        from IT
                                                                        / Admin:
                                                                    </p>
                                                                    <p className="leading-normal text-[var(--ticket-ink-soft)]">
                                                                        {
                                                                            ticket.admin_notes
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[var(--ticket-line)] pt-2">
                                                            <div className="vintage-ticket-requester">
                                                                <span className="vintage-ticket-avatar">
                                                                    {getInitials(
                                                                        ticket
                                                                            .user
                                                                            ?.name ||
                                                                            auth
                                                                                .user
                                                                                .name,
                                                                    )}
                                                                </span>
                                                                <span className="max-w-[150px] truncate">
                                                                    {ticket.user
                                                                        ?.name ||
                                                                        auth
                                                                            .user
                                                                            .name}
                                                                </span>
                                                            </div>
                                                            <span className="vintage-ticket-category capitalize">
                                                                {
                                                                    ticket.category
                                                                }
                                                            </span>
                                                            <span className="vintage-ticket-age">
                                                                {getTicketAge(
                                                                    ticket.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                        </InfiniteScroll>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin' && isAdmin && (
                        <div className="grid items-start gap-6 lg:grid-cols-3">
                            {/* Tickets Data List */}
                            <div className="space-y-4 lg:col-span-2">
                                <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    <Shield className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Manage Support Queue
                                </h3>

                                <div className="space-y-4">
                                    {tickets.data.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed bg-card/50 p-6">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <FileX className="h-6 w-6" />
                                            </div>
                                            <h3 className="mt-4 text-sm font-semibold">Queue is clear</h3>
                                            <p className="mt-2 text-xs text-muted-foreground max-w-sm">
                                                No support tickets have been filed in the GIMS registry.
                                            </p>
                                        </div>
                                    ) : (
                                        <InfiniteScroll
                                            key={scrollKey}
                                            data="tickets"
                                            className="space-y-4"
                                        >
                                            {tickets.data.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className={`vintage-ticket cursor-pointer transition-all duration-150 ${
                                                        selectedTicket?.id ===
                                                        ticket.id
                                                            ? 'bg-[var(--ticket-paper-deep)] ring-2 ring-indigo-600 dark:ring-indigo-400'
                                                            : 'hover:bg-[var(--ticket-paper-deep)]/50'
                                                    }`}
                                                    onClick={() =>
                                                        selectTicketForEdit(
                                                            ticket,
                                                        )
                                                    }
                                                >
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="vintage-ticket-id">
                                                            ID: #{ticket.id}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`vintage-priority-tag ${
                                                                    ticket.priority ===
                                                                    'high'
                                                                        ? 'vintage-priority-critical'
                                                                        : ticket.priority ===
                                                                            'medium'
                                                                          ? 'vintage-priority-high'
                                                                          : 'vintage-priority-low'
                                                                }`}
                                                            >
                                                                {
                                                                    ticket.priority
                                                                }
                                                            </span>
                                                            {getStatusBadge(
                                                                ticket.status,
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="vintage-ticket-title mb-2">
                                                        {ticket.title}
                                                    </h3>

                                                    <div className="mt-3 rounded-sm border border-[var(--ticket-line)]/50 bg-[var(--ticket-paper-deep)] p-3 text-xs leading-relaxed text-[var(--ticket-ink-soft)]">
                                                        <p className="line-clamp-2">
                                                            {ticket.description}
                                                        </p>
                                                        {ticket.admin_notes && (
                                                            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                                                                <Check className="size-3.5" />{' '}
                                                                Notes attached
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between border-t border-dashed border-[var(--ticket-line)] pt-2">
                                                        <div className="vintage-ticket-requester">
                                                            <span className="vintage-ticket-avatar">
                                                                {getInitials(
                                                                    ticket.user
                                                                        ?.name ||
                                                                        '',
                                                                )}
                                                            </span>
                                                            <span className="max-w-[120px] truncate">
                                                                {ticket.user
                                                                    ?.name ||
                                                                    'Unknown'}
                                                            </span>
                                                            {ticket.user
                                                                ?.employee
                                                                ?.department
                                                                ?.name && (
                                                                <span className="max-w-[80px] truncate text-[10px] text-[var(--ticket-steel-light)]">
                                                                    (
                                                                    {
                                                                        ticket
                                                                            .user
                                                                            .employee
                                                                            .department
                                                                            .name
                                                                    }
                                                                    )
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="vintage-ticket-category capitalize">
                                                            {ticket.category}
                                                        </span>
                                                        <span className="vintage-ticket-age">
                                                            {getTicketAge(
                                                                ticket.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </InfiniteScroll>
                                    )}
                                </div>
                            </div>

                            {/* Resolution Details Form */}
                            <div className="hidden lg:block sticky top-6 space-y-4">
                                <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    <UserCheck className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Ticket Action Panel
                                </h3>
                                {renderActionPanel()}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isMobile && selectedTicket && (
                <Sheet open={selectedTicket !== null} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                    <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto pt-10">
                        <SheetHeader className="p-0 mb-4">
                            <SheetTitle>Ticket Action Panel</SheetTitle>
                            <SheetDescription>
                                Resolve or update ticket #{selectedTicket.id}
                            </SheetDescription>
                        </SheetHeader>
                        {renderActionPanel()}
                    </SheetContent>
                </Sheet>
            )}

            {zoomedImage && (
                <div
                    className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/85 p-4 transition-opacity duration-300 fade-in"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-h-full max-w-5xl overflow-hidden rounded-lg bg-black p-1 shadow-2xl">
                        <img
                            src={zoomedImage}
                            alt="Attachment Fullscreen"
                            className="max-h-[85vh] max-w-full rounded object-contain"
                        />
                        <button
                            className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black focus:outline-hidden"
                            onClick={() => setZoomedImage(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
