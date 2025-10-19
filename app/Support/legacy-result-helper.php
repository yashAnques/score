<?php

use App\Models\City;
use App\Models\State;
use Sunra\PhpSimple\HtmlDomParser;

function getStudentResult($url)
{
    $data = fetchMarks($url);

    $data['overallStats'] = [
        "totalCorrect"     => 0,
        "totalIncorrect"   => 0,
        "totalUnattempted" => 0,
        "totalScore"       => 0,
        "totalPercentile"  => 0,
        "percentile"       => 0,
    ];

    foreach ($data['sections'] as $section_key => $section_data) {
        $data['sections'][$section_key]["stats"] = [
            "correctCount"     => 0,
            "incorrectCount"   => 0,
            "unattemptedCount" => 0,
            "score"            => 0,
            "percentile"       => 0,
        ];

        foreach ($section_data['questions'] as $key => $value) {
            if ($value['result'] == "Correct") {
                $data['sections'][$section_key]["stats"]['correctCount'] = $data['sections'][$section_key]["stats"]['correctCount'] + 1;
                $data['sections'][$section_key]["stats"]['score']        = $data['sections'][$section_key]["stats"]['score'] + 3;
            } elseif ($value['result'] == "Unattempted") {
                $data['sections'][$section_key]["stats"]['unattemptedCount'] = $data['sections'][$section_key]["stats"]['unattemptedCount'] + 1;
            } else {
                $data['sections'][$section_key]["stats"]['incorrectCount'] = $data['sections'][$section_key]["stats"]['incorrectCount'] + 1;

                if ($value['question_type'] == "MCQ") {
                    $data['sections'][$section_key]["stats"]['score'] = $data['sections'][$section_key]["stats"]['score'] - 1;
                }
            }
        }

        $data['overallStats']['totalCorrect']     = $data['overallStats']['totalCorrect'] + $data['sections'][$section_key]["stats"]['correctCount'];
        $data['overallStats']['totalIncorrect']   = $data['overallStats']['totalIncorrect'] + $data['sections'][$section_key]["stats"]['incorrectCount'];
        $data['overallStats']['totalUnattempted'] = $data['overallStats']['totalUnattempted'] + $data['sections'][$section_key]["stats"]['unattemptedCount'];
        $data['overallStats']['totalScore']       = $data['overallStats']['totalScore'] + $data['sections'][$section_key]["stats"]['score'];
    }

    $shift = 1;

    switch (@$data['details']['Test Time']) {
        case "8:30 AM - 10:30 AM":
            $shift = 1;
            break;
        case "12:30 PM - 2:30 PM":
            $shift = 2;
            break;
        case "4:30 PM - 6:30 PM":
            $shift = 3;
            break;
    }

    @$data['details']['Shift'] = $shift;

    $obtain_marks = @$data['overallStats']['totalScore'] ?? 0;
    $percentile   = @getScorePercentile($obtain_marks, $shift);

    @$data['percentile']                 = @$percentile;
    @$data['overallStats']['percentile'] = @$percentile;
    return $data;
}

