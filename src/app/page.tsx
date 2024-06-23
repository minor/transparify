"use client";
import React from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <div className="relative">
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(#A4A4A3, transparent 50%)",
          }}
        ></div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full stroke-gray-400/80 opacity-50 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
              width="200"
              height="200"
              x="50%"
              y="-1"
              patternUnits="userSpaceOnUse"
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y="-1" className="overflow-visible fill-gray-50">
            <path
              d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
              strokeWidth="{0}"
            ></path>
          </svg>
          <rect
            width="100%"
            height="100%"
            strokeWidth="{0}"
            fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)"
          ></rect>
        </svg>
        <div className="mx-auto max-w-2xl pt-64 text-center">
          <div className="relative mx-4 flex flex-col sm:mx-0">
            <h1 className="relative mb-4 text-5xl font-semibold">
              Get real-time{" "}
              <span className="bg-gradient-to-r from-rose-400 to-orange-300 bg-clip-text text-transparent">
                truth and transparency
              </span>{" "}
              in your favorite livestreams
            </h1>

            <p className="mx-auto max-w-xl text-center text-xl text-gray-600">
              Transparify is a service that provides real-time livestream
              fact-checking and emotional analysis for a more informed and
              transparent viewing experience.
            </p>
            <a href="/app">
              <button
                className={`bg-rose-400/80 mt-4 text-white px-6 w-1/4 mx-auto py-2 rounded-lg font-semibold transition ease-in-out duration-200 hover:bg-rose-400`}
              >
                Share Tab
              </button>
            </a>
          </div>
        </div>
      </div>
      <footer className="flex justify-center pt-20 pb-10 bg-gray-50">
        <h3 className="text-gray-600 font-light text-base cursor-default">
          hacked together with <span className="hover:text-rose-400">♡</span> by{" "}
          <a
            className="underline text-rose-400 text-base hover:text-rose-400/60"
            href="https://calhacks.io"
          >
            3 canadians and 1 american
          </a>{" "}
          |{" "}
          <a
            className="underline text-rose-400 text-base hover:text-rose-400/60"
            href="https://github.com/minor/transparify/"
          >
            how it works
          </a>
        </h3>
      </footer>
    </main>
  );
}
