<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('api_logs', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->index();
            $table->string('model')->nullable();
            $table->string('endpoint')->nullable();
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->longText('request_payload')->nullable();
            $table->longText('response_body')->nullable();
            $table->unsignedInteger('usage_prompt_tokens')->nullable();
            $table->unsignedInteger('usage_completion_tokens')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_logs');
    }
};
