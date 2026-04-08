<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('nama_instansi')->default('Satuan Pengawasan Intern (SPI)');
            $table->string('email_admin')->nullable();
            $table->string('periode_audit')->nullable();
            $table->unsignedInteger('max_upload_size_mb')->default(10);
            $table->string('allowed_file_types')->default('PDF,DOC,DOCX,PNG,JPG');
            $table->unsignedInteger('session_timeout_minutes')->default(30);
            $table->boolean('maintenance_mode')->default(false);
            $table->boolean('email_notification')->default(true);
            $table->boolean('auto_backup')->default(true);
            $table->enum('backup_frequency', ['daily', 'weekly', 'monthly'])->default('daily');
            $table->unsignedInteger('max_login_attempts')->default(5);
            $table->unsignedInteger('password_min_length')->default(8);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
