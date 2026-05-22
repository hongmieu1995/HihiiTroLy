"use client";

import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Send, Square, X, GripHorizontal, Volume2 } from "lucide-react";

interface DiscordVoiceSettings {
  selectedDevice?: string;
  selectedVoice?: string;
}

export default function DiscordVoiceOverlay() {
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("Sẵn sàng TTS");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getSettings = (): DiscordVoiceSettings => {
    try {
      return JSON.parse(localStorage.getItem("discordVoiceSettings") || "{}");
    } catch {
      return {};
    }
  };

  const playAudioBase64 = async (base64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const settings = getSettings();
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audioCable = new Audio(url);
      const audioCableWithSink = audioCable as HTMLAudioElement & {
        setSinkId?: (sinkId: string) => Promise<void>;
      };

      if (settings.selectedDevice && audioCableWithSink.setSinkId) {
        audioCableWithSink.setSinkId(settings.selectedDevice).catch(console.warn);
      }

      const audioLocal = new Audio(url);
      audioCable.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audioCable.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      audioCable.play().catch(reject);
      audioLocal.play().catch(console.warn);
      audioRef.current = audioCable;
    });
  };

  const speak = async () => {
    const text = input.trim();
    if (!text || isSpeaking) return;

    const settings = getSettings();
    setIsSpeaking(true);
    setStatus("Đang tạo giọng nói...");

    try {
      const result = await invoke<{ success: boolean; audio_base64?: string }>("tts_speak", {
        text,
        voice: settings.selectedVoice || "gtts-vi",
        rate: "+0%",
      });

      if (result.success && result.audio_base64) {
        setStatus("Đang nói trong Discord...");
        await playAudioBase64(result.audio_base64);
        setInput("");
        setStatus("Đã nói xong");
      } else {
        setStatus("TTS thất bại");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "TTS thất bại");
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setStatus("Đã dừng");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      speak();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#090b12]/95 text-white shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
      <div data-tauri-drag-region className="flex h-9 items-center gap-2 border-b border-white/10 px-3 select-none">
        <GripHorizontal className="h-4 w-4 text-neutral-500" />
        <Volume2 className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-bold text-neutral-200">Discord Voice TTS</span>
        <button
          onClick={() => getCurrentWindow().close()}
          className="ml-auto rounded-md p-1 text-neutral-500 transition-colors hover:bg-red-500/20 hover:text-red-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex h-[calc(100vh-36px)] flex-col gap-3 p-3">
        <div className={`rounded-xl border px-3 py-2 text-xs ${isSpeaking ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/5 text-neutral-400"}`}>
          {status}
        </div>

        <textarea
          className="min-h-0 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-cyan-400/40"
          placeholder="Gõ nội dung rồi Enter để TTS vào Discord..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSpeaking}
        />

        {isSpeaking ? (
          <button
            onClick={stopSpeaking}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white transition-colors hover:bg-red-400"
          >
            <Square className="h-4 w-4" />
            Dừng
          </button>
        ) : (
          <button
            onClick={speak}
            disabled={!input.trim()}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-bold text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Nói trong Discord
          </button>
        )}
      </div>
    </div>
  );
}
