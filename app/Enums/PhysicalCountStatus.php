<?php

namespace App\Enums;

enum PhysicalCountStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Finalized = 'finalized';
}
