<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_processes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auditee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('auditor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('biro')->nullable();
            $table->year('tahun_audit');
            
            // 10 Tahapan Audit
            $table->enum('tahap_1_permintaan', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_2_telaah', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_3_surat_tugas', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_4_entry_meeting', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_5_permintaan_dokumen', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_6_pemenuhan_dokumen', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_7_analisa', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_8_exit_meeting', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_9_draft_lhk', ['belum', 'proses', 'selesai'])->default('belum');
            $table->enum('tahap_10_finalisasi', ['belum', 'proses', 'selesai'])->default('belum');
            
            $table->text('catatan_auditor')->nullable();
            $table->string('dokumen_path')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_processes');
    }
};
