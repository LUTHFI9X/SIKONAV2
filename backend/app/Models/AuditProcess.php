<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditProcess extends Model
{
    private const TAHAP_LABELS = [
        1 => 'Permintaan Konsultasi dari Klien',
        2 => 'Identifikasi Permintaan Konsultasi dari Biro Candit',
        3 => 'Pembuatan Surat Tugas (Diterima)',
        4 => 'Entry Meeting',
        5 => 'Permintaan Dokumen Konsultasi',
        6 => 'Pemenuhan Dokumen Konsultasi',
        7 => 'Analisa Data',
        8 => 'Review KKA',
        9 => 'Exit Meeting',
        10 => 'Penyusunan Draft LHK',
        11 => 'Review Draft LHK',
        12 => 'Finalisasi LHK',
        13 => 'Distribusi LHK',
    ];

    private const TAHAP_DB_FIELD_MAP = [
        1 => 'tahap_1_permintaan',
        2 => 'tahap_2_telaah',
        3 => 'tahap_3_surat_tugas',
        4 => 'tahap_4_entry_meeting',
        5 => 'tahap_5_permintaan_dokumen',
        6 => 'tahap_6_pemenuhan_dokumen',
        7 => 'tahap_7_analisa',
        8 => 'tahap_8_exit_meeting',
        9 => 'tahap_9_draft_lhk',
        10 => 'tahap_10_finalisasi',
    ];

    protected $fillable = [
        'conversation_id',
        'auditee_id',
        'auditor_id',
        'biro',
        'tahun_audit',
        'tahap_1_permintaan',
        'tahap_2_telaah',
        'tahap_3_surat_tugas',
        'tahap_4_entry_meeting',
        'tahap_5_permintaan_dokumen',
        'tahap_6_pemenuhan_dokumen',
        'tahap_7_analisa',
        'tahap_8_exit_meeting',
        'tahap_9_draft_lhk',
        'tahap_10_finalisasi',
        'catatan_auditor',
        'dokumen_path',
        'status',
        'kka_review_approved',
        'kka_review_note',
        'lhk_stage',
        'lhk_review_approved',
        'lhk_review_note',
    ];

    protected $casts = [
        'kka_review_approved' => 'boolean',
        'lhk_review_approved' => 'boolean',
    ];

    public function auditee()
    {
        return $this->belongsTo(User::class, 'auditee_id');
    }

    public function auditor()
    {
        return $this->belongsTo(User::class, 'auditor_id');
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function documents()
    {
        return $this->hasMany(AuditProcessDocument::class);
    }

    public function notes()
    {
        return $this->hasMany(AuditNote::class);
    }

    public function getTahapanAttribute(): array
    {
        $items = [];
        foreach (self::TAHAP_LABELS as $no => $nama) {
            $items[] = [
                'no' => $no,
                'nama' => $nama,
                'status' => $this->resolveTahapStatus($no),
            ];
        }

        return $items;
    }

    public function getProgressPercentageAttribute(): int
    {
        $targetTahapan = $this->status === 'cancelled'
            ? [1, 2]
            : array_keys(self::TAHAP_LABELS);

        $completed = 0;
        foreach ($targetTahapan as $tahapNo) {
            if ($this->resolveTahapStatus($tahapNo) === 'selesai') {
                $completed++;
            }
        }

        $denominator = max(count($targetTahapan), 1);

        return (int) round(($completed / $denominator) * 100);
    }

    private function resolveTahapStatus(int $tahapNo): string
    {
        if ($this->status === 'cancelled' && $tahapNo === 2) {
            return 'selesai';
        }

        if ($this->status === 'completed' && $tahapNo === 13) {
            return 'selesai';
        }

        if ($this->hasTahapDocument($tahapNo)) {
            return 'selesai';
        }

        $field = self::TAHAP_DB_FIELD_MAP[$tahapNo] ?? null;
        if ($field) {
            return $this->{$field} ?: 'belum';
        }

        return 'belum';
    }

    private function hasTahapDocument(int $tahapNo): bool
    {
        if ($this->relationLoaded('documents')) {
            return $this->documents->contains(fn ($doc) => (int) $doc->tahap_no === $tahapNo);
        }

        return $this->documents()->where('tahap_no', $tahapNo)->exists();
    }

    protected $appends = ['tahapan', 'progress_percentage'];
}