function getCmatStudentResult($url)
{
    $data      = fetchMarks($url);
    $cmatSlot1 = [
        53100242  => 3,
        53100243  => 1,
        53100244  => 1,
        53100245  => 4,
        53100246  => 2,
        53100247  => 1,
        53100249  => 1,
        53100250  => 3,
        53100251  => 2,
        53100252  => 3,
        53100253  => 2,
        53100254  => 4,
        53100255  => 4,
        53100256  => 3,
        53100257  => 1,
        53100258  => 1,
        53100259  => 2,
        53100260  => 1,
        53100262  => 3,
        53100263  => 1,
        53100264  => 2,
        53100265  => 1,
        53100266  => 1,
        53100267  => 2,
        53100268  => 4,
        53100269  => 2,
        53100270  => 3,
        53100271  => 4,
        53100272  => 1,
        53100273  => 1,
        53100274  => 2,
        53100275  => 3,
        53100276  => 3,
        53100277  => 4,
        53100278  => 2,
        53100279  => 3,
        53100280  => 3,
        53100281  => 4,
        53100282  => 3,
        53100283  => 3,
        53100284  => 3,
        53100285  => 1,
        53100286  => 1,
        53100287  => 3,
        53100288  => 3,
        53100289  => 4,
        53100290  => 2,
        53100291  => 3,
        53100292  => 2,
        53100293  => 1,
        53100294  => 1,
        53100295  => 3,
        53100296  => 3,
        53100297  => 3,
        53100298  => 2,
        53100299  => 1,
        531002100 => 1,
        531002101 => 3,
        531002102 => 4,
        531002103 => 2,
        5310022   => 2,
        5310023   => 3,
        5310024   => 4,
        5310025   => 2,
        5310026   => 3,
        5310027   => 3,
        5310028   => 3,
        5310029   => 2,
        53100210  => 1,
        53100211  => 4,
        53100212  => 2,
        53100213  => 1,
        53100214  => 3,
        53100215  => 3,
        53100216  => 3,
        53100217  => 3,
        53100218  => 3,
        53100219  => 3,
        53100220  => 1,
        53100221  => 2,
        53100222  => 2,
        53100223  => 2,
        53100224  => 2,
        53100225  => 4,
        53100226  => 4,
        53100227  => 3,
        53100228  => 2,
        53100229  => 2,
        53100230  => 1,
        53100231  => 2,
        53100232  => 2,
        53100233  => 4,
        53100234  => 1,
        53100235  => 3,
        53100236  => 4,
        53100237  => 3,
        53100238  => 4,
        53100239  => 4,
        53100240  => 4,
        53100241  => 4,
    ];

    $cmatSlot2 = [
        599138723 => 2,
        599138724 => 2,
        599138725 => 4,
        599138726 => 1,
        599138727 => 1,
        599138728 => 2,
        599138729 => 4,
        599138730 => 4,
        599138731 => 1,
        599138732 => 3,
        599138733 => 3,
        599138734 => 2,
        599138735 => 1,
        599138736 => 4,
        599138737 => 4,
        599138738 => 1,
        599138739 => 4,
        599138740 => 4,
        599138741 => 4,
        599138742 => 1,
        599138743 => 1,
        599138744 => 3,
        599138745 => 4,
        599138746 => 4,
        599138747 => 3,
        599138748 => 4,
        599138749 => 4,
        599138750 => 3,
        599138751 => 4,
        599138752 => 3,
        599138753 => 4,
        599138754 => 3,
        599138755 => 2,
        599138756 => 4,
        599138757 => 3,
        599138758 => 4,
        599138759 => 2,
        599138760 => 4,
        599138761 => 4,
        599138762 => 3,
        599138763 => 4,
        599138764 => 4,
        599138765 => 3,
        599138766 => 2,
        599138767 => 3,
        599138768 => 2,
        599138770 => 3,
        599138771 => 2,
        599138772 => [2, 3, 4],
        599138773 => 1,
        599138774 => 4,
        599138775 => 1,
        599138776 => 1,
        599138777 => 3,
        599138778 => 1,
        599138779 => 3,
        599138780 => 3,
        599138781 => 1,
        599138783 => 1,
        599138784 => 4,
        599138785 => 2,
        599138786 => 1,
        599138787 => 3,
        599138788 => 4,
        599138789 => 2,
        599138790 => 4,
        599138791 => 2,
        599138792 => 2,
        599138793 => 2,
        599138794 => 3,
        599138795 => 4,
        599138796 => 1,
        599138797 => 2,
        599138798 => 3,
        599138799 => 2,
        599138800 => 3,
        599138801 => 3,
        599138802 => 3,
        599138803 => 3,
        599138804 => 4,
        599138805 => 1,
        599138806 => 2,
        599138807 => 1,
        599138808 => 3,
        599138809 => 1,
        599138810 => 3,
        599138811 => 1,
        599138812 => 1,
        599138813 => 4,
        599138814 => 2,
        599138815 => 1,
        599138816 => 2,
        599138817 => 1,
        599138818 => 4,
        599138819 => 4,
        599138820 => 1,
        599138821 => 4,
        599138822 => 3,
        599138823 => 2,
        599138824 => 3,
    ];

    foreach ($data['sections'] as $sKey => &$section) {
        foreach ($section['questions'] as $qKey => &$question) {
            if ($data['details']['Test Time'] === '9:00 AM - 12:00 PM') {
                $question['right_answer'] = $cmatSlot1[$question['question_id']] ?? '0';
            } else {
                $question['right_answer'] = $cmatSlot2[$question['question_id']] ?? '0';
            }

            $right_answer  = $question['right_answer'];
            $chosen_option = $question['chosen_option'];

            if ($chosen_option == $right_answer) {
                $question['result'] = 'Correct';
            } elseif ($chosen_option == '0' && $right_answer == '0') {
                $question['result'] = 'Correct';
            } elseif (in_array($question['status'] ?? '', ["Not Answered", "Not Attempted and Marked For Review"])) {
                $question['result'] = "Unattempted";
            } else {
                $question['result'] = "Incorrect";
            }
        }
    }

    $data['overallStats'] = [
        "totalCorrect"     => 0,
        "totalIncorrect"   => 0,
        "totalUnattempted" => 0,
        "totalScore"       => 0,
        "totalPercentile"  => 0,
        "percentile"       => 0,
    ];

    foreach ($data['sections'] as $section_key => $section_data) {
        $data['sections'][$section_key]["stats"] = [
            "correctCount"     => 0,
            "incorrectCount"   => 0,
            "unattemptedCount" => 0,
            "score"            => 0,
            "percentile"       => 0,
        ];

        foreach ($section_data['questions'] as $key => $value) {
            if ($value['result'] == "Correct") {
                $data['sections'][$section_key]["stats"]['correctCount'] = $data['sections'][$section_key]["stats"]['correctCount'] + 1;
                $data['sections'][$section_key]["stats"]['score']        = $data['sections'][$section_key]["stats"]['score'] + 4;
            } elseif ($value['result'] == "Unattempted") {
                $data['sections'][$section_key]["stats"]['unattemptedCount'] = $data['sections'][$section_key]["stats"]['unattemptedCount'] + 1;
            } else {
                $data['sections'][$section_key]["stats"]['incorrectCount'] = $data['sections'][$section_key]["stats"]['incorrectCount'] + 1;

                if ($value['question_type'] == "MCQ") {
                    $data['sections'][$section_key]["stats"]['score'] = $data['sections'][$section_key]["stats"]['score'] - 1;
                }
            }
        }

        $data['overallStats']['totalCorrect']     = $data['overallStats']['totalCorrect'] + $data['sections'][$section_key]["stats"]['correctCount'];
        $data['overallStats']['totalIncorrect']   = $data['overallStats']['totalIncorrect'] + $data['sections'][$section_key]["stats"]['incorrectCount'];
        $data['overallStats']['totalUnattempted'] = $data['overallStats']['totalUnattempted'] + $data['sections'][$section_key]["stats"]['unattemptedCount'];
        $data['overallStats']['totalScore']       = $data['overallStats']['totalScore'] + $data['sections'][$section_key]["stats"]['score'];
    }

    $shift = 1;

    switch (@$data['details']['Test Time']) {
        case "8:30 AM - 10:30 AM":
            $shift = 1;
            break;
        case "12:30 PM - 2:30 PM":
            $shift = 2;
            break;
        case "4:30 PM - 6:30 PM":
            $shift = 3;
            break;
    }

    @$data['details']['Shift'] = $shift;

    $obtain_marks = @$data['overallStats']['totalScore'] ?? 0;

    return $data;
}

function fetchMarks($url)
{
    $html = file_get_html($url);

    $student_info = [];

    foreach ($html->find('div.main-info-pnl table tr') as $tr) {
        $tds                                       = $tr->find('td');
        $student_info[_t($tds[0]->plaintext, ':')] = _t($tds[1]->plaintext);
    }

    $sections_result = [];
    $sections        = $html->find('div.grp-cntnr div.section-cntnr');

    foreach ($sections as $section) {
        $section_name     = _t(str_replace('Section : ', '', _t($section->find('div.section-lbl', 0)->plaintext)));
        $questions_result = [];
        foreach ($section->find('div.question-pnl') as $K => $question) {
            $questions_result[] = parseQuestion($question);
        }
        $section_result = [
            'name'      => $section_name,
            'questions' => $questions_result,
        ];
        $sections_result[] = $section_result;
    }

    return ['details' => $student_info, 'sections' => $sections_result];
}

