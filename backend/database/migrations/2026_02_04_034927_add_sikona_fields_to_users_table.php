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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['auditee', 'auditor', 'manajemen'])->default('auditee');
            $table->enum('sub_role', ['admin', 'kspi', 'komite'])->nullable();
            $table->string('department')->nullable();
            $table->string('biro')->nullable(); // Perencanaan Audit, Operasional & TI, Keuangan & Fraud
            $table->string('phone')->nullable();
            $table->string('avatar')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_seen_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'sub_role', 'department', 'biro', 'phone', 'avatar', 'is_active', 'is_online', 'last_seen_at']);
        });
    }
};
