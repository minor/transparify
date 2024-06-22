"use client";
import { Button } from "../../components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { Textarea } from "../../components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function Component() {
  const searchParams = useSearchParams();
  const [videoId, setVideoId] = useState("");

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
      <div className="w-[40%] bg-background p-8">
        <div className="flex flex-col h-full rounded-xl border border-input shadow-sm">
          <div className="sticky top-0 flex items-center justify-between bg-background px-4 py-3 border-b border-input">
            <div className="text-lg font-medium">ChatBot</div>
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
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OA</AvatarFallback>
              </Avatar>
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
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
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
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OA</AvatarFallback>
              </Avatar>
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
