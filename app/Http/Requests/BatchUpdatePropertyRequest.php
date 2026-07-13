<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchUpdatePropertyRequest extends FormRequest
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
            'properties' => ['required', 'array'],
            'properties.*.id' => ['required', 'integer', 'exists:properties,id'],
            'properties.*.brand' => ['required', 'string', 'max:255'],
            'properties.*.model' => ['required', 'string', 'max:255'],
            'properties.*.serial_number' => ['required', 'string', 'max:255'],
            'properties.*.condition' => ['required', 'in:new,good,fair,needs_repair,unserviceable,disposed'],
        ];
    }
}