function parseQuestion($question)
{

    $texts = [];
    foreach ($question->find('td') as $tk => $td) {
        $texts[$tk] = _t($td->plaintext);
    }

    $right_answer = "";
    $que_data     = [];

    foreach ($texts as $key => $value) {

        if ($value == "Question Type :") {
            $que_data['question_type'] = $texts[$key + 1];
        }

        if ($value == "Question ID :") {
            $que_data['question_id'] = $texts[$key + 1];
        }

        if ($value == "Status :") {
            $que_data['status'] = $texts[$key + 1];
        }

        if ($value == "Chosen Option :") {
            $que_data['chosen_option'] = $texts[$key + 1] == 0 ? '0' : $texts[$key + 1];
        }

        if ($value == "Given Answer :") {
            $que_data['chosen_option'] = $texts[$key + 1];
        }
    }
    foreach ($question->find('td') as $tk => $td) {
        $texts[$tk] = _t($td->plaintext);
        if (dom_node_has_class($td, 'rightAns')) {
            $que_data['answer'] = $texts[$tk];
            if ($que_data['question_type'] == "MCQ") {
                $right_answer = substr(str_replace('Possible Answer: ', '', $texts[$tk]), 0, 1);
            } else {
                $right_answer = substr(str_replace('Possible Answer: ', '', $texts[$tk]), 0, 5);
            }
            $right_answer = filter_var($right_answer, FILTER_VALIDATE_INT);
        }
    }

    $que_data['right_answer'] = $right_answer;
    if ($que_data['chosen_option'] == '--') {
        $que_data['chosen_option'] = null;
    }

    if ($que_data['chosen_option'] == '0' && $right_answer == '0') {
        $que_data['result'] = "Correct";
    } else if (! empty($que_data['chosen_option']) && $que_data['chosen_option'] == $right_answer) {
        $que_data['result'] = "Correct";
    } elseif (in_array($que_data['status'], ["Not Answered", "Not Attempted and Marked For Review"])) {
        $que_data['result'] = "Unattempted";
    } else {
        $que_data['result'] = "Incorrect";
    }

    return $que_data;
}

function parseMCQ_Question($question)
{
    $texts                = [];
    $correct_option       = 0;
    $correct_option_index = 0;
    foreach ($question->find('td') as $tk => $td) {
        $texts[$tk] = _t($td->plaintext);
        if (dom_node_has_class($td, 'rightAns')) {
            $correct_option_index = $tk;
        }
    }
    $rev_correct_option_index = (count($texts) - $correct_option_index) - 1;
    if (strpos(strtolower(@$texts[2]), 'comprehension') !== false) {
        switch ($rev_correct_option_index) {
            case 22:
                $correct_option = 1;
                break;
            case 20:
                $correct_option = 2;
                break;
            case 18:
                $correct_option = 3;
                break;
            case 16:
                $correct_option = 4;
                break;
        }
        $rtexts = array_reverse($texts);
        return [
            'passage_title'      => @$texts[2],
            'passage'            => @$texts[4],
            'parse_as'           => 'mcq',
            'sub_type'           => 'comprehension',
            'type'               => strtolower(@$rtexts[14]),
            'id'                 => @$rtexts[12],
            'number'             => @$rtexts[26],
            'name'               => @$rtexts[25],
            'options'            => [
                1 => @$rtexts[10],
                2 => @$rtexts[8],
                3 => @$rtexts[6],
                4 => @$rtexts[4],
            ],
            'attempted'          => isQuestionAttempted(@$rtexts[2]),
            'correct_option'     => $correct_option,
            'selected_option'    => @$rtexts[0],
            'answered_correctly' => $correct_option == @$rtexts[0],
        ];
    } else {
        $correct_option = explode('.', @$texts[$correct_option_index])[0];

        return [
            'parse_as'           => 'mcq',
            'sub_type'           => 'alternate',
            'type'               => strtolower(@$texts[13]),
            'id'                 => @$texts[15],
            'number'             => @$texts[1],
            'name'               => @$texts[2],
            'options'            => [
                1 => @$texts[5],
                2 => @$texts[7],
                3 => @$texts[9],
                4 => @$texts[11],
            ],
            'attempted'          => isQuestionAttempted(@$texts[25]),
            'correct_option'     => $correct_option,
            'selected_option'    => @$texts[27],
            'answered_correctly' => $correct_option == @$texts[27],
        ];
    }
}

function parseSA_Question($question)
{
    $texts = [];
    foreach ($question->find('td') as $tk => $td) {
        $texts[$tk] = _t($td->plaintext);
    }
    if (strpos(strtolower(@$texts[2]), 'comprehension') !== false) {
        $rtexts         = array_reverse($texts);
        $correct_answer = _t(str_replace('possible answer:', '', strtolower(@$rtexts[8])));
        return [
            'passage_title'      => @$texts[2],
            'passage'            => @$texts[4],
            'parse_as'           => 'sa',
            'sub_type'           => 'comprehension',
            'type'               => strtolower(@$rtexts[4]),
            'cs'                 => _t(str_replace('case sensitivity:', '', strtolower(@$rtexts[12]))),
            'id'                 => @$rtexts[2],
            'number'             => @$rtexts[16],
            'name'               => @$rtexts[15],
            'attempted'          => isQuestionAttempted(@$rtexts[0]),
            'correct_answer'     => $correct_answer,
            'given_answer'       => @$rtexts[6],
            'answered_correctly' => $correct_answer == @$rtexts[6],
        ];
    } else {
        $correct_answer = _t(str_replace('possible answer:', '', strtolower(@$texts[9])));
        return [
            'parse_as'           => 'sa',
            'sub_type'           => 'jumbled',
            'type'               => strtolower(@$texts[13]),
            'cs'                 => _t(str_replace('case sensitivity:', '', strtolower(@$texts[5]))),
            'id'                 => @$texts[15],
            'number'             => @$texts[1],
            'name'               => @$texts[2],
            'attempted'          => isQuestionAttempted(@$texts[17]),
            'correct_answer'     => $correct_answer,
            'given_answer'       => @$texts[11],
            'answered_correctly' => $correct_answer == @$texts[11],
        ];
    }
}
function isQuestionAttempted($status)
{
    $status = _t(strtolower($status));
    return in_array($status, ["answered", "marked for review"]);
}

