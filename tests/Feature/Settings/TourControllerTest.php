<?php

use App\Models\User;

test('authenticated user can mark a tour as completed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('tours.complete'), [
            'tour_id' => 'items-index',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'completed_tours' => ['items-index'],
        ]);

    $user->refresh();
    expect($user->completed_tours)->toBe(['items-index']);
});

test('completing the same tour multiple times does not create duplicates', function () {
    $user = User::factory()->create(['completed_tours' => ['items-index']]);

    $response = $this
        ->actingAs($user)
        ->post(route('tours.complete'), [
            'tour_id' => 'items-index',
        ]);

    $response->assertOk();

    $user->refresh();
    expect($user->completed_tours)->toBe(['items-index']);
});

test('authenticated user can reset completed tours', function () {
    $user = User::factory()->create(['completed_tours' => ['items-index', 'po-index']]);

    $response = $this
        ->actingAs($user)
        ->delete(route('tours.reset'));

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'completed_tours' => [],
        ]);

    $user->refresh();
    expect($user->completed_tours)->toBe([]);
});

test('guest cannot mark tour as completed', function () {
    $response = $this->post(route('tours.complete'), [
        'tour_id' => 'items-index',
    ]);

    $response->assertRedirect(route('login'));
});
