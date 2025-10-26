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
        Schema::create('whatsapp_links', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->decimal('min_percentile', 5, 2)->nullable();
            $table->decimal('max_percentile', 5, 2)->nullable();
            $table->string('label')->nullable();
            $table->string('cta_text')->nullable();
            $table->string('description')->nullable();
            $table->string('url', 2048);
            $table->boolean('is_active')->default(true);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['type', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_links');
    }
};
