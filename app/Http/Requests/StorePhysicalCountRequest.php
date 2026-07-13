<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePhysicalCountRequest extends FormRequest
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
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:RPCPPE,RPCI'],
            'as_of_date' => ['required', 'date'],
            'chairperson_id' => ['required', 'exists:employees,id'],
            'head_of_agency_id' => ['required', 'exists:employees,id'],
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['exists:employees,id'],
            'coa_representative_id' => ['nullable', 'exists:employees,id'],
            'coa_representative_absent_reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if (empty($this->coa_representative_id) && empty($this->coa_representative_absent_reason)) {
                $validator->errors()->add(
                    'coa_representative_absent_reason',
                    'A COA Representative is required, or a documented reason for their absence must be provided.'
                );
            }
        });
    }
}
