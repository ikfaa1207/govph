<?php

namespace App\Actions;

use App\Models\PhysicalCount;
use App\Models\PhysicalCountCommittee;
use App\Models\PhysicalCountItem;

class GenerateRpcppeReport
{
    /**
     * Generate the RPCPPE report for a given physical count.
     *
     * @return array<string, mixed>
     */
    public function execute(PhysicalCount $physicalCount): array
    {
        // Load relationships
        $physicalCount->load(['items.item', 'items.property', 'committees.employee', 'creator', 'coaRepresentative']);

        // In a real application, this would generate a PDF or Excel file.
        // For this implementation, we return a structured array that can be
        // returned as JSON or passed to a view for PDF generation.

        return [
            'report_title' => 'Report on the Physical Count of Property, Plant and Equipment',
            'as_of_date' => $physicalCount->as_of_date->format('F d, Y'),
            'type' => $physicalCount->type,
            'status' => $physicalCount->status->value ?? $physicalCount->status,
            'prepared_by' => $physicalCount->creator ? $physicalCount->creator->name : 'N/A',
            'coa_representative' => $physicalCount->coaRepresentative
                ? $physicalCount->coaRepresentative->name
                : ($physicalCount->coa_representative_absent_reason ?: 'N/A'),
            'items' => $physicalCount->items->map(function (PhysicalCountItem $item) {
                return [
                    'article' => $item->item ? $item->item->name : 'N/A',
                    'description' => $item->item ? $item->item->description : ($item->property ? $item->property->brand.' '.$item->property->model : 'N/A'),
                    'property_number' => $item->item ? $item->item->stock_number : ($item->property ? $item->property->property_number : 'N/A'),
                    'unit_measure' => 'Unit',
                    'unit_value' => $item->item ? $item->item->unit_cost : ($item->property ? $item->property->unit_cost : 0),
                    'balance_per_card' => $item->recorded_qty,
                    'on_hand_per_count' => $item->actual_qty,
                    'shortage_overage' => (float) $item->actual_qty - (float) $item->recorded_qty,
                    'remarks' => $item->remarks,
                ];
            })->toArray(),
            'committees' => $physicalCount->committees->map(function (PhysicalCountCommittee $committee) {
                return [
                    'name' => $committee->employee ? $committee->employee->name : 'Unknown',
                    'role' => $committee->role,
                ];
            })->toArray(),
        ];
    }
}
