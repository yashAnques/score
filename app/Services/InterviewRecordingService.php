<?php

namespace App\Services;

use App\Models\InterviewRecording;
use App\Models\InterviewSession;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;

class InterviewRecordingService
{
    public function __construct(
        protected InterviewSettingService $settingService
    ) {
    }

    public function getDisk(): string
    {
        $preferred = $this->settingService->get('interview.storage.disk', config('filesystems.interview_disk', 'spaces')) ?: 'spaces';

        if (app()->environment('local')) {
            return 'local';
        }

        if ($preferred !== 'local' && !class_exists('League\\Flysystem\\AwsS3V3\\PortableVisibilityConverter')) {
            return 'local';
        }

        return $preferred;
    }

    public function storeChunk(
        InterviewSession $session,
        UploadedFile $file,
        int $chunkIndex,
        int $durationSeconds,
        bool $isLastChunk = false,
        ?int $totalChunks = null
    ): string {
        $disk = $this->getDisk();
        $extension = $file->getClientOriginalExtension() ?: 'webm';
        $path = $this->buildPath($session, $chunkIndex, $extension);

        $existing = InterviewRecording::query()
            ->where('interview_session_id', $session->id)
            ->where('chunk_index', $chunkIndex)
            ->first();

        if ($existing) {
            Storage::disk($existing->storage_disk)->delete($existing->storage_path);
            $existing->delete();
        }

        Storage::disk($disk)->putFileAs(Str::beforeLast($path, '/'), $file, basename($path), [
            'visibility' => 'private',
        ]);

        InterviewRecording::query()->create([
            'interview_session_id' => $session->id,
            'storage_disk' => $disk,
            'storage_path' => $path,
            'chunk_index' => $chunkIndex,
            'size_bytes' => $file->getSize(),
            'duration_seconds' => $durationSeconds,
            'stored_at' => now(),
            'meta' => [
                'is_last_chunk' => $isLastChunk,
                'total_chunks' => $totalChunks,
            ],
        ]);

        return $path;
    }

    protected function buildPath(InterviewSession $session, int $chunkIndex, ?string $extension = null): string
    {
        $ext = $extension ?: 'webm';

        return sprintf(
            'interviews/%s/%s/chunks/chunk-%05d.%s',
            $session->user_id,
            $session->uuid,
            $chunkIndex,
            $ext,
        );
    }

    public function finalizeRecording(InterviewSession $session): ?string
    {
        $chunks = InterviewRecording::query()
            ->where('interview_session_id', $session->id)
            ->orderBy('chunk_index')
            ->get();

        if ($chunks->isEmpty()) {
            return null;
        }

        $disk = $chunks->first()->storage_disk;
        $tempDir = storage_path('app/interview-recordings/'.$session->uuid.'/'.Str::uuid());
        File::makeDirectory($tempDir, 0755, true, true);

        $listFile = $tempDir.'/chunks.txt';
        $entries = [];

        foreach ($chunks as $chunk) {
            $localPath = $tempDir.'/chunk-'.str_pad((string) $chunk->chunk_index, 5, '0', STR_PAD_LEFT).'.webm';
            $stream = Storage::disk($chunk->storage_disk)->readStream($chunk->storage_path);
            if ($stream === false) {
                throw new RuntimeException('Unable to read recording chunk from storage.');
            }

            $localHandle = fopen($localPath, 'w+b');
            if ($localHandle === false) {
                throw new RuntimeException('Unable to create temporary recording chunk.');
            }

            stream_copy_to_stream($stream, $localHandle);
            fclose($stream);
            fclose($localHandle);

            $entries[] = 'file '.escapeshellarg($localPath);
        }

        File::put($listFile, implode(PHP_EOL, $entries));

        $outputPath = $tempDir.'/recording.mp4';
        $process = new Process([
            'ffmpeg',
            '-y',
            '-f',
            'concat',
            '-safe',
            '0',
            '-i',
            $listFile,
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-c:a',
            'aac',
            '-movflags',
            '+faststart',
            $outputPath,
        ]);
        $process->setTimeout(null);
        $process->run();

        if (!$process->isSuccessful()) {
            File::deleteDirectory($tempDir);
            throw new RuntimeException('Unable to finalize recording: '.$process->getErrorOutput());
        }

        $finalPath = sprintf(
            'interviews/%s/%s/full/recording-%s.mp4',
            $session->user_id,
            $session->uuid,
            now()->format('YmdHis'),
        );

        $outputStream = fopen($outputPath, 'rb');
        if ($outputStream === false) {
            File::deleteDirectory($tempDir);
            throw new RuntimeException('Unable to read merged recording.');
        }

        $written = Storage::disk($disk)->writeStream($finalPath, $outputStream, [
            'visibility' => 'private',
        ]);
        fclose($outputStream);

        if ($written === false) {
            File::deleteDirectory($tempDir);
            throw new RuntimeException('Unable to store merged recording.');
        }

        File::deleteDirectory($tempDir);

        foreach ($chunks as $chunk) {
            Storage::disk($chunk->storage_disk)->delete($chunk->storage_path);
            $chunk->delete();
        }

        $session->forceFill([
            'recording_manifest_path' => $finalPath,
        ])->save();

        return $finalPath;
    }
}
