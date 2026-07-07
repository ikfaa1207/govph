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

        $allPermissions = once(function () {
            if (! $this->relationLoaded('permissions')) {
                $this->load('permissions');
            }
            if (! $this->relationLoaded('roles.permissions')) {
                $this->load('roles.permissions');
            }

            $direct = $this->permissions->pluck('name');
            $roleBased = $this->roles->flatMap(fn ($role) => $role->permissions->pluck('name'));

            return $direct->concat($roleBased)->unique()->values();
        });

        return $allPermissions->contains($permissionName);
    }

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(string|Role $role): bool
    {
        $roleName = $role instanceof Role ? $role->name : $role;

        $roleNames = once(function () {
            if (! $this->relationLoaded('roles')) {
                $this->load('roles');
            }

            return $this->roles->pluck('name');
        });

        return $roleNames->contains($roleName);
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
