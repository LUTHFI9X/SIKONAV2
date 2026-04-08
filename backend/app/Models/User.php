<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'sub_role',
        'department',
        'biro',
        'phone',
        'avatar',
        'is_active',
        'is_online',
        'last_seen_at',
        'failed_login_attempts',
        'locked_until',
        'must_change_password',
        'password_changed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_online' => 'boolean',
            'last_seen_at' => 'datetime',
            'locked_until' => 'datetime',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
        ];
    }

    // Relationships
    public function auditeeConversations()
    {
        return $this->hasMany(Conversation::class, 'auditee_id');
    }

    public function auditorConversations()
    {
        return $this->hasMany(Conversation::class, 'auditor_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function auditeeProcesses()
    {
        return $this->hasMany(AuditProcess::class, 'auditee_id');
    }

    public function auditorProcesses()
    {
        return $this->hasMany(AuditProcess::class, 'auditor_id');
    }

    public function passwordHistories()
    {
        return $this->hasMany(PasswordHistory::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Scopes
    public function scopeAuditees($query)
    {
        return $query->where('role', 'auditee');
    }

    public function scopeAuditors($query)
    {
        return $query->where('role', 'auditor');
    }

    public function scopeManajemen($query)
    {
        return $query->where('role', 'manajemen');
    }

    // Helpers
    public function isAuditee(): bool
    {
        return $this->role === 'auditee';
    }

    public function isAuditor(): bool
    {
        return $this->role === 'auditor';
    }

    public function isManajemen(): bool
    {
        return $this->role === 'manajemen';
    }

    // Security helpers
    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function isPasswordExpired(): bool
    {
        if (!$this->password_changed_at) return true;
        return $this->password_changed_at->addDays(90)->isPast();
    }

    public function incrementFailedAttempts(): void
    {
        $this->increment('failed_login_attempts');
        if ($this->failed_login_attempts >= 3) {
            $this->update(['locked_until' => now()->addMinutes(30)]);
        }
    }

    public function resetFailedAttempts(): void
    {
        $this->update(['failed_login_attempts' => 0, 'locked_until' => null]);
    }
}
