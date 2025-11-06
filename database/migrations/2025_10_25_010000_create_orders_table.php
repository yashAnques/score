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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_email');
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('provider')->default('razorpay')->index();
            $table->string('provider_order_id')->unique();
            $table->string('provider_payment_id')->nullable()->unique();
            $table->string('provider_signature')->nullable();
            $table->unsignedBigInteger('amount');
            $table->string('currency', 3)->default('INR');
            $table->string('status', 32)->default('pending')->index();
            $table->json('meta')->nullable();
            $table->timestamp('paid_at')->nullable()->index();
            $table->timestamps();

            $table->index(['course_id', 'customer_email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
