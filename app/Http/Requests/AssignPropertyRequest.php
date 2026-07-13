<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignPropertyRequest extends FormRequest
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
            'is_non_system' => ['nullable', 'boolean'],
            'assigned_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'non_system_department' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
