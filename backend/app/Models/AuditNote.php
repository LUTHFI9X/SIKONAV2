<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditNote extends Model
{
    protected $fillable = [
        'audit_process_id',
        'user_id',
        'note_type',
        'message',
    ];

    public function auditProcess()
    {
        return $this->belongsTo(AuditProcess::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
