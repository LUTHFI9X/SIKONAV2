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
    $tahap10Changed = 0;

    AuditProcess::query()
        ->with('documents:id,audit_process_id,tahap_no')
        ->chunkById(200, function ($items) use (&$total, &$changed, &$tahap10Changed, $dryRun) {
            foreach ($items as $process) {
                $total++;

                $hasDraftLhk = $process->documents->contains(fn ($doc) => (int) $doc->tahap_no === 10);
                $targetTahap10 = $hasDraftLhk ? 'selesai' : 'belum';

                $payload = [];
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
    $this->line("- Tahap 10 update: {$tahap10Changed}");
})->purpose('Sinkronisasi permanen tahap 10 berdasarkan dokumen draft LHK');
