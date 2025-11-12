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
        Schema::table('courses', function (Blueprint $table) {
            $table->unsignedSmallInteger('interview_credits')
                ->default(0)
                ->after('sale_price');
        });

        Schema::create('interview_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('type', 32)->default('string');
            $table->text('value')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_prompts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('template');
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('interview_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->date('slot_date')->index();
            $table->dateTimeTz('starts_at')->index();
            $table->dateTimeTz('ends_at')->index();
            $table->unsignedSmallInteger('capacity')->default(1);
            $table->unsignedSmallInteger('booked_count')->default(0);
            $table->string('timezone', 64)->default('Asia/Kolkata');
            $table->boolean('is_active')->default(true)->index();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'starts_at']);
        });

        Schema::create('interview_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('interview_slot_id')->nullable()->constrained('interview_slots')->nullOnDelete();
            $table->string('status', 32)->default('scheduled')->index();
            $table->string('candidate_role')->nullable();
            $table->unsignedSmallInteger('question_limit')->default(0);
            $table->unsignedSmallInteger('questions_asked')->default(0);
            $table->unsignedSmallInteger('credits_debited')->default(0);
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->text('feedback_summary')->nullable();
            $table->timestamp('feedback_generated_at')->nullable();
            $table->string('recording_manifest_path')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['interview_slot_id', 'status']);
        });

        Schema::create('interview_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_session_id')->constrained('interview_sessions')->cascadeOnDelete();
            $table->unsignedSmallInteger('sequence')->default(1);
            $table->text('question');
            $table->text('answer_notes')->nullable();
            $table->string('answer_recording_path')->nullable();
            $table->unsignedInteger('answer_duration_seconds')->default(0);
            $table->timestamp('asked_at')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['interview_session_id', 'sequence']);
        });

        Schema::create('interview_recordings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_session_id')->constrained('interview_sessions')->cascadeOnDelete();
            $table->string('storage_disk')->default('spaces');
            $table->string('storage_path');
            $table->unsignedInteger('chunk_index')->default(0);
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->timestamp('stored_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['interview_session_id', 'chunk_index']);
        });

        Schema::create('interview_credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('interview_session_id')->nullable()->constrained('interview_sessions')->nullOnDelete();
            $table->string('type', 32)->index();
            $table->integer('amount')->comment('Positive for credit, negative for debit');
            $table->integer('balance_after');
            $table->string('description')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        Schema::create('user_course_interview_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->integer('balance')->default(0);
            $table->unsignedInteger('lifetime_credited')->default(0);
            $table->unsignedInteger('lifetime_debited')->default(0);
            $table->timestamp('last_transaction_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);
            $table->index(['course_id', 'balance']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_course_interview_credits');
        Schema::dropIfExists('interview_credit_transactions');
        Schema::dropIfExists('interview_recordings');
        Schema::dropIfExists('interview_questions');
        Schema::dropIfExists('interview_sessions');
        Schema::dropIfExists('interview_slots');
        Schema::dropIfExists('ai_prompts');
        Schema::dropIfExists('interview_settings');

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('interview_credits');
        });
    }
};
