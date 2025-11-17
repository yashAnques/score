<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('interview_questions', function (Blueprint $table) {
            $table->longText('answer_transcript')->nullable()->after('answer_notes');
        });
    }

    public function down(): void
    {
        Schema::table('interview_questions', function (Blueprint $table) {
            $table->dropColumn('answer_transcript');
        });
    }
};
