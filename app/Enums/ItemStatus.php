<?php

namespace App\Enums;

enum ItemStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Obsolete = 'obsolete';
}