function getScorePercentile($score, $shift)
{
    $pp = "0%tile - 10%tile";
    if ($shift == 1) {
        if ($score >= 116) {
            $pp = "99.9%tile - 100%tile";
        } else if ($score >= 109) {
            $pp = "99.8%tile - 99.9%tile";
        } else if ($score >= 100) {
            $pp = "99.6%tile - 99.8%tile";
        } else if ($score >= 94) {
            $pp = "99.4%tile - 99.6%tile";
        } else if ($score >= 90) {
            $pp = "99.2%tile - 99.4%tile";
        } else if ($score >= 87) {
            $pp = "99%tile - 99.2%tile";
        } else if ($score >= 81) {
            $pp = "98.5%tile - 99%tile";
        } else if ($score >= 76) {
            $pp = "98%tile - 98.5%tile";
        } else if ($score >= 70) {
            $pp = "97%tile - 98%tile";
        } else if ($score >= 65) {
            $pp = "96%tile - 97%tile";
        } else if ($score >= 60) {
            $pp = "95%tile (CAP IIMs) - 96%tile";
        } else if ($score >= 54) {
            $pp = "92%tile - 95%tile";
        } else if ($score >= 47) {
            $pp = "89%tile - 92%tile";
        } else if ($score >= 42) {
            $pp = "85%tile - 89%tile";
        } else if ($score >= 38) {
            $pp = "80%tile - 85%tile";
        } else if ($score >= 34) {
            $pp = "75%tile - 80%tile";
        } else if ($score >= 30) {
            $pp = "70%tile - 75%tile";
        } else if ($score >= 25) {
            $pp = "65%tile - 70%tile";
        } else if ($score >= 23) {
            $pp = "60%tile - 65%tile";
        } else if ($score >= 19) {
            $pp = "55%tile - 60%tile";
        } else if ($score >= 15) {
            $pp = "50%tile - 55%tile";
        } else if ($score >= 10) {
            $pp = "45%tile - 50%tile";
        } else if ($score >= 6) {
            $pp = "35%tile - 45%tile";
        } else if ($score >= 4) {
            $pp = "25%tile - 35%tile";
        } else if ($score >= 2) {
            $pp = "15%tile - 25%tile";
        } else if ($score >= -2) {
            $pp = "10%tile - 15%tile";
        } else {
            $pp = "0%tile - 10%tile";
        }
    } else if ($shift == 2) {
        if ($score >= 104) {
            $pp = "99.9%tile - 100%tile";
        } else if ($score >= 98) {
            $pp = "99.8%tile - 99.9%tile";
        } else if ($score >= 92) {
            $pp = "99.6%tile - 99.8%tile";
        } else if ($score >= 86) {
            $pp = "99.4%tile - 99.6%tile";
        } else if ($score >= 83) {
            $pp = "99.2%tile - 99.4%tile";
        } else if ($score >= 80) {
            $pp = "99%tile - 99.2%tile";
        } else if ($score >= 76) {
            $pp = "98.5%tile - 99%tile";
        } else if ($score >= 71) {
            $pp = "98%tile - 98.5%tile";
        } else if ($score >= 66) {
            $pp = "97%tile - 98%tile";
        } else if ($score >= 61) {
            $pp = "96%tile - 97%tile";
        } else if ($score >= 57) {
            $pp = "95%tile - 96%tile";
        } else if ($score >= 52) {
            $pp = "92%tile - 95%tile";
        } else if ($score >= 45) {
            $pp = "89%tile - 92%tile";
        } else if ($score >= 39) {
            $pp = "85%tile - 89%tile";
        } else if ($score >= 35) {
            $pp = "80%tile - 85%tile";
        } else if ($score >= 32) {
            $pp = "75%tile - 80%tile";
        } else if ($score >= 28) {
            $pp = "70%tile - 75%tile";
        } else if ($score >= 24) {
            $pp = "65%tile - 70%tile";
        } else if ($score >= 21) {
            $pp = "60%tile - 65%tile";
        } else if ($score >= 18) {
            $pp = "55%tile - 60%tile";
        } else if ($score >= 15) {
            $pp = "50%tile - 55%tile";
        } else if ($score >= 12) {
            $pp = "45%tile - 50%tile";
        } else if ($score >= 8) {
            $pp = "35%tile - 45%tile";
        } else if ($score >= 4) {
            $pp = "25%tile - 35%tile";
        } else if ($score >= 1) {
            $pp = "15%tile - 25%tile";
        } else if ($score >= -2) {
            $pp = "10%tile - 15%tile";
        } else {
            $pp = "0%tile - 10%tile";
        }
    } elseif ($shift == 3) {
        if ($score >= 114) {
            $pp = "99.9%tile - 100%tile";
        } else if ($score >= 106) {
            $pp = "99.8%tile - 99.9%tile";
        } else if ($score >= 98) {
            $pp = "99.6%tile - 99.8%tile";
        } else if ($score >= 92) {
            $pp = "99.4%tile - 99.6%tile";
        } else if ($score >= 86) {
            $pp = "99.2%tile - 99.4%tile";
        } else if ($score >= 83) {
            $pp = "99%tile - 99.2%tile";
        } else if ($score >= 78) {
            $pp = "98.5%tile - 99%tile";
        } else if ($score >= 74) {
            $pp = "98%tile - 98.5%tile";
        } else if ($score >= 68) {
            $pp = "97%tile - 98%tile";
        } else if ($score >= 64) {
            $pp = "96%tile - 97%tile";
        } else if ($score >= 59) {
            $pp = "95%tile - 96%tile";
        } else if ($score >= 55) {
            $pp = "92%tile - 95%tile";
        } else if ($score >= 51) {
            $pp = "89%tile - 92%tile";
        } else if ($score >= 46) {
            $pp = "85%tile - 89%tile";
        } else if ($score >= 41) {
            $pp = "80%tile - 85%tile";
        } else if ($score >= 35) {
            $pp = "75%tile - 80%tile";
        } else if ($score >= 30) {
            $pp = "70%tile - 75%tile";
        } else if ($score >= 27) {
            $pp = "65%tile - 70%tile";
        } else if ($score >= 24) {
            $pp = "60%tile - 65%tile";
        } else if ($score >= 20) {
            $pp = "55%tile - 60%tile";
        } else if ($score >= 17) {
            $pp = "50%tile - 55%tile";
        } else if ($score >= 15) {
            $pp = "45%tile - 50%tile";
        } else if ($score >= 10) {
            $pp = "35%tile - 45%tile";
        } else if ($score >= 6) {
            $pp = "25%tile - 35%tile";
        } else if ($score >= 3) {
            $pp = "15%tile - 25%tile";
        } else if ($score >= -2) {
            $pp = "10%tile - 15%tile";
        } else {
            $pp = "0%tile - 10%tile";
        }
    }
    return $pp;
}

function sendJson($data, $http_code = 200)
{
    header('Content-type: application/json');
    http_response_code($http_code);
    echo json_encode($data);
    die;
}

