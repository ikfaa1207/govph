import { Head, useForm, router, setLayoutProps, Link } from '@inertiajs/react';
import { Plus, Edit2, Copy, Trash2, Users, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { RowActionsMenu } from '@/components/row-actions-menu';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const formatPermissionName = (name: string) => {
    const map: Record<string, string> = {
        'inventory.create': 'Manage Catalogue: Add Items',
        'inventory.update': 'Manage Catalogue: Edit Items',
        'inventory.delete': 'Manage Catalogue: Archive Items',
        'inventory.view': 'View Catalogue',
    };

    if (map[name]) {
        return map[name];
    }

    // Fallback: capitalize and replace dots with spaces
    return name
        .split('.')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

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
        { title: 'Roles & Permissions', href: '/inventory/admin/roles' },
    ];
    setLayoutProps({ breadcrumbs });

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCloneOpen, setIsCloneOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

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
            },
        });
    };

    const openEditDialog = (role: Role) => {
        setSelectedRole(role);
        editForm.setData({
            name: role.name,
            description: role.description,
            permissions: role.permissions.map((p) => p.id),
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
            },
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
            },
        });
    };

    const handleDeleteRole = (role: Role) => {
        if (role.users.length > 0) {
            toast.error(
                'Cannot delete role. Some users are currently assigned to it.',
            );

            return;
        }

        setRoleToDelete(role);
    };

    const confirmDeleteRole = () => {
        if (!roleToDelete) {
            return;
        }

        const role = roleToDelete;
        setRoleToDelete(null);

        router.delete(`/inventory/admin/roles/${role.id}`, {
            onSuccess: () => {
                toast.success('Role deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete role.');
            },
        });
    };

    const togglePermissionSelection = (
        form: typeof addForm | typeof editForm,
        id: number,
    ) => {
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

            <Dialog
                open={roleToDelete !== null}
                onOpenChange={(open) => !open && setRoleToDelete(null)}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription className="pt-2 text-xs">
                            Are you sure you want to delete the role "
                            {roleToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setRoleToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteRole}
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Access Control & Role Matrix
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure permission levels, build custom roles, and
                            map security privileges.
                        </p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Custom Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Custom Role</DialogTitle>
                                <DialogDescription>
                                    Give a name, description, and select
                                    applicable permissions.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                onSubmit={handleAddSubmit}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <Label htmlFor="rname" required>
                                        Role Name
                                    </Label>
                                    <Input
                                        id="rname"
                                        value={addForm.data.name}
                                        onChange={(e) =>
                                            addForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="rdesc" required>
                                        Description
                                    </Label>
                                    <Input
                                        id="rdesc"
                                        value={addForm.data.description}
                                        onChange={(e) =>
                                            addForm.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-3 border-t border-border pt-4">
                                    <Label className="text-sm font-bold">
                                        Permissions Mapping
                                    </Label>
                                    <Accordion
                                        type="multiple"
                                        className="w-full"
                                    >
                                        {Object.entries(permissions).map(
                                            ([module, permList]) => (
                                                <AccordionItem
                                                    key={module}
                                                    value={module}
                                                    className="mb-2 rounded-lg border bg-card px-4 data-[state=open]:bg-muted/10"
                                                >
                                                    <AccordionTrigger className="py-3 hover:no-underline">
                                                        <span className="text-sm font-bold tracking-wider text-primary uppercase">
                                                            {module} Module
                                                        </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="grid grid-cols-1 gap-4 pt-2 pb-4 md:grid-cols-2">
                                                            {permList.map(
                                                                (perm) => {
                                                                    const isChecked =
                                                                        addForm.data.permissions.includes(
                                                                            perm.id,
                                                                        );

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                perm.id
                                                                            }
                                                                            className="flex items-start space-x-3 rounded-md border bg-background p-3"
                                                                        >
                                                                            <Switch
                                                                                id={`add-perm-${perm.id}`}
                                                                                checked={
                                                                                    isChecked
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermissionSelection(
                                                                                        addForm,
                                                                                        perm.id,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <div className="space-y-1 leading-none">
                                                                                <Label
                                                                                    htmlFor={`add-perm-${perm.id}`}
                                                                                    className="cursor-pointer font-semibold"
                                                                                >
                                                                                    {formatPermissionName(
                                                                                        perm.name,
                                                                                    )}
                                                                                </Label>
                                                                                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                                                                                    {
                                                                                        perm.description
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ),
                                        )}
                                    </Accordion>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={addForm.processing}
                                    >
                                        Save Role
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Roles Board */}
                {roles.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-6 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold">
                            No custom roles configured
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                            Build custom permission schemes and security
                            clearance levels for your staff.
                        </p>
                        <Button
                            className="mt-4 gap-2"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Create Custom Role
                        </Button>
                    </Card>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">
                                    Role / Description
                                </TableHead>
                                <TableHead className="hidden sm:table-cell">
                                    Users Assigned
                                </TableHead>
                                <TableHead className="hidden sm:table-cell">
                                    Permissions Count
                                </TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <div className="font-semibold text-foreground">
                                            {role.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {role.description ||
                                                'No description provided'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Link href="/inventory/admin/users">
                                            <Badge
                                                variant="outline"
                                                className="flex w-fit cursor-pointer items-center gap-1 bg-muted/20 transition-colors hover:bg-muted/30"
                                            >
                                                <Users className="h-3 w-3" />
                                                {role.users.length} Users
                                            </Badge>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge
                                            variant="secondary"
                                            className="font-mono"
                                        >
                                            {role.permissions.length} Configured
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <RowActionsMenu
                                            actions={[
                                                {
                                                    label: 'Edit Permissions',
                                                    icon: Edit2,
                                                    onClick: () =>
                                                        openEditDialog(role),
                                                },
                                                {
                                                    label: 'Clone Role',
                                                    icon: Copy,
                                                    onClick: () =>
                                                        openCloneDialog(role),
                                                },
                                                {
                                                    label: 'Delete Role',
                                                    icon: Trash2,
                                                    onClick: () =>
                                                        handleDeleteRole(role),
                                                    show:
                                                        role.users.length === 0,
                                                    destructive: true,
                                                },
                                            ]}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Dialog: Edit Permissions */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Configure Role Permissions
                            </DialogTitle>
                            <DialogDescription>
                                Toggle access rights for the role:{' '}
                                {selectedRole?.name}.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRole && (
                            <form
                                onSubmit={handleEditSubmit}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="ename">Role Name</Label>
                                        <Input
                                            id="ename"
                                            value={editForm.data.name}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="edesc" required>
                                            Description
                                        </Label>
                                        <Input
                                            id="edesc"
                                            value={editForm.data.description}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 border-t border-border pt-4">
                                    <Label className="text-sm font-bold">
                                        Permissions Mapping
                                    </Label>
                                    <Accordion
                                        type="multiple"
                                        className="w-full"
                                    >
                                        {Object.entries(permissions).map(
                                            ([module, permList]) => (
                                                <AccordionItem
                                                    key={module}
                                                    value={module}
                                                    className="mb-2 rounded-lg border bg-card px-4 data-[state=open]:bg-muted/10"
                                                >
                                                    <AccordionTrigger className="py-3 hover:no-underline">
                                                        <span className="text-sm font-bold tracking-wider text-primary uppercase">
                                                            {module} Module
                                                        </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="grid grid-cols-1 gap-4 pt-2 pb-4 md:grid-cols-2">
                                                            {permList.map(
                                                                (perm) => {
                                                                    const isChecked =
                                                                        editForm.data.permissions.includes(
                                                                            perm.id,
                                                                        );

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                perm.id
                                                                            }
                                                                            className="flex items-start space-x-3 rounded-md border bg-background p-3"
                                                                        >
                                                                            <Switch
                                                                                id={`edit-perm-${perm.id}`}
                                                                                checked={
                                                                                    isChecked
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermissionSelection(
                                                                                        editForm,
                                                                                        perm.id,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <div className="space-y-1 leading-none">
                                                                                <Label
                                                                                    htmlFor={`edit-perm-${perm.id}`}
                                                                                    className="cursor-pointer font-semibold"
                                                                                >
                                                                                    {formatPermissionName(
                                                                                        perm.name,
                                                                                    )}
                                                                                </Label>
                                                                                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                                                                                    {
                                                                                        perm.description
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ),
                                        )}
                                    </Accordion>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                    >
                                        Save Permissions
                                    </Button>
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
                            <DialogDescription>
                                Create a new role with identical permissions to{' '}
                                {selectedRole?.name}.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRole && (
                            <form
                                onSubmit={handleCloneSubmit}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <Label htmlFor="cname">New Role Name</Label>
                                    <Input
                                        id="cname"
                                        value={cloneForm.data.name}
                                        onChange={(e) =>
                                            cloneForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="cdesc">Description</Label>
                                    <Input
                                        id="cdesc"
                                        value={cloneForm.data.description}
                                        onChange={(e) =>
                                            cloneForm.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCloneOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={cloneForm.processing}
                                    >
                                        Clone Role
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
