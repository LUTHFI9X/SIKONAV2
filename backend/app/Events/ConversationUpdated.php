<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Conversation $conversation,
        public string $type,
        public array $payload = [],
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('users.'.$this->conversation->auditee_id),
            new PrivateChannel('users.'.$this->conversation->auditor_id),
            new PrivateChannel('roles.kspi'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'conversation.updated';
    }

    public function broadcastWith(): array
    {
        return array_merge([
            'conversation_id' => $this->conversation->id,
            'type' => $this->type,
            'status' => $this->conversation->status,
            'last_message_at' => optional($this->conversation->last_message_at)?->toIso8601String(),
        ], $this->payload);
    }
}
