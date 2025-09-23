import { useState, useCallback, useRef } from 'react';
import { pipeline } from '@huggingface/transformers';

interface UseSpeechToTextReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriberRef = useRef<any>(null);

  const initializeTranscriber = useCallback(async () => {
    if (!transcriberRef.current) {
      try {
        transcriberRef.current = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-base.en',
          { device: 'webgpu' },
        );
      } catch (err) {
        console.warn('WebGPU not available, falling back to CPU');
        transcriberRef.current = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-base.en',
        );
      }
    }
    return transcriberRef.current;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm;codecs=opus',
          });

          // Create a URL from the blob for the transcriber
          const audioUrl = URL.createObjectURL(audioBlob);

          // Initialize transcriber if not already done
          const transcriber = await initializeTranscriber();

          // Transcribe the audio using the URL
          const result = await transcriber(audioUrl);
          setTranscript(result.text.trim());

          // Clean up the URL
          URL.revokeObjectURL(audioUrl);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Transcription failed');
        } finally {
          setIsTranscribing(false);
        }

        // Clean up stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start recording',
      );
      setIsRecording(false);
    }
  }, [initializeTranscriber]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};
