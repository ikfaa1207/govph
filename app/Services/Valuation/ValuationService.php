<?php

namespace App\Services\Valuation;

use App\Exceptions\InsufficientStockException;
use App\Models\Item;
use App\Models\StockTransaction;
use Illuminate\Support\Facades\DB;

class ValuationService
{
    /**
     * Record a stock-in transaction and update the item's average unit cost.
     */
    public function recordStockIn(
        Item $item,
        int $quantity,
        float $unitCost,
        string $referenceType,
        int $referenceId,
        ?string $remarks = null
    ): StockTransaction {
        return DB::transaction(function () use ($item, $quantity, $unitCost, $referenceType, $referenceId, $remarks) {
            // Re-fetch the item with a row lock to prevent concurrent updates
            $lockedItem = Item::where('id', $item->id)->lockForUpdate()->first();

            // Get current stock quantity before this transaction
            $currentQty = $lockedItem->current_stock;
            $currentCost = (float) $lockedItem->unit_cost;

            // Recalculate moving average cost
            $newQuantity = $currentQty + $quantity;
            if ($newQuantity > 0) {
                $newCost = (($currentQty * $currentCost) + ($quantity * $unitCost)) / $newQuantity;
            } else {
                $newCost = $unitCost;
            }

            // Update item's cost and stock, then persist
            $lockedItem->unit_cost = round($newCost, 2);
            $lockedItem->current_stock = $newQuantity;
            $lockedItem->save();

            // Create stock transaction
            return StockTransaction::create([
                'item_id' => $lockedItem->id,
                'transaction_type' => 'in',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'remarks' => $remarks,
            ]);
        });
    }

    /**
     * Record a stock-out transaction. Uses the current average unit cost of the item.
     * Returns the unit cost at the time of issuance.
     */
    public function recordStockOut(
        Item $item,
        int $quantity,
        string $referenceType,
        int $referenceId,
        ?string $remarks = null
    ): float {
        return DB::transaction(function () use ($item, $quantity, $referenceType, $referenceId, $remarks) {
            // Lock the item row to ensure consistent unit cost read
            $lockedItem = Item::where('id', $item->id)->lockForUpdate()->first();

            if (! $lockedItem) {
                throw new \RuntimeException('Item not found');
            }

            if ($lockedItem->current_stock < $quantity) {
                throw new InsufficientStockException($lockedItem, $quantity, $lockedItem->current_stock);
            }

            $issuedUnitCost = (float) $lockedItem->unit_cost;

            // Deduct stock and persist
            $lockedItem->current_stock -= $quantity;
            $lockedItem->save();

            // Create negative stock transaction
            StockTransaction::create([
                'item_id' => $lockedItem->id,
                'transaction_type' => 'out',
                'quantity' => -$quantity, // Negative for stock out
                'unit_cost' => $issuedUnitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'remarks' => $remarks,
            ]);

            return $issuedUnitCost;
        });
    }

    /**
     * Reverse a previous stock-in transaction.
     * Reduces the stock by the given quantity, and subtracts the exact total value of that transaction
     * from the moving average calculation to restore the unit cost prior to that specific stock-in.
     */
    public function reverseStockIn(
        Item $item,
        int $quantity,
        float $unitCost,
        string $referenceType,
        int $referenceId,
        ?string $remarks = null
    ): StockTransaction {
        return DB::transaction(function () use ($item, $quantity, $unitCost, $referenceType, $referenceId, $remarks) {
            $lockedItem = Item::where('id', $item->id)->lockForUpdate()->first();
            $currentQty = $lockedItem->current_stock;
            $currentCost = (float) $lockedItem->unit_cost;

            $newQuantity = $currentQty - $quantity;

            // To properly reverse moving average:
            // (CurrentTotalValue - ReversedTotalValue) / NewQuantity
            if ($newQuantity > 0) {
                $currentTotalValue = $currentQty * $currentCost;
                $reversedTotalValue = $quantity * $unitCost;
                $newTotalValue = $currentTotalValue - $reversedTotalValue;
                $newCost = max(0, $newTotalValue / $newQuantity); // Avoid negative cost
            } else {
                $newCost = $currentCost; // Keep last known cost if stock drops to 0
            }

            $lockedItem->unit_cost = round($newCost, 2);
            $lockedItem->current_stock = max(0, $newQuantity);
            $lockedItem->save();

            return StockTransaction::create([
                'item_id' => $lockedItem->id,
                'transaction_type' => 'out', // Negative adjustment
                'quantity' => -$quantity,
                'unit_cost' => $unitCost, // Store original cost reversed
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'remarks' => $remarks,
            ]);
        });
    }
}
