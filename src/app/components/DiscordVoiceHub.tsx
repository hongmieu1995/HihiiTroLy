"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, Send, Volume2, Square, Mic, Pin } from "lucide-react";

interface HistoryItem {
  id: string;
  text: string;
  time: string;
  status: "pending" | "speaking" | "done" | "error";
}

interface TtsVoice {
  name: string;
  gender?: string;
  locale?: string;
}

export default function DiscordVoiceHub() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceError, setDeviceError] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("gtts-vi");
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const historyIdRef = useRef(0);

  const loadAudioDevices = async (requestPermission = false) => {
    setDeviceError("");
    try {
      let stream: MediaStream | null = null;
      if (requestPermission) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === "audiooutput");
      setAudioDevices(outputs);
      const cable = outputs.find(
        (d) => d.label.toLowerCase().includes("cable") || d.label.toLowerCase().includes("virtual")
      );
      if (cable) setSelectedDevice(cable.deviceId);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      setDeviceError(err instanceof Error ? err.message : "Không thể quét thiết bị âm thanh");
    }
  };

  useEffect(() => {
    const setupDevices = async () => {
      await loadAudioDevices(false);
    };

    setupDevices();
  }, []);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke<{ success: boolean; voices?: TtsVoice[] }>("get_tts_voices");
        if (result.success && result.voices) {
          setVoices(result.voices);
        }
      } catch (err) {
        console.warn("Không thể tải danh sách giọng TTS:", err);
      }
    };

    loadVoices();
  }, []);

  useEffect(() => {
    localStorage.setItem("discordVoiceSettings", JSON.stringify({
      selectedDevice,
      selectedVoice,
    }));
  }, [selectedDevice, selectedVoice]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTo({
        top: historyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [history]);

  const playAudioBase64 = async (base64: string, format?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: format === "mp3" ? "audio/mpeg" : "audio/wav" });
      const url = URL.createObjectURL(blob);

      const audioCable = new Audio(url);
      const audioCableWithSink = audioCable as HTMLAudioElement & {
        setSinkId?: (sinkId: string) => Promise<void>;
      };
      if (selectedDevice && audioCableWithSink.setSinkId) {
        audioCableWithSink.setSinkId(selectedDevice).catch(console.warn);
      }
      const audioLocal = new Audio(url);

      audioCable.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audioCable.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      audioCable.play().catch(reject);
      audioLocal.play().catch(console.warn);
      audioRef.current = audioCable;
    });
  };

  const speak = async (text: string) => {
    if (!text.trim() || isSpeaking) return;
    historyIdRef.current += 1;
    const id = historyIdRef.current.toString();
    setHistory((prev) => [...prev, {
      id, text: text.trim(),
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      status: "speaking",
    }]);
    setIsSpeaking(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<{ success: boolean; audio_base64?: string; error?: string }>(
        "tts_speak",
        { text: text.trim(), voice: selectedVoice, rate: "+0%" }
      );
      if (result.success && result.audio_base64) {
        await playAudioBase64(result.audio_base64, "mp3");
        setHistory((prev) => prev.map((h) => h.id === id ? { ...h, status: "done" } : h));
      } else {
        setHistory((prev) => prev.map((h) => h.id === id ? { ...h, status: "error" } : h));
      }
    } catch {
      setHistory((prev) => prev.map((h) => h.id === id ? { ...h, status: "error" } : h));
    }
    setIsSpeaking(false);
  };

  const handleSend = () => {
    if (!input.trim() || isSpeaking) return;
    speak(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
  };

  const openOverlay = async () => {
    localStorage.setItem("discordVoiceSettings", JSON.stringify({
      selectedDevice,
      selectedVoice,
    }));
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_discord_voice_overlay");
  };

  return (
    <div className="flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mt-2 mb-3 flex-shrink-0 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black text-white">Discord Voice TTS</h1>
          <p className="text-xs text-neutral-400 mt-1">Gõ văn bản để phát thành giọng nói trong Discord</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
            isSpeaking ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-neutral-400"
          }`}>
            <Mic className="w-3.5 h-3.5" />
            {isSpeaking ? "Đang nói..." : "Sẵn sàng"}
          </div>
          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-300 outline-none max-w-[200px]"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            title="Output device: chọn CABLE Input để đưa tiếng vào Discord"
          >
            <option value="">-- Output Device --</option>
            {audioDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Device ${d.deviceId.slice(0, 8)}`}</option>
            ))}
          </select>
          <button
            onClick={openOverlay}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-400/20 hover:text-cyan-200"
            title="Pin cửa sổ TTS nhỏ lên Discord"
          >
            <Pin className="h-3.5 w-3.5" />
            Sử dụng
          </button>
          <button
            onClick={() => loadAudioDevices(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
            title="Quét lại thiết bị âm thanh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Quét
          </button>
          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-300 outline-none max-w-[220px]"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            title="Giọng nói"
          >
            <option value="gtts-vi">🇻🇳 Chị Google (Nữ)</option>
            <option value="vi-VN-HoaiMyNeural">🇻🇳 HoaiMy (Nữ)</option>
            <option value="vi-VN-NamMinhNeural">🇻🇳 NamMinh (Nam)</option>
            {voices
              .filter((voice) => voice.name !== "vi-VN-HoaiMyNeural" && voice.name !== "vi-VN-NamMinhNeural")
              .slice(0, 30)
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.locale?.startsWith("vi") ? "🇻🇳" : "🌐"} {voice.name.split("-").pop()?.replace("Neural", "") || voice.name} ({voice.gender === "Female" ? "Nữ" : "Nam"})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* History */}
      <div ref={historyRef} className="mb-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Volume2 className="w-10 h-10 text-cyan-500/40 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Discord Voice</h3>
            <p className="text-neutral-500 text-xs max-w-xs leading-relaxed">
              Gõ văn bản để phát thành giọng nói trong Discord voice chat.<br />
              Cài VB-Audio Virtual Cable, chọn <strong>CABLE Input</strong> ở Output.<br />
              Trong Discord chọn <strong>CABLE Output</strong> làm Input Device.
            </p>
            {deviceError && (
              <p className="mt-3 text-xs text-red-400">
                {deviceError}
              </p>
            )}
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className={`p-3 rounded-xl border transition-all ${
              item.status === "speaking" ? "bg-cyan-500/5 border-cyan-500/30" : "bg-white/[0.03] border-white/5"
            }`}>
              <p className="text-sm text-white">{item.text}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-neutral-500">{item.time}</span>
                <div className="flex items-center gap-2">
                  {item.status === "speaking" && <span className="text-[10px] text-cyan-400 animate-pulse">🔊 Đang nói</span>}
                  {(item.status === "done" || item.status === "error") && (
                    <button
                      className={`text-[10px] transition-colors ${item.status === "error" ? "text-red-400 hover:text-red-300" : "text-neutral-400 hover:text-cyan-400"}`}
                      onClick={() => speak(item.text)}
                      disabled={isSpeaking}
                    >
                      {item.status === "error" ? "🔄 Thử lại" : "🔁 Nói lại"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={historyEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-2xl">
        <textarea
          className="flex-1 bg-transparent border-none outline-none text-white text-sm resize-none placeholder-neutral-500"
          placeholder="Nhập văn bản để nói trong Discord..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSpeaking}
        />
        {isSpeaking ? (
          <button className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center flex-shrink-0" onClick={stopSpeaking}>
            <Square className="w-4 h-4 text-white" />
          </button>
        ) : (
          <button
            className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center flex-shrink-0 disabled:opacity-30"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
