<?php

use App\Http\Controllers\Inventory\AcknowledgeAssignmentController;
use App\Http\Controllers\Inventory\AcknowledgeTransferController;
use App\Http\Controllers\Inventory\AdminController;
use App\Http\Controllers\Inventory\CategoryController;
use App\Http\Controllers\Inventory\DashboardController;
use App\Http\Controllers\Inventory\DepartmentController;
use App\Http\Controllers\Inventory\HelpdeskController;
use App\Http\Controllers\Inventory\ItemController;
use App\Http\Controllers\Inventory\LocationController;
use App\Http\Controllers\Inventory\MasterDataController;
use App\Http\Controllers\Inventory\OfficeController;
use App\Http\Controllers\Inventory\PhysicalCountController;
use App\Http\Controllers\Inventory\PropertyController;
use App\Http\Controllers\Inventory\PurchaseOrderController;
use App\Http\Controllers\Inventory\PurchaseRequestController;
use App\Http\Controllers\Inventory\ReceivingReportController;
use App\Http\Controllers\Inventory\ReportController;
use App\Http\Controllers\Inventory\RequisitionController;
use App\Http\Controllers\Inventory\SearchController;
use App\Http\Controllers\Inventory\SupplierController;
use App\Http\Controllers\Inventory\UnitController;
use App\Http\Controllers\Inventory\WarehouseController;
use App\Http\Controllers\RpcppeReportController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('inventory/search', [SearchController::class, 'index'])->name('inventory.search');

    // Items/Stock Management
    Route::get('inventory/items', [ItemController::class, 'index'])->name('inventory.items.index');
    Route::post('inventory/items', [ItemController::class, 'store'])->name('inventory.items.store');
    Route::put('inventory/items/{item}', [ItemController::class, 'update'])->name('inventory.items.update');
    Route::patch('inventory/items/{item}/toggle', [ItemController::class, 'toggleStatus'])->name('inventory.items.toggle');
    Route::get('inventory/items/{item}', [ItemController::class, 'show'])->name('inventory.items.show');

    // Purchase Requests
    Route::get('inventory/purchase-requests', [PurchaseRequestController::class, 'index'])->name('inventory.purchase-requests.index');
    Route::post('inventory/purchase-requests', [PurchaseRequestController::class, 'store'])->name('inventory.purchase-requests.store');
    Route::post('inventory/purchase-requests/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve'])->name('inventory.purchase-requests.approve');
    Route::post('inventory/purchase-requests/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject'])->name('inventory.purchase-requests.reject');
    Route::get('inventory/purchase-requests/{purchaseRequest}/print', [PurchaseRequestController::class, 'print'])->name('inventory.purchase-requests.print');

    // Purchase Orders
    Route::get('inventory/purchase-orders', [PurchaseOrderController::class, 'index'])->name('inventory.purchase-orders.index');
    Route::post('inventory/purchase-orders', [PurchaseOrderController::class, 'store'])->name('inventory.purchase-orders.store');
    Route::put('inventory/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->name('inventory.purchase-orders.update');
    Route::post('inventory/purchase-orders/{purchaseOrder}/send', [PurchaseOrderController::class, 'send'])->name('inventory.purchase-orders.send');
    Route::get('inventory/purchase-orders/{purchaseOrder}/print', [PurchaseOrderController::class, 'print'])->name('inventory.purchase-orders.print');

    // Receiving Reports (Stock In)
    Route::get('inventory/receiving-reports', [ReceivingReportController::class, 'index'])->name('inventory.receiving.index');
    Route::post('inventory/receiving-reports', [ReceivingReportController::class, 'store'])->name('inventory.receiving.store');
    Route::put('inventory/receiving-reports/{report}', [ReceivingReportController::class, 'update'])->name('inventory.receiving.update');
    Route::get('inventory/receiving-reports/{report}/history', [ReceivingReportController::class, 'history'])->name('inventory.receiving.history');
    Route::get('inventory/master-data', [MasterDataController::class, 'index'])->name('inventory.master-data.index');

    Route::post('inventory/suppliers', [SupplierController::class, 'store'])->name('inventory.suppliers.store');
    Route::put('inventory/suppliers/{supplier}', [SupplierController::class, 'update'])->name('inventory.suppliers.update');
    Route::post('inventory/suppliers/{supplier}/toggle', [SupplierController::class, 'toggleStatus'])->name('inventory.suppliers.toggle');

    Route::post('inventory/categories/seed-defaults', [CategoryController::class, 'seedDefaults'])->name('inventory.categories.seed-defaults');
    Route::post('inventory/categories', [CategoryController::class, 'store'])->name('inventory.categories.store');
    Route::put('inventory/categories/{category}', [CategoryController::class, 'update'])->name('inventory.categories.update');
    Route::post('inventory/categories/{category}/toggle', [CategoryController::class, 'toggleStatus'])->name('inventory.categories.toggle');

    Route::post('inventory/units/seed-defaults', [UnitController::class, 'seedDefaults'])->name('inventory.units.seed-defaults');
    Route::post('inventory/units', [UnitController::class, 'store'])->name('inventory.units.store');
    Route::put('inventory/units/{unit}', [UnitController::class, 'update'])->name('inventory.units.update');
    Route::post('inventory/units/{unit}/toggle', [UnitController::class, 'toggleStatus'])->name('inventory.units.toggle');

    Route::post('inventory/locations', [LocationController::class, 'store'])->name('inventory.locations.store');
    Route::put('inventory/locations/{location}', [LocationController::class, 'update'])->name('inventory.locations.update');
    Route::post('inventory/locations/{location}/toggle', [LocationController::class, 'toggleStatus'])->name('inventory.locations.toggle');

    Route::post('inventory/warehouses', [WarehouseController::class, 'store'])->name('inventory.warehouses.store');
    Route::put('inventory/warehouses/{warehouse}', [WarehouseController::class, 'update'])->name('inventory.warehouses.update');
    Route::post('inventory/warehouses/{warehouse}/toggle', [WarehouseController::class, 'toggleStatus'])->name('inventory.warehouses.toggle');

    Route::post('inventory/master-data/departments/seed-defaults', [DepartmentController::class, 'seedDefaults'])->name('inventory.master-data.departments.seed-defaults');
    Route::post('inventory/master-data/departments', [DepartmentController::class, 'store'])->name('inventory.master-data.departments.store');
    Route::put('inventory/master-data/departments/{department}', [DepartmentController::class, 'update'])->name('inventory.master-data.departments.update');

    Route::post('inventory/master-data/offices/seed-defaults', [OfficeController::class, 'seedDefaults'])->name('inventory.master-data.offices.seed-defaults');
    Route::post('inventory/master-data/offices', [OfficeController::class, 'store'])->name('inventory.master-data.offices.store');
    Route::put('inventory/master-data/offices/{office}', [OfficeController::class, 'update'])->name('inventory.master-data.offices.update');

    // Requisition/RIS
    Route::get('inventory/requisitions', [RequisitionController::class, 'index'])->name('inventory.requisitions.index');
    Route::post('inventory/requisitions', [RequisitionController::class, 'store'])->name('inventory.requisitions.store');
    Route::post('inventory/requisitions/{requisition}/approve', [RequisitionController::class, 'approve'])->name('inventory.requisitions.approve');
    Route::post('inventory/requisitions/{requisition}/reject', [RequisitionController::class, 'reject'])->name('inventory.requisitions.reject');
    Route::post('inventory/requisitions/{requisition}/issue', [RequisitionController::class, 'issue'])->name('inventory.requisitions.issue');
    Route::get('inventory/requisitions/{requisition}/print', [RequisitionController::class, 'print'])->name('inventory.requisitions.print');

    // Properties/Assets
    Route::get('inventory/properties/print-stickers', [PropertyController::class, 'printStickers'])->name('inventory.properties.print-stickers');
    Route::get('inventory/properties', [PropertyController::class, 'index'])->name('inventory.properties.index');
    Route::post('inventory/properties', [PropertyController::class, 'store'])->name('inventory.properties.store');
    Route::post('inventory/properties/batch-assign', [PropertyController::class, 'batchAssign'])->name('inventory.properties.batch-assign');
    Route::post('inventory/properties/{property}/assign', [PropertyController::class, 'assign'])->name('inventory.properties.assign');
    Route::post('inventory/properties/{property}/transfer', [PropertyController::class, 'transfer'])->name('inventory.properties.transfer');
    Route::post('inventory/properties/{property}/dispose', [PropertyController::class, 'dispose'])->name('inventory.properties.dispose');
    Route::post('inventory/property-assignments/{assignment}/acknowledge', AcknowledgeAssignmentController::class)->name('inventory.property-assignments.acknowledge');
    Route::post('inventory/property-transfers/{transfer}/acknowledge', AcknowledgeTransferController::class)->name('inventory.property-transfers.acknowledge');
    Route::post('inventory/properties/{property}/sub-assign', [PropertyController::class, 'subAssign'])->name('inventory.properties.sub-assign');
    Route::post('inventory/properties/sub-assignments/{subAssignment}/return', [PropertyController::class, 'returnSubAssignment'])->name('inventory.properties.sub-assignments.return');
    Route::put('inventory/properties/{property}', [PropertyController::class, 'update'])->name('inventory.properties.update');
    Route::post('inventory/properties/batch-update', [PropertyController::class, 'batchUpdate'])->name('inventory.properties.batch-update');

    // Reports
    Route::get('inventory/reports', [ReportController::class, 'index'])->name('inventory.reports.index');
    Route::get('inventory/reports/{type}', [ReportController::class, 'generate'])->name('inventory.reports.generate');

    // Physical Counts (RPCPPE/RPCI)
    Route::get('inventory/physical-counts', [PhysicalCountController::class, 'index'])->name('inventory.physical-counts.index');
    Route::post('inventory/physical-counts', [PhysicalCountController::class, 'store'])->name('inventory.physical-counts.store');
    Route::get('inventory/physical-counts/{physicalCount}', [PhysicalCountController::class, 'show'])->name('inventory.physical-counts.show');
    Route::put('inventory/physical-counts/{physicalCount}', [PhysicalCountController::class, 'update'])->name('inventory.physical-counts.update');
    Route::put('inventory/physical-counts/{physicalCount}/approve', [PhysicalCountController::class, 'approve'])->name('inventory.physical-counts.approve');
    Route::get('inventory/physical-counts/{physicalCount}/export', [PhysicalCountController::class, 'export'])->name('inventory.physical-counts.export');
    Route::delete('inventory/physical-counts/{physicalCount}', [PhysicalCountController::class, 'destroy'])->name('inventory.physical-counts.destroy');

    // Helpdesk
    Route::get('inventory/helpdesk', [HelpdeskController::class, 'index'])->name('helpdesk');
    Route::post('inventory/helpdesk', [HelpdeskController::class, 'store'])->name('helpdesk.store');
    Route::patch('inventory/helpdesk/{ticket}', [HelpdeskController::class, 'update'])->name('helpdesk.update');

    // Administration
    Route::get('inventory/admin/users', [AdminController::class, 'usersIndex'])->name('inventory.admin.users.index');
    Route::post('inventory/admin/users', [AdminController::class, 'storeUser'])->name('inventory.admin.users.store');
    Route::post('inventory/admin/users/{user}', [AdminController::class, 'updateUser'])->name('inventory.admin.users.update');
    Route::post('inventory/offices', [AdminController::class, 'storeOffice'])->name('inventory.offices.store');
    Route::post('inventory/departments', [AdminController::class, 'storeDepartment'])->name('inventory.departments.store');
    Route::post('inventory/admin/users/{user}/toggle', [AdminController::class, 'toggleUserStatus'])->name('inventory.admin.users.toggle');
    Route::post('inventory/admin/users/{user}/unlock', [AdminController::class, 'unlockUser'])->name('inventory.admin.users.unlock');
    Route::post('inventory/admin/users/{user}/reset-password', [AdminController::class, 'resetUserPassword'])->name('inventory.admin.users.reset-password');
    Route::get('inventory/admin/roles', [AdminController::class, 'rolesIndex'])->name('inventory.admin.roles.index');
    Route::post('inventory/admin/roles', [AdminController::class, 'storeRole'])->name('inventory.admin.roles.store');
    Route::post('inventory/admin/roles/{role}', [AdminController::class, 'updateRole'])->name('inventory.admin.roles.update');
    Route::post('inventory/admin/roles/{role}/clone', [AdminController::class, 'cloneRole'])->name('inventory.admin.roles.clone');
    Route::delete('inventory/admin/roles/{role}', [AdminController::class, 'deleteRole'])->name('inventory.admin.roles.delete');

    Route::get('/physical-counts/{physicalCount}/rpcppe', [RpcppeReportController::class, 'export'])->name('physical-counts.rpcppe');
});

require __DIR__.'/settings.php';
