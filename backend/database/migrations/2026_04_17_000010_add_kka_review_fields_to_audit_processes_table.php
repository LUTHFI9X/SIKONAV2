<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_processes', function (Blueprint $table) {
            $table->boolean('kka_review_approved')->nullable()->after('status');
            $table->text('kka_review_note')->nullable()->after('kka_review_approved');
        });
    }

    public function down(): void
    {
        Schema::table('audit_processes', function (Blueprint $table) {
            $table->dropColumn(['kka_review_approved', 'kka_review_note']);
        });
    }
};
