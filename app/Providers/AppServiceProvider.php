<?php

namespace App\Providers;

use App\Enums\PhysicalCountStatus;
use App\Enums\RequisitionStatus;
use App\Models\PhysicalCount;
use App\Models\Requisition;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
    }

    /**
     * Map fine-grained GIMS permissions to Laravel Gates.
     */
    protected function configureAuthorization(): void
    {
        Gate::before(function (User $user, string $ability) {
            // Super Admin bypass
            if ($user->hasPermissionTo('admin.super')) {
                return true;
            }
        });

        // Requisition Gates
        Gate::define('requisition.viewAny', function (User $user) {
            return $user->hasPermissionTo('inventory.view');
        });

        Gate::define('requisition.view', function (User $user, Requisition $requisition) {
            if (! $user->hasPermissionTo('inventory.view')) {
                return Response::deny('You do not have permission to view this requisition.');
            }

            if ($user->hasPermissionTo('warehouse.issue') || $user->hasPermissionTo('audit.view')) {
                return Response::allow();
            }

            $employee = $user->employee;

            if (! $employee) {
                return Response::deny('You must have an employee profile to view requisitions.');
            }

            if ($user->hasPermissionTo('request.approve')) {
                return $requisition->department_id === $employee->department_id
                    ? Response::allow()
                    : Response::deny('You can only view requisitions from your department.');
            }

            return $requisition->requesting_employee_id === $employee->id
                ? Response::allow()
                : Response::deny('You can only view your own requisitions.');
        });

        Gate::define('requisition.approve', function (User $user, Requisition $requisition) {
            if (! $user->hasPermissionTo('request.approve')) {
                return Response::deny('You do not have permission to approve requisitions.');
            }

            $employee = $user->employee()->first();

            if ($employee && $requisition->requesting_employee_id === $employee->id) {
                return Response::deny('A creator cannot approve their own requisition request.');
            }

            $isAdmin = $user->hasRole('System Administrator') || $user->hasPermissionTo('admin.super');

            if ($requisition->department_head_id === null) {
                if ($isAdmin) {
                    if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
                        return Response::deny('Only pending requisitions can be approved.');
                    }

                    return Response::allow();
                }

                return Response::deny('This requisition has no assigned department head and must be approved by an administrator.');
            }

            if ($employee === null || $requisition->department_head_id !== $employee->getKey()) {
                if ($isAdmin) {
                    if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
                        return Response::deny('Only pending requisitions can be approved.');
                    }

                    return Response::allow();
                }

                return Response::deny('You are not the designated department head for this requisition.');
            }

            if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
                return Response::deny('Only pending requisitions can be approved.');
            }

            return Response::allow();
        });

        Gate::define('requisition.issue', function (User $user, Requisition $requisition) {
            if (! $user->hasPermissionTo('warehouse.issue')) {
                return Response::deny('You do not have permission to issue items.');
            }

            if (! in_array($requisition->status, [RequisitionStatus::PendingSupply, RequisitionStatus::PartiallyIssued], true)) {
                return Response::deny('Requisition is not in a state that can be issued.');
            }

            return Response::allow();
        });

        // Property / Sub-Assignment Gates
        Gate::define('property.subassign', function (User $user) {
            $allowed = $user->hasPermissionTo('property.transfer') || $user->hasRole('Department Head');

            if (! $allowed) {
                $request = request();
                if (! $request->wantsJson() && ! $request->is('inertia/*') && (! app()->runningInConsole() || app()->runningUnitTests())) {
                    AuditLogger::logUnauthorized('property.subassign', 'property');
                }

                return Response::deny('Unauthorized to issue or return Memorandum Receipts.');
            }

            return Response::allow();
        });

        // Physical Count Gates
        Gate::define('physical-count.viewAny', function (User $user) {
            return true;
        });

        Gate::define('physical-count.create', function (User $user) {
            return $user->hasPermissionTo('reports.view');
        });

        Gate::define('physical-count.view', function (User $user, PhysicalCount $physicalCount) {
            if ($user->hasPermissionTo('reports.view')) {
                return Response::allow();
            }

            $employee = $user->employee;
            if (! $employee) {
                return Response::deny('You must have an employee profile to view physical counts.');
            }

            if ($physicalCount->created_by === $employee->id) {
                return Response::allow();
            }

            $isCommitteeMember = in_array($physicalCount->status, [PhysicalCountStatus::PendingReview, PhysicalCountStatus::Finalized], true)
                && $physicalCount->committees()->where('employee_id', $employee->id)->exists();

            if ($isCommitteeMember) {
                return Response::allow();
            }

            return Response::deny('You are not authorized to view this physical count.');
        });

        Gate::define('physical-count.update', function (User $user, PhysicalCount $physicalCount) {
            if ($user->hasPermissionTo('reports.view')) {
                return Response::allow();
            }

            $employee = $user->employee;
            if (! $employee) {
                return Response::deny('You must have an employee profile to update physical counts.');
            }

            if ($physicalCount->created_by === $employee->id) {
                return Response::allow();
            }

            return Response::deny('You are not authorized to update this physical count.');
        });

        Gate::define('physical-count.review', function (User $user, PhysicalCount $physicalCount) {
            $employee = $user->employee;
            if (! $employee) {
                return Response::deny('You must have an employee profile to review physical counts.');
            }

            $isCommitteeMember = $physicalCount->committees()->where('employee_id', $employee->id)->exists();
            if ($isCommitteeMember) {
                return Response::allow();
            }

            return Response::deny('You are not assigned to the committee for this physical count.');
        });

        Gate::define('physical-count.delete', function (User $user, PhysicalCount $physicalCount) {
            $employee = $user->employee;
            if (! $employee) {
                return Response::deny('You must have an employee profile to delete physical counts.');
            }

            if ($physicalCount->created_by === $employee->id) {
                return Response::allow();
            }

            return Response::deny('Only the creator of the physical count can delete it.');
        });

        // Ticket / Helpdesk Gates
        Gate::define('ticket.viewAny', function (User $user) {
            return true;
        });

        Gate::define('ticket.create', function (User $user) {
            return true;
        });

        Gate::define('ticket.update', function (User $user, Ticket $ticket) {
            return $user->can('users.manage');
        });

        // Alias for backward compatibility
        Gate::define('helpdesk.viewAny', function (User $user) {
            return $user->hasPermissionTo('helpdesk.viewAny');
        });

        Gate::after(function (User $user, string $ability, $result) {
            if ($result === null) {
                // Check if the gate name matches GIMS permission format (contains dot)
                if (str_contains($ability, '.')) {
                    $allowed = $user->hasPermissionTo($ability);

                    if (! $allowed) {
                        // Filter out noisy frontend/inertia checks and automatic validation
                        $request = request();
                        if (! $request->wantsJson() && ! $request->is('inertia/*') && (! app()->runningInConsole() || app()->runningUnitTests())) {
                            AuditLogger::logUnauthorized(
                                $ability,
                                explode('.', $ability)[0],
                            );
                        }
                    }

                    return $allowed;
                }
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
