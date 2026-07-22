import {
    Head,
    useForm,
    useHttp,
    usePage,
    router,
    setLayoutProps,
} from '@inertiajs/react';
import {
    ShieldCheck,
    Edit3,
    UserPlus,
    AlertCircle,
    XCircle,
    Plus,
    CheckCircle,
    Key,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DicebearAvatar } from '@/components/dicebear-avatar';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface User {
    id: number;
    name: string;
    email: string;
    roles: any[];
    is_active: boolean;
    locked_until: string | null;
    failed_login_attempts: number;
    employee?: {
        position: string;
        office?: { id: number; name: string };
        department?: { id: number; name: string };
    };
}

interface UsersProps {
    users: any; // paginator or array (backwards-compatible)
    roles: any[];
    offices: any[];
    departments: any[];
}

export default function UsersIndex({
    users,
    roles,
    offices: initialOffices,
    departments: initialDepartments,
}: UsersProps) {
    const { auth } = usePage().props as any;
    const currentUser = auth.user;

    const breadcrumbs = [
        { title: 'Administration', href: '#' },
        { title: 'User Management', href: '/inventory/admin/users' },
    ];
    setLayoutProps({ breadcrumbs });

    const [offices, setOffices] = useState(initialOffices);
    const [departments, setDepartments] = useState(initialDepartments);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAddOfficeOpen, setIsAddOfficeOpen] = useState(false);
    const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
    const [inlineFormContext, setInlineFormContext] = useState<
        'create' | 'edit'
    >('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isToggleStatusConfirmOpen, setIsToggleStatusConfirmOpen] =
        useState(false);

    // Password reset section state
    const [isResetSectionOpen, setIsResetSectionOpen] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

    const officeHttp = useHttp({
        name: '',
        code: '',
    });

    const departmentHttp = useHttp({
        office_id: '',
        name: '',
        code: '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        roles: [] as number[],
        office_id: '',
        department_id: '',
        position: '',
    });

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        roles: [] as number[],
        office_id: '',
        department_id: '',
        position: '',
    });

    const [now] = useState(() => Date.now());
    const [isPaginating, setIsPaginating] = useState(false);

    const isUserLocked = (u: User) => {
        if (!u.locked_until) {
            return false;
        }

        const lockedTime = new Date(u.locked_until).getTime();

        return lockedTime > now;
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setIsResetSectionOpen(false);
        setTempPassword('');
        editForm.setData({
            name: user.name,
            email: user.email,
            roles: user.roles.map((r) => r.id),
            office_id: user.employee?.office?.id
                ? String(user.employee.office.id)
                : '',
            department_id: user.employee?.department?.id
                ? String(user.employee.department.id)
                : '',
            position: user.employee?.position || '',
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser) {
            return;
        }

        editForm.post(`/inventory/admin/users/${selectedUser.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                toast.success('User account details and roles updated.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Failed to update user account.');
            },
        });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/inventory/admin/users', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                toast.success('New user account created successfully.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Failed to create user account.');
            },
        });
    };

    const handleOfficeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        officeHttp.post('/inventory/offices', {
            onSuccess: (newOffice: any) => {
                setOffices([...offices, newOffice]);

                if (inlineFormContext === 'create') {
                    createForm.setData('office_id', String(newOffice.id));
                } else {
                    editForm.setData('office_id', String(newOffice.id));
                }

                setIsAddOfficeOpen(false);
                officeHttp.reset();
                toast.success('Office created successfully.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(
                    firstError ||
                        'Failed to create office. Check unique constraints.',
                );
            },
        });
    };

    const handleDepartmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        departmentHttp.post('/inventory/departments', {
            onSuccess: (newDept: any) => {
                setDepartments([...departments, newDept]);

                if (inlineFormContext === 'create') {
                    createForm.setData('department_id', String(newDept.id));
                } else {
                    editForm.setData('department_id', String(newDept.id));
                }

                setIsAddDepartmentOpen(false);
                departmentHttp.reset();
                toast.success('Department created successfully.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(
                    firstError ||
                        'Failed to create department. Check unique constraints.',
                );
            },
        });
    };

    const openAddDepartment = (context: 'create' | 'edit') => {
        setInlineFormContext(context);
        const form = context === 'create' ? createForm : editForm;
        departmentHttp.setData('office_id', form.data.office_id);
        setIsAddDepartmentOpen(true);
    };

    const handleToggleStatus = () => {
        if (!selectedUser) {
            return;
        }

        if (selectedUser.id === 1) {
            toast.error(
                'The protected Super Admin account cannot be deactivated.',
            );

            return;
        }

        setIsToggleStatusConfirmOpen(true);
    };

    const confirmToggleStatus = () => {
        if (!selectedUser) {
            return;
        }

        setIsToggleStatusConfirmOpen(false);

        router.post(
            `/inventory/admin/users/${selectedUser.id}/toggle`,
            {},
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    toast.success('User status updated successfully.');
                },
                onError: (errs) => {
                    const firstError = Object.values(errs)[0];
                    toast.error(firstError || 'Failed to toggle user status.');
                },
            },
        );
    };

    const handleUnlockUser = () => {
        if (!selectedUser) {
            return;
        }

        router.post(
            `/inventory/admin/users/${selectedUser.id}/unlock`,
            {},
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    toast.success('User account unlocked successfully.');
                },
                onError: (errs) => {
                    const firstError = Object.values(errs)[0];
                    toast.error(firstError || 'Failed to unlock user account.');
                },
            },
        );
    };

    const handleResetPassword = () => {
        if (!selectedUser || !tempPassword) {
            return;
        }

        router.post(
            `/inventory/admin/users/${selectedUser.id}/reset-password`,
            {
                password: tempPassword,
            },
            {
                onSuccess: () => {
                    setIsResetSectionOpen(false);
                    setTempPassword('');
                    toast.success(
                        'User password has been reset. User will be forced to change it on their next login.',
                    );
                },
                onError: (errs) => {
                    const firstError = Object.values(errs)[0];
                    toast.error(
                        firstError ||
                            'Failed to reset password. Ensure it meets complexity rules and is not a duplicate of recent passwords.',
                    );
                },
            },
        );
    };

    const toggleRoleSelection = (roleId: number, isEdit: boolean = true) => {
        const form = isEdit ? editForm : createForm;
        const current = [...form.data.roles];
        const idx = current.indexOf(roleId);

        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(roleId);
        }

        if (isEdit) {
            editForm.setData('roles', current);
        } else {
            createForm.setData('roles', current);
        }
    };

    const isCreateFormValid =
        createForm.data.name.trim() !== '' &&
        createForm.data.email.trim() !== '' &&
        createForm.data.password.trim() !== '' &&
        createForm.data.office_id !== '' &&
        createForm.data.department_id !== '' &&
        createForm.data.roles.length > 0;

    const isEditFormValid =
        editForm.data.name.trim() !== '' &&
        editForm.data.email.trim() !== '' &&
        editForm.data.roles.length > 0;

    return (
        <>
            <Head title="User Management - GIMS" />
            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Personnel Directory & User Accounts
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Administer active accounts, organizational
                            assignments, and operational roles.
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-1.5 self-start bg-indigo-600 text-white hover:bg-indigo-700 sm:self-auto"
                    >
                        <UserPlus className="h-4 w-4" />
                        Create Account
                    </Button>
                </div>

                {/* Users List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
                            Registered GIMS Accounts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(users && users.data ? users.data : users).length ===
                        0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold">
                                    No user accounts registered
                                </h3>
                                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                    Get started by creating a new employee or
                                    administrator account.
                                </p>
                                <Button
                                    className="mt-4 gap-2"
                                    onClick={() => setIsCreateOpen(true)}
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Create Account
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User Name</TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Email Address
                                            </TableHead>
                                            <TableHead className="hidden lg:table-cell">
                                                Office / Department
                                            </TableHead>
                                            <TableHead className="hidden sm:table-cell">
                                                Assigned Roles
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(users && users.data
                                            ? users.data
                                            : users
                                        ).map((user: User) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <DicebearAvatar
                                                            seed={user.name}
                                                            className="h-10 w-10 shrink-0 border"
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">
                                                                    {user.name}
                                                                </span>
                                                                {!user.is_active && (
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="flex items-center gap-0.5 px-1.5 py-0 text-[9px]"
                                                                    >
                                                                        <XCircle className="h-2 w-2" />{' '}
                                                                        Deactivated
                                                                    </Badge>
                                                                )}
                                                                {isUserLocked(
                                                                    user,
                                                                ) && (
                                                                    <Badge className="flex items-center gap-0.5 border-none bg-amber-500 px-1.5 py-0 text-[9px] text-white hover:bg-amber-600">
                                                                        <AlertCircle className="h-2 w-2" />{' '}
                                                                        Locked
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                                {user.employee
                                                                    ?.position ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden font-mono text-xs md:table-cell">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="text-sm">
                                                        {user.employee?.office
                                                            ?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {user.employee
                                                            ?.department
                                                            ?.name || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.length ===
                                                        0 ? (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                No Roles
                                                            </span>
                                                        ) : (
                                                            user.roles.map(
                                                                (r) => (
                                                                    <Badge
                                                                        key={
                                                                            r.id
                                                                        }
                                                                        variant="outline"
                                                                        className="text-[10px]"
                                                                    >
                                                                        {r.name}
                                                                    </Badge>
                                                                ),
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1.5 border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                                                        onClick={() =>
                                                            openEditDialog(user)
                                                        }
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                        Manage User
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {users && users.links && (
                    <nav
                        className="mt-4 flex items-center justify-between"
                        aria-label="Pagination"
                    >
                        <div className="text-sm text-muted-foreground">
                            Page{' '}
                            {users.current_page ?? users.meta?.current_page} of{' '}
                            {users.last_page ?? users.meta?.last_page}
                        </div>
                        <div className="flex items-center gap-2">
                            {users.links.map((link: any, idx: number) => {
                                // If label is not clickable (null url) render as plain text/separator
                                if (!link.url) {
                                    return (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 text-sm text-muted-foreground"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                }

                                const isActive = link.active;

                                return (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant={
                                            isActive ? 'default' : 'outline'
                                        }
                                        disabled={isPaginating}
                                        onClick={() => {
                                            setIsPaginating(true);
                                            router.visit(link.url, {
                                                preserveState: false,
                                                replace: false,
                                                onFinish: () =>
                                                    setIsPaginating(false),
                                            });
                                        }}
                                        className={
                                            isActive ? 'font-semibold' : ''
                                        }
                                        aria-current={
                                            isActive ? 'page' : undefined
                                        }
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                );
                            })}
                        </div>
                    </nav>
                )}

                {/* Dialog: Confirm Toggle Status */}
                <Dialog
                    open={isToggleStatusConfirmOpen}
                    onOpenChange={setIsToggleStatusConfirmOpen}
                >
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Update User Status</DialogTitle>
                            <DialogDescription className="pt-2 text-xs">
                                {selectedUser &&
                                    (selectedUser.id === currentUser.id
                                        ? 'WARNING: You are about to deactivate your own account. If you proceed, you will be logged out immediately and lose access to GIMS. Are you sure you want to proceed?'
                                        : `Are you sure you want to ${selectedUser.is_active ? 'deactivate' : 'activate'} this user account?`)}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setIsToggleStatusConfirmOpen(false)
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={
                                    selectedUser?.is_active
                                        ? 'destructive'
                                        : 'default'
                                }
                                onClick={confirmToggleStatus}
                            >
                                Confirm{' '}
                                {selectedUser?.is_active
                                    ? 'Deactivate'
                                    : 'Activate'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Create User */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent
                        className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]"
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => e.preventDefault()}
                    >
                        <DialogHeader className="border-b border-border pb-3">
                            <DialogTitle className="text-lg font-bold">
                                Create New User Account
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Add employee details, organizational unit, and
                                assign system roles.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={handleCreateSubmit}
                            className="space-y-4 pt-2"
                        >
                            {/* Personal & Job Details */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="cname"
                                        className="text-xs font-semibold text-muted-foreground"
                                        required
                                    >
                                        Full Name{' '}
                                    </Label>
                                    <Input
                                        id="cname"
                                        value={createForm.data.name}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        placeholder="Juan dela Cruz"
                                        className="h-9"
                                    />
                                    {createForm.errors.name && (
                                        <p className="text-xs text-rose-500">
                                            {createForm.errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor="cemail"
                                        className="text-xs font-semibold text-muted-foreground"
                                        required
                                    >
                                        Email Address{' '}
                                    </Label>
                                    <Input
                                        id="cemail"
                                        type="email"
                                        value={createForm.data.email}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'email',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        placeholder="email@example.gov.ph"
                                        className="h-9"
                                    />
                                    {createForm.errors.email && (
                                        <p className="text-xs text-rose-500">
                                            {createForm.errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor="cpassword"
                                        className="text-xs font-semibold text-muted-foreground"
                                        required
                                    >
                                        Temp Password{' '}
                                    </Label>
                                    <PasswordInput
                                        id="cpassword"
                                        value={createForm.data.password}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        placeholder="Temporary password"
                                        className="h-9"
                                    />
                                    {createForm.errors.password && (
                                        <p className="text-xs text-rose-500">
                                            {createForm.errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor="coffice"
                                        className="text-xs font-semibold text-muted-foreground"
                                        required
                                    >
                                        Office{' '}
                                    </Label>
                                    <div className="flex gap-1.5">
                                        <Select
                                            value={String(
                                                createForm.data.office_id,
                                            )}
                                            onValueChange={(val) =>
                                                createForm.setData(
                                                    'office_id',
                                                    val,
                                                )
                                            }
                                            required
                                        >
                                            <SelectTrigger className="h-9 min-w-0 flex-1">
                                                <SelectValue placeholder="Select Office" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {offices.map((o) => (
                                                    <SelectItem
                                                        key={o.id}
                                                        value={String(o.id)}
                                                    >
                                                        {o.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => {
                                                setInlineFormContext('create');
                                                setIsAddOfficeOpen(true);
                                            }}
                                            title="Add New Office"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor="cdept"
                                        className="text-xs font-semibold text-muted-foreground"
                                        required
                                    >
                                        Department{' '}
                                    </Label>
                                    <div className="flex gap-1.5">
                                        <Select
                                            value={String(
                                                createForm.data.department_id,
                                            )}
                                            onValueChange={(val) =>
                                                createForm.setData(
                                                    'department_id',
                                                    val,
                                                )
                                            }
                                            required
                                        >
                                            <SelectTrigger className="h-9 min-w-0 flex-1">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((d) => (
                                                    <SelectItem
                                                        key={d.id}
                                                        value={String(d.id)}
                                                    >
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() =>
                                                openAddDepartment('create')
                                            }
                                            title="Add New Department"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor="cpos"
                                        className="text-xs font-semibold text-muted-foreground"
                                        required
                                    >
                                        Position / Title
                                    </Label>
                                    <Input
                                        id="cpos"
                                        value={createForm.data.position}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'position',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. Supply Officer II"
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            {/* Roles & Permission Settings */}
                            <div className="space-y-2 border-t border-border pt-2">
                                <div>
                                    <h3 className="text-xs font-bold text-foreground">
                                        System Permissions
                                    </h3>
                                </div>
                                <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border bg-neutral-50 p-2 dark:bg-neutral-900/60">
                                    {roles.map((role) => {
                                        const isChecked =
                                            createForm.data.roles.includes(
                                                role.id,
                                            );

                                        return (
                                            <label
                                                key={role.id}
                                                className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-xs transition-all select-none ${isChecked ? 'bg-indigo-500/10 font-semibold text-indigo-900 dark:text-indigo-400' : 'text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-input text-indigo-600 focus:ring-indigo-500"
                                                    checked={isChecked}
                                                    onChange={() =>
                                                        toggleRoleSelection(
                                                            role.id,
                                                            false,
                                                        )
                                                    }
                                                />
                                                <span>{role.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions Row */}
                            <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="h-9"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        createForm.processing ||
                                        !isCreateFormValid
                                    }
                                    className={`h-9 font-medium transition-all ${
                                        !isCreateFormValid ||
                                        createForm.processing
                                            ? 'cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xs'
                                    }`}
                                >
                                    Create Account
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Edit User Details */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent
                        className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]"
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => e.preventDefault()}
                    >
                        <DialogHeader className="border-b border-border pb-3">
                            <DialogTitle className="text-lg font-bold">
                                Manage User Profile & Roles
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Alter contact information, office structures,
                                and system permissions.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4 pt-2">
                                <form
                                    onSubmit={handleEditSubmit}
                                    id="edit-user-form"
                                    className="space-y-4"
                                >
                                    {/* Personal Info & Job Details */}
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="uname"
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            Full Name{' '}
                                        </Label>
                                        <Input
                                            id="uname"
                                            value={editForm.data.name}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="uemail"
                                            className="text-xs font-semibold text-muted-foreground"
                                            required
                                        >
                                            Email Address{' '}
                                        </Label>
                                        <Input
                                            id="uemail"
                                            type="email"
                                            value={editForm.data.email}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="h-9"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="uoffice"
                                            className="text-xs font-semibold text-muted-foreground"
                                            required
                                        >
                                            Office
                                        </Label>
                                        <div className="flex gap-1.5">
                                            <Select
                                                value={String(
                                                    editForm.data.office_id,
                                                )}
                                                onValueChange={(val) =>
                                                    editForm.setData(
                                                        'office_id',
                                                        val,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-9 min-w-0 flex-1">
                                                    <SelectValue placeholder="Select Office" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {offices.map((o) => (
                                                        <SelectItem
                                                            key={o.id}
                                                            value={String(o.id)}
                                                        >
                                                            {o.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 shrink-0"
                                                onClick={() => {
                                                    setInlineFormContext(
                                                        'edit',
                                                    );
                                                    setIsAddOfficeOpen(true);
                                                }}
                                                title="Add New Office"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="udept"
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            Department
                                        </Label>
                                        <div className="flex gap-1.5">
                                            <Select
                                                value={String(
                                                    editForm.data.department_id,
                                                )}
                                                onValueChange={(val) =>
                                                    editForm.setData(
                                                        'department_id',
                                                        val,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-9 min-w-0 flex-1">
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map((d) => (
                                                        <SelectItem
                                                            key={d.id}
                                                            value={String(d.id)}
                                                        >
                                                            {d.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 shrink-0"
                                                onClick={() =>
                                                    openAddDepartment('edit')
                                                }
                                                title="Add New Department"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="upos"
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            Position / Title
                                        </Label>
                                        <Input
                                            id="upos"
                                            value={editForm.data.position}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'position',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9"
                                        />
                                    </div>
                                </form>

                                {/* Roles Center */}
                                <div className="space-y-2 border-t border-border pt-2">
                                    <div>
                                        <h3 className="text-xs font-bold text-foreground">
                                            Access Permissions{' '}
                                            <span className="ml-0.5 font-bold text-rose-500">
                                                *
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border bg-neutral-50 p-2 dark:bg-neutral-900/60">
                                        {roles.map((role) => {
                                            const isChecked =
                                                editForm.data.roles.includes(
                                                    role.id,
                                                );

                                            return (
                                                <label
                                                    key={role.id}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-xs transition-all select-none ${isChecked ? 'bg-indigo-500/10 font-semibold text-indigo-900 dark:text-indigo-400' : 'text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-input text-indigo-600 focus:ring-indigo-500"
                                                        checked={isChecked}
                                                        onChange={() =>
                                                            toggleRoleSelection(
                                                                role.id,
                                                                true,
                                                            )
                                                        }
                                                    />
                                                    <span>{role.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Action Center */}
                                <div className="mt-2 space-y-2 border-t border-border pt-4">
                                    <div className="flex flex-col gap-3">
                                        {isResetSectionOpen ? (
                                            <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
                                                <PasswordInput
                                                    id="temp-pw"
                                                    value={tempPassword}
                                                    onChange={(e) =>
                                                        setTempPassword(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="New temporary password"
                                                    className="h-8 flex-1 text-xs"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={
                                                        handleResetPassword
                                                    }
                                                    className="h-8 bg-indigo-600 text-xs text-white"
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setIsResetSectionOpen(
                                                            false,
                                                        )
                                                    }
                                                    className="h-8 text-xs"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            selectedUser.is_active
                                                                ? 'destructive'
                                                                : 'default'
                                                        }
                                                        size="sm"
                                                        className="h-9 text-xs font-medium"
                                                        onClick={
                                                            handleToggleStatus
                                                        }
                                                        disabled={
                                                            selectedUser.id ===
                                                            1
                                                        }
                                                    >
                                                        {selectedUser.is_active ? (
                                                            <span className="flex items-center gap-1.5">
                                                                <XCircle className="h-3.5 w-3.5" />
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5">
                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                            </span>
                                                        )}
                                                    </Button>

                                                    {isUserLocked(
                                                        selectedUser,
                                                    ) && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 border-amber-500 text-xs font-medium text-amber-600 hover:bg-amber-500/10"
                                                            onClick={
                                                                handleUnlockUser
                                                            }
                                                        >
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                                                        onClick={() =>
                                                            setIsResetSectionOpen(
                                                                true,
                                                            )
                                                        }
                                                        disabled={
                                                            selectedUser.id ===
                                                                1 &&
                                                            currentUser.id !== 1
                                                        }
                                                    >
                                                        <Key className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setIsEditOpen(false)
                                                        }
                                                        className="h-9"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        form="edit-user-form"
                                                        disabled={
                                                            editForm.processing ||
                                                            !isEditFormValid
                                                        }
                                                        className="h-9 bg-indigo-600 font-medium text-white hover:bg-indigo-700"
                                                    >
                                                        Save Changes
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Inline Office Creation Dialog */}
                <Dialog
                    open={isAddOfficeOpen}
                    onOpenChange={setIsAddOfficeOpen}
                >
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Add New Office</DialogTitle>
                            <DialogDescription>
                                Create a new office/agency division.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={handleOfficeSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <Label htmlFor="office_name">Office Name</Label>
                                <Input
                                    id="office_name"
                                    value={officeHttp.data.name}
                                    onChange={(e) =>
                                        officeHttp.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="e.g. Office of the Regional Director"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="office_code" required>
                                    Office Code
                                </Label>
                                <Input
                                    id="office_code"
                                    placeholder="e.g. ORD"
                                    value={officeHttp.data.code}
                                    onChange={(e) =>
                                        officeHttp.setData(
                                            'code',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddOfficeOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={officeHttp.processing}
                                >
                                    Save Office
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Inline Department Creation Dialog */}
                <Dialog
                    open={isAddDepartmentOpen}
                    onOpenChange={setIsAddDepartmentOpen}
                >
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Add New Department</DialogTitle>
                            <DialogDescription>
                                Create a new department under an office.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={handleDepartmentSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <Label htmlFor="dept_office" required>
                                    Parent Office
                                </Label>
                                <Select
                                    value={String(
                                        departmentHttp.data.office_id,
                                    )}
                                    onValueChange={(val) =>
                                        departmentHttp.setData('office_id', val)
                                    }
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Office" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {offices.map((o) => (
                                            <SelectItem
                                                key={o.id}
                                                value={String(o.id)}
                                            >
                                                {o.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="dept_name" required>
                                    Department Name
                                </Label>
                                <Input
                                    id="dept_name"
                                    value={departmentHttp.data.name}
                                    onChange={(e) =>
                                        departmentHttp.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="e.g. Finance and Administrative Division"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="dept_code" required>
                                    Department Code
                                </Label>
                                <Input
                                    id="dept_code"
                                    placeholder="e.g. FAD"
                                    value={departmentHttp.data.code}
                                    onChange={(e) =>
                                        departmentHttp.setData(
                                            'code',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setIsAddDepartmentOpen(false)
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={departmentHttp.processing}
                                >
                                    Save Department
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
