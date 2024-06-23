"use client";

import fetch from "cross-fetch";
import Groq, { toFile } from "groq-sdk";
import React, { useEffect, useRef, useState } from "react";

async function transcribe(blob: Blob, groq: Groq) {
  const startTime = performance.now();
  const response = await groq.audio.translations.create({
    file: await toFile(blob, "audio.webm"),
    model: "whisper-large-v3",
    prompt: "",
    response_format: "json",
    temperature: 0,
  });
  const endTime = performance.now();
  console.log(`[TRANSCRIPTION]: ${(endTime - startTime).toFixed(2)} ms`);
  return response;
}

interface UseAudioRecorderProps {
  onTranscribe: (transcription: string) => void;
  onRecordingStart: () => void;
  onRecordingEnd: () => void;
  groq: Groq;
}

const useAudioRecorder = ({
  onTranscribe,
  onRecordingStart,
  onRecordingEnd,
  groq,
}: UseAudioRecorderProps) => {
  const isRecording = useRef<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptionInterval = useRef<number | null>(null);
  const [mimeType, setMimeType] = useState<string>("audio/webm;codecs=opus");

  useEffect(() => {
    const typesToCheck = ["audio/webm", "audio/webm;codecs=opus", "audio/webm;codecs=vorbis", "audio/ogg", "audio/ogg;codecs=opus", "audio/ogg;codecs=vorbis", "audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/wav", "audio/mpeg"];
    const supportedTypes = typesToCheck.filter(type => MediaRecorder.isTypeSupported(type));
    setMimeType(supportedTypes[0]);
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Media Devices will not work on this browser.");
      return;
    }
    onRecordingStart();
    isRecording.current = true;
    const audioConstraints = { audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } };
    const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.error(`MIME type ${mimeType} is not supported on this browser.`);
      return;
    }
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = event => {
      audioChunksRef.current.push(event.data);
    };
    recorder.start(500); // Collect data into blobs every 500ms
    setMediaRecorder(recorder);
  };

  useEffect(() => {
    if (isRecording.current) {
      transcriptionInterval.current = window.setInterval(async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const transcription = await transcribe(blob, groq);
        onTranscribe(transcription.text);
      }, 500);
    }

    return () => {
      if (transcriptionInterval.current !== null) {
        clearInterval(transcriptionInterval.current);
      }
    };
  }, [isRecording.current]);

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      if (transcriptionInterval.current !== null) {
        clearInterval(transcriptionInterval.current);
        transcriptionInterval.current = null;
      }
      isRecording.current = false;
      onRecordingEnd();
    }
  };

  return {
    isRecording: isRecording.current,
    startRecording,
    stopRecording,
  };
};

function App({ groqApiKey } : { groqApiKey: string }) {
  const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onTranscribe: transcription => console.log(transcription),
    onRecordingStart: () => console.log("Recording started"),
    onRecordingEnd: () => console.log("Recording ended"),
    groq,
  });

  return (
    <div>
      <button disabled={isRecording} onClick={startRecording}>Start Recording</button>
      <button disabled={!isRecording} onClick={stopRecording}>Stop Recording</button>
      {isRecording ? <p>Recording...</p> : <p>Not recording</p>}
    </div>
  );
}

export default function Home() {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const keysEndpoint = "/api/keys";
        const response = await fetch(keysEndpoint);
        if (response.status === 200) {
          const key = await response.json();
          setKey(key);
        } else {
          throw new Error("Failed to fetch API keys: " + response.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
      }
    };

    fetchApiKeys();
  }, []);
  if (!key) return <div>Loading...</div>;
  return <App groqApiKey={key} />;
}