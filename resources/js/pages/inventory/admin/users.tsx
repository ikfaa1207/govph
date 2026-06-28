import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm, usePage, router, setLayoutProps } from '@inertiajs/react';
import { ShieldCheck, Edit3, UserPlus, AlertCircle, CheckCircle, XCircle, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

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
    users: User[];
    roles: any[];
    offices: any[];
    departments: any[];
}

export default function UsersIndex({ users, roles, offices, departments }: UsersProps) {
    const { auth } = usePage().props as any;
    const currentUser = auth.user;

    const breadcrumbs = [
        { title: 'Administration', href: '#' },
        { title: 'User Management', href: '/inventory/admin/users' }
    ];
    setLayoutProps({ breadcrumbs });

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Password reset section state
    const [isResetSectionOpen, setIsResetSectionOpen] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

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

    const isUserLocked = (u: User) => {
        if (!u.locked_until) return false;
        const lockedTime = new Date(u.locked_until).getTime();
        return lockedTime > Date.now();
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setIsResetSectionOpen(false);
        setTempPassword('');
        editForm.setData({
            name: user.name,
            email: user.email,
            roles: user.roles.map(r => r.id),
            office_id: user.employee?.office?.id ? String(user.employee.office.id) : '',
            department_id: user.employee?.department?.id ? String(user.employee.department.id) : '',
            position: user.employee?.position || '',
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        
        editForm.post(`/inventory/admin/users/${selectedUser.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                toast.success('User account details and roles updated.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Failed to update user account.');
            }
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
            }
        });
    };

    const handleToggleStatus = () => {
        if (!selectedUser) return;

        if (selectedUser.id === 1) {
            toast.error('The protected Super Admin account cannot be deactivated.');
            return;
        }

        const isSelf = selectedUser.id === currentUser.id;
        const confirmMessage = isSelf
            ? 'WARNING: You are about to deactivate your own account. If you proceed, you will be logged out immediately and lose access to GIMS. Are you sure you want to proceed?'
            : `Are you sure you want to ${selectedUser.is_active ? 'deactivate' : 'activate'} this user account?`;

        if (confirm(confirmMessage)) {
            router.post(`/inventory/admin/users/${selectedUser.id}/toggle`, {}, {
                onSuccess: () => {
                    setIsEditOpen(false);
                    toast.success('User status updated successfully.');
                },
                onError: (errs) => {
                    const firstError = Object.values(errs)[0];
                    toast.error(firstError || 'Failed to toggle user status.');
                }
            });
        }
    };

    const handleUnlockUser = () => {
        if (!selectedUser) return;

        router.post(`/inventory/admin/users/${selectedUser.id}/unlock`, {}, {
            onSuccess: () => {
                setIsEditOpen(false);
                toast.success('User account unlocked successfully.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Failed to unlock user account.');
            }
        });
    };

    const handleResetPassword = () => {
        if (!selectedUser || !tempPassword) return;

        if (tempPassword.length < 12) {
            toast.error('Temporary password must be at least 12 characters.');
            return;
        }

        router.post(`/inventory/admin/users/${selectedUser.id}/reset-password`, {
            password: tempPassword
        }, {
            onSuccess: () => {
                setIsResetSectionOpen(false);
                setTempPassword('');
                toast.success('User password has been reset. User will be forced to change it on their next login.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Failed to reset password. Ensure it meets complexity rules and is not a duplicate of recent passwords.');
            }
        });
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
        form.setData('roles', current);
    };

    return (
        <>
            <Head title="User Management - GIMS" />
            <div className="space-y-6 p-6">
                
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Personnel Directory & User Accounts</h1>
                        <p className="text-sm text-muted-foreground">Administer active accounts, organizational assignments, and operational roles.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 self-start sm:self-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                        <UserPlus className="h-4 w-4" />
                        Create Account
                    </Button>
                </div>

                {/* Users List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
                            Registered GIMS Accounts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                No user accounts registered.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border pb-2 text-muted-foreground font-medium">
                                            <th className="py-2">User Name</th>
                                            <th className="py-2">Email Address</th>
                                            <th className="py-2">Office / Department</th>
                                            <th className="py-2">Assigned Roles</th>
                                            <th className="py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/50">
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{user.name}</span>
                                                        {!user.is_active && (
                                                            <Badge variant="destructive" className="text-[9px] py-0 px-1.5 flex items-center gap-0.5">
                                                                <XCircle className="h-2 w-2" /> Deactivated
                                                            </Badge>
                                                        )}
                                                        {isUserLocked(user) && (
                                                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] py-0 px-1.5 flex items-center gap-0.5 border-none">
                                                                <AlertCircle className="h-2 w-2" /> Locked
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{user.employee?.position || 'N/A'}</div>
                                                </td>
                                                <td className="py-3 font-mono text-xs">{user.email}</td>
                                                <td className="py-3">
                                                    <div className="text-sm">{user.employee?.office?.name || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">{user.employee?.department?.name || 'N/A'}</div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground italic">No Roles</span>
                                                        ) : (
                                                            user.roles.map(r => (
                                                                <Badge key={r.id} variant="outline" className="text-[10px]">
                                                                    {r.name}
                                                                </Badge>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Button size="sm" variant="outline" className="gap-1.5 border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300" onClick={() => openEditDialog(user)}>
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                        Manage User
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog: Create User */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New User Account</DialogTitle>
                            <DialogDescription>Add a new employee account, configure organizational parameters, and assign initial roles.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="cname">Full Name *</Label>
                                <Input id="cname" value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)} required placeholder="Juan dela Cruz" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="cemail">Email Address *</Label>
                                <Input id="cemail" type="email" value={createForm.data.email} onChange={e => createForm.setData('email', e.target.value)} required placeholder="email@example.gov.ph" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="cpassword">Temporary Password *</Label>
                                <Input id="cpassword" type="password" value={createForm.data.password} onChange={e => createForm.setData('password', e.target.value)} required placeholder="At least 12 chars with complexity" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="coffice">Office *</Label>
                                    <select 
                                        id="coffice" 
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                        value={createForm.data.office_id} 
                                        onChange={e => createForm.setData('office_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Office</option>
                                        {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="cdept">Department *</Label>
                                    <select 
                                        id="cdept" 
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                        value={createForm.data.department_id} 
                                        onChange={e => createForm.setData('department_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="cpos">Position / Title</Label>
                                <Input id="cpos" value={createForm.data.position} onChange={e => createForm.setData('position', e.target.value)} placeholder="e.g. Supply Officer II" />
                            </div>

                            <div className="space-y-2 border-t border-border pt-3">
                                <Label>Assign Roles *</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1.5">
                                    {roles.map((role) => {
                                        const isChecked = createForm.data.roles.includes(role.id);
                                        return (
                                            <div 
                                                key={role.id} 
                                                onClick={() => toggleRoleSelection(role.id, false)}
                                                className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 transition-colors ${isChecked ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-border bg-background'}`}
                                            >
                                                <div>{role.name}</div>
                                                <div className="text-[10px] font-normal text-muted-foreground leading-normal line-clamp-1">{role.description}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.processing}>Create Account</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Edit User Details */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Manage User Profile & Roles</DialogTitle>
                            <DialogDescription>Alter contact information, office structures, and system permissions.</DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4">
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="uname">Full Name *</Label>
                                        <Input id="uname" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="uemail">Email Address *</Label>
                                        <Input id="uemail" type="email" value={editForm.data.email} onChange={e => editForm.setData('email', e.target.value)} required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="uoffice">Office</Label>
                                            <select 
                                                id="uoffice" 
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                value={editForm.data.office_id} 
                                                onChange={e => editForm.setData('office_id', e.target.value)}
                                            >
                                                <option value="">Select Office</option>
                                                {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="udept">Department</Label>
                                            <select 
                                                id="udept" 
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden"
                                                value={editForm.data.department_id} 
                                                onChange={e => editForm.setData('department_id', e.target.value)}
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="upos">Position / Title</Label>
                                        <Input id="upos" value={editForm.data.position} onChange={e => editForm.setData('position', e.target.value)} />
                                    </div>

                                    <div className="space-y-2 border-t border-border pt-3">
                                        <Label>Assign Roles</Label>
                                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                                            {roles.map((role) => {
                                                const isChecked = editForm.data.roles.includes(role.id);
                                                return (
                                                    <div 
                                                        key={role.id} 
                                                        onClick={() => toggleRoleSelection(role.id, true)}
                                                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 transition-colors ${isChecked ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-border bg-background'}`}
                                                    >
                                                        <div>{role.name}</div>
                                                        <div className="text-[10px] font-normal text-muted-foreground leading-normal line-clamp-1">{role.description}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-b border-border pb-4">
                                        <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={editForm.processing}>Save Changes</Button>
                                    </div>
                                </form>

                                {/* Action Center (Deactivate, Unlock, Reset Password) */}
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Action Center</h4>
                                    
                                    {isResetSectionOpen ? (
                                        <div className="p-3 bg-muted rounded-lg border border-border space-y-3">
                                            <div className="space-y-1">
                                                <Label htmlFor="temp-pw" className="text-xs">Temporary Password *</Label>
                                                <Input 
                                                    id="temp-pw" 
                                                    type="password" 
                                                    value={tempPassword} 
                                                    onChange={e => setTempPassword(e.target.value)}
                                                    placeholder="At least 12 characters with complexity"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleResetPassword} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                                                    Save Password
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setIsResetSectionOpen(false)} className="h-8 text-xs">
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant={selectedUser.is_active ? "destructive" : "default"}
                                                size="sm"
                                                className="h-8.5 text-xs font-medium"
                                                onClick={handleToggleStatus}
                                                disabled={selectedUser.id === 1}
                                            >
                                                {selectedUser.is_active ? (
                                                    <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Deactivate Account</span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Activate Account</span>
                                                )}
                                            </Button>

                                            {isUserLocked(selectedUser) && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8.5 text-xs font-medium border-amber-500 text-amber-600 hover:bg-amber-500/10"
                                                    onClick={handleUnlockUser}
                                                >
                                                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                                    Unlock Account
                                                </Button>
                                            )}

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8.5 text-xs font-medium border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                                                onClick={() => setIsResetSectionOpen(true)}
                                                disabled={selectedUser.id === 1 && currentUser.id !== 1}
                                            >
                                                <Key className="h-3.5 w-3.5 mr-1.5" />
                                                Reset Password
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}
