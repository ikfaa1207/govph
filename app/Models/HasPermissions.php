<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasPermissions
{
    /**
     * Get the roles assigned to the user.
     *
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'model_has_roles');
    }

    /**
     * Get direct permissions assigned to the user.
     *
     * @return BelongsToMany<Permission, $this>
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'model_has_permissions');
    }

    /**
     * Check if the user has a specific permission (either directly or via their roles).
     */
    public function hasPermissionTo(string|Permission $permission): bool
    {
        $permissionName = $permission instanceof Permission ? $permission->name : $permission;

        // 1. Check direct permissions
        if ($this->permissions()->where('name', $permissionName)->exists()) {
            return true;
        }

        // 2. Check permissions via roles
        foreach ($this->roles()->with('permissions')->get() as $role) {
            if ($role->permissions->contains('name', $permissionName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(string|Role $role): bool
    {
        $roleName = $role instanceof Role ? $role->name : $role;

        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * Assign one or more roles to the user.
     */
    public function assignRole(string|Role ...$roles): self
    {
        foreach ($roles as $role) {
            $roleModel = $role instanceof Role ? $role : Role::where('name', $role)->first();
            if ($roleModel) {
                $this->roles()->syncWithoutDetaching([$roleModel->id]);
            }
        }

        return $this;
    }

    /**
     * Remove one or more roles from the user.
     */
    public function removeRole(string|Role ...$roles): self
    {
        foreach ($roles as $role) {
            $roleModel = $role instanceof Role ? $role : Role::where('name', $role)->first();
            if ($roleModel) {
                $this->roles()->detach($roleModel->id);
            }
        }

        return $this;
    }

    /**
     * Assign direct permissions to the user.
     */
    public function givePermissionTo(string|Permission ...$permissions): self
    {
        foreach ($permissions as $permission) {
            $permissionModel = $permission instanceof Permission ? $permission : Permission::where('name', $permission)->first();
            if ($permissionModel) {
                $this->permissions()->syncWithoutDetaching([$permissionModel->id]);
            }
        }

        return $this;
    }

    /**
     * Revoke direct permissions from the user.
     */
    public function revokePermissionTo(string|Permission ...$permissions): self
    {
        foreach ($permissions as $permission) {
            $permissionModel = $permission instanceof Permission ? $permission : Permission::where('name', $permission)->first();
            if ($permissionModel) {
                $this->permissions()->detach($permissionModel->id);
            }
        }

        return $this;
    }
}
