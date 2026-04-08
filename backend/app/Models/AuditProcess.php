<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditProcess extends Model
{
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
        $tahap9Status = $this->resolveTahap9Status();
        $tahap10Status = $this->resolveTahap10Status();

        return [
            ['no' => 1, 'nama' => 'Permintaan Audit', 'status' => $this->tahap_1_permintaan],
            ['no' => 2, 'nama' => 'Telaah Pendahuluan', 'status' => $this->tahap_2_telaah],
            ['no' => 3, 'nama' => 'Surat Tugas', 'status' => $this->tahap_3_surat_tugas],
            ['no' => 4, 'nama' => 'Entry Meeting', 'status' => $this->tahap_4_entry_meeting],
            ['no' => 5, 'nama' => 'Permintaan Dokumen', 'status' => $this->tahap_5_permintaan_dokumen],
            ['no' => 6, 'nama' => 'Pemenuhan Dokumen', 'status' => $this->tahap_6_pemenuhan_dokumen],
            ['no' => 7, 'nama' => 'Analisa Bukti', 'status' => $this->tahap_7_analisa],
            ['no' => 8, 'nama' => 'Exit Meeting', 'status' => $this->tahap_8_exit_meeting],
            ['no' => 9, 'nama' => 'Draft LHK', 'status' => $tahap9Status],
            ['no' => 10, 'nama' => 'Finalisasi', 'status' => $tahap10Status],
        ];
    }

    public function getProgressPercentageAttribute(): int
    {
        $tahap9Status = $this->resolveTahap9Status();
        $tahap10Status = $this->resolveTahap10Status();

        $completed = 0;
        $tahapan = [
            $this->tahap_1_permintaan, $this->tahap_2_telaah, $this->tahap_3_surat_tugas,
            $this->tahap_4_entry_meeting, $this->tahap_5_permintaan_dokumen, $this->tahap_6_pemenuhan_dokumen,
            $this->tahap_7_analisa, $this->tahap_8_exit_meeting, $tahap9Status, $tahap10Status,
        ];
        
        foreach ($tahapan as $status) {
            if ($status === 'selesai') $completed++;
        }
        
        return (int) round(($completed / 10) * 100);
    }

    private function resolveTahap9Status(): string
    {
        if ($this->tahap_9_draft_lhk === 'selesai') {
            return 'selesai';
        }

        $hasDraftDoc = false;
        if ($this->relationLoaded('documents')) {
            $hasDraftDoc = $this->documents->contains(fn ($doc) => (int) $doc->tahap_no === 9);
        } else {
            $hasDraftDoc = $this->documents()->where('tahap_no', 9)->exists();
        }

        return $hasDraftDoc ? 'selesai' : ($this->tahap_9_draft_lhk ?: 'belum');
    }

    private function resolveTahap10Status(): string
    {
        if ($this->status === 'completed') {
            return 'selesai';
        }

        return $this->tahap_10_finalisasi ?: 'belum';
    }

    protected $appends = ['tahapan', 'progress_percentage'];
}
