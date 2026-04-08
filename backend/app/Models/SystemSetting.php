<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'nama_instansi',
        'email_admin',
        'periode_audit',
        'max_upload_size_mb',
        'allowed_file_types',
        'session_timeout_minutes',
        'maintenance_mode',
        'email_notification',
        'auto_backup',
        'backup_frequency',
        'max_login_attempts',
        'password_min_length',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'maintenance_mode' => 'boolean',
            'email_notification' => 'boolean',
            'auto_backup' => 'boolean',
            'max_upload_size_mb' => 'integer',
            'session_timeout_minutes' => 'integer',
            'max_login_attempts' => 'integer',
            'password_min_length' => 'integer',
        ];
    }
}
