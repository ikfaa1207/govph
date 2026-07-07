<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

/**
 * Thrown when a domain status transition is not allowed
 * (e.g. issuing a cancelled requisition, transferring a disposed property).
 */
class IllegalStatusTransitionException extends RuntimeException
{
    public function __construct(
        public readonly string $entityType,
        public readonly string $fromStatus,
        public readonly string $toStatus,
        ?Throwable $previous = null,
    ) {
        parent::__construct(
            "Illegal status transition for {$entityType}: '{$fromStatus}' -> '{$toStatus}'",
            0,
            $previous,
        );
    }
}
