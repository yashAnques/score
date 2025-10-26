<?php

namespace App\Http\Controllers;

use App\Http\Resources\CatScoreCalculationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatScoreCalculatorController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'link' => ['required', 'url'],
        ]);

        try {
            $result = getStudentResult($data['link']);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Unable to parse the response sheet. Please verify the link and try again.',
            ], 422);
        }

        if (! is_array($result) || empty($result)) {
            return response()->json([
                'message' => 'Unable to compute the score from the provided link.',
            ], 422);
        }

        $details = data_get($result, 'details', []);
        $overall = data_get($result, 'overallStats', []);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $calculation = $user->catScoreCalculations()->create([
            'response_link' => $data['link'],
            'candidate_name' => data_get($details, 'Candidate Name') ?? data_get($details, 'Candidate_Name'),
            'slot' => data_get($details, 'slot') ?? data_get($details, 'Shift'),
            'test_center' => data_get($details, 'Test Center Name')
                ?? data_get($details, 'Test Center')
                ?? data_get($details, 'Test Center')
                ?? data_get($details, 'Test_Center'),
            'total_score' => data_get($overall, 'totalScore'),
            'total_percentile' => null,
            'overall_percentile' => null,
            'result_image_url' => null,
            'payload' => $result,
        ]);

        return response()->json([
            'message' => 'Score calculated successfully.',
            'calculation' => (new CatScoreCalculationResource($calculation))->toArray($request),
        ]);
    }
}
