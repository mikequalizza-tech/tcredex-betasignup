'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MediaRoom } from '@/components/closing-room/media-room';

export default function CallPageWrapper() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CallPage />
    </Suspense>
  );
}

function CallPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const dealId = params.id as string;
  const roomId = searchParams.get('room') || dealId;
  const video = searchParams.get('video') === 'true';

  const handleDisconnect = () => {
    window.close();
  };

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {video ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {video ? 'Video Call' : 'Voice Call'}
            </h1>
            <p className="text-xs text-gray-400">tCredex Connect</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
          Leave Call
        </button>
      </div>

      {/* Media Room */}
      <div className="flex-1">
        <MediaRoom
          roomId={roomId}
          dealId={dealId}
          video={video}
          audio={true}
          onDisconnect={handleDisconnect}
        />
      </div>
    </div>
  );
}
