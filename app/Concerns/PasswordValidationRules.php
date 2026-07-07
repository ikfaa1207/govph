<?php

namespace App\Concerns;

use App\Models\User;
use App\Rules\PasswordPolicyRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @param  User|null  $user  The user context to check password history
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function passwordRules(?User $user = null): array
    {
        if ($user === null && method_exists($this, 'user')) {
            $user = $this->user();
        }

        return ['required', 'string', new PasswordPolicyRule($user), 'confirmed'];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }
}
