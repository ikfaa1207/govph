<?php

namespace App\Http\Controllers;

use App\Actions\GenerateRpcppeReport;
use App\Models\PhysicalCount;
use Illuminate\Http\JsonResponse;

class RpcppeReportController extends Controller
{
    /**
     * Export the RPCPPE report.
     */
    public function export(PhysicalCount $physicalCount, GenerateRpcppeReport $action): JsonResponse
    {
        $reportData = $action->execute($physicalCount);

        return response()->json([
            'message' => 'RPCPPE Report generated successfully.',
            'data' => $reportData,
        ]);
    }
}
