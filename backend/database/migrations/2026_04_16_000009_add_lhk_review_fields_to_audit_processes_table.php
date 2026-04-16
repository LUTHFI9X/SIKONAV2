<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_processes', function (Blueprint $table) {
            $table->string('lhk_stage', 20)->default('draft')->after('status');
            $table->boolean('lhk_review_approved')->nullable()->after('lhk_stage');
            $table->text('lhk_review_note')->nullable()->after('lhk_review_approved');
        });
    }

    public function down(): void
    {
        Schema::table('audit_processes', function (Blueprint $table) {
            $table->dropColumn(['lhk_stage', 'lhk_review_approved', 'lhk_review_note']);
        });
    }
};
