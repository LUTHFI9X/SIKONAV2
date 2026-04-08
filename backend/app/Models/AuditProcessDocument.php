<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditProcessDocument extends Model
{
    protected $fillable = [
        'audit_process_id',
        'tahap_no',
        'uploaded_by',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    public function auditProcess()
    {
        return $this->belongsTo(AuditProcess::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
