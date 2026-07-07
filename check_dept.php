<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$employees = App\Models\Employee::where('department_id', 4)->with('user.roles')->get();
echo json_encode($employees);
