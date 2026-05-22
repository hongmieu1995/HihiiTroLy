"use client";

import { useState } from "react";
import { Mail, Plus, RefreshCw, Search, HardDrive, ArrowLeft, Paperclip, Download } from "lucide-react";

export default function GmailHub() {
  const [view, setView] = useState<"mail" | "drive">("mail");

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between mt-6 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Gmail & Drive</h1>
          <p className="text-xs text-neutral-400 mt-1">Quản lý email và Google Drive từ nhiều tài khoản</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "mail" ? "bg-cyan-500 text-white" : "text-neutral-400 hover:text-white"}`}
              onClick={() => setView("mail")}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1.5" />Mail
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "drive" ? "bg-cyan-500 text-white" : "text-neutral-400 hover:text-white"}`}
              onClick={() => setView("drive")}
            >
              <HardDrive className="w-3.5 h-3.5 inline mr-1.5" />Drive
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
        <Mail className="w-12 h-12 text-cyan-500/50 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Tính năng đang phát triển</h3>
        <p className="text-neutral-500 text-sm max-w-md">
          Gmail & Drive sẽ cho phép bạn quản lý email và file từ nhiều tài khoản Google ngay trong app.
          Tính năng này cần kết nối Google OAuth - sẽ được hoàn thiện trong bản cập nhật tiếp theo.
        </p>
        <button className="mt-6 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-xs font-bold transition-all">
          <Plus className="w-4 h-4 inline mr-2" />
          Kết nối tài khoản Google
        </button>
      </div>
    </div>
  );
}
