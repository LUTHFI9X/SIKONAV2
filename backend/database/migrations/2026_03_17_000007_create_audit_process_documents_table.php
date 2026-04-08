<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_process_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_process_id')->constrained('audit_processes')->onDelete('cascade');
            $table->unsignedTinyInteger('tahap_no');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();

            $table->unique(['audit_process_id', 'tahap_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_process_documents');
    }
};
