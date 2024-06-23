"use client";
import { useEffect, useRef, useState } from "react";
import Groq, { toFile } from "groq-sdk";

export default function Home() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunks: Blob[] = [];
  let recorder: MediaRecorder;
  const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY, dangerouslyAllowBrowser: true });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
        transcribe(new Blob(chunks, {type: chunks[0].type}), groq);
      };
    }
    console.log(stream);
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
    return response;
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 bg-background p-8">
        <div className="mt-8 mx-auto max-w-sm">
          <div className="flex flex-col gap-2 lg:flex-row">
            <button
              onClick={handleShareButton}
              className="flex h-10 shrink-0 items-center justify-center gap-1 rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-800"
              type="submit"
            >
              <span>{stream ? "Change" : "Share"} Tab</span>
            </button>
          </div>
        </div>
        <div className="relative h-full w-full rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            className="w-full h-full"
            onPlay={() =>
              recorder.state == "paused"
                ? recorder.resume()
                : recorder.start(3000)
            }
            onPause={() => recorder.pause()}
            onEnded={() => recorder.stop()}
          />
        </div>
      </div>
      <div className="w-[40%] bg-background p-8">
        <div className="flex flex-col h-full rounded-xl border border-input shadow-sm">
          <div className="sticky top-0 flex items-center justify-between bg-background px-4 py-3 border-b border-input">
            <div className="text-lg font-medium">ChatBot</div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-start gap-4">
              <div className="grid gap-1">
                <div className="font-bold">ChatGPT</div>
                <div className="prose text-muted-foreground">
                  <p>
                    Hello! I'm an AI assistant created by Anthropic. How can I
                    help you today?
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 mt-6">
              <div className="grid gap-1">
                <div className="font-bold">You</div>
                <div className="prose text-muted-foreground">
                  <p>
                    Hi ChatGPT! I'm interested in learning more about the latest
                    advancements in AI technology. Can you tell me about some of
                    the exciting developments happening in the field?
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 mt-6">
              <div className="grid gap-1">
                <div className="font-bold">ChatGPT</div>
                <div className="prose text-muted-foreground">
                  <p>
                    Absolutely! There have been some incredible advancements in
                    AI technology recently. One of the most exciting
                    developments is the rapid progress in natural language
                    processing, which has enabled AI systems like myself to
                    engage in more natural and contextual conversations.
                  </p>
                  <p>
                    Another area of innovation is in the field of computer
                    vision, where AI models are now able to analyze and
                    understand visual information with human-like accuracy. This
                    has opened up a wide range of applications, from autonomous
                    vehicles to medical image analysis.
                  </p>
                  <p>
                    Additionally, the increasing availability of large datasets
                    and the growing computational power of modern hardware have
                    allowed for the development of more sophisticated and
                    capable AI models. These advancements are paving the way for
                    AI to tackle increasingly complex problems and provide
                    valuable insights across a variety of industries.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 bg-background px-4 py-3 border-t border-input">
            <div className="relative">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
