<?php

use App\Models\AuditProcess;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('audit:sync-tahapan-status {--dry-run : Preview changes without saving}', function () {
    $dryRun = (bool) $this->option('dry-run');

    $total = 0;
    $changed = 0;
    $tahap9Changed = 0;
    $tahap10Changed = 0;

    AuditProcess::query()
        ->with('documents:id,audit_process_id,tahap_no')
        ->chunkById(200, function ($items) use (&$total, &$changed, &$tahap9Changed, &$tahap10Changed, $dryRun) {
            foreach ($items as $process) {
                $total++;

                $hasDraftLhk = $process->documents->contains(fn ($doc) => (int) $doc->tahap_no === 9);
                $targetTahap9 = $hasDraftLhk ? 'selesai' : 'belum';
                $targetTahap10 = $process->status === 'completed' ? 'selesai' : 'belum';

                $payload = [];
                if (($process->tahap_9_draft_lhk ?: 'belum') !== $targetTahap9) {
                    $payload['tahap_9_draft_lhk'] = $targetTahap9;
                    $tahap9Changed++;
                }

                if (($process->tahap_10_finalisasi ?: 'belum') !== $targetTahap10) {
                    $payload['tahap_10_finalisasi'] = $targetTahap10;
                    $tahap10Changed++;
                }

                if (!empty($payload)) {
                    $changed++;
                    if (!$dryRun) {
                        $process->update($payload);
                    }
                }
            }
        });

    $mode = $dryRun ? 'DRY-RUN' : 'APPLIED';
    $this->info("[{$mode}] Sinkronisasi tahapan audit selesai.");
    $this->line("- Total proses   : {$total}");
    $this->line("- Data berubah   : {$changed}");
    $this->line("- Tahap 9 update : {$tahap9Changed}");
    $this->line("- Tahap 10 update: {$tahap10Changed}");
})->purpose('Sinkronisasi permanen tahap 9/10 berdasarkan dokumen draft dan status completed');
