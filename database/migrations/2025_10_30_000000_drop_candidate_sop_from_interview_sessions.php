<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('interview_sessions', 'candidate_sop')) {
            Schema::table('interview_sessions', function (Blueprint $table) {
                $table->dropColumn('candidate_sop');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('interview_sessions', 'candidate_sop')) {
            Schema::table('interview_sessions', function (Blueprint $table) {
                $table->text('candidate_sop')->nullable();
            });
        }
    }
};
