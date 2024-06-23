"use client";
import { Button } from "../../components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { Textarea } from "../../components/ui/textarea";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import fetch from "cross-fetch";
import Groq, { toFile } from "groq-sdk";

interface UseAudioTranscriberProps {
  onTranscribe: (transcription: string) => void;
  groq: Groq;
}

// transcribe function
async function transcribe(blob: Blob, groq: Groq) {
  const startTime = performance.now();
  // get stt from groq & openai whisper
  const response = await groq.audio.translations.create({
    file: await toFile(blob, "audio.webm"),
    model: "whisper-large-v3",
    prompt: "",
    response_format: "json",
    temperature: 0,
  });
  const endTime = performance.now();
  // get how long the transcription took
  console.log(`[TRANSCRIPTION]: ${(endTime - startTime).toFixed(2)} ms`);
  return response;
}

//
const useAudioTranscriber = ({
  onTranscribe,
  groq,
}: UseAudioTranscriberProps) => {
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptionInterval = useRef<number | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const isCapturing = useRef<boolean>(false);

  const startCapture = async () => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamSource.current =
        audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      mediaStreamSource.current.connect(analyser.current);

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.start(500); // Collect data into blobs every 500ms

      isCapturing.current = true;

      transcriptionInterval.current = window.setInterval(async () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const transcription = await transcribe(blob, groq);
          onTranscribe(transcription.text);
          audioChunksRef.current = []; // Clear the chunks after transcription
        }
      }, 500);
    } catch (error) {
      console.error("Error capturing audio:", error);
    }
  };

  const stopCapture = () => {
    if (transcriptionInterval.current) {
      clearInterval(transcriptionInterval.current);
    }
    if (mediaStreamSource.current) {
      mediaStreamSource.current.disconnect();
    }
    if (audioContext.current) {
      audioContext.current.close();
    }
    isCapturing.current = false;
  };

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  return { startCapture, stopCapture, isCapturing: isCapturing.current };
};

export function App({ groqApiKey }: { groqApiKey: string }) {
  const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
  const [videoId, setVideoId] = useState("");
  const [transcription, setTranscription] = useState("");
  const { startCapture, stopCapture, isCapturing } = useAudioTranscriber({
    onTranscribe: (text) => setTranscription((prev) => prev + " " + text),
    groq,
  });

  // all related to getting the video
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      const url = new URL(urlParam);
      const id = url.searchParams.get("v");
      setVideoId(id || "");
    }
  }, [searchParams]);

  if (!videoId) {
    return <div>Loading...</div>;
  }
  // end of getting the video

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 bg-background p-8">
        <div className="relative h-full w-full rounded-xl overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full"
            allowFullScreen
          ></iframe>
          {/* <div className="absolute top-4 left-4 bg-background/50 rounded-md px-3 py-1 text-sm text-foreground">
            Big Buck Bunny
          </div> */}
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={isCapturing ? stopCapture : startCapture}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isCapturing ? "Stop Transcription" : "Start Transcription"}
        </button>
      </div>
      {/* <div>
        <button disabled={isRecording} onClick={startRecording}>
          Start Recording
        </button>
        <button disabled={!isRecording} onClick={stopRecording}>
          Stop Recording
        </button>
        {isRecording ? <p>Recording...</p> : <p>Not recording</p>}
      </div> */}
      <div className="w-[40%] bg-background p-8">
        <div className="flex flex-col h-full rounded-xl border border-input shadow-sm">
          <div className="sticky top-0 flex items-center justify-between bg-background px-4 py-3 border-b border-input">
            <div className="text-lg font-medium">Transparify</div>
            <Button variant="ghost" size="icon">
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-start gap-4 mt-6">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-bold">Video Transcription</div>
                <div className="prose text-muted-foreground">
                  <p>{transcription}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 bg-background px-4 py-3 border-t border-input">
            <div className="relative">
              <Textarea
                placeholder="Type your message..."
                name="message"
                id="message"
                rows={1}
                className="min-h-[48px] rounded-2xl resize-none p-4 border border-neutral-400 shadow-sm pr-16"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute w-8 h-8 top-3 right-3"
                disabled
              >
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const keysEndpoint = "/api/key";
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
