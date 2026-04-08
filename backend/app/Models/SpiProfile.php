<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpiProfile extends Model
{
    protected $fillable = [
        'nama_instansi',
        'visi',
        'misi',
        'alamat',
        'telepon',
        'email',
        'website',
        'logo_path',
        'struktur_organisasi',
    ];

    protected function casts(): array
    {
        return [
            'struktur_organisasi' => 'array',
        ];
    }
}
