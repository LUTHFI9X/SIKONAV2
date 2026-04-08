<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'event_type',
        'description',
        'target_type',
        'target_id',
        'metadata',
        'ip_address',
        'user_agent',
        'session_id',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record an activity log entry.
     */
    public static function record(
        string $eventType,
        string $description,
        ?object $request = null,
        ?object $user = null,
        ?string $targetType = null,
        ?int $targetId = null,
        ?array $metadata = null,
    ): self {
        $sessionId = null;
        if ($request && method_exists($request, 'hasSession') && $request->hasSession()) {
            $sessionId = $request->session()->getId();
        }

        return self::create([
            'user_id'     => $user?->id,
            'user_name'   => $user?->name,
            'user_role'   => $user?->role,
            'event_type'  => $eventType,
            'description' => $description,
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'metadata'    => $metadata,
            'ip_address'  => $request?->ip(),
            'user_agent'  => $request?->userAgent(),
            'session_id'  => $sessionId,
        ]);
    }
}
