import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound, Plus, Edit2, Copy, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    module: string;
    description: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
    users: any[];
}

interface RolesIndexProps {
    roles: Role[];
    permissions: Record<string, Permission[]>;
}

export default function RolesIndex({ roles, permissions }: RolesIndexProps) {
    const breadcrumbs = [
        { title: 'Administration', href: '#' },
        { title: 'Roles & Permissions', href: '/inventory/admin/roles' }
    ];

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCloneOpen, setIsCloneOpen] = useState(false);

    // Form: Create Role
    const addForm = useForm({
        name: '',
        description: '',
        permissions: [] as number[],
    });

    // Form: Edit Role
    const editForm = useForm({
        name: '',
        description: '',
        permissions: [] as number[],
    });

    // Form: Clone Role
    const cloneForm = useForm({
        name: '',
        description: '',
    });

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/inventory/admin/roles', {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
                toast.success('Custom role created successfully.');
            },
            onError: () => {
                toast.error('Failed to create role.');
            }
        });
    };

    const openEditDialog = (role: Role) => {
        setSelectedRole(role);
        editForm.setData({
            name: role.name,
            description: role.description,
            permissions: role.permissions.map(p => p.id),
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;
        editForm.post(`/inventory/admin/roles/${selectedRole.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                toast.success('Role permissions updated successfully.');
            },
            onError: () => {
                toast.error('Failed to update role.');
            }
        });
    };

    const openCloneDialog = (role: Role) => {
        setSelectedRole(role);
        cloneForm.setData({
            name: `${role.name} - Copy`,
            description: `Clone of ${role.name}`,
        });
        setIsCloneOpen(true);
    };

    const handleCloneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;
        cloneForm.post(`/inventory/admin/roles/${selectedRole.id}/clone`, {
            onSuccess: () => {
                setIsCloneOpen(false);
                toast.success('Role cloned successfully.');
            },
            onError: () => {
                toast.error('Failed to clone role.');
            }
        });
    };

    const handleDeleteRole = (role: Role) => {
        if (role.users.length > 0) {
            toast.error('Cannot delete role. Some users are currently assigned to it.');
            return;
        }

        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            // Send delete request
            const { delete: destroy } = useForm();
            destroy(`/inventory/admin/roles/${role.id}`, {
                onSuccess: () => {
                    toast.success('Role deleted successfully.');
                },
                onError: () => {
                    toast.error('Failed to delete role.');
                }
            });
        }
    };

    const togglePermissionSelection = (form: typeof addForm | typeof editForm, id: number) => {
        const current = [...form.data.permissions];
        const idx = current.indexOf(id);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(id);
        }
        form.setData('permissions', current);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Matrix - GIMS" />
            <div className="space-y-6 p-6">
                
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Access Control & Role Matrix</h1>
                        <p className="text-sm text-muted-foreground">Configure permission levels, build custom roles, and map security privileges.</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Custom Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Custom Role</DialogTitle>
                                <DialogDescription>Give a name, description, and select applicable permissions.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="rname">Role Name *</Label>
                                    <Input id="rname" value={addForm.data.name} onChange={e => addForm.setData('name', e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="rdesc">Description</Label>
                                    <Input id="rdesc" value={addForm.data.description} onChange={e => addForm.setData('description', e.target.value)} />
                                </div>

                                <div className="space-y-3 border-t border-border pt-4">
                                    <Label className="text-sm font-bold">Permissions Mapping</Label>
                                    <div className="space-y-4 mt-2">
                                        {Object.entries(permissions).map(([module, permList]) => (
                                            <div key={module} className="space-y-1.5">
                                                <div className="text-xs font-bold uppercase tracking-wider text-primary">{module} Module</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {permList.map((perm) => {
                                                        const isChecked = addForm.data.permissions.includes(perm.id);
                                                        return (
                                                            <div 
                                                                key={perm.id}
                                                                onClick={() => togglePermissionSelection(addForm, perm.id)}
                                                                className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${isChecked ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-border bg-background'}`}
                                                            >
                                                                <div>
                                                                    <div>{perm.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-normal leading-normal">{perm.description}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={addForm.processing}>Save Role</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Roles Board */}
                <div className="grid gap-4 md:grid-cols-2">
                    {roles.map((role) => (
                        <Card key={role.id} className="relative overflow-hidden flex flex-col justify-between">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base font-bold text-foreground">{role.name}</CardTitle>
                                        <CardDescription className="text-xs mt-1 leading-normal">{role.description || 'No description provided.'}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {role.users.length} Users
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.map(p => (
                                        <Badge key={p.id} variant="secondary" className="text-[9px] px-1 py-0 font-mono">
                                            {p.name}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-1.5 border-t border-border pt-3 mt-auto">
                                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => openEditDialog(role)}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                        Permissions
                                    </Button>
                                    <Button size="sm" variant="ghost" className="gap-1 text-xs text-sky-500" onClick={() => openCloneDialog(role)}>
                                        <Copy className="h-3.5 w-3.5" />
                                        Clone
                                    </Button>
                                    {role.users.length === 0 && (
                                        <Button size="sm" variant="ghost" className="gap-1 text-xs text-rose-500" onClick={() => handleDeleteRole(role)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Dialog: Edit Permissions */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Configure Role Permissions</DialogTitle>
                            <DialogDescription>Toggle access rights for the role: {selectedRole?.name}.</DialogDescription>
                        </DialogHeader>
                        {selectedRole && (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="ename">Role Name *</Label>
                                        <Input id="ename" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="edesc">Description</Label>
                                        <Input id="edesc" value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-3 border-t border-border pt-4">
                                    <Label className="text-sm font-bold">Permissions Mapping</Label>
                                    <div className="space-y-4 mt-2">
                                        {Object.entries(permissions).map(([module, permList]) => (
                                            <div key={module} className="space-y-1.5">
                                                <div className="text-xs font-bold uppercase tracking-wider text-primary">{module} Module</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {permList.map((perm) => {
                                                        const isChecked = editForm.data.permissions.includes(perm.id);
                                                        return (
                                                            <div 
                                                                key={perm.id}
                                                                onClick={() => togglePermissionSelection(editForm, perm.id)}
                                                                className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${isChecked ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-border bg-background'}`}
                                                            >
                                                                <div>
                                                                    <div>{perm.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-normal leading-normal">{perm.description}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={editForm.processing}>Save Permissions</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Dialog: Clone Role */}
                <Dialog open={isCloneOpen} onOpenChange={setIsCloneOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Clone Custom Role</DialogTitle>
                            <DialogDescription>Create a new role with identical permissions to {selectedRole?.name}.</DialogDescription>
                        </DialogHeader>
                        {selectedRole && (
                            <form onSubmit={handleCloneSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="cname">New Role Name *</Label>
                                    <Input id="cname" value={cloneForm.data.name} onChange={e => cloneForm.setData('name', e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="cdesc">Description</Label>
                                    <Input id="cdesc" value={cloneForm.data.description} onChange={e => cloneForm.setData('description', e.target.value)} />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCloneOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={cloneForm.processing}>Clone Role</Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </AppLayout>
    );
}
