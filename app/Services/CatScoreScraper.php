<?php

namespace App\Services;

use App\Services\Exceptions\CatScoreScraperException;
use voku\helper\HtmlDomParser;
use voku\helper\SimpleHtmlDomInterface;

class CatScoreScraper
{
    /**
     * Fetch and calculate CAT score details from the given response sheet URL.
     *
     * @return array<string, mixed>
     */
    public function calculate(string $url): array
    {
        /** @var HtmlDomParser|false $html */
        $html = HtmlDomParser::file_get_html($url);

        if ($html === false) {
            throw new CatScoreScraperException('Unable to fetch the response sheet.');
        }

        try {
            $data = $this->fetchMarksFromDom($html);
        } finally {
            $html->clear();
        }

        return $this->buildStudentResult($data);
    }

    /**
     * @param  HtmlDomParser|SimpleHtmlDomInterface  $html
     * @return array<string, mixed>
     */
    private function fetchMarksFromDom($html): array
    {
        $studentInfo = [];

        foreach ($html->find('div.main-info-pnl table tr') as $row) {
            $cells = $row->find('td');

            if (count($cells) < 2) {
                continue;
            }

            $label = $this->cleanText($cells[0]->plaintext, ':');
            $value = $this->cleanText($cells[1]->plaintext);

            if ($label === '') {
                continue;
            }

            $studentInfo[$label] = $value;
        }

        $sections = [];

        foreach ($html->find('div.grp-cntnr div.section-cntnr') as $section) {
            $labelNode = $section->find('div.section-lbl', 0);
            $rawName = $labelNode ? $labelNode->plaintext : 'Section';
            $sectionName = $this->cleanText(str_replace('Section : ', '', $rawName));

            $questions = [];

            foreach ($section->find('div.question-pnl') as $questionNode) {
                $questions[] = $this->parseQuestion($questionNode);
            }

            $sections[] = [
                'name' => $sectionName,
                'questions' => $questions,
            ];
        }

        return [
            'details' => $studentInfo,
            'sections' => $sections,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function buildStudentResult(array $data): array
    {
        $data['overallStats'] = [
            'totalCorrect' => 0,
            'totalIncorrect' => 0,
            'totalUnattempted' => 0,
            'totalScore' => 0,
            'totalPercentile' => 0,
            'percentile' => 0,
        ];

        foreach ($data['sections'] as $sectionKey => $section) {
            $stats = [
                'correctCount' => 0,
                'incorrectCount' => 0,
                'unattemptedCount' => 0,
                'score' => 0,
                'percentile' => 0,
            ];

            foreach ($section['questions'] as $question) {
                $result = $question['result'] ?? null;
                $questionType = strtoupper((string) ($question['question_type'] ?? ''));

                if ($result === 'Correct') {
                    $stats['correctCount']++;
                    $stats['score'] += 3;
                } elseif ($result === 'Unattempted') {
                    $stats['unattemptedCount']++;
                } elseif ($result === 'Incorrect') {
                    $stats['incorrectCount']++;

                    if ($questionType === 'MCQ') {
                        $stats['score'] -= 1;
                    }
                }
            }

            $data['sections'][$sectionKey]['stats'] = $stats;

            $data['overallStats']['totalCorrect'] += $stats['correctCount'];
            $data['overallStats']['totalIncorrect'] += $stats['incorrectCount'];
            $data['overallStats']['totalUnattempted'] += $stats['unattemptedCount'];
            $data['overallStats']['totalScore'] += $stats['score'];
        }

        $shift = $this->resolveShift($data['details']['Test Time'] ?? null);

        $data['details']['Shift'] = $shift;

        $percentile = $this->getScorePercentile((float) ($data['overallStats']['totalScore'] ?? 0), $shift);

        $data['percentile'] = $percentile;
        $data['overallStats']['percentile'] = $percentile;

        return $data;
    }

    /**
     * @param  SimpleHtmlDomInterface  $question
     * @return array<string, mixed>
     */
    private function parseQuestion(SimpleHtmlDomInterface $question): array
    {
        $texts = [];

        foreach ($question->find('td') as $index => $td) {
            $texts[$index] = $this->cleanText($td->plaintext);
        }

        $questionData = [
            'question_type' => $this->pluckNextValue($texts, 'Question Type :'),
            'question_id' => $this->pluckNextValue($texts, 'Question ID :'),
            'status' => $this->pluckNextValue($texts, 'Status :'),
            'chosen_option' => $this->pluckNextValue($texts, 'Chosen Option :'),
        ];

        $givenAnswer = $this->pluckNextValue($texts, 'Given Answer :');

        if ($givenAnswer !== null && $givenAnswer !== '') {
            $questionData['chosen_option'] = $givenAnswer;
        }

        if ($questionData['chosen_option'] === '--') {
            $questionData['chosen_option'] = null;
        } elseif ($questionData['chosen_option'] === '0') {
            $questionData['chosen_option'] = '0';
        }

        $rightAnswer = null;

        foreach ($question->find('td') as $td) {
            if (! $this->hasClass($td, 'rightAns')) {
                continue;
            }

            $text = $this->cleanText($td->plaintext);

            if (($questionData['question_type'] ?? '') === 'MCQ') {
                $rightAnswer = substr(str_replace('Possible Answer: ', '', $text), 0, 1);
            } else {
                $rightAnswer = substr(str_replace('Possible Answer: ', '', $text), 0, 5);
            }

            $filtered = filter_var($rightAnswer, FILTER_VALIDATE_INT);
            $rightAnswer = $filtered !== false ? (string) $filtered : $rightAnswer;
        }

        $questionData['right_answer'] = $rightAnswer;

        $questionData['result'] = $this->resolveResult(
            $questionData['chosen_option'] ?? null,
            $rightAnswer,
            $questionData['status'] ?? null
        );

        return $questionData;
    }

    private function resolveResult(?string $chosenOption, $rightAnswer, ?string $status): string
    {
        if ($chosenOption !== null && $rightAnswer !== null && (string) $chosenOption === (string) $rightAnswer) {
            return 'Correct';
        }

        if ($chosenOption === '0' && (string) $rightAnswer === '0') {
            return 'Correct';
        }

        if (in_array($status, ['Not Answered', 'Not Attempted and Marked For Review'], true)) {
            return 'Unattempted';
        }

        if ($chosenOption === null || $chosenOption === '') {
            return 'Unattempted';
        }

        return 'Incorrect';
    }

    private function resolveShift(?string $testTime): int
    {
        return match ($testTime) {
            '8:30 AM - 10:30 AM' => 1,
            '12:30 PM - 2:30 PM' => 2,
            '4:30 PM - 6:30 PM' => 3,
            '9:00 AM - 12:00 PM' => 1,
            default => 1,
        };
    }

    private function pluckNextValue(array $texts, string $needle): ?string
    {
        foreach ($texts as $index => $value) {
            if ($value !== $needle) {
                continue;
            }

            return $texts[$index + 1] ?? null;
        }

        return null;
    }

    private function hasClass(SimpleHtmlDomInterface $node, string $class): bool
    {
        $classAttr = $node->class ?? ($node->attr['class'] ?? null);

        if (! is_string($classAttr) || $classAttr === '') {
            return false;
        }

        $classes = preg_split('/\s+/', trim($classAttr)) ?: [];

        return in_array($class, $classes, true);
    }

    private function cleanText(string $text, string $removeExtra = '', string $replaceWith = ''): string
    {
        $clean = str_replace('&nbsp;', ' ', $text);
        $clean = str_replace($removeExtra, $replaceWith, $clean);
        $clean = html_entity_decode($clean, ENT_QUOTES | ENT_COMPAT, 'UTF-8');
        $clean = html_entity_decode($clean, ENT_HTML5, 'UTF-8');
        $clean = html_entity_decode($clean);
        $clean = htmlspecialchars_decode($clean);
        $clean = strip_tags($clean);

        return trim($clean);
    }

    private function getScorePercentile(float $score, int $shift): string
    {
        if ($shift === 2) {
            return $this->scorePercentileShiftTwo($score);
        }

        if ($shift === 3) {
            return $this->scorePercentileShiftThree($score);
        }

        return $this->scorePercentileShiftOne($score);
    }

    private function scorePercentileShiftOne(float $score): string
    {
        if ($score >= 116) {
            return '99.9%tile - 100%tile';
        }
        if ($score >= 109) {
            return '99.8%tile - 99.9%tile';
        }
        if ($score >= 100) {
            return '99.6%tile - 99.8%tile';
        }
        if ($score >= 94) {
            return '99.4%tile - 99.6%tile';
        }
        if ($score >= 90) {
            return '99.2%tile - 99.4%tile';
        }
        if ($score >= 87) {
            return '99%tile - 99.2%tile';
        }
        if ($score >= 81) {
            return '98.5%tile - 99%tile';
        }
        if ($score >= 76) {
            return '98%tile - 98.5%tile';
        }
        if ($score >= 70) {
            return '97%tile - 98%tile';
        }
        if ($score >= 65) {
            return '96%tile - 97%tile';
        }
        if ($score >= 60) {
            return '95%tile (CAP IIMs) - 96%tile';
        }
        if ($score >= 54) {
            return '92%tile - 95%tile';
        }
        if ($score >= 47) {
            return '89%tile - 92%tile';
        }
        if ($score >= 42) {
            return '85%tile - 89%tile';
        }
        if ($score >= 38) {
            return '80%tile - 85%tile';
        }
        if ($score >= 34) {
            return '75%tile - 80%tile';
        }
        if ($score >= 30) {
            return '70%tile - 75%tile';
        }
        if ($score >= 25) {
            return '65%tile - 70%tile';
        }
        if ($score >= 23) {
            return '60%tile - 65%tile';
        }
        if ($score >= 19) {
            return '55%tile - 60%tile';
        }
        if ($score >= 15) {
            return '50%tile - 55%tile';
        }
        if ($score >= 10) {
            return '45%tile - 50%tile';
        }
        if ($score >= 6) {
            return '35%tile - 45%tile';
        }
        if ($score >= 4) {
            return '25%tile - 35%tile';
        }
        if ($score >= 2) {
            return '15%tile - 25%tile';
        }
        if ($score >= -2) {
            return '10%tile - 15%tile';
        }

        return '0%tile - 10%tile';
    }

    private function scorePercentileShiftTwo(float $score): string
    {
        if ($score >= 104) {
            return '99.9%tile - 100%tile';
        }
        if ($score >= 98) {
            return '99.8%tile - 99.9%tile';
        }
        if ($score >= 92) {
            return '99.6%tile - 99.8%tile';
        }
        if ($score >= 86) {
            return '99.4%tile - 99.6%tile';
        }
        if ($score >= 83) {
            return '99.2%tile - 99.4%tile';
        }
        if ($score >= 80) {
            return '99%tile - 99.2%tile';
        }
        if ($score >= 76) {
            return '98.5%tile - 99%tile';
        }
        if ($score >= 71) {
            return '98%tile - 98.5%tile';
        }
        if ($score >= 66) {
            return '97%tile - 98%tile';
        }
        if ($score >= 61) {
            return '96%tile - 97%tile';
        }
        if ($score >= 57) {
            return '95%tile - 96%tile';
        }
        if ($score >= 52) {
            return '92%tile - 95%tile';
        }
        if ($score >= 45) {
            return '89%tile - 92%tile';
        }
        if ($score >= 39) {
            return '85%tile - 89%tile';
        }
        if ($score >= 35) {
            return '80%tile - 85%tile';
        }
        if ($score >= 32) {
            return '75%tile - 80%tile';
        }
        if ($score >= 28) {
            return '70%tile - 75%tile';
        }
        if ($score >= 24) {
            return '65%tile - 70%tile';
        }
        if ($score >= 21) {
            return '60%tile - 65%tile';
        }
        if ($score >= 18) {
            return '55%tile - 60%tile';
        }
        if ($score >= 15) {
            return '50%tile - 55%tile';
        }
        if ($score >= 12) {
            return '45%tile - 50%tile';
        }
        if ($score >= 8) {
            return '35%tile - 45%tile';
        }
        if ($score >= 4) {
            return '25%tile - 35%tile';
        }
        if ($score >= 1) {
            return '15%tile - 25%tile';
        }
        if ($score >= -2) {
            return '10%tile - 15%tile';
        }

        return '0%tile - 10%tile';
    }

    private function scorePercentileShiftThree(float $score): string
    {
        if ($score >= 114) {
            return '99.9%tile - 100%tile';
        }
        if ($score >= 106) {
            return '99.8%tile - 99.9%tile';
        }
        if ($score >= 98) {
            return '99.6%tile - 99.8%tile';
        }
        if ($score >= 92) {
            return '99.4%tile - 99.6%tile';
        }
        if ($score >= 86) {
            return '99.2%tile - 99.4%tile';
        }
        if ($score >= 83) {
            return '99%tile - 99.2%tile';
        }
        if ($score >= 78) {
            return '98.5%tile - 99%tile';
        }
        if ($score >= 74) {
            return '98%tile - 98.5%tile';
        }
        if ($score >= 68) {
            return '97%tile - 98%tile';
        }
        if ($score >= 64) {
            return '96%tile - 97%tile';
        }
        if ($score >= 59) {
            return '95%tile - 96%tile';
        }
        if ($score >= 55) {
            return '92%tile - 95%tile';
        }
        if ($score >= 51) {
            return '89%tile - 92%tile';
        }
        if ($score >= 46) {
            return '85%tile - 89%tile';
        }
        if ($score >= 41) {
            return '80%tile - 85%tile';
        }
        if ($score >= 35) {
            return '75%tile - 80%tile';
        }
        if ($score >= 30) {
            return '70%tile - 75%tile';
        }
        if ($score >= 27) {
            return '65%tile - 70%tile';
        }
        if ($score >= 24) {
            return '60%tile - 65%tile';
        }
        if ($score >= 20) {
            return '55%tile - 60%tile';
        }
        if ($score >= 17) {
            return '50%tile - 55%tile';
        }
        if ($score >= 15) {
            return '45%tile - 50%tile';
        }
        if ($score >= 10) {
            return '35%tile - 45%tile';
        }
        if ($score >= 6) {
            return '25%tile - 35%tile';
        }
        if ($score >= 3) {
            return '15%tile - 25%tile';
        }
        if ($score >= -2) {
            return '10%tile - 15%tile';
        }

        return '0%tile - 10%tile';
    }
}
