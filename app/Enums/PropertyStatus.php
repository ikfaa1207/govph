<?php

namespace App\Enums;

enum PropertyStatus: string
{
    case Available = 'available';
    case Assigned = 'assigned';
    case Transferred = 'transferred';
    case Disposed = 'disposed';
}
