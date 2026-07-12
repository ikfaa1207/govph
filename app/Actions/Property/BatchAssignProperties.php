<?php

namespace App\Actions\Property;

use App\Enums\PropertyStatus;
use App\Models\Employee;
use App\Models\Property;
use App\Services\DocumentSequenceService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BatchAssignProperties
{
    public function __construct(
        protected DocumentSequenceService $sequences,
        protected AssignProperty $assignProperty
    ) {}

    /**
     * Assign multiple properties to an employee in a batch.
     *
     * @param  Collection<int, Property>  $properties
     * @param  array<string, mixed>  $data
     * @return Collection<int, PropertyAssignment>
     */
    public function execute(Collection $properties, array $data, Employee $custodian): Collection
    {
        foreach ($properties as $property) {
            if ($property->status !== PropertyStatus::Available) {
                throw new InvalidArgumentException("Property {$property->property_number} is not available for assignment.");
            }
        }

        return DB::transaction(function () use ($properties, $data, $custodian) {
            $grouped = $properties->groupBy(fn (Property $property) => $this->assignProperty->documentTypeFor($property));

            return $grouped->flatMap(function (Collection $group, string $docType) use ($data, $custodian) {
                $docNo = $this->sequences->next($docType);

                return $group->map(
                    fn (Property $property) => $this->assignProperty->assignWithDocument($property, $data, $custodian, $docType, $docNo)
                );
            })->values();
        });
    }
}
