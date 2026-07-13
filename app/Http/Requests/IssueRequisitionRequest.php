<?php

namespace App\Http\Requests;

use App\Models\RequisitionItem;
use Illuminate\Foundation\Http\FormRequest;

class IssueRequisitionRequest extends FormRequest
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
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:requisition_items,id'],
            'items.*.quantity_issued' => [
                'required',
                'integer',
                'min:0',
                function (string $attribute, mixed $value, \Closure $fail) {
                    preg_match('/items\.(\d+)\.quantity_issued/', $attribute, $matches);
                    if (! isset($matches[1])) {
                        return;
                    }
                    $index = $matches[1];
                    $itemId = $this->input("items.{$index}.id");

                    $requisitionItem = RequisitionItem::find($itemId);
                    if ($requisitionItem instanceof RequisitionItem) {
                        $remaining = $requisitionItem->quantity_approved - $requisitionItem->quantity_issued;
                        if ($value > $remaining) {
                            $fail("The issued quantity cannot exceed the remaining approved quantity ({$remaining}).");
                        }
                    }
                },
            ],
        ];
    }
}
