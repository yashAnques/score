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
        Schema::create('cat_score_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('response_link');
            $table->string('candidate_name')->nullable();
            $table->unsignedTinyInteger('slot')->nullable();
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
        Schema::dropIfExists('cat_score_calculations');
    }
};
