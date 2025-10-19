<?php

namespace App\Http\Controllers;

use App\Http\Resources\XatScoreCalculationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class XatScoreCalculatorController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'link' => ['required', 'url'],
        ]);

        try {
            $result = xatgetStudentResult($data['link']);
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

        /** @var \App\Models\User $user */
        $user = $request->user();

        $calculation = $user->xatScoreCalculations()->create([
            'response_link' => $data['link'],
            'xat_id' => data_get($details, 'XAT_ID'),
            'candidate_name' => data_get($details, 'Candidate_Name'),
            'test_center' => data_get($details, 'Test_Center'),
            'total_score' => data_get($result, 'obtain_marks'),
            'total_percentile' => null,
            'overall_percentile' => null,
            'result_image_url' => null,
            'payload' => $result,
        ]);

        return response()->json([
            'message' => 'Score calculated successfully.',
            'calculation' => (new XatScoreCalculationResource($calculation))->toArray($request),
        ]);
    }
}
