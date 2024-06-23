"use client";

import { useEffect, useRef, useState } from "react";
import Groq, { toFile } from "groq-sdk";
import { triggerCompletionFlow } from "../utils/tools";
import React from "react";
import ReactMarkdown from "react-markdown";

interface Foo {
  txt: string;
  txt2: string;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [incorrectTexts, setIncorrectTexts] = useState<Array<Foo>>([]);
  const [hAudioStats, setHAudioStats] = useState<any>({});
  const [hVideoStats, setHVideoStats] = useState<any>({});
  const [stringBuffer, setBuffer] = useState<string>("");
  let astream: MediaStream;
  let arecorder: MediaRecorder;
  let vstream: MediaStream;
  let vrecorder: MediaRecorder;
  let groq: Groq;
  let sock: WebSocket;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      sock = connect_hume();

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
        hume_query(sock, e.data, { prosody: {} });
        transcribe(e.data, groq)
      };
      vrecorder.ondataavailable = (e) => {
        hume_query(sock, e.data, { face: {} });
      };

      setInterval(() => {
        if (!stream || stream.active === false) {
          stopCapture();
          return;
        }
        if (arecorder.state == "recording") {
          arecorder.stop();
          arecorder.start();
        }
        if (vrecorder.state == "recording") {
          vrecorder.stop();
          vrecorder.start();
        }
      }, 3000);
    }

    groq = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }, [stream]);

  function stopCapture() {
    if (videoRef?.current?.srcObject) {
      let tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track: any) => track.stop());
      videoRef.current.srcObject = null;
    }
  }

  const handleShareButton = () => {
    stopCapture();
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
    setTranscript((prevText) => prevText + response.text);

    const sentences = transcript.match(/[^.!?]+[.!?]/g);
    if (!sentences) {
      return "No sentences found.";
    }
    const lastThree = sentences.slice(-3).join(' ').trim();
    console.log(lastThree)

    await triggerCompletionFlow(groq, lastThree).then((out) => {
      if (!out) return;
      if (out.functionCall === "correct") return
      setIncorrectTexts((prevTexts) => [
        ...prevTexts,
        { txt: lastThree, txt2: out?.functionCall },
      ]);
    })

    return response;
  }

  function connect_hume(): WebSocket {
    const socket = new WebSocket(
      `wss://api.hume.ai/v0/stream/models?apikey=${process.env.NEXT_PUBLIC_HUME_API_KEY}`
    );

    socket.addEventListener("open", () => {
      console.log("connection to hume established");
    });

    socket.addEventListener("message", (e) => {
      const data: any = JSON.parse(e.data);
      if ("face" in data) {
        setHVideoStats(data.face);
      } else if ("prosody" in data) {
        setHAudioStats(data.prosody);
      }

      const frame = Number(data.payload_id);
    });

    socket.addEventListener("close", () => {
      sock = connect_hume();
      console.log("connection to hume closed");
    });

    return socket;
  }

  function getHumeDisplayEmotions() {
    let faceEmotions = {};
    if (!hVideoStats || !hVideoStats.predictions) return [];
    for (const frame of hVideoStats.predictions) {
      for (const e of frame.emotions) {
        if (!(e.name in faceEmotions)) {
          faceEmotions[e.name] = e.score;
        } else {
          faceEmotions[e.name] += e.score;
        }
      }
    }

    for (const emotion in faceEmotions) {
      faceEmotions[emotion] /= hVideoStats.predictions.length;
    }

    const voiceEmotions = {};
    if (!hAudioStats || !hAudioStats.predictions) return [];
    for (const e of hAudioStats.predictions[0].emotions) {
      voiceEmotions[e.name] = e.score;
    }

    const combinedEmotions = {};
    for (const emotion in faceEmotions) {
      combinedEmotions[emotion] =
        (faceEmotions[emotion] + voiceEmotions[emotion]) / 2;
    }
    const sortedEmotions = [];
    for (const emotion in combinedEmotions) {
      sortedEmotions.push([combinedEmotions[emotion], emotion]);
    }
    sortedEmotions.sort((a, b) => b[0] - a[0]);
    return sortedEmotions.slice(0, 5);
  }

  async function hume_query(socket: WebSocket, blob: Blob, models: Object) {
    const data = await blobToBase64(blob);

    const message = JSON.stringify({ data, models, raw_text: false });
    socket.send(message);
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve: (value: string) => void, _) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (!reader.result) return;

        const result = reader.result as string;
        resolve(result.split(",")[1]);
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
    <div className="fullWrapper" >
      <rect
            width="100%"
            height="100%"
            strokeWidth="{0}"
          ></rect>
      <div className="leftSide">
        <div>
          <button
            onClick={handleShareButton}
            className="shareButton"
            type="submit"
          >
            <span>{stream ? "Change" : "Share"} Tab</span>
          </button>
        </div>
        <div className="videoBox">
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
            onPause={() => {
              arecorder.pause();
              vrecorder.pause();
            }}
            onEnded={() => {
              arecorder.stop();
              vrecorder.stop();
            }}
          />
        </div>
        <div className="ErrorTexts">
          <div className="text-lg font-medium">Error Checking</div>
          <div>
            {incorrectTexts.map((text, index) => (
              <div key={index}>
                <div>Erroneous Statement: {text.txt}</div>
                <ReactMarkdown>{text.txt2}</ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rightSide">
        <div className="TranscriptBox">
          <div className="text-lg font-medium">Transcript</div>
          <div>
            <p>{transcript}</p>
            <div ref={endOfMessagesRef} />
          </div>
        </div>
        <div className="HumeBox">
          <div className="text-lg font-medium">Emotional Analysis</div>
          {getHumeDisplayEmotions().map(([score, emotion]) => (
            <div className="flex items-center Ewrapper" key={emotion}>
              <ProgressBar progress={score} />
              <div className="ml-2 text-sm capitalize">{emotion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ProgressBar = ({
  progress,
  height = "h-4",
  color = "bg-green-500",
  backgroundColor = "bg-gray-200",
}: any) => {
  return (
    <div
      className={`w-full ${height} ${backgroundColor} rounded-full overflow-hidden progessbar`}
    >
      <div
        className={`h-full ${color}`}
        style={{ width: `${progress * 100}%` }}
      ></div>
    </div>
  );
};
