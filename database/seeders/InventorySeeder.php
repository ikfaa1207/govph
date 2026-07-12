<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\Location;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Suppliers
        $suppliers = [
            Supplier::create(['name' => 'GovSupply Co. Ltd.', 'address' => '123 Quezon Ave, QC', 'contact_person' => 'Juan Dela Cruz', 'contact_number' => '09123456789', 'tin' => '123-456-789-000']),
            Supplier::create(['name' => 'Manila IT Experts', 'address' => '456 Ayala Ave, Makati', 'contact_person' => 'Maria Santos', 'contact_number' => '09987654321', 'tin' => '987-654-321-000']),
            Supplier::create(['name' => 'Philippine Furniture Corp', 'address' => 'Mandaue, Cebu', 'contact_person' => 'Pedro Penduko', 'contact_number' => '09223334444', 'tin' => '111-222-333-000']),
        ];

        // 2. Create Categories
        $catSupplies = Category::create(['name' => 'Office Supplies', 'code' => 'OFF-SUPP', 'is_ppe' => false]);
        $catInk = Category::create(['name' => 'Ink and Toners', 'code' => 'INK', 'is_ppe' => false]);
        $catItEqp = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP', 'is_ppe' => true]);
        $catFurniture = Category::create(['name' => 'Office Furniture', 'code' => 'FURNITURE', 'is_ppe' => true]);
        $catVehicles = Category::create(['name' => 'Motor Vehicles', 'code' => 'VEHICLES', 'is_ppe' => true]);

        // 3. Create Units
        $unitPc = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
        $unitBox = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
        $unitReam = Unit::create(['name' => 'Ream', 'abbreviation' => 'ream']);
        $unitBottle = Unit::create(['name' => 'Bottle', 'abbreviation' => 'btl']);
        $unitUnit = Unit::create(['name' => 'Unit', 'abbreviation' => 'unit']);

        // 4. Create Warehouse & Locations
        $wh = Warehouse::create(['name' => 'Main Central Warehouse', 'address' => 'Central Office Ground Floor']);
        $locA = Location::create(['warehouse_id' => $wh->id, 'code' => 'ZONE-A', 'description' => 'Supplies Area']);
        $locB = Location::create(['warehouse_id' => $wh->id, 'code' => 'ZONE-B', 'description' => 'Equipment Area']);

        // 5. Seed Items (Consumables)
        $consumables = [
            ['name' => 'Bond Paper A4', 'category_id' => $catSupplies->id, 'unit_id' => $unitReam->id, 'price' => 250, 'stock' => 500, 'reorder' => 50],
            ['name' => 'Bond Paper Legal', 'category_id' => $catSupplies->id, 'unit_id' => $unitReam->id, 'price' => 280, 'stock' => 300, 'reorder' => 50],
            ['name' => 'Ballpen Black (50s)', 'category_id' => $catSupplies->id, 'unit_id' => $unitBox->id, 'price' => 300, 'stock' => 100, 'reorder' => 20],
            ['name' => 'Ballpen Blue (50s)', 'category_id' => $catSupplies->id, 'unit_id' => $unitBox->id, 'price' => 300, 'stock' => 80, 'reorder' => 20],
            ['name' => 'Stapler Heavy Duty', 'category_id' => $catSupplies->id, 'unit_id' => $unitPc->id, 'price' => 500, 'stock' => 45, 'reorder' => 10],
            ['name' => 'Staple Wire #35', 'category_id' => $catSupplies->id, 'unit_id' => $unitBox->id, 'price' => 45, 'stock' => 200, 'reorder' => 50],
            ['name' => 'Epson 003 Ink Black', 'category_id' => $catInk->id, 'unit_id' => $unitBottle->id, 'price' => 295, 'stock' => 150, 'reorder' => 30],
            ['name' => 'Epson 003 Ink Cyan', 'category_id' => $catInk->id, 'unit_id' => $unitBottle->id, 'price' => 295, 'stock' => 100, 'reorder' => 30],
            ['name' => 'Epson 003 Ink Magenta', 'category_id' => $catInk->id, 'unit_id' => $unitBottle->id, 'price' => 295, 'stock' => 100, 'reorder' => 30],
            ['name' => 'Epson 003 Ink Yellow', 'category_id' => $catInk->id, 'unit_id' => $unitBottle->id, 'price' => 295, 'stock' => 100, 'reorder' => 30],
            ['name' => 'HP 85A Toner', 'category_id' => $catInk->id, 'unit_id' => $unitPc->id, 'price' => 3500, 'stock' => 25, 'reorder' => 5],
            ['name' => 'Paper Clip 33mm', 'category_id' => $catSupplies->id, 'unit_id' => $unitBox->id, 'price' => 25, 'stock' => 300, 'reorder' => 50],
            ['name' => 'Folder Long White', 'category_id' => $catSupplies->id, 'unit_id' => $unitPc->id, 'price' => 8, 'stock' => 1000, 'reorder' => 200],
            ['name' => 'Envelope Brown Long', 'category_id' => $catSupplies->id, 'unit_id' => $unitPc->id, 'price' => 5, 'stock' => 1500, 'reorder' => 300],
            ['name' => 'Sticky Notes 3x3', 'category_id' => $catSupplies->id, 'unit_id' => $unitPc->id, 'price' => 40, 'stock' => 250, 'reorder' => 50],
        ];

        foreach ($consumables as $i => $itemData) {
            Item::create([
                'category_id' => $itemData['category_id'],
                'unit_id' => $itemData['unit_id'],
                'location_id' => $locA->id,
                'item_code' => 'SUP-'.str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                'name' => $itemData['name'],
                'description' => 'Standard '.$itemData['name'],
                'unit_cost' => $itemData['price'],
                'current_stock' => $itemData['stock'],
                'reorder_level' => $itemData['reorder'],
                'status' => 'active',
            ]);
        }

        // 6. Seed Items (Equipment/PPE)
        $equipment = [
            ['name' => 'Lenovo ThinkPad E14', 'category_id' => $catItEqp->id, 'unit_id' => $unitUnit->id, 'price' => 45000, 'stock' => 30, 'supp' => $suppliers[1]->id],
            ['name' => 'Dell Optiplex 3080 Desktop', 'category_id' => $catItEqp->id, 'unit_id' => $unitUnit->id, 'price' => 38000, 'stock' => 25, 'supp' => $suppliers[1]->id],
            ['name' => 'Epson L3110 Printer', 'category_id' => $catItEqp->id, 'unit_id' => $unitUnit->id, 'price' => 8500, 'stock' => 15, 'supp' => $suppliers[1]->id],
            ['name' => 'APC Back-UPS 650VA', 'category_id' => $catItEqp->id, 'unit_id' => $unitUnit->id, 'price' => 2500, 'stock' => 40, 'supp' => $suppliers[1]->id],
            ['name' => 'Executive Office Chair', 'category_id' => $catFurniture->id, 'unit_id' => $unitUnit->id, 'price' => 5500, 'stock' => 50, 'supp' => $suppliers[2]->id],
            ['name' => 'Standard Staff Desk', 'category_id' => $catFurniture->id, 'unit_id' => $unitUnit->id, 'price' => 8000, 'stock' => 60, 'supp' => $suppliers[2]->id],
            ['name' => 'Steel Filing Cabinet 4-Drawer', 'category_id' => $catFurniture->id, 'unit_id' => $unitUnit->id, 'price' => 12000, 'stock' => 20, 'supp' => $suppliers[2]->id],
            ['name' => 'Toyota Hiace Commuter 2023', 'category_id' => $catVehicles->id, 'unit_id' => $unitUnit->id, 'price' => 1800000, 'stock' => 2, 'supp' => $suppliers[0]->id],
            ['name' => 'Toyota Innova 2.8 E', 'category_id' => $catVehicles->id, 'unit_id' => $unitUnit->id, 'price' => 1300000, 'stock' => 3, 'supp' => $suppliers[0]->id],
            ['name' => 'Conference Table 10-seater', 'category_id' => $catFurniture->id, 'unit_id' => $unitUnit->id, 'price' => 25000, 'stock' => 5, 'supp' => $suppliers[2]->id],
        ];

        foreach ($equipment as $i => $itemData) {
            Item::create([
                'category_id' => $itemData['category_id'],
                'unit_id' => $itemData['unit_id'],
                'location_id' => $locB->id,
                'item_code' => 'EQP-'.str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                'name' => $itemData['name'],
                'description' => 'Standard '.$itemData['name'],
                'unit_cost' => $itemData['price'],
                'current_stock' => $itemData['stock'],
                'reorder_level' => 5,
                'status' => 'active',
            ]);
        }
    }
}
