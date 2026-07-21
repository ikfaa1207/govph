<?php

namespace App\Http\Requests;

use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\ReceivingReportItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateReceivingReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('warehouse.receive');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $status = $this->input('status', 'finalized');
        $report = $this->route('report');
        $reportId = $report instanceof ReceivingReport ? $report->id : null;

        return [
            'status' => ['nullable', 'in:draft,finalized'],
            'po_number' => ['required', 'string', 'max:255', 'exists:purchase_orders,po_number'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'po_date' => ['required', 'date'],
            'iar_number' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'string',
                'max:255',
                'unique:receiving_reports,iar_number,'.$reportId,
            ],
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'delivery_receipt_number' => [$status === 'finalized' ? 'required' : 'nullable', 'string', 'max:255'],
            'received_date' => [$status === 'finalized' ? 'required' : 'nullable', 'date'],
            'received_by' => [$status === 'finalized' ? 'required' : 'nullable', 'exists:employees,id'],
            'inspected_by' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'exists:employees,id',
                $status === 'finalized' ? 'different:received_by' : '',
            ],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer'], // track existing items
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.quantity_received' => ['required', 'integer', 'min:1'],
            'items.*.quantity_accepted' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'integer',
                'min:0',
                function (string $attribute, mixed $value, \Closure $fail) {
                    preg_match('/items\.(\d+)\.quantity_accepted/', $attribute, $matches);
                    if (! isset($matches[1])) {
                        return;
                    }
                    $index = $matches[1];
                    $receivedQty = (int) $this->input("items.{$index}.quantity_received");
                    if ($value > $receivedQty) {
                        $fail("The accepted quantity cannot exceed the received quantity ({$receivedQty}).");
                    }
                },
            ],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.batch_number' => ['nullable', 'string', 'max:255'],
            'items.*.expiration_date' => ['nullable', 'date'],
            'items.*.rejection_reason' => ['nullable', 'string'],
        ];
    }

    /**
     * Get the "after" validation callables for the request.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $poNumber = $this->input('po_number');
                if (! $poNumber) {
                    return;
                }

                $po = PurchaseOrder::where('po_number', $poNumber)->first();
                if (! $po) {
                    return; // Already handled by the exists rule
                }

                // Check PO status
                $poStatus = $po->status instanceof \BackedEnum ? $po->status->value : $po->status;
                if (! in_array($poStatus, ['sent', 'partially_received', 'received'])) {
                    $validator->errors()->add('po_number', "Purchase Order is in '{$poStatus}' status and cannot be received against.");
                }

                // Check item validity and quantities
                $items = $this->input('items', []);
                $report = $this->route('report');
                $reportId = $report instanceof ReceivingReport ? $report->id : null;

                foreach ($items as $index => $itemData) {
                    $itemId = $itemData['item_id'] ?? null;
                    $qtyReceived = (int) ($itemData['quantity_received'] ?? 0);

                    if (! $itemId) {
                        continue;
                    }

                    $poItem = $po->items()->where('item_id', $itemId)->first();
                    if (! $poItem) {
                        $validator->errors()->add("items.{$index}.item_id", 'This item is not part of the specified Purchase Order.');

                        continue;
                    }

                    // Calculate previously accepted quantity across all finalized receiving reports for this PO (excluding this report)
                    $previouslyAccepted = ReceivingReportItem::whereHas('receivingReport', function ($q) use ($po, $reportId) {
                        $q->where('purchase_order_id', $po->id)
                            ->where('status', 'finalized')
                            ->when($reportId, function ($query) use ($reportId) {
                                $query->where('id', '!=', $reportId);
                            });
                    })->where('item_id', $itemId)->sum('quantity_accepted');

                    if (($previouslyAccepted + $qtyReceived) > $poItem->quantity) {
                        $validator->errors()->add(
                            "items.{$index}.quantity_received",
                            'Total received quantity ('.($previouslyAccepted + $qtyReceived).") exceeds ordered quantity ({$poItem->quantity})."
                        );
                    }
                }
            },
        ];
    }
}
