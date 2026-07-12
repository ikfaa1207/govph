<?php

namespace App\Enums;

enum RequisitionStatus: string
{
    case PendingDeptHead = 'pending_dept_head';
    case RejectedDeptHead = 'rejected_dept_head';
    case PendingSupply = 'pending_supply';
    case Issued = 'issued';
    case PartiallyIssued = 'partially_issued';
    case Cancelled = 'cancelled';
}
