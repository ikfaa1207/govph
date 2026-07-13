<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferPropertyRequest extends FormRequest
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
            'to_employee_id' => ['required', 'exists:employees,id'],
            'office_id' => ['required', 'exists:offices,id'],
            'reason' => ['required', 'string'],
        ];
    }
}
