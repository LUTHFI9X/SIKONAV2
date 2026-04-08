<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->string('event_type', 50);         // login, logout, login_failed, user_created, user_updated, user_deleted, password_changed, password_reset, role_changed, data_modified, file_uploaded, file_deleted, etc.
            $table->string('description');
            $table->string('target_type')->nullable(); // User, AuditProcess, Conversation, etc.
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('metadata')->nullable();      // additional context (old/new values, etc.)
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('session_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
