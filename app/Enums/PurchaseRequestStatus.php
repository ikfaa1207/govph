<?php

namespace App\Enums;

enum PurchaseRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Ordered = 'ordered';
    case Completed = 'completed';
}
