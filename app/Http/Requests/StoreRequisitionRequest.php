<?php

namespace App\Http\Requests;

use App\Models\Item;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRequisitionRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => [
                'required',
                'exists:items,id',
                function ($attribute, $value, $fail) {
                    $item = Item::find($value);
                    if ($item instanceof Item && $item->current_stock < 1) {
                        $fail("The selected item '{$item->name}' is out of stock.");
                    }
                },
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'purpose' => ['nullable', 'string'],
        ];
    }
}
