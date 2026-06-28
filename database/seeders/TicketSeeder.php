<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;

class TicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employee = User::where('email', 'employee@example.com')->first();
        $admin = User::where('email', 'admin@example.com')->first();

        if (! $employee || ! $admin) {
            $this->command->error('Run DatabaseSeeder first to create base users.');

            return;
        }

        $categories = ['technical', 'discrepancy', 'request', 'other'];
        $priorities = ['low', 'medium', 'high'];
        $statuses = ['open', 'in_progress', 'resolved'];

        $sampleTickets = [
            ['title' => 'Stock balance mismatch on whiteboard markers', 'desc' => 'The supplies catalog shows 50 units but the physical count in Shelf-A-01 only lists 30.'],
            ['title' => 'Unable to generate RPCI report for Q2', 'desc' => 'Clicking compile report on RPCI results in a 500 server error.'],
            ['title' => 'ICS document layout overflow', 'desc' => 'The printed layout of the Inventory Custodian Slip cuts off the property numbers.'],
            ['title' => 'PAR request signature routing error', 'desc' => 'When submitting a PAR assignment, it does not route to the HR Director department head.'],
            ['title' => 'Barcode scanner drivers missing', 'desc' => 'The warehouse barcode scanner is not recognized on the Warehouse A terminal.'],
            ['title' => 'Double entries in property registry', 'desc' => 'The database shows duplicate property codes for two Dell Latitude laptops.'],
            ['title' => 'A4 coupon bond count discrepancy', 'desc' => 'Warehouse reports show 100 boxes of A4 coupon bond but we only count 95.'],
            ['title' => 'Need access to COA reports export', 'desc' => 'As a State Auditor, I am missing the export to spreadsheet option on the reports page.'],
            ['title' => 'Reset two-factor authorization token', 'desc' => 'The 2FA token generator on my device was lost. Please reset my profile security.'],
            ['title' => 'Cannot delete archived item from catalog', 'desc' => 'Attempting to delete item code OFF-SUPP-001 returns permission denied.'],
            ['title' => 'Requisition limit warning error', 'desc' => 'I cannot submit a requisition of 20 pieces even though warehouse stock shows 150 pieces.'],
            ['title' => 'Disposal form (IIRUP) missing field', 'desc' => 'The disposal form lacks a field to state the mode of public bidding.'],
            ['title' => 'Slow database query on Property Registry', 'desc' => 'Loading the property database page takes over 5 seconds on slow networks.'],
            ['title' => 'Incorrect unit cost formatting', 'desc' => 'Unit cost is displayed as plain decimals without the PHP currency symbol.'],
            ['title' => 'Audit log export corrupted', 'desc' => 'Downloading the audit log CSV results in a corrupt file error.'],
        ];

        for ($i = 1; $i <= 40; $i++) {
            $sample = $sampleTickets[($i - 1) % count($sampleTickets)];

            // Alter title slightly to distinguish entries
            $title = $sample['title']." (Batch #{$i})";
            $desc = $sample['desc']."\nThis is auto-generated support ticket number {$i} for verification of infinite scrolling.";

            $cat = $categories[($i - 1) % count($categories)];
            $prio = $priorities[($i - 1) % count($priorities)];
            $status = $statuses[($i - 1) % count($statuses)];

            // Assign to employee for odd numbers, admin for even numbers
            $userId = ($i % 2 === 0) ? $admin->id : $employee->id;

            Ticket::create([
                'user_id' => $userId,
                'title' => $title,
                'category' => $cat,
                'priority' => $prio,
                'description' => $desc,
                'status' => $status,
                'admin_notes' => $status !== 'open' ? "Automated agent resolution comments for ticket batch #{$i}." : null,
                'created_at' => now()->subHours($i * 4),
            ]);
        }

        $this->command->info('Seeded 40 support tickets successfully.');
    }
}
