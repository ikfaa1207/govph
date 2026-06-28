<?php

use App\Http\Controllers\Inventory\AdminController;
use App\Http\Controllers\Inventory\CategoryController;
use App\Http\Controllers\Inventory\DashboardController;
use App\Http\Controllers\Inventory\HelpdeskController;
use App\Http\Controllers\Inventory\ItemController;
use App\Http\Controllers\Inventory\LocationController;
use App\Http\Controllers\Inventory\PropertyController;
use App\Http\Controllers\Inventory\ReportController;
use App\Http\Controllers\Inventory\RequisitionController;
use App\Http\Controllers\Inventory\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Items/Stock Management
    Route::get('inventory/items', [ItemController::class, 'index'])->name('inventory.items.index');
    Route::post('inventory/items', [ItemController::class, 'store'])->name('inventory.items.store');
    Route::get('inventory/items/{item}', [ItemController::class, 'show'])->name('inventory.items.show');
    Route::post('inventory/categories', [CategoryController::class, 'store'])->name('inventory.categories.store');
    Route::post('inventory/locations', [LocationController::class, 'store'])->name('inventory.locations.store');
    Route::post('inventory/warehouses', [WarehouseController::class, 'store'])->name('inventory.warehouses.store');

    // Requisition/RIS
    Route::get('inventory/requisitions', [RequisitionController::class, 'index'])->name('inventory.requisitions.index');
    Route::post('inventory/requisitions', [RequisitionController::class, 'store'])->name('inventory.requisitions.store');
    Route::post('inventory/requisitions/{requisition}/approve', [RequisitionController::class, 'approve'])->name('inventory.requisitions.approve');
    Route::post('inventory/requisitions/{requisition}/issue', [RequisitionController::class, 'issue'])->name('inventory.requisitions.issue');
    Route::get('inventory/requisitions/{requisition}/print', [RequisitionController::class, 'print'])->name('inventory.requisitions.print');

    // Properties/Assets
    Route::get('inventory/properties', [PropertyController::class, 'index'])->name('inventory.properties.index');
    Route::post('inventory/properties', [PropertyController::class, 'store'])->name('inventory.properties.store');
    Route::post('inventory/properties/{property}/assign', [PropertyController::class, 'assign'])->name('inventory.properties.assign');
    Route::post('inventory/properties/{property}/transfer', [PropertyController::class, 'transfer'])->name('inventory.properties.transfer');
    Route::post('inventory/properties/{property}/dispose', [PropertyController::class, 'dispose'])->name('inventory.properties.dispose');

    // Reports
    Route::get('inventory/reports', [ReportController::class, 'index'])->name('inventory.reports.index');
    Route::get('inventory/reports/{type}', [ReportController::class, 'generate'])->name('inventory.reports.generate');

    // Helpdesk
    Route::get('inventory/helpdesk', [HelpdeskController::class, 'index'])->name('helpdesk');
    Route::post('inventory/helpdesk', [HelpdeskController::class, 'store'])->name('helpdesk.store');
    Route::patch('inventory/helpdesk/{ticket}', [HelpdeskController::class, 'update'])->name('helpdesk.update');

    // Administration
    Route::get('inventory/admin/users', [AdminController::class, 'usersIndex'])->name('inventory.admin.users.index');
    Route::post('inventory/admin/users', [AdminController::class, 'storeUser'])->name('inventory.admin.users.store');
    Route::post('inventory/admin/users/{user}', [AdminController::class, 'updateUser'])->name('inventory.admin.users.update');
    Route::post('inventory/admin/users/{user}/toggle', [AdminController::class, 'toggleUserStatus'])->name('inventory.admin.users.toggle');
    Route::post('inventory/admin/users/{user}/unlock', [AdminController::class, 'unlockUser'])->name('inventory.admin.users.unlock');
    Route::post('inventory/admin/users/{user}/reset-password', [AdminController::class, 'resetUserPassword'])->name('inventory.admin.users.reset-password');
    Route::get('inventory/admin/roles', [AdminController::class, 'rolesIndex'])->name('inventory.admin.roles.index');
    Route::post('inventory/admin/roles', [AdminController::class, 'storeRole'])->name('inventory.admin.roles.store');
    Route::post('inventory/admin/roles/{role}', [AdminController::class, 'updateRole'])->name('inventory.admin.roles.update');
    Route::post('inventory/admin/roles/{role}/clone', [AdminController::class, 'cloneRole'])->name('inventory.admin.roles.clone');
    Route::delete('inventory/admin/roles/{role}', [AdminController::class, 'deleteRole'])->name('inventory.admin.roles.delete');
});

require __DIR__.'/settings.php';
