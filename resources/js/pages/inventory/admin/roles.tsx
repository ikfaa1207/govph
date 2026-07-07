import { Head, useForm, router, setLayoutProps } from '@inertiajs/react';
import { Plus, Edit2, Copy, Trash2, Users, ChevronDown, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    setLayoutProps({ breadcrumbs });

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

        if (!selectedRole) {
return;
}

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

        if (!selectedRole) {
return;
}

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
            router.delete(`/inventory/admin/roles/${role.id}`, {
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

        form.setData({ ...form.data, permissions: current });
    };

    return (
        <>
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
                                    <Accordion type="multiple" className="w-full">
                                        {Object.entries(permissions).map(([module, permList]) => (
                                            <AccordionItem key={module} value={module} className="border bg-card mb-2 rounded-lg px-4 data-[state=open]:bg-muted/10">
                                                <AccordionTrigger className="hover:no-underline py-3">
                                                    <span className="text-sm font-bold uppercase tracking-wider text-primary">{module} Module</span>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pb-4">
                                                        {permList.map((perm) => {
                                                            const isChecked = addForm.data.permissions.includes(perm.id);
                                                            return (
                                                                <div key={perm.id} className="flex items-start space-x-3 rounded-md border p-3 bg-background">
                                                                    <Switch 
                                                                        id={`add-perm-${perm.id}`}
                                                                        checked={isChecked}
                                                                        onCheckedChange={() => togglePermissionSelection(addForm, perm.id)}
                                                                    />
                                                                    <div className="space-y-1 leading-none">
                                                                        <Label 
                                                                            htmlFor={`add-perm-${perm.id}`}
                                                                            className="font-semibold cursor-pointer"
                                                                        >
                                                                            {perm.name}
                                                                        </Label>
                                                                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{perm.description}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
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
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Role / Description</TableHead>
                                <TableHead>Users Assigned</TableHead>
                                <TableHead>Permissions Count</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No roles configured yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div className="font-semibold text-foreground">{role.name}</div>
                                            <div className="text-xs text-muted-foreground">{role.description || 'No description provided'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="flex w-fit items-center gap-1 bg-muted/20">
                                                <Users className="h-3 w-3" />
                                                {role.users.length} Users
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">
                                                {role.permissions.length} Configured
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditDialog(role)}>
                                                        <Edit2 className="mr-2 h-4 w-4" /> Edit Permissions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openCloneDialog(role)}>
                                                        <Copy className="mr-2 h-4 w-4" /> Clone Role
                                                    </DropdownMenuItem>
                                                    {role.users.length === 0 && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRole(role)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

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
                                    <Accordion type="multiple" className="w-full">
                                        {Object.entries(permissions).map(([module, permList]) => (
                                            <AccordionItem key={module} value={module} className="border bg-card mb-2 rounded-lg px-4 data-[state=open]:bg-muted/10">
                                                <AccordionTrigger className="hover:no-underline py-3">
                                                    <span className="text-sm font-bold uppercase tracking-wider text-primary">{module} Module</span>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pb-4">
                                                        {permList.map((perm) => {
                                                            const isChecked = editForm.data.permissions.includes(perm.id);
                                                            return (
                                                                <div key={perm.id} className="flex items-start space-x-3 rounded-md border p-3 bg-background">
                                                                    <Switch 
                                                                        id={`edit-perm-${perm.id}`}
                                                                        checked={isChecked}
                                                                        onCheckedChange={() => togglePermissionSelection(editForm, perm.id)}
                                                                    />
                                                                    <div className="space-y-1 leading-none">
                                                                        <Label 
                                                                            htmlFor={`edit-perm-${perm.id}`}
                                                                            className="font-semibold cursor-pointer"
                                                                        >
                                                                            {perm.name}
                                                                        </Label>
                                                                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{perm.description}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
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
        </>
    );
}
