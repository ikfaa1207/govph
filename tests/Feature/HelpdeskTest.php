<?php

use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('guest users are redirected to login when accessing helpdesk', function () {
    $response = $this->get(route('helpdesk'));
    $response->assertRedirect('/login');
});

test('authenticated users can access helpdesk page', function () {
    $user = User::create([
        'name' => 'Normal Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    $this->actingAs($user);

    $response = $this->get(route('helpdesk'));
    $response->assertStatus(200);
});

test('authenticated users can submit a ticket', function () {
    $user = User::create([
        'name' => 'Normal Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    $this->actingAs($user);

    $response = $this->post(route('helpdesk.store'), [
        'title' => 'Cannot log in with passkey',
        'category' => 'technical',
        'priority' => 'high',
        'description' => 'I registered my passkey but the verification fails on Chrome.',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'user_id' => $user->id,
        'title' => 'Cannot log in with passkey',
        'category' => 'technical',
        'priority' => 'high',
        'description' => 'I registered my passkey but the verification fails on Chrome.',
        'status' => 'open',
    ]);
});

test('regular users can only view their own tickets', function () {
    $user1 = User::create(['name' => 'User One', 'email' => 'one@example.com', 'password' => bcrypt('password')]);
    $user2 = User::create(['name' => 'User Two', 'email' => 'two@example.com', 'password' => bcrypt('password')]);

    $ticket1 = Ticket::create([
        'user_id' => $user1->id,
        'title' => 'Ticket 1',
        'category' => 'technical',
        'priority' => 'low',
        'description' => 'Desc 1',
        'status' => 'open',
    ]);

    $ticket2 = Ticket::create([
        'user_id' => $user2->id,
        'title' => 'Ticket 2',
        'category' => 'discrepancy',
        'priority' => 'medium',
        'description' => 'Desc 2',
        'status' => 'open',
    ]);

    $this->actingAs($user1);
    $response = $this->get(route('helpdesk'));
    $response->assertStatus(200);

    // Assert that ticket1 is in the response, but not ticket2
    $response->assertInertia(fn ($page) => $page
        ->has('tickets', 1)
        ->where('tickets.0.id', $ticket1->id)
    );
});

test('administrators can view all tickets', function () {
    $admin = User::create(['name' => 'Admin User', 'email' => 'admin@example.com', 'password' => bcrypt('password')]);
    $role = Role::create(['name' => 'System Administrator']);
    $admin->roles()->attach($role->id);

    $user = User::create(['name' => 'Regular User', 'email' => 'user@example.com', 'password' => bcrypt('password')]);

    $ticket1 = Ticket::create(['user_id' => $admin->id, 'title' => 'Admin Ticket', 'category' => 'technical', 'priority' => 'low', 'description' => 'D1']);
    $ticket2 = Ticket::create(['user_id' => $user->id, 'title' => 'User Ticket', 'category' => 'discrepancy', 'priority' => 'medium', 'description' => 'D2']);

    $this->actingAs($admin);
    $response = $this->get(route('helpdesk'));
    $response->assertStatus(200);

    // Admin should see both tickets
    $response->assertInertia(fn ($page) => $page
        ->has('tickets', 2)
    );
});

test('non-administrators cannot update ticket status', function () {
    $user = User::create(['name' => 'Regular User', 'email' => 'user@example.com', 'password' => bcrypt('password')]);
    $ticket = Ticket::create(['user_id' => $user->id, 'title' => 'Ticket', 'category' => 'technical', 'priority' => 'low', 'description' => 'D']);

    $this->actingAs($user);
    $response = $this->patch(route('helpdesk.update', $ticket->id), [
        'status' => 'resolved',
        'admin_notes' => 'Resolved by normal user',
    ]);

    $response->assertForbidden();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'status' => 'open',
        'admin_notes' => null,
    ]);
});

test('administrators can update ticket status and admin notes', function () {
    $admin = User::create(['name' => 'Admin User', 'email' => 'admin@example.com', 'password' => bcrypt('password')]);
    $role = Role::create(['name' => 'System Administrator']);
    $admin->roles()->attach($role->id);

    $user = User::create(['name' => 'Regular User', 'email' => 'user@example.com', 'password' => bcrypt('password')]);
    $ticket = Ticket::create(['user_id' => $user->id, 'title' => 'Ticket', 'category' => 'technical', 'priority' => 'low', 'description' => 'D']);

    $this->actingAs($admin);
    $response = $this->patch(route('helpdesk.update', $ticket->id), [
        'status' => 'resolved',
        'admin_notes' => 'Fixed the issue.',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'status' => 'resolved',
        'admin_notes' => 'Fixed the issue.',
    ]);
});

test('authenticated users can submit a ticket with an attachment', function () {
    Storage::fake('public');

    $user = User::create([
        'name' => 'Normal Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    $this->actingAs($user);

    $file = UploadedFile::fake()->create('screenshot.png', 100, 'image/png');

    $response = $this->post(route('helpdesk.store'), [
        'title' => 'Cannot log in with passkey',
        'category' => 'technical',
        'priority' => 'high',
        'description' => 'I registered my passkey but the verification fails on Chrome.',
        'attachment' => $file,
    ]);

    $response->assertRedirect();

    $ticket = Ticket::where('user_id', $user->id)->first();
    $this->assertNotNull($ticket->attachment_path);
    Storage::disk('public')->assertExists($ticket->attachment_path);

    $this->assertDatabaseHas('tickets', [
        'user_id' => $user->id,
        'title' => 'Cannot log in with passkey',
        'attachment_path' => $ticket->attachment_path,
    ]);
});

test('ticket submission fails validation with invalid attachment', function () {
    $user = User::create([
        'name' => 'Normal Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    $this->actingAs($user);

    // Invalid file type (TXT is not in validation mimes)
    $file = UploadedFile::fake()->create('document.txt', 100);

    $response = $this->post(route('helpdesk.store'), [
        'title' => 'Cannot log in with passkey',
        'category' => 'technical',
        'priority' => 'high',
        'description' => 'I registered my passkey but the verification fails on Chrome.',
        'attachment' => $file,
    ]);

    $response->assertSessionHasErrors('attachment');

    // Oversized file (6000KB is greater than 5120KB limit)
    $largeFile = UploadedFile::fake()->create('large.pdf', 6000);

    $response = $this->post(route('helpdesk.store'), [
        'title' => 'Cannot log in with passkey',
        'category' => 'technical',
        'priority' => 'high',
        'description' => 'I registered my passkey but the verification fails on Chrome.',
        'attachment' => $largeFile,
    ]);

    $response->assertSessionHasErrors('attachment');
});

test('ticket submission ignores string null attachment and passes validation', function () {
    $user = User::create([
        'name' => 'Normal Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    $this->actingAs($user);

    $response = $this->post(route('helpdesk.store'), [
        'title' => 'Cannot log in with passkey',
        'category' => 'technical',
        'priority' => 'high',
        'description' => 'I registered my passkey but the verification fails on Chrome.',
        'attachment' => 'null',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'user_id' => $user->id,
        'title' => 'Cannot log in with passkey',
        'attachment_path' => null,
    ]);
});
