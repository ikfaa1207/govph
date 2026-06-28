<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\Disposal;
use App\Models\Employee;
use App\Models\Issuance;
use App\Models\IssuanceItem;
use App\Models\Item;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\PropertyTransfer;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\Supplier;
use App\Models\Unit;
use App\Services\Valuation\ValuationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key constraints to safely truncate/delete existing records
        DB::statement('PRAGMA foreign_keys = OFF;');

        // Clear existing demo tables (leaves users, roles, and permissions intact)
        DB::table('stock_transactions')->truncate();
        DB::table('requisition_items')->truncate();
        DB::table('requisitions')->truncate();
        DB::table('issuance_items')->truncate();
        DB::table('issuances')->truncate();
        DB::table('property_assignments')->truncate();
        DB::table('property_transfers')->truncate();
        DB::table('disposals')->truncate();
        DB::table('properties')->truncate();
        DB::table('items')->truncate();

        DB::statement('PRAGMA foreign_keys = ON;');

        $valuationService = new ValuationService;

        // 1. Get references to existing static lookup data
        $supplier = Supplier::first() ?: Supplier::create([
            'name' => 'GovSupply Co. Ltd.',
            'address' => '123 Quezon Ave, Quezon City',
            'contact_person' => 'Juan Dela Cruz',
            'contact_number' => '+63 912 345 6789',
            'tin' => '123-456-789-000',
        ]);

        $catSupplies = Category::where('code', 'OFF-SUPP')->first() ?: Category::create(['name' => 'Office Supplies', 'code' => 'OFF-SUPP', 'is_ppe' => false]);
        $catItEqp = Category::where('code', 'IT-EQP')->first() ?: Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP', 'is_ppe' => true]);

        $unitPc = Unit::where('abbreviation', 'pc')->first() ?: Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
        $unitBox = Unit::where('abbreviation', 'box')->first() ?: Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
        $unitReam = Unit::where('abbreviation', 'ream')->first() ?: Unit::create(['name' => 'Ream', 'abbreviation' => 'ream']);

        $loc1 = Location::where('code', 'SHELF-A-01')->first() ?: Location::create(['warehouse_id' => 1, 'code' => 'SHELF-A-01', 'description' => 'Top Shelf, Row A']);
        $loc2 = Location::where('code', 'SHELF-B-02')->first() ?: Location::create(['warehouse_id' => 1, 'code' => 'SHELF-B-02', 'description' => 'Middle Shelf, Row B']);

        // Get standard Employees from DatabaseSeeder
        $empSupply = Employee::where('employee_id', 'EMP-SUPPLY-02')->first();
        $empHead = Employee::where('employee_id', 'EMP-HEAD-04')->first();
        $empStaff = Employee::where('employee_id', 'EMP-STAFF-05')->first();
        $empAdmin = Employee::where('employee_id', 'EMP-ADMIN-01')->first();

        if (! $empSupply || ! $empHead || ! $empStaff || ! $empAdmin) {
            $this->command->error('Users/Employees must be seeded first. Run database/seeders/DatabaseSeeder.');

            return;
        }

        // ==========================================
        // 2. SEED ITEMS & INITIAL STOCK IN TRANSACTIONS
        // ==========================================

        // Item A4 Paper
        $itemPaper = Item::create([
            'item_code' => 'OFF-BOND-A4',
            'stock_number' => '10000001',
            'name' => 'A4 Coupon Bond Paper (80gsm)',
            'description' => 'High quality multipurpose copier paper.',
            'category_id' => $catSupplies->id,
            'unit_id' => $unitReam->id,
            'unit_cost' => 0.00,
            'reorder_level' => 15,
            'maximum_stock' => 120,
            'location_id' => $loc1->id,
            'status' => 'active',
        ]);
        // Two Stock-Ins with different prices to demonstrate moving average calculation
        $valuationService->recordStockIn($itemPaper, 60, 220.00, Supplier::class, $supplier->id, 'Initial procurement batch');
        $itemPaper->refresh();
        $valuationService->recordStockIn($itemPaper, 40, 240.00, Supplier::class, $supplier->id, 'Supplementary emergency purchase');
        $itemPaper->refresh(); // New Moving Average: (60*220 + 40*240) / 100 = 228.00

        // Item Black Pens
        $itemPen = Item::create([
            'item_code' => 'OFF-PEN-BLK',
            'stock_number' => '10000002',
            'name' => 'Fine Gel Pen (Black, 0.5mm)',
            'description' => 'Smooth writing gel ink pens for office signatures.',
            'category_id' => $catSupplies->id,
            'unit_id' => $unitPc->id,
            'unit_cost' => 0.00,
            'reorder_level' => 30,
            'maximum_stock' => 300,
            'location_id' => $loc1->id,
            'status' => 'active',
        ]);
        $valuationService->recordStockIn($itemPen, 200, 15.00, Supplier::class, $supplier->id, 'Standard office supplies replenishment');
        $itemPen->refresh();

        // Item Whiteboard Markers
        $itemMarker = Item::create([
            'item_code' => 'OFF-MRK-BLU',
            'stock_number' => '10000003',
            'name' => 'Whiteboard Marker (Blue)',
            'description' => 'Dry-erase whiteboard bullet tip marker.',
            'category_id' => $catSupplies->id,
            'unit_id' => $unitPc->id,
            'unit_cost' => 0.00,
            'reorder_level' => 20,
            'maximum_stock' => 100,
            'location_id' => $loc1->id,
            'status' => 'active',
        ]);
        $valuationService->recordStockIn($itemMarker, 50, 42.50, Supplier::class, $supplier->id, 'Training center batch');
        $itemMarker->refresh();

        // Item Heavy Duty Stapler
        $itemStapler = Item::create([
            'item_code' => 'OFF-STP-HD',
            'stock_number' => '10000004',
            'name' => 'Heavy Duty Stapler (30-Sheet)',
            'description' => 'All-metal desk stapler for heavy office archiving.',
            'category_id' => $catSupplies->id,
            'unit_id' => $unitPc->id,
            'unit_cost' => 0.00,
            'reorder_level' => 5,
            'maximum_stock' => 20,
            'location_id' => $loc2->id,
            'status' => 'active',
        ]);
        $valuationService->recordStockIn($itemStapler, 12, 280.00, Supplier::class, $supplier->id, 'Equipment upgrade release');
        $itemStapler->refresh();

        // Item Post-it Notes
        $itemPostit = Item::create([
            'item_code' => 'OFF-PST-3X3',
            'stock_number' => '10000005',
            'name' => 'Sticky Notes 3x3 (Yellow, 100 sheets)',
            'description' => 'Self-adhesive notes for tasks and agile planning.',
            'category_id' => $catSupplies->id,
            'unit_id' => $unitBox->id,
            'unit_cost' => 0.00,
            'reorder_level' => 15,
            'maximum_stock' => 80,
            'location_id' => $loc2->id,
            'status' => 'active',
        ]);
        $valuationService->recordStockIn($itemPostit, 35, 55.00, Supplier::class, $supplier->id, 'Agile planning boards stock');
        $itemPostit->refresh();

        // Item USB Keyboard (IT accessory consumable)
        $itemKybd = Item::create([
            'item_code' => 'IT-ACC-KYBD',
            'stock_number' => '20000001',
            'name' => 'USB Standard Keyboard (QWERTY)',
            'description' => 'Wired membrane standard keyboard.',
            'category_id' => $catItEqp->id,
            'unit_id' => $unitPc->id,
            'unit_cost' => 0.00,
            'reorder_level' => 10,
            'maximum_stock' => 50,
            'location_id' => $loc2->id,
            'status' => 'active',
        ]);
        $valuationService->recordStockIn($itemKybd, 30, 490.00, Supplier::class, $supplier->id, 'IT Helpdesk storage stock');
        $itemKybd->refresh();

        // ==========================================
        // 3. SEED REQUISITION AND ISSUE SLIPS (RIS)
        // ==========================================

        // RIS #1: Pending Department Head Approval
        $ris1 = Requisition::create([
            'ris_number' => 'RIS-20260627-HR01',
            'requesting_employee_id' => $empStaff->id,
            'department_id' => $empStaff->department_id,
            'status' => 'pending_dept_head',
            'remarks' => 'Office supplies for HR training next week.',
            'created_at' => now()->subDay(),
        ]);
        RequisitionItem::create([
            'requisition_id' => $ris1->id,
            'item_id' => $itemPaper->id,
            'quantity_requested' => 12,
            'quantity_approved' => 0,
            'quantity_issued' => 0,
        ]);
        RequisitionItem::create([
            'requisition_id' => $ris1->id,
            'item_id' => $itemPen->id,
            'quantity_requested' => 20,
            'quantity_approved' => 0,
            'quantity_issued' => 0,
        ]);

        // RIS #2: Approved by Dept Head, awaiting Supply Officer issuance
        $ris2 = Requisition::create([
            'ris_number' => 'RIS-20260626-HR02',
            'requesting_employee_id' => $empStaff->id,
            'department_id' => $empStaff->department_id,
            'status' => 'pending_supply',
            'department_head_id' => $empHead->id,
            'approved_at' => now()->subDays(2),
            'remarks' => 'Materials for the recruitment panel.',
            'created_at' => now()->subDays(3),
        ]);
        RequisitionItem::create([
            'requisition_id' => $ris2->id,
            'item_id' => $itemPaper->id,
            'quantity_requested' => 6,
            'quantity_approved' => 6,
            'quantity_issued' => 0,
        ]);
        RequisitionItem::create([
            'requisition_id' => $ris2->id,
            'item_id' => $itemPostit->id,
            'quantity_requested' => 10,
            'quantity_approved' => 8, // Dept Head approved slightly less
            'quantity_issued' => 0,
        ]);

        // RIS #3: Fully Issued and Stock Cards updated
        $ris3 = Requisition::create([
            'ris_number' => 'RIS-20260623-HR03',
            'requesting_employee_id' => $empStaff->id,
            'department_id' => $empStaff->department_id,
            'status' => 'issued',
            'department_head_id' => $empHead->id,
            'approved_at' => now()->subDays(5),
            'remarks' => 'Regular monthly office stationeries.',
            'created_at' => now()->subDays(6),
        ]);

        $riPaper = RequisitionItem::create([
            'requisition_id' => $ris3->id,
            'item_id' => $itemPaper->id,
            'quantity_requested' => 5,
            'quantity_approved' => 5,
            'quantity_issued' => 5,
        ]);
        $riPen = RequisitionItem::create([
            'requisition_id' => $ris3->id,
            'item_id' => $itemPen->id,
            'quantity_requested' => 12,
            'quantity_approved' => 12,
            'quantity_issued' => 12,
        ]);

        // Record the formal Issuance Handovers
        $issuance3 = Issuance::create([
            'requisition_id' => $ris3->id,
            'issue_number' => 'ISSUE-20260624-001',
            'issued_date' => now()->subDays(4)->toDateString(),
            'issued_by' => $empSupply->id,
            'received_by' => $empStaff->id,
            'purpose' => $ris3->remarks,
            'created_at' => now()->subDays(4),
        ]);

        // Perform physical stock-out and capture unit cost
        $paperCost = $valuationService->recordStockOut($itemPaper, 5, Issuance::class, $issuance3->id, "Issued via RIS #{$ris3->ris_number}");
        $penCost = $valuationService->recordStockOut($itemPen, 12, Issuance::class, $issuance3->id, "Issued via RIS #{$ris3->ris_number}");

        IssuanceItem::create([
            'issuance_id' => $issuance3->id,
            'item_id' => $itemPaper->id,
            'quantity_issued' => 5,
            'unit_cost' => $paperCost,
        ]);
        IssuanceItem::create([
            'issuance_id' => $issuance3->id,
            'item_id' => $itemPen->id,
            'quantity_issued' => 12,
            'unit_cost' => $penCost,
        ]);

        // ==========================================
        // 4. SEED PROPERTIES / ASSETS (PPE vs ICS)
        // ==========================================

        // Property 1: High Value Asset (>50,000) -> Generates PAR document
        $propMac = Property::create([
            'property_number' => 'PPE-IT-2025-001',
            'serial_number' => 'C02H41XYZL15',
            'model' => 'MacBook Pro 16" (M3 Pro, 18GB, 512GB)',
            'brand' => 'Apple',
            'unit_cost' => 135000.00,
            'date_acquired' => '2025-06-10',
            'warranty_expiration' => '2028-06-10',
            'category_id' => $catItEqp->id,
            'condition' => 'new',
            'status' => 'assigned',
        ]);
        PropertyAssignment::create([
            'property_id' => $propMac->id,
            'assigned_to' => $empHead->id,
            'document_type' => 'PAR',
            'document_number' => 'PAR-2025-0001',
            'assigned_by' => $empSupply->id, // Property Custodian/Supply
            'date_assigned' => '2025-06-12',
            'remarks' => 'Issued to HR Director for primary workflow office use.',
        ]);

        // Property 2: Medium Value Asset (<50,000) -> Generates ICS document
        $propDell = Property::create([
            'property_number' => 'SEM-IT-2026-001',
            'serial_number' => 'DELL-SER-99X88',
            'model' => 'Latitude 5440 Core i5 (16GB, 512GB SSD)',
            'brand' => 'Dell',
            'unit_cost' => 45800.00,
            'date_acquired' => '2026-01-15',
            'warranty_expiration' => '2029-01-15',
            'category_id' => $catItEqp->id,
            'condition' => 'good',
            'status' => 'assigned',
        ]);
        PropertyAssignment::create([
            'property_id' => $propDell->id,
            'assigned_to' => $empStaff->id,
            'document_type' => 'ICS',
            'document_number' => 'ICS-2026-0001',
            'assigned_by' => $empSupply->id,
            'date_assigned' => '2026-01-18',
            'remarks' => 'Standard issue staff laptop workstation.',
        ]);

        // Property 3: Unassigned Available Asset
        Property::create([
            'property_number' => 'SEM-IT-2026-002',
            'serial_number' => 'EPSON-L3210-9902',
            'model' => 'EcoTank L3210 Ink Tank Printer',
            'brand' => 'Epson',
            'unit_cost' => 9500.00,
            'date_acquired' => '2026-03-05',
            'warranty_expiration' => '2027-03-05',
            'category_id' => $catItEqp->id,
            'condition' => 'new',
            'status' => 'available',
        ]);

        // Property 4: Transferred Asset (Staff to Admin)
        $propIPad = Property::create([
            'property_number' => 'SEM-IT-2025-003',
            'serial_number' => 'IPAD-M2-7722',
            'model' => 'iPad Pro 11" M2 (Wi-Fi, 128GB)',
            'brand' => 'Apple',
            'unit_cost' => 48000.00,
            'date_acquired' => '2025-08-12',
            'warranty_expiration' => '2026-08-12',
            'category_id' => $catItEqp->id,
            'condition' => 'good',
            'status' => 'transferred',
        ]);
        // Initial assignment
        $oldAssign = PropertyAssignment::create([
            'property_id' => $propIPad->id,
            'assigned_to' => $empStaff->id,
            'document_type' => 'ICS',
            'document_number' => 'ICS-2025-0002',
            'assigned_by' => $empSupply->id,
            'date_assigned' => '2025-08-15',
            'returned_date' => '2026-04-10', // Returned for transfer
            'remarks' => 'Issued to staff for mobile onboarding.',
        ]);
        // Property Transfer (PTR)
        PropertyTransfer::create([
            'property_id' => $propIPad->id,
            'ptr_number' => 'PTR-2026-0001',
            'transfer_date' => '2026-04-12',
            'from_employee_id' => $empStaff->id,
            'to_employee_id' => $empAdmin->id,
            'office_id' => $empAdmin->office_id,
            'reason' => 'Change of accountability and role delegation.',
            'approved_by' => $empSupply->id,
            'status' => 'completed',
        ]);
        // New active assignment
        PropertyAssignment::create([
            'property_id' => $propIPad->id,
            'assigned_to' => $empAdmin->id,
            'document_type' => 'ICS',
            'document_number' => 'ICS-2026-0004',
            'assigned_by' => $empSupply->id,
            'date_assigned' => '2026-04-12',
            'remarks' => 'Transferred from Staff (HR) to Admin (IT).',
        ]);

        // Property 5: Disposed Asset
        $propSwitch = Property::create([
            'property_number' => 'PPE-IT-2025-002',
            'serial_number' => 'CISCO-CAT-9200',
            'model' => 'Catalyst 9200L 24-Port Switch',
            'brand' => 'Cisco',
            'unit_cost' => 85000.00,
            'date_acquired' => '2025-02-18',
            'warranty_expiration' => '2026-02-18',
            'category_id' => $catItEqp->id,
            'condition' => 'unserviceable',
            'status' => 'disposed',
        ]);
        Disposal::create([
            'property_id' => $propSwitch->id,
            'disposal_number' => 'IIRUP-2026-0001',
            'disposal_method' => 'auction',
            'reason' => 'broken',
            'disposal_date' => '2026-06-18',
            'appraised_value' => 4500.00,
            'proceeds' => 4800.00,
            'witness_by' => 'COA Representative',
            'approved_by' => $empSupply->id,
            'status' => 'completed',
        ]);

        $this->command->info('Loaded 6 Items, 4 Requisitions, 5 Properties, and all associated valuations successfully!');
    }
}
