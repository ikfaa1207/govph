<?php

namespace App\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Generates sequential, collision-free document numbers keyed by
 * (document type, year). Replaces the previous `uniqid()`-based
 * scheme used in RIS, PAR, PTR, IIRUP, and ISSUE documents.
 *
 * Output format: "{PREFIX}-{YEAR}-{6-digit zero-padded sequence}"
 *   e.g. "RIS-2026-000123"
 *
 * The unique index on (type, year) guarantees no two concurrent calls
 * produce the same number under SQLite/Postgres/MySQL.
 */
class DocumentSequenceService
{
    /**
     * Map of document type code -> display prefix used in the output string.
     */
    private const PREFIXES = [
        'RIS' => 'RIS',
        'ISSUE' => 'ISSUE',
        'PAR' => 'PAR',
        'ICS' => 'ICS',
        'PTR' => 'PTR',
        'IIRUP' => 'IIRUP',
        'ITEM' => 'ITEM',
        'PPE' => 'PPE',
        'EMP' => 'EMP',
        'MR' => 'MR',
    ];

    /**
     * Allocate and return the next number for the given document type.
     * Atomic across concurrent requests.
     */
    public function next(string $type, ?int $year = null): string
    {
        $year ??= (int) date('Y');

        if (! isset(self::PREFIXES[$type])) {
            throw new RuntimeException("Unknown document type: {$type}");
        }

        $prefix = self::PREFIXES[$type];

        $sequence = DB::transaction(function () use ($type, $year) {
            // INSERT IGNORE / ON CONFLICT do the same job: insert a fresh
            // row at sequence 1, or no-op if a row already exists for the
            // (type, year) pair. Then SELECT FOR UPDATE-equivalent row lock
            // by primary key, increment, save.
            $row = DB::table('document_sequences')
                ->where('type', $type)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if (! $row) {
                try {
                    DB::table('document_sequences')->insert([
                        'type' => $type,
                        'year' => $year,
                        'last_value' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (QueryException) {
                    // Race: another request inserted first. Re-select.
                    $row = DB::table('document_sequences')
                        ->where('type', $type)
                        ->where('year', $year)
                        ->lockForUpdate()
                        ->first();
                }
            }

            if ($row === null) {
                $row = DB::table('document_sequences')
                    ->where('type', $type)
                    ->where('year', $year)
                    ->lockForUpdate()
                    ->first();
            }

            $next = (int) $row->last_value + 1;

            DB::table('document_sequences')
                ->where('id', $row->id)
                ->update([
                    'last_value' => $next,
                    'updated_at' => now(),
                ]);

            return $next;
        }, 3);

        return sprintf('%s-%d-%06d', $prefix, $year, $sequence);
    }
}
