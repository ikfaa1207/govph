<?php

namespace App\Http\Requests;

use App\Models\RequisitionItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ApproveRequisitionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by Policy
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:requisition_items,id'],
            'items.*.quantity_approved' => [
                'required',
                'integer',
                'min:0',
                function (string $attribute, mixed $value, \Closure $fail) {
                    preg_match('/items\.(\d+)\.quantity_approved/', $attribute, $matches);
                    if (! isset($matches[1])) {
                        return;
                    }
                    $index = $matches[1];
                    $itemId = $this->input("items.{$index}.id");

                    $requisitionItem = RequisitionItem::find($itemId);
                    if ($requisitionItem instanceof RequisitionItem && $value > $requisitionItem->quantity_requested) {
                        $fail("The approved quantity cannot exceed the requested quantity ({$requisitionItem->quantity_requested}).");
                    }
                },
            ],
        ];
    }
}
