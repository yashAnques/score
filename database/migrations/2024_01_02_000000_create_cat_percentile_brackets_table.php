<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cat_percentile_brackets', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('shift');
            $table->decimal('min_score', 6, 2);
            $table->string('label');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['shift', 'min_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cat_percentile_brackets');
    }
};
