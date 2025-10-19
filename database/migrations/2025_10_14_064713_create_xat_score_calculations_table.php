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
        Schema::create('xat_score_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('response_link');
            $table->string('xat_id')->nullable();
            $table->string('candidate_name')->nullable();
            $table->string('test_center')->nullable();
            $table->decimal('total_score', 6, 2)->nullable();
            $table->decimal('total_percentile', 6, 2)->nullable();
            $table->decimal('overall_percentile', 6, 2)->nullable();
            $table->string('result_image_url')->nullable();
            $table->json('payload');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('xat_score_calculations');
    }
};
