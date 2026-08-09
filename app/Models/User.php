<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Exceptions\EmployeeProfileNotFoundException;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property Carbon|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property array|null $completed_tours
 * @property Employee|null $employee
 */
#[Fillable(['name', 'email', 'password', 'completed_tours', 'is_active', 'password_change_required', 'password_changed_at', 'failed_login_attempts', 'locked_until'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasPermissions, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'completed_tours' => 'array',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'password_change_required' => 'boolean',
            'password_changed_at' => 'datetime',
            'failed_login_attempts' => 'integer',
            'locked_until' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::saving(function (User $user) {
            if ($user->isDirty('password')) {
                $user->password_changed_at = now();

                if (auth()->check() && auth()->id() === $user->id) {
                    $user->password_change_required = false;
                }
            }
        });

        static::saved(function (User $user) {
            if ($user->wasChanged('password') || $user->wasRecentlyCreated) {
                // Save current password hash to history
                DB::table('password_histories')->insert([
                    'user_id' => $user->id,
                    'password' => $user->password,
                    'created_at' => now(),
                ]);
            }
        });
    }

    /**
     * Get the employee profile associated with the user.
     *
     * @return HasOne<Employee, $this>
     */
    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Get the employee profile or throw an exception if not found.
     *
     * @throws EmployeeProfileNotFoundException
     */
    public function getEmployeeOrAbort(?string $message = null): Employee
    {
        $employee = $this->employee;

        if (! $employee) {
            throw new EmployeeProfileNotFoundException($message ?? 'Employee profile not found.');
        }

        return $employee;
    }

    /**
     * Get the support tickets submitted by the user.
     *
     * @return HasMany<Ticket, $this>
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get the first URL authorized for this user based on their permissions.
     */
    public function getFirstAuthorizedUrl(): string
    {
        if ($this->hasPermissionTo('dashboard.view')) {
            return route('dashboard');
        }

        if ($this->hasPermissionTo('requisition.viewAny') || $this->hasPermissionTo('request.viewAny')) {
            return '/inventory/requisitions';
        }

        if ($this->hasPermissionTo('item.viewAny')) {
            return '/inventory/items';
        }

        if ($this->hasPermissionTo('property.viewAny')) {
            return '/inventory/property';
        }

        if ($this->hasPermissionTo('receiving.viewAny')) {
            return '/inventory/receiving-reports';
        }

        if ($this->hasPermissionTo('purchase_request.viewAny')) {
            return '/inventory/purchase-requests';
        }

        if ($this->hasPermissionTo('purchase_order.viewAny')) {
            return '/inventory/purchase-orders';
        }

        if ($this->hasPermissionTo('physical_count.viewAny')) {
            return '/inventory/physical-counts';
        }

        if ($this->hasPermissionTo('helpdesk.viewAny')) {
            return '/inventory/helpdesk';
        }

        if ($this->hasPermissionTo('report.viewAny')) {
            return '/inventory/reports';
        }

        if ($this->hasPermissionTo('user.viewAny')) {
            return '/inventory/admin/users';
        }

        return route('dashboard');
    }
}
