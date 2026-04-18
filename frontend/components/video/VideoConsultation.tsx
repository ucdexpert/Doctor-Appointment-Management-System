"use client";

import { useEffect, useRef, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Video, PhoneOff, Clock } from "lucide-react";
import { toast } from "sonner";

interface VideoConsultationProps {
  appointmentId: number;
  userName: string;
  userEmail: string;
  userRole: "patient" | "doctor";
  onStartCall?: () => void;
  onEndCall?: (duration: number) => void;
}

export default function VideoConsultation({
  appointmentId,
  userName,
  userEmail,
  userRole,
  onStartCall,
  onEndCall,
}: VideoConsultationProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const jitsiRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for call duration
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartCall = async () => {
    try {
      setIsConnecting(true);

      // Get video room details from backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/video/room/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get video consultation room");
      }

      const data = await response.json();

      // Notify backend that call has started
      const callStartResponse = await fetch(`${API_URL}/appointments/${appointmentId}/call/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!callStartResponse.ok) {
        console.warn("Failed to track call start, but continuing with call");
      }

      setIsCallActive(true);
      setIsConnecting(false);
      setCallDuration(0);

      if (onStartCall) {
        onStartCall();
      }

      toast.success("Video call connected! 📹");
    } catch (error) {
      console.error("Failed to start call:", error);
      toast.error("Failed to start video call. Please try again.");
      setIsConnecting(false);
    }
  };

  const handleEndCall = async () => {
    try {
      // Stop the Jitsi meeting
      if (jitsiRef.current && jitsiRef.current.api) {
        jitsiRef.current.api.executeCommand("hangup");
      }

      setIsCallActive(false);
      setIsCallEnded(true);

      // Notify backend that call has ended
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/appointments/${appointmentId}/call/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to end call tracking");
      }

      const data = await response.json();

      if (onEndCall) {
        onEndCall(callDuration);
      }

      toast.success(`Call ended. Duration: ${formatDuration(callDuration)}`);
    } catch (error) {
      console.error("Failed to end call:", error);
      toast.error("Failed to track call duration");
    }
  };

  const handleJitsiReady = () => {
    console.log("Jitsi meeting ready");
  };

  const handleJitsiEnd = () => {
    console.log("Jitsi meeting ended");
    if (isCallActive) {
      handleEndCall();
    }
  };

  // Room name - unique per appointment
  const roomName = `MediConnect-apt-${appointmentId}`;

  if (!isCallActive && isCallEnded) {
    return (
      <Card className="p-4 sm:p-8 text-center">
        <div className="mb-4">
          <PhoneOff className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-green-500 mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Call Ended</h3>
          <p className="text-sm text-gray-600">
            Video consultation completed
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">
              Duration: {formatDuration(callDuration)}
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500">
          Thank you for using MediConnect
        </p>
      </Card>
    );
  }

  if (!isCallActive) {
    return (
      <Card className="p-4 sm:p-8 text-center">
        <div className="mb-4 sm:mb-6">
          <Video className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-blue-500 mb-3 sm:mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Video Consultation
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
            Click below to start your video consultation
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Before you start:</h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>✓ Stable internet connection</li>
              <li>✓ Camera and microphone working</li>
              <li>✓ Quiet and well-lit space</li>
              <li className="hidden sm:block">✓ Medical reports ready</li>
            </ul>
          </div>

          <Button
            onClick={handleStartCall}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 sm:h-14 text-base sm:text-lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Start Video Call
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Full Screen Video Area */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        {/* Jitsi Meeting - Full Screen */}
        <div className="absolute inset-0">
          <JitsiMeeting
            domain="meet.element.io"
            roomName={roomName}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              disableModeratorIndicator: true,
              enableClosePage: false,
              enableWelcomePage: false,
              prejoinConfig: {
                enabled: false,
              },
              // Disable lobby mode - allow anyone to join directly
              lobby: {
                enabled: false,
              },
              enableLobbyChat: false,
              // Room settings
              requireDisplayName: false,
              // Security settings - make room open
              enableUserRolesBasedOnToken: false,
              // WhatsApp-like settings
              disableProfile: true,
              disableChat: false,
              disableReactions: false,
              remoteVideoMenu: {
                disable: false,
              },
              maxFullResolutionParticipants: 2,
              constraints: {
                video: {
                  height: {
                    ideal: 1080,
                    max: 1080,
                    min: 360,
                  },
                },
              },
            }}
            interfaceConfigOverwrite={{
              TOOLBAR_BUTTONS: [
                "microphone",
                "camera",
                "desktop",
                "fullscreen",
                "fodeviceselection",
                "hangup",
                "chat",
                "settings",
                "raisehand",
                "videoquality",
                "tileview",
                "mute-everyone",
              ],
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              DEFAULT_REMOTE_DISPLAY_NAME: userRole === "doctor" ? "Doctor" : "Patient",
              MOBILE_APP_PROMO: false,
              FILM_STRIP_ONLY: false,
              TILE_VIEW_MAX_COLUMNS: 2,
              TILE_VIEW_MAX_ROWS: 2,
              VERTICAL_FILMSTRIP: false,
              DEFAULT_LOCAL_DISPLAY_NAME: "You",
              ENFORCE_NOTIFICATION_AUTOPLAY: true,
            }}
            userInfo={{
              displayName: userName,
              email: userEmail,
            }}
            onApiReady={handleJitsiReady}
            onReadyToClose={handleJitsiEnd}
            getIFrameRef={(iframeRef: { ref: HTMLIFrameElement }) => {
              if (iframeRef?.ref) {
                iframeRef.ref.style.height = "100%";
                iframeRef.ref.style.width = "100%";
                iframeRef.ref.style.border = "none";
              }
            }}
          />
        </div>

        {/* Overlay - Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div>
                <p className="text-white font-semibold text-lg">
                  {userRole === "doctor" ? "Patient" : "Doctor"} Consultation
                </p>
                <p className="text-white/70 text-sm">
                  {formatDuration(callDuration)}
                </p>
              </div>
            </div>
            <Button
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Controls - WhatsApp Style */}
      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute Button */}
          <button
            onClick={() => {
              if (jitsiRef.current?.api) {
                jitsiRef.current.api.executeCommand("toggleAudio");
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors min-w-[80px]"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span className="text-white text-xs">Mute</span>
          </button>

          {/* Video Toggle */}
          <button
            onClick={() => {
              if (jitsiRef.current?.api) {
                jitsiRef.current.api.executeCommand("toggleVideo");
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors min-w-[80px]"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
            <span className="text-white text-xs">Video</span>
          </button>

          {/* End Call - Center */}
          <button
            onClick={handleEndCall}
            className="flex flex-col items-center gap-2 p-6 rounded-full bg-red-600 hover:bg-red-700 transition-colors mx-4"
          >
            <PhoneOff className="w-8 h-8 text-white" />
            <span className="text-white text-xs">End</span>
          </button>

          {/* Screen Share */}
          <button
            onClick={() => {
              if (jitsiRef.current?.api) {
                jitsiRef.current.api.executeCommand("toggleShareScreen");
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors min-w-[80px]"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
            </svg>
            <span className="text-white text-xs">Share</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              if (jitsiRef.current?.api) {
                jitsiRef.current.api.executeCommand("toggleSettings");
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors min-w-[80px]"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            <span className="text-white text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
