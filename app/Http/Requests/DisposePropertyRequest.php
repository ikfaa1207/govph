<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DisposePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'disposal_method' => ['required', 'in:auction,transfer,donation,destruction'],
            'reason' => ['required', 'in:broken,obsolete,lost,expired,condemned'],
            'appraised_value' => ['nullable', 'numeric', 'min:0'],
            'proceeds' => ['nullable', 'numeric', 'min:0'],
            'witness_by' => ['required', 'string', 'max:255'],
            'inspected_by' => ['nullable', 'exists:employees,id'],
            'jev_reference' => ['nullable', 'string', 'max:255'],
            'approved_by' => [
                'required',
                'exists:employees,id',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $user = auth()->user();
                    $custodian = $user ? $user->employee : null;
                    if ($custodian && (int) $value === (int) $custodian->id) {
                        $fail('The disposal approver cannot be the same custodian who initiated the disposal.');
                    }
                },
            ],
        ];
    }
}