function _t($str, $remove_extra = '', $remove_extra_by = '')
{
    $str = str_replace('&nbsp;', ' ', $str);
    $str = str_replace($remove_extra, $remove_extra_by, $str);
    $str = html_entity_decode($str, ENT_QUOTES | ENT_COMPAT, 'UTF-8');
    $str = html_entity_decode($str, ENT_HTML5, 'UTF-8');
    $str = html_entity_decode($str);
    $str = htmlspecialchars_decode($str);
    $str = strip_tags($str);
    return trim($str);
}

function xlirfetchMarks($url)
{
    $html = file_get_html($url);

    $student_info = [];
    foreach ($html->find('div.main-info-pnl table tr') as $tr) {
        $tds                                       = $tr->find('td');
        $student_info[_t($tds[0]->plaintext, ':')] = _t($tds[1]->plaintext);
    }

    $sections_result = [];
    $sections        = $html->find('div.grp-cntnr div.section-cntnr');

    foreach ($sections as $section) {
        $name = _t(str_replace('Section : ', '', _t($section->find('div.section-lbl', 0)->plaintext)));
        if (strpos(strtolower($name), 'essay') === false) {
            $questions_result = [];
            foreach ($section->find('div.question-pnl') as $question) {
                $questions_result[] = parseQuestion($question);
            }
            $section_result = [
                'name'      => $name,
                'questions' => $questions_result,
            ];
            $sections_result[] = $section_result;
        }
    }

    return ['details' => $student_info, 'sections' => $sections_result];
}

function getDomainFromUrl($url)
{
    $parsed = @parse_url($url);

    if (! is_array($parsed) || empty($parsed['host'])) {
        return $url;
    }

    $parts = explode('.', $parsed['host']);
    $tld = array_pop($parts);
    $host = array_pop($parts);

    if ($tld !== null && $host !== null && strlen($tld) === 2 && strlen($host) <= 3) {
        $tld = "{$host}.{$tld}";
        $host = array_pop($parts);
    }

    if ($host === null) {
        return $parsed['host'];
    }

    return "{$host}.{$tld}";
}
function xatgetStudentResult($url)
{
    $data = xatfetchMarks($url);
    if (! $data) {
        return false;
    }
    $sections_marks                = [];
    $obtain_marks                  = 0;
    $total_marks                   = 0;
    $unattempted_questions         = 0;
    $unattempted_negative_marks    = 0;
    $excluded_section_obtain_marks = 0;
    $excluded_section_total_marks  = 0;
    $special_ids                   = ['41569977', '41569989', '41569991'];

    foreach (@$data['sections'] as $section) {
        $is_excluded_section = in_array(strtoupper($section['name']), ['MOCK KEYBOARD TESTING', 'GENERAL KNOWLEDGE']);
        $attempt_questions   = 0;
        $unattempt_questions = 0;
        $correct_answers     = 0;
        $wrong_answers       = 0;
        $_total_marks        = 0;
        $_obtain_marks       = 0;
        foreach ($section['questions'] as $question) {
            $_total_marks += 1;
            if (@$question['attempted']) {
                $attempt_questions++;
                if (@$question['answered_correctly']) {
                    $correct_answers++;
                    $_obtain_marks += 1;
                } else {
                    $wrong_answers++;
                    if (! $is_excluded_section) {
                        $_obtain_marks -= 0.25;
                    }
                }
            } else {
                if (! $is_excluded_section) {
                    if (in_array(@$question['id'], $special_ids)) {
                        $attempt_questions++;
                        $correct_answers++;
                        $_obtain_marks += 1;
                    } else {
                        $unattempted_questions++;
                        if ($unattempted_questions > 8) {
                            $unattempted_negative_marks += 0.1;
                        }

                        $unattempt_questions++;
                    }
                }
            }

        }

        $sections_marks[] = [
            'name'                => @$section['name'],
            'total_questions'     => count(@$section['questions']),
            'attempt_questions'   => $attempt_questions,
            'unattempt_questions' => $unattempt_questions,
            'correct_answers'     => $correct_answers,
            'wrong_answers'       => $wrong_answers,
            'obtain_marks_org'    => $_obtain_marks,
            'obtain_marks'        => $_obtain_marks,
            'total_marks'         => $_total_marks,
        ];

        if ($is_excluded_section) {
            $excluded_section_obtain_marks += $_obtain_marks;
            $excluded_section_total_marks += $_total_marks;
        } else {
            $obtain_marks += $_obtain_marks;
            $total_marks += $_total_marks;
        }
    }
    $de          = 0;
    $total_score = 0;
    foreach ($sections_marks as $k => $section) {
        if (in_array(strtoupper($section['name']), ['MOCK KEYBOARD TESTING', 'GENERAL KNOWLEDGE'])) {
            continue;
        }
        if ($obtain_marks > 0) {
            $de += ($sections_marks[$k]['obtain_marks_org'] / $obtain_marks) * $unattempted_negative_marks;
        } else {
            $de += $sections_marks[$k]['obtain_marks_org'] * $unattempted_negative_marks;
        }
        $total_score += $section['total_marks'];
    }

    foreach ($sections_marks as $k => $section) {
        if (in_array(strtoupper($section['name']), ['MOCK KEYBOARD TESTING', 'GENERAL KNOWLEDGE'])) {
            continue;
        }

        $sections_marks[$k]['obtain_marks'] = number_format($sections_marks[$k]['obtain_marks_org'] - $de * ($section['total_marks'] / $total_score), 2);
    }

    $score = $obtain_marks - $unattempted_negative_marks;

    $percentile = xatgetScorePercentile($score);

    return [
        'percentile'                 => $percentile,
        'details'                    => @$data['details'],
        'sections_marks'             => $sections_marks,
        'obtain_marks'               => round($obtain_marks - $unattempted_negative_marks, 2),
        'total_marks'                => $total_marks,
        'unattempted_questions'      => $unattempted_questions,
        'unattempted_negative_marks' => $unattempted_negative_marks,
    ];
}

function xatfetchMarks($url)
{
    $html = file_get_html($url);

    $student_info = [];
    foreach ($html->find('div.main-info-pnl table tr') as $tr) {
        $tds                                       = $tr->find('td');
        $student_info[_t($tds[0]->plaintext, ':')] = _t($tds[1]->plaintext);
    }

    $sections_result = [];
    $sections        = $html->find('div.grp-cntnr div.section-cntnr');

    foreach ($sections as $section) {
        $name = _t(str_replace('Section : ', '', _t($section->find('div.section-lbl', 0)->plaintext)));
        if (strpos(strtolower($name), 'essay') === false) {
            $questions_result = [];
            foreach ($section->find('div.question-pnl') as $question) {
                $questions_result[] = xatparseQuestion($question);
            }
            $section_result = [
                'name'      => $name,
                'questions' => $questions_result,
            ];
            $sections_result[] = $section_result;
        }
    }

    if (strpos($student_info['XAT ID'], 'XAT25') !== false) {
        return ['details' => $student_info, 'sections' => $sections_result];
    }
    return false;
}

