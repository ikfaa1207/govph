<?php

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PasswordPolicyRule implements ValidationRule
{
    /**
     * Create a new rule instance.
     *
     * @param  User|null  $user  The user to check password history against (optional, null for new users)
     */
    public function __construct(protected ?User $user = null) {}

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('The :attribute must be a string.');

            return;
        }

        // 1. Minimum 12 characters
        if (strlen($value) < 12) {
            $fail('The :attribute must be at least 12 characters.');
        }

        // 2. At least 1 uppercase letter
        if (! preg_match('/[A-Z]/', $value)) {
            $fail('The :attribute must contain at least one uppercase letter.');
        }

        // 3. At least 1 lowercase letter
        if (! preg_match('/[a-z]/', $value)) {
            $fail('The :attribute must contain at least one lowercase letter.');
        }

        // 4. At least 1 digit
        if (! preg_match('/[0-9]/', $value)) {
            $fail('The :attribute must contain at least one number.');
        }

        // 5. At least 1 special character
        if (! preg_match('/[^A-Za-z0-9]/', $value)) {
            $fail('The :attribute must contain at least one special character.');
        }

        // 6. Cannot match any of the user's last 5 passwords
        if ($this->user) {
            $pastPasswords = DB::table('password_histories')
                ->where('user_id', $this->user->id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->pluck('password')
                ->toArray();

            foreach ($pastPasswords as $hashedPassword) {
                if (Hash::check($value, $hashedPassword)) {
                    $fail('The new password cannot be the same as any of your last 5 passwords.');

                    return;
                }
            }
        }
    }
}
