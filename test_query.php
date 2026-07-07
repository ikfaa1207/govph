<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$deptHead = App\Models\Employee::where('department_id', 4)
    ->whereHas('user.roles', fn ($q) => $q->where('name', 'Department Head'))
    ->first();
echo "Found dept head: " . json_encode($deptHead);
