<?php

use App\Services\DocumentSequenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('document sequence service allocates sequential numbers and handles first insert', function () {
    $service = new DocumentSequenceService;

    // First call should insert and return the first sequence number
    $first = $service->next('PPE');

    // Let's see what it returns
    expect($first)->toBe('PPE-'.date('Y').'-000001');

    // Second call should return the next sequence number
    $second = $service->next('PPE');
    expect($second)->toBe('PPE-'.date('Y').'-000002');
});
