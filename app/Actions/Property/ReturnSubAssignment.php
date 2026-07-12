<?php

namespace App\Actions\Property;

use App\Models\PropertySubAssignment;
use App\Services\Audit\AuditLogger;

class ReturnSubAssignment
{
    /**
     * Return/close an internal Sub-Assignment (Memorandum Receipt).
     *
     * @param  array<string, mixed>  $data
     */
    public function execute(PropertySubAssignment $subAssignment, array $data): void
    {
        $subAssignment->returned_date = now()->toDateString();
        $subAssignment->remarks = ($subAssignment->remarks ? $subAssignment->remarks.' | ' : '').'Returned. '.($data['remarks'] ?? '');
        $subAssignment->save();

        AuditLogger::log('RETURN_MR', $subAssignment->property, null, ['mr_number' => $subAssignment->mr_number]);
    }
}