function xatparseQuestion($question)
{
    $texts                = [];
    $options_as_images    = false;
    $correct_option       = "";
    $correct_option_index = 0;
    foreach ($question->find('td') as $tk => $td) {
        $texts[$tk] = _t($td->plaintext);
        if (dom_node_has_class($td, 'rightAns')) {
            $correct_option_index = $tk;
        }
        if ($td->has_child()) {
            if (in_array(strtoupper($texts[$tk]), ["A.", "B.", "C.", "D.", "E.", "1.", "2.", "3.", "4.", "5."])) {
                $images = $td->find('img');
                if (! empty($images)) {
                    $lastChild         = end($images);
                    $texts[$tk]        = $lastChild->getAttribute('name');
                    $options_as_images = true;
                }
            }
        }
    }
    for ($i = 16; $i <= 25; $i++) {
        if (isset($texts[$i])) {
            unset($texts[$i]);
        }
    }

    $texts = array_values($texts);
    $rev_correct_option_index = (count($texts) - $correct_option_index) - 1;

    if (strpos(strtolower(@$texts[2]), 'comprehension') !== false) {
        $rtexts = array_reverse($texts);
        switch ($rev_correct_option_index) {
            case 14:
                $correct_option = "A";
                break;
            case 12:
                $correct_option = "B";
                break;
            case 10:
                $correct_option = "C";
                break;
            case 8:
                $correct_option = "D";
                break;
            case 6:
                $correct_option = "E";
                break;
        }

        switch (@$rtexts[0]) {
            case "1":
                $selected_option = "A";
                break;
            case "2":
                $selected_option = "B";
                break;
            case "3":
                $selected_option = "C";
                break;
            case "4":
                $selected_option = "D";
                break;
            case "5":
                $selected_option = "E";
                break;
            default:
                $selected_option = @$rtexts[0];
                break;
        }

        $options = [
            "A" => xat_ta("A.", xat_ta("1.", @$rtexts[14])),
            "B" => xat_ta("B.", xat_ta("2.", @$rtexts[12])),
            "C" => xat_ta("C.", xat_ta("3.", @$rtexts[10])),
            "D" => xat_ta("D.", xat_ta("4.", @$rtexts[8])),
            "E" => xat_ta("E.", xat_ta("5.", @$rtexts[6])),
        ];

        if (strstr(strtolower(@$rtexts[4]), "discrepancy")) {
            @$rtexts[4] = "41569977";
        }

        return [
            'passage_title'         => @$texts[2],
            'passage'               => @$texts[4],
            'sub_type'              => 'comprehension',
            'type'                  => 'mcq',
            'id'                    => @$rtexts[4],
            'number'                => @$rtexts[18],
            'name'                  => @$rtexts[17],
            'options'               => $options,
            'attempted'             => isQuestionAttempted(@$rtexts[2]),
            'selected_option'       => $selected_option,
            'selected_option_value' => @$options[@$rtexts[0]],
            'correct_option'        => $correct_option,
            'correct_option_value'  => @$options[$correct_option],
            'options_as_images'     => $options_as_images,
            'answered_correctly'    => $selected_option == $correct_option,
        ];
    } else {
        switch ($correct_option_index) {
            case 5:
                $correct_option = "A";
                break;
            case 7:
                $correct_option = "B";
                break;
            case 9:
                $correct_option = "C";
                break;
            case 11:
                $correct_option = "D";
                break;
            case 13:
                $correct_option = "E";
                break;
        }
        switch (@$texts[19]) {
            case "1":
                $selected_option = "A";
                break;
            case "2":
                $selected_option = "B";
                break;
            case "3":
                $selected_option = "C";
                break;
            case "4":
                $selected_option = "D";
                break;
            case "5":
                $selected_option = "E";
                break;
            default:
                $selected_option = @$texts[19];
                break;
        }

        $options = [
            "A" => xat_ta("A.", xat_ta("1.", @$texts[5])),
            "B" => xat_ta("B.", xat_ta("2.", @$texts[7])),
            "C" => xat_ta("C.", xat_ta("3.", @$texts[9])),
            "D" => xat_ta("D.", xat_ta("4.", @$texts[11])),
            "E" => xat_ta("E.", xat_ta("5.", @$texts[13])),
        ];

        if (strstr(strtolower(@$texts[15]), "discrepancy")) {
            @$texts[15] = "41569977";
        }

        return [
            'sub_type'              => 'alternate',
            'type'                  => 'mcq',
            'id'                    => @$texts[15],
            'number'                => @$texts[1],
            'name'                  => @$texts[2],
            'options'               => $options,
            'attempted'             => isQuestionAttempted(@$texts[17]),
            'selected_option'       => $selected_option,
            'selected_option_value' => @$options[@$texts[19]],
            'correct_option'        => $correct_option,
            'correct_option_value'  => @$options[$correct_option],
            'options_as_images'     => $options_as_images,
            'answered_correctly'    => $selected_option == $correct_option,
        ];
    }
}

function xat_ta($option, $answer)
{
    if (substr($answer, 0, strlen($option)) == $option) {
        $answer = substr($answer, strlen($option));
    }
    return xat_t($answer);
}

function xatisQuestionAttempted($status)
{
    $status = _t(strtolower($status));
    return in_array($status, ["answered", "marked for review"]);
}

