import React, { useRef, useState } from "react";
import {
  MdOutlineSummarize,
  MdEditNote,
  MdGTranslate,
  MdClose,
  MdMicNone,
} from "react-icons/md";
import { IoIosAddCircleOutline } from "react-icons/io";
import { FaRegStopCircle } from "react-icons/fa";
import { IoSend } from "react-icons/io5";

interface AIChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (
    text?: string,
    attachment?: { mimeType: string; data: string },
  ) => void;
  isTyping: boolean;
}

const AIChatInput: React.FC<AIChatInputProps> = ({
  input,
  setInput,
  onSend,
  isTyping,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    mimeType: string;
    data: string;
  } | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachedFile) {
      onSend(input, attachedFile || undefined);
      setAttachedFile(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setAttachedFile({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          data: base64,
        });
      } catch (err) {
        console.error("File conversion failed", err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorder.current = recorder;
        chunks.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunks.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            onSend("Voice message", { mimeType: "audio/webm", data: base64 });
          };
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        setIsRecording(true);
      } catch (error) {
        alert("Microphone permission denied: " + error);
      }
    }
  };

  const actions = [
    {
      icon: <MdOutlineSummarize />,
      label: "Summarize",
      prompt: "Summarize our discussion so far.",
    },
    {
      icon: <MdEditNote />,
      label: "Write",
      prompt: "Help me write an email about...",
    },
    {
      icon: <MdGTranslate />,
      label: "Translate",
      prompt: "Translate the previous message.",
    },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 md:px-8 md:pb-8 bg-linear-to-t from-background-light via-background-light/90 to-transparent z-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-4 justify-center overflow-x-auto pb-2 no-scrollbar">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => onSend(action.prompt)}
              className="whitespace-nowrap px-4 py-2 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-2 hover:border-teal-500 hover:text-teal-500 transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <span className="text-sm">{action.icon}</span> {action.label}
            </button>
          ))}
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-teal-500/10 blur-3xl rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>

          <form
            onSubmit={handleSubmit}
            className="relative bg-white border-2 border-slate-200 rounded-2xl p-2 flex flex-col gap-1 focus-within:border-teal-500 transition-all shadow-xl"
          >
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl w-fit text-xs font-bold text-slate-600 animate-fade-in mx-2 mt-1 border border-teal-500/10">
                <span className="text-sm">attachment</span>
                <span className="truncate max-w-50">{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="hover:text-rose-500 ml-1 cursor-pointer"
                >
                  <MdClose className="text-lg" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-1">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-teal-500 transition-colors active:scale-90 shrink-0 cursor-pointer"
              >
                <IoIosAddCircleOutline className="text-3xl" />
              </button>

              <textarea
                className="flex-1 bg-transparent border-none outline-none appearance-none shadow-none ring-0
          focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 py-3 px-2 text-slate-700 resize-none max-h-40 min-h-12 placeholder-slate-400 font-medium"
                placeholder="Type your message here..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              <div className="flex items-center gap-1 pr-1">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3 transition-colors active:scale-90 shrink-0 cursor-pointer ${isRecording ? "text-rose-500 animate-pulse" : "text-slate-400 hover:text-teal-500"}`}
                >
                  <span className="text-3xl">
                    {isRecording ? <FaRegStopCircle /> : <MdMicNone />}
                  </span>
                </button>
                <button
                  type="submit"
                  disabled={isTyping || (!input.trim() && !attachedFile)}
                  className="size-10 flex items-center justify-center bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none shrink-0 cursor-pointer"
                >
                  <IoSend className="text-lg" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatInput;
