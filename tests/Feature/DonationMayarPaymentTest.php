<?php

namespace Tests\Feature;

use App\Models\Donation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DonationMayarPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creates_donation_and_calls_mayar_api(): void
    {
        Event::fake();
        config(['services.mayar.api_key' => 'mayar_test_key_123']);
        config(['services.mayar.base_url' => 'https://api.mayar.id']);

        Http::fake([
            'https://api.mayar.id/hl/v2/payments/create' => Http::response([
                'statusCode' => 200,
                'messages' => 'success',
                'data' => [
                    'id' => 'mayar-req-uuid-1',
                    'transactionId' => 'mayar-tx-uuid-1',
                    'link' => 'https://mayar.id/pl/test-payment',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/donations', [
            'donor_name' => 'Fulan bin Fulan',
            'donor_phone' => '081234567890',
            'donor_email' => 'fulan@example.com',
            'amount' => 50000,
            'is_anonymous' => false,
            'prayer_message' => 'Semoga berkah',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'paymentUrl' => 'https://mayar.id/pl/test-payment',
            ]);

        $this->assertDatabaseHas('donations', [
            'donor_name' => 'Fulan bin Fulan',
            'amount' => 50000,
            'status' => 'pending',
            'mayar_payment_id' => 'mayar-req-uuid-1',
            'mayar_transaction_id' => 'mayar-tx-uuid-1',
            'payment_url' => 'https://mayar.id/pl/test-payment',
        ]);
    }

    public function test_mayar_webhook_updates_pending_donation_to_verified(): void
    {
        Event::fake();
        config(['services.mayar.webhook_token' => null]);

        $donation = Donation::create([
            'donor_name' => 'Ahmad',
            'donor_phone' => '081298765432',
            'donor_email' => 'ahmad@example.com',
            'amount' => 100000,
            'status' => 'pending',
            'mayar_payment_id' => 'mayar-pay-999',
        ]);

        $payload = [
            'event' => 'payment.received',
            'data' => [
                'id' => 'tx-abc-123',
                'transactionId' => 'tx-abc-123',
                'paymentLinkId' => 'mayar-pay-999',
                'status' => 'SUCCESS',
                'transactionStatus' => 'paid',
                'amount' => 100000,
                'customerName' => 'Ahmad',
                'customerMobile' => '081298765432',
                'extraData' => [
                    'donation_id' => $donation->id,
                ],
            ],
        ];

        $response = $this->postJson('/api/webhooks/mayar', $payload);
        $response->assertStatus(200)->assertJson(['success' => true]);

        $donation->refresh();
        $this->assertSame('verified', $donation->status);
        $this->assertNotNull($donation->verified_at);
        $this->assertSame('tx-abc-123', $donation->mayar_transaction_id);
    }

    public function test_mayar_webhook_auto_inputs_direct_payment(): void
    {
        Event::fake();
        config(['services.mayar.webhook_token' => null]);

        $payload = [
            'event' => 'payment.received',
            'data' => [
                'id' => 'tx-direct-777',
                'transactionId' => 'tx-direct-777',
                'paymentLinkId' => 'link-direct-888',
                'status' => 'SUCCESS',
                'transactionStatus' => 'paid',
                'amount' => 250000,
                'customerName' => 'Hamba Dermawan',
                'customerMobile' => '085566778899',
                'customerEmail' => 'dermawan@example.com',
                'productName' => 'Donasi Langsung Mayar QRIS',
                'paymentUrl' => 'https://mayar.id/pl/link-direct-888',
            ],
        ];

        $response = $this->postJson('/api/webhooks/mayar', $payload);
        $response->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('donations', [
            'donor_name' => 'Hamba Dermawan',
            'donor_phone' => '085566778899',
            'donor_email' => 'dermawan@example.com',
            'amount' => 250000,
            'status' => 'verified',
            'mayar_payment_id' => 'link-direct-888',
            'mayar_transaction_id' => 'tx-direct-777',
        ]);
    }

    public function test_check_status_queries_mayar_and_updates_donation(): void
    {
        Event::fake();
        config(['services.mayar.api_key' => 'mayar_test_key_123']);
        config(['services.mayar.base_url' => 'https://api.mayar.id']);

        $donation = Donation::create([
            'donor_name' => 'Zahra',
            'donor_phone' => '089988776655',
            'amount' => 75000,
            'status' => 'pending',
            'mayar_payment_id' => 'mayar-check-uuid-1',
        ]);

        Http::fake([
            'https://api.mayar.id/hl/v2/payments/mayar-check-uuid-1' => Http::response([
                'statusCode' => 200,
                'messages' => 'success',
                'data' => [
                    'id' => 'mayar-check-uuid-1',
                    'status' => 'paid',
                ],
            ], 200),
        ]);

        $response = $this->getJson("/api/donations/{$donation->id}/check-status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'verified',
            ]);

        $donation->refresh();
        $this->assertSame('verified', $donation->status);
        $this->assertNotNull($donation->verified_at);
    }
}
