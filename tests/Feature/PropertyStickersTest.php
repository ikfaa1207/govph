<?php

use App\Models\Category;
use App\Models\Permission;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthorized users cannot access print stickers route', function () {
    $user = User::factory()->create();

    // No permissions assigned
    $response = $this->actingAs($user)->get(route('inventory.properties.print-stickers'));

    $response->assertForbidden();
});

test('authorized users can access print stickers route with selected properties', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'property.view', 'module' => 'properties']);
    $user->givePermissionTo('property.view');

    $category = Category::firstOrCreate(['code' => 'TEST'], ['name' => 'Laptops']);
    $properties = Property::factory()->count(3)->create([
        'category_id' => $category->id,
    ]);

    $ids = $properties->pluck('id')->implode(',');

    $response = $this->actingAs($user)->get(route('inventory.properties.print-stickers', ['ids' => $ids]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/property/print-stickers')
        ->has('properties', 3)
    );
});
