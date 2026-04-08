<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'auditee_id',
        'auditor_id',
        'subject',
        'is_anonymous',
        'status',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'is_anonymous' => 'boolean',
            'last_message_at' => 'datetime',
        ];
    }

    public function auditee()
    {
        return $this->belongsTo(User::class, 'auditee_id');
    }

    public function auditor()
    {
        return $this->belongsTo(User::class, 'auditor_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function firstMessage()
    {
        return $this->hasOne(Message::class)->oldestOfMany();
    }

    public function auditProcess()
    {
        return $this->hasOne(AuditProcess::class, 'conversation_id');
    }

    public function unreadMessagesFor(User $user)
    {
        return $this->messages()->where('sender_id', '!=', $user->id)->where('is_read', false);
    }
}
