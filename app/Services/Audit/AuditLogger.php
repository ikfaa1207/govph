<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Record an audit log for an action on a model.
     *
     * @param  string  $action  The action performed (e.g. CREATE_ITEM, APPROVE_RIS)
     * @param  Model  $model  The Eloquent model being acted upon
     * @param  array|null  $oldValues  Previous state of the model
     * @param  array|null  $newValues  New state of the model
     * @param  string|null  $module  The module context (e.g. inventory, warehouse, property)
     * @param  string|null  $permission  The permission key used (e.g. inventory.create)
     */
    public static function log(
        string $action,
        Model $model,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $module = null,
        ?string $permission = null,
    ): void {
        $user = Auth::user();

        // Auto-detect module from the model class name if not provided
        if ($module === null) {
            $module = self::resolveModuleFromModel($model);
        }

        // Resolve current user's role names
        $userRole = null;
        if ($user !== null && method_exists($user, 'roles')) {
            $roles = $user->roles->pluck('name')->toArray();
            $userRole = implode(', ', $roles);
        }

        AuditLog::create([
            'user_id' => $user?->id,
            'user_role' => $userRole,
            'action' => $action,
            'module' => $module,
            'permission' => $permission,
            'model_type' => get_class($model),
            'model_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Log an unauthorized access attempt.
     */
    public static function logUnauthorized(string $permission, ?string $module = null): void
    {
        $user = Auth::user();
        $userRole = null;
        if ($user !== null && method_exists($user, 'roles')) {
            $roles = $user->roles->pluck('name')->toArray();
            $userRole = implode(', ', $roles);
        }

        AuditLog::create([
            'user_id' => $user?->id,
            'user_role' => $userRole,
            'action' => 'UNAUTHORIZED_ACCESS_ATTEMPT',
            'module' => $module,
            'permission' => $permission,
            'model_type' => 'System',
            'model_id' => 0,
            'old_values' => null,
            'new_values' => [
                'attempted_permission' => $permission,
                'url' => Request::fullUrl(),
                'method' => Request::method(),
            ],
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Auto-detect module from the model class name.
     */
    private static function resolveModuleFromModel(Model $model): string
    {
        $className = class_basename($model);

        return match (true) {
            in_array($className, ['Item', 'StockTransaction', 'Category', 'Unit']) => 'inventory',
            in_array($className, ['PurchaseRequest', 'PurchaseOrder', 'ReceivingReport', 'ReceivingReportItem']) => 'procurement',
            in_array($className, ['Requisition', 'RequisitionItem', 'Issuance', 'IssuanceItem']) => 'warehouse',
            in_array($className, ['Property', 'PropertyAssignment', 'PropertyTransfer', 'Disposal']) => 'property',
            in_array($className, ['User', 'Role', 'Permission']) => 'administration',
            default => strtolower($className),
        };
    }
}
