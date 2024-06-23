"use client";

import { useEffect, useRef, useState } from "react";
import Groq, { toFile } from "groq-sdk";
import { triggerCompletionFlow } from "./utils/tools";
import { FactError } from "./components/factError";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");
  const [erroniousStatement, setErroniousStatement] = useState<string>("");
  const sock:WebSocket = connect_hume();
  let astream: MediaStream;
  let arecorder:MediaRecorder;
  let vstream:MediaStream;
  let vrecorder: MediaRecorder;
  let groq: Groq;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      astream = new MediaStream();
      for (const track of stream.getAudioTracks()) {
        astream.addTrack(track);
      }
      vstream = new MediaStream();
      for (const track of stream.getVideoTracks()) {
        vstream.addTrack(track);
      }

      arecorder = new MediaRecorder(astream);
      vrecorder = new MediaRecorder(vstream);

      arecorder.ondataavailable = (e) => {
        transcribe(e.data, groq);
        hume_query(sock, e.data, {prosody: {}});
      };
      vrecorder.ondataavailable = (e) => {
        hume_query(sock, e.data, {face: {}});
      }

      setInterval(() => {
        if (arecorder.state == "recording") {
          arecorder.stop();
          arecorder.start();
        };
        if (vrecorder.state == "recording") {
          vrecorder.stop();
          vrecorder.start();
        };
      }, 3000);
    };
    
    groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY, dangerouslyAllowBrowser: true });
  }, [stream]);

  const handleShareButton = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((cs) => setStream(cs))
      .catch((err: any) => console.error(err));
  };

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
    console.log(response);
     await triggerCompletionFlow(groq, response.text);

    setTranscript(prevText => prevText + response.text)
    return response;
  };

  function connect_hume(): WebSocket {
    const socket = new WebSocket(`wss://api.hume.ai/v0/stream/models?apikey=${process.env.NEXT_PUBLIC_HUME_API_KEY}`);
  
    socket.addEventListener('open', () => {
      console.log("connection to hume established");
    });
  
    socket.addEventListener('message', (e) => {
      const data: any = JSON.parse(e.data);
      const frame = Number(data.payload_id);
      console.log(data);
    });
  
    socket.addEventListener('close', () => {
      console.log("connection to hume closed");
    });
  
    return socket;
  }
  
  async function hume_query(socket: WebSocket, blob: Blob, models: Object) {
    const data = await blobToBase64(blob);
  
    const message = JSON.stringify({data, models, raw_text: false});
    socket.send(message);
  }
  
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve: (value: string) => void, _) => {
      const reader = new FileReader();
  
      reader.onloadend = () => {
        if (!reader.result) return;
  
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  }

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  return (
    <div className="flex h-screen w-full">
      <div style={{alignItems: "center"}} className="flex-1 content-center bg-background p-4"> {/* Decreased padding */}
        <div className="mt-4 mx-auto max-w-sm"> {/* Decreased margin */}
          <div style={{justifyContent: "center"}} className="flex flex-col content-center gap-2 lg:flex-row">
            <button
              onClick={handleShareButton}
              className="flex h-10 shrink-0 items-center m-5
                        justify-center gap-1 rounded-lg bg-black-600 px-4 py-2 text-sm font-semibold text-white transition-all"
              type="submit"
            >
              <span>{stream ? "Change" : "Share"} Tab</span>
            </button>
          </div>
        </div>
        <div className="relative h-min w-full rounded-xl overflow-hidden border border-gray-300 shadow"> 
          <video
            ref={videoRef}
            autoPlay
            className="w-full h-full rounded-xl"
            onPlay={() => {
              if (arecorder.state === "paused") {
                arecorder.resume();
              } else {
                arecorder.start();
              }
              if (vrecorder.state === "paused") {
                vrecorder.resume();
              } else {
                vrecorder.start();
              }
            }}
            onPause={() => { arecorder.pause(); vrecorder.pause(); }}
            onEnded={() => { arecorder.stop(); vrecorder.stop(); }}
          />
        </div>
      </div>
      <div className="w-[40%] bg-background p-4">
        <div className="flex flex-col h-full rounded-xl border border-input shadow-sm overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3 border-b border-input">
            <div className="text-lg font-medium">Transcript</div>
          </div>
          <div className="flex-grow overflow-auto p-4">
            <div className="flex flex-col">
              <p>{transcript}</p>
              <div ref={endOfMessagesRef} /> {/* Invisible element to mark the end of messages */}
            </div>
          </div>
        </div>
        <FactError statement=""></FactError>
      </div>
    </div>
  );  
}