<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\Inventory\DashboardController::class, 'index'])->name('dashboard');

    // Items/Stock Management
    Route::get('inventory/items', [App\Http\Controllers\Inventory\ItemController::class, 'index'])->name('inventory.items.index');
    Route::post('inventory/items', [App\Http\Controllers\Inventory\ItemController::class, 'store'])->name('inventory.items.store');
    Route::get('inventory/items/{item}', [App\Http\Controllers\Inventory\ItemController::class, 'show'])->name('inventory.items.show');

    // Requisition/RIS
    Route::get('inventory/requisitions', [App\Http\Controllers\Inventory\RequisitionController::class, 'index'])->name('inventory.requisitions.index');
    Route::post('inventory/requisitions', [App\Http\Controllers\Inventory\RequisitionController::class, 'store'])->name('inventory.requisitions.store');
    Route::post('inventory/requisitions/{requisition}/approve', [App\Http\Controllers\Inventory\RequisitionController::class, 'approve'])->name('inventory.requisitions.approve');
    Route::post('inventory/requisitions/{requisition}/issue', [App\Http\Controllers\Inventory\RequisitionController::class, 'issue'])->name('inventory.requisitions.issue');

    // Properties/Assets
    Route::get('inventory/properties', [App\Http\Controllers\Inventory\PropertyController::class, 'index'])->name('inventory.properties.index');
    Route::post('inventory/properties', [App\Http\Controllers\Inventory\PropertyController::class, 'store'])->name('inventory.properties.store');
    Route::post('inventory/properties/{property}/assign', [App\Http\Controllers\Inventory\PropertyController::class, 'assign'])->name('inventory.properties.assign');
    Route::post('inventory/properties/{property}/transfer', [App\Http\Controllers\Inventory\PropertyController::class, 'transfer'])->name('inventory.properties.transfer');
    Route::post('inventory/properties/{property}/dispose', [App\Http\Controllers\Inventory\PropertyController::class, 'dispose'])->name('inventory.properties.dispose');

    // Reports
    Route::get('inventory/reports', [App\Http\Controllers\Inventory\ReportController::class, 'index'])->name('inventory.reports.index');
    Route::get('inventory/reports/{type}', [App\Http\Controllers\Inventory\ReportController::class, 'generate'])->name('inventory.reports.generate');

    // Helpdesk
    Route::get('inventory/helpdesk', [App\Http\Controllers\Inventory\HelpdeskController::class, 'index'])->name('helpdesk');
    Route::post('inventory/helpdesk', [App\Http\Controllers\Inventory\HelpdeskController::class, 'store'])->name('helpdesk.store');
    Route::patch('inventory/helpdesk/{ticket}', [App\Http\Controllers\Inventory\HelpdeskController::class, 'update'])->name('helpdesk.update');

    // Administration
    Route::get('inventory/admin/users', [App\Http\Controllers\Inventory\AdminController::class, 'usersIndex'])->name('inventory.admin.users.index');
    Route::post('inventory/admin/users', [App\Http\Controllers\Inventory\AdminController::class, 'storeUser'])->name('inventory.admin.users.store');
    Route::post('inventory/admin/users/{user}', [App\Http\Controllers\Inventory\AdminController::class, 'updateUser'])->name('inventory.admin.users.update');
    Route::post('inventory/admin/users/{user}/toggle', [App\Http\Controllers\Inventory\AdminController::class, 'toggleUserStatus'])->name('inventory.admin.users.toggle');
    Route::post('inventory/admin/users/{user}/unlock', [App\Http\Controllers\Inventory\AdminController::class, 'unlockUser'])->name('inventory.admin.users.unlock');
    Route::post('inventory/admin/users/{user}/reset-password', [App\Http\Controllers\Inventory\AdminController::class, 'resetUserPassword'])->name('inventory.admin.users.reset-password');
    Route::get('inventory/admin/roles', [App\Http\Controllers\Inventory\AdminController::class, 'rolesIndex'])->name('inventory.admin.roles.index');
    Route::post('inventory/admin/roles', [App\Http\Controllers\Inventory\AdminController::class, 'storeRole'])->name('inventory.admin.roles.store');
    Route::post('inventory/admin/roles/{role}', [App\Http\Controllers\Inventory\AdminController::class, 'updateRole'])->name('inventory.admin.roles.update');
    Route::post('inventory/admin/roles/{role}/clone', [App\Http\Controllers\Inventory\AdminController::class, 'cloneRole'])->name('inventory.admin.roles.clone');
    Route::delete('inventory/admin/roles/{role}', [App\Http\Controllers\Inventory\AdminController::class, 'deleteRole'])->name('inventory.admin.roles.delete');
});

require __DIR__.'/settings.php';
