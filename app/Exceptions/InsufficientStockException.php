<?php

namespace App\Exceptions;

use App\Models\Item;
use RuntimeException;
use Throwable;

/**
 * Thrown when attempting to issue more units of an item than are available.
 */
class InsufficientStockException extends RuntimeException
{
    public function __construct(
        public readonly Item $item,
        public readonly int $requested,
        public readonly int $available,
        ?Throwable $previous = null,
    ) {
        parent::__construct(
            "Insufficient stock for item '{$item->name}': requested {$requested}, available {$available}.",
            0,
            $previous,
        );
    }
}
