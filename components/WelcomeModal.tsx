"use client";

import { useState, useEffect } from "react";

interface WelcomeModalProps {
  onDismiss: () => void;
}

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
        onClick={handleContinue}
      />

      {/* Modal */}
      <div
        className={`relative bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all duration-300 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Welcome to tCredex
        </h2>

        {/* Body */}
        <p className="text-gray-300 text-center mb-8 leading-relaxed">
          tCredex helps you explore eligibility, impact, and opportunities using
          transparent data and analytics.{" "}
          <span className="text-indigo-400 font-medium">
            All decisions remain with you and your advisors.
          </span>
        </p>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <svg
              className="w-5 h-5 text-green-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Explore NMTC, HTC, LIHTC, OZ, and state credits</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <svg
              className="w-5 h-5 text-green-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>AI-assisted eligibility and matching</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <svg
              className="w-5 h-5 text-green-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Transparent data, human oversight</span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleContinue}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
