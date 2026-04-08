<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_process_id')->constrained('audit_processes')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('note_type', ['pesan_spi', 'tindak_lanjut']);
            $table->text('message');
            $table->timestamps();

            $table->index(['audit_process_id', 'note_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_notes');
    }
};
