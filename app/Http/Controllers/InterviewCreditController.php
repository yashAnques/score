<?php

namespace App\Http\Controllers;

use App\Models\InterviewCreditTransaction;
use App\Models\UserCourseInterviewCredit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewCreditController extends Controller
{
    /**
     * Return the authenticated user's interview credit balances and recent ledger entries.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $balances = UserCourseInterviewCredit::query()
            ->with('course:id,name,slug,interview_credits')
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (UserCourseInterviewCredit $credit) => [
                'course' => $credit->course ? [
                    'id' => $credit->course->id,
                    'name' => $credit->course->name,
                    'slug' => $credit->course->slug,
                    'defaultCredits' => (int) $credit->course->interview_credits,
                ] : null,
                'balance' => (int) $credit->balance,
                'lifetimeCredited' => (int) $credit->lifetime_credited,
                'lifetimeDebited' => (int) $credit->lifetime_debited,
                'lastTransactionAt' => optional($credit->last_transaction_at)?->toIso8601String(),
                'updatedAt' => optional($credit->updated_at)?->toIso8601String(),
            ]);

        $limit = (int) min(max($request->integer('limit', 25), 1), 100);

        $transactions = InterviewCreditTransaction::query()
            ->with('course:id,name,slug')
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (InterviewCreditTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'amount' => (int) $transaction->amount,
                'balanceAfter' => (int) $transaction->balance_after,
                'description' => $transaction->description,
                'course' => $transaction->course ? [
                    'id' => $transaction->course->id,
                    'name' => $transaction->course->name,
                    'slug' => $transaction->course->slug,
                ] : null,
                'meta' => $transaction->meta,
                'createdAt' => optional($transaction->created_at)?->toIso8601String(),
            ]);

        return response()->json([
            'balances' => $balances,
            'transactions' => $transactions,
        ]);
    }
}
