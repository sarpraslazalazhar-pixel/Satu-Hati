<?php

namespace App\Events;

use App\Models\Donation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DonationStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $donation;

    public int $currentAmount;

    public float $progressPercentage;

    public int $verifiedCount;

    public string $action;

    /**
     * Create a new event instance.
     */
    public function __construct(Donation $donation, string $action = 'approved')
    {
        $this->action = $action;
        $this->donation = $donation->toPublicArray();

        $this->currentAmount = (int) Donation::where('status', 'verified')->sum('amount');
        $targetAmount = 500000000; // Rp 500.000.000
        $raw = ($this->currentAmount / $targetAmount) * 100;
        $this->progressPercentage = $raw > 0 && $raw < 1 ? round($raw, 1) : (float) min(100, round($raw, 1));
        $this->verifiedCount = Donation::where('status', 'verified')->count();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('public-donations'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'donation.status.updated';
    }
}
