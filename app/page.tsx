"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (videoUrl) {
      router.push(`/app?url=${videoUrl}`);
    }
  };

  return (
    <div className="flex h-screen bg-white w-full justify-center items-center">
      <form className="mt-8 mx-auto max-w-sm" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 lg:flex-row">
          <label className="sr-only" htmlFor="url">
            Video URL
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Enter video URL"
            className="block h-10 w-full appearance-none text-black rounded border border-gray-300 px-4 py-2 placeholder-gray-400 duration-200 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          <button
            className="flex h-10 shrink-0 items-center justify-center gap-1 rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-800"
            type="submit"
          >
            <span>Go to App</span>
          </button>
        </div>
      </form>
    </div>
  );
}