function xatgetScorePercentile($score)
{
    if ($score >= 45 && $score <= 75) {
        return "99%tile - 100%tile";
    } elseif ($score >= 36 && $score <= 44) {
        return "99.5%tile - 99.9%tile";
    } elseif ($score > 32 && $score <= 36) {
        return "98.5%tile - 99.4%tile";
    } elseif ($score > 31 && $score <= 31.9) {
        return "98%tile - 98.5%tile";
    } elseif ($score >= 30.6 && $score <= 31) {
        return "97.5%tile - 98%tile";
    } elseif ($score >= 29.25 && $score <= 30.05) {
        return "97%tile - 97.5%tile";
    } elseif ($score >= 27 && $score <= 29.24) {
        return "96.5%tile - 97%tile";
    } elseif ($score >= 25.25) {
        return "90%tile - 93%tile";
    } elseif ($score >= 24) {
        return "88%tile - 90%tile";
    } elseif ($score >= 23) {
        return "85%tile - 88%tile";
    } elseif ($score >= 22) {
        return "83%tile - 85%tile";
    } elseif ($score >= 21.25) {
        return "80%tile - 83%tile";
    } elseif ($score >= 20.75) {
        return "77%tile - 80%tile";
    } elseif ($score >= 20.25) {
        return "75%tile - 77%tile";
    } elseif ($score >= 20) {
        return "73%tile - 75%tile";
    } elseif ($score >= 19.75) {
        return "70%tile - 73%tile";
    } elseif ($score >= 19.25) {
        return "68%tile - 70%tile";
    } elseif ($score >= 18.5) {
        return "65%tile - 68%tile";
    } elseif ($score >= 17) {
        return "60%tile - 65%tile";
    } elseif ($score >= 15.5) {
        return "55%tile - 60%tile";
    } elseif ($score >= 13.75) {
        return "50%tile - 55%tile";
    } elseif ($score >= 12.25) {
        return "45%tile - 50%tile";
    } elseif ($score >= 10.75) {
        return "40%tile - 45%tile";
    } elseif ($score >= 9.25) {
        return "35%tile - 40%tile";
    } elseif ($score >= 7.75) {
        return "30%tile - 35%tile";
    } elseif ($score >= 6.25) {
        return "25%tile - 30%tile";
    } elseif ($score >= 4.75) {
        return "20%tile - 25%tile";
    } elseif ($score >= 3.25) {
        return "15%tile - 20%tile";
    } elseif ($score >= 1.75) {
        return "10%tile - 15%tile";
    } elseif ($score >= 0.25) {
        return "5%tile - 10%tile";
    } else {
        return "0%tile - 5%tile";
    }
}

function xat_t($str, $remove_extra = '', $remove_extra_by = '')
{
    $str = str_replace('&nbsp;', ' ', $str);
    $str = str_replace($remove_extra, $remove_extra_by, $str);
    $str = html_entity_decode($str, ENT_QUOTES | ENT_COMPAT, 'UTF-8');
    $str = html_entity_decode($str, ENT_HTML5, 'UTF-8');
    $str = html_entity_decode($str);
    $str = htmlspecialchars_decode($str);
    $str = strip_tags($str);
    return trim($str);
}

function iiftgetDomainFromUrl($url)
{
    $parsed = @parse_url($url);

    if (! is_array($parsed) || empty($parsed['host'])) {
        return $url;
    }

    $parts = explode('.', $parsed['host']);
    $tld = array_pop($parts);
    $host = array_pop($parts);

    if ($tld !== null && $host !== null && strlen($tld) === 2 && strlen($host) <= 3) {
        $tld = "{$host}.{$tld}";
        $host = array_pop($parts);
    }

    if ($host === null) {
        return $parsed['host'];
    }

    return "{$host}.{$tld}";
}

function iiftgetStudentResult($url)
{
    $data           = iiftfetchMarks($url);
    $sections_marks = [];
    $obtain_marks   = 0;
    $total_marks    = 0;
    foreach (@$data['sections'] as $section) {
        $is_ga_section     = strtoupper($section['name']) == 'GA';
        $attempt_questions = 0;
        $correct_answers   = 0;
        $wrong_answers     = 0;
        $_total_marks      = 0;
        $_obtain_marks     = 0;
        foreach ($section['questions'] as $question) {
            if ($is_ga_section) {
                $_total_marks += 1.5;
            } else {
                $_total_marks += 3;
            }
            if (@$question['attempted']) {
                $attempt_questions++;
                if (@$question['answered_correctly']) {
                    $correct_answers++;
                    if ($is_ga_section) {
                        $_obtain_marks += 1.5;
                    } else {
                        $_obtain_marks += 3;
                    }
                } else {
                    $wrong_answers++;
                    if ($is_ga_section) {
                        $_obtain_marks -= 0.5;
                    } else {
                        $_obtain_marks -= 1;
                    }
                }
            }
        }
        $sections_marks[] = [
            'name'              => @$section['name'],
            'total_questions'   => count(@$section['questions']),
            'attempt_questions' => $attempt_questions,
            'correct_answers'   => $correct_answers,
            'wrong_answers'     => $wrong_answers,
            'obtain_marks'      => $_obtain_marks,
            'total_marks'       => $_total_marks,
        ];
        $obtain_marks += $_obtain_marks;
        $total_marks += $_total_marks;
    }

    return [
        'details'        => @$data['details'],
        'sections_marks' => $sections_marks,
        'obtain_marks'   => round($obtain_marks, 2),
        'total_marks'    => $total_marks,
    ];
}

function iiftfetchMarks($url)
{
    $html = file_get_html($url);

    $student_info = [];
    foreach ($html->find('table tr') as $tr) {
        $tds = $tr->find('td');
        if (
            count($tds) == 2 && in_array(_t($tds[0]->plaintext), [
                'Roll No',
                'Application No',
                'Name',
                'Paper/Subject',
                'Exam Date',
                'Exam Slot',
            ])
        ) {
            $student_info[_t($tds[0]->plaintext)] = _t($tds[1]->plaintext);
        }
    }
    $answer_sheet_name = @$student_info['Exam Date'];
    $questions         = [];
    foreach ($html->find('table tr td table') as $question) {
        $q = iiftparseQuestion($question, $answer_sheet_name);
        if (@$q['selected_option']) {
            $questions[] = $q;
        }
    }

    $sections = [];
    foreach ($questions as $question) {
        $sections[$question['section']]['name']        = $question['section'];
        $sections[$question['section']]['questions'][] = $question;
    }

    return [
        'details'  => $student_info,
        'sections' => $sections,
    ];
}

function iiftparseQuestion($question, $answer_sheet_name)
{
    $data      = [];
    $tmp_texts = [];
    foreach ($question->find('td') as $tk => $td) {
        $txt = _t($td->plaintext);
        if (! in_array(strtoupper($txt), ["A", "B", "C", "D", ""]) && ! in_array($txt, $tmp_texts)) {
            $data[]      = $txt;
            $tmp_texts[] = $txt;
        }

        foreach ($td->find('img') as $img) {
            if (
                $td->previousSibling() &&
                $td->previousSibling()->nodeName() == 'td' &&
                $td->previousSibling()->hasAttribute('width')
            ) {
                $img_path = explode('/', $img->getAttribute('src'));
                $data[]   = end($img_path);
            }
        }

        foreach ($td->find('b') as $b) {
            if (! $b->has_child()) {
                $data[] = _t($b->plaintext);
            } else {
                foreach ($b->find('font') as $font) {
                    $data[] = iift_t($font->plaintext);
                }
            }
        }
    }

    $rdata   = array_reverse($data);
    $qid     = @$data[1];
    $options = [
        "A" => @$rdata[8],
        "B" => @$rdata[6],
        "C" => @$rdata[4],
        "D" => @$rdata[2],
    ];
    $section       = "";
    $answer        = "";
    $given_option  = @$rdata[0];
    $given_answer  = @$options[@$rdata[0]];
    $question_name = _t(@$data[0], 'Question ID:' . $qid);

    global $XLSX;

    $sheet_index = 0;
    foreach ($XLSX->sheetNames() as $index => $name) {
        if ($name == $answer_sheet_name) {
            $sheet_index = $index;
        }
    }
    foreach ($XLSX->rows($sheet_index) as $rk => $row) {
        if ($rk === 0) {
            continue;
        }
        if (@$row[1] == $qid) {
            $section = @$row[0];
            $answer  = _t(@$row[2], '`');
        }
    }

    return [
        'sub_type'              => strtolower(_t(@$data[2], ':')) == 'passage' ? 'passage' : 'alternate',
        'type'                  => 'mcq',
        'id'                    => $qid,
        'name'                  => $question_name,
        'options'               => $options,
        'attempted'             => iiftisQuestionAttempted($given_option),
        'selected_option'       => $given_option,
        'selected_option_value' => $given_answer,
        'correct_option'        => iiftgetAnswerOption($options, $answer),
        'correct_option_value'  => $answer,
        'answered_correctly'    => $answer == $given_answer,
        'section'               => $section ?: '-',
    ];
}

function iift_ta($option, $answer)
{
    if (substr($answer, 0, strlen($option)) == $option) {
        $answer = substr($answer, strlen($option));
    }
    return _t($answer);
}

function iiftisQuestionAttempted($status)
{
    $status = _t(strtolower($status));
    return in_array($status, ["a", "b", "c", "d"]);
}

function iiftgetAnswerOption($options, $answer)
{
    switch ($answer) {
        case $options["A"]:
            return "A";
        case $options["B"]:
            return "B";
        case $options["C"]:
            return "C";
        case $options["D"]:
            return "D";
    }
    return null;
}

function iift_t($str, $remove_extra = '', $remove_extra_by = '')
{
    $str = str_replace('&nbsp;', ' ', $str);
    $str = str_replace($remove_extra, $remove_extra_by, $str);
    $str = html_entity_decode($str, ENT_QUOTES | ENT_COMPAT, 'UTF-8');
    $str = html_entity_decode($str, ENT_HTML5, 'UTF-8');
    $str = html_entity_decode($str);
    $str = htmlspecialchars_decode($str);
    $str = strip_tags($str);
    return trim($str);
}

function get_cities()
{
    return cache()->remember('cities-list', (24 * 60 * 60), function () {
        return collect(City::all());
    });
}

function get_states()
{
    return cache()->remember('states-list', (24 * 60 * 60), function () {
        return collect(State::all());
    });
}

function get_object_id_name($cities, $city)
{
    return @$cities->where('id', $city)->first()->name ?: $city;
}

function js_update_user_updated_date($user)
{
    try {
        $user->updated_at = now();
        $user->save();
    } catch (\Exception $e) {
    }
}

function abbreviate($string)
{
    $ignore_words = ['and', 'or', 'the', 'in', 'to', 'for', 'with', '&'];
    $words        = explode(' ', $string);
    $abbreviation = '';

    foreach ($words as $word) {
        if (! in_array(strtolower($word), $ignore_words)) {
            $abbreviation .= strtoupper($word[0]);
        }
    }

    return $abbreviation;
}

if (! function_exists('file_get_html')) {
    /**
     * Lightweight shim that mirrors the helper signature expected by the legacy scraper.
     */
    function file_get_html(
        string $url,
        bool $use_include_path = false,
        $context = null,
        int $offset = 0,
        int $maxLen = -1,
        bool $lowercase = true,
        bool $forceTagsClosed = true,
        string $target_charset = 'UTF-8',
        bool $stripRN = true,
        string $defaultBRText = "\r\n",
        string $defaultSpanText = ' '
    ) {
        $maxFileSize = defined('MAX_FILE_SIZE') ? MAX_FILE_SIZE : 600000;

        if ($maxLen <= 0) {
            $maxLen = $maxFileSize;
        }

        $contents = curl_get_contents($url, $maxLen);

        if ($contents === false && is_file($url)) {
            $contents = @file_get_contents($url, $use_include_path, $context, $offset);
        }

        if (! is_string($contents) || $contents === '' || strlen($contents) > $maxLen) {
            return false;
        }

        return HtmlDomParser::str_get_html(
            $contents,
            $lowercase,
            $forceTagsClosed,
            $target_charset,
            $stripRN,
            $defaultBRText,
            $defaultSpanText
        );
    }
}

if (! function_exists('str_get_html')) {
    function str_get_html(
        string $str,
        bool $lowercase = true,
        bool $forceTagsClosed = true,
        string $target_charset = 'UTF-8',
        bool $stripRN = true,
        string $defaultBRText = "\r\n",
        string $defaultSpanText = ' '
    ) {
        $maxFileSize = defined('MAX_FILE_SIZE') ? MAX_FILE_SIZE : 600000;

        if ($str === '' || strlen($str) > $maxFileSize) {
            return false;
        }

        return HtmlDomParser::str_get_html(
            $str,
            $lowercase,
            $forceTagsClosed,
            $target_charset,
            $stripRN,
            $defaultBRText,
            $defaultSpanText
        );
    }
}

if (! function_exists('curl_get_contents')) {
    function curl_get_contents(string $url, int $maxLen)
    {
        if (! function_exists('curl_init')) {
            return @file_get_contents($url);
        }

        $handle = curl_init();
        curl_setopt_array($handle, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; ScoreCalculatorBot/1.0)',
        ]);

        $contents = curl_exec($handle);
        curl_close($handle);

        if (! is_string($contents) || $contents === '' || strlen($contents) > $maxLen) {
            return false;
        }

    return $contents;
}

if (! function_exists('dom_node_has_class')) {
    function dom_node_has_class($node, string $class): bool
    {
        if (! is_object($node)) {
            return false;
        }

        $classAttr = $node->class ?? ($node->attr['class'] ?? null);

        if (! is_string($classAttr) || $classAttr === '') {
            return false;
        }

        $classes = preg_split('/\s+/', trim($classAttr)) ?: [];

        return in_array($class, $classes, true);
    }
}
}
