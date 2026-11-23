'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, FileText, Loader2, Mic, Paperclip, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_VOICE_SECONDS = 60;
const ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf';
const BARS = 28;

export type ChatSendPayload = { text: string; file?: File; kind?: 'voice' | 'file' };

type Props = {
  busy: boolean;
  placeholder: string;
  lang: 'ar' | 'en';
  compact?: boolean;
  onSend: (p: ChatSendPayload) => void;
};

/** Same limits/behaviour as the original ChatComposer (png/jpeg/webp/pdf ≤4MB, voice ≤60s) with a live waveform and a morphing send button. */
export function AssistantComposer({ busy, placeholder, lang, compact, onSend }: Props) {
  const ar = lang === 'ar';
  const [text, setText] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [canRecord, setCanRecord] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [levels, setLevels] = React.useState<number[]>(() => Array(BARS).fill(0.15));

  const fileRef = React.useRef<HTMLInputElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const cancelledRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const onSendRef = React.useRef(onSend);
  onSendRef.current = onSend;

  const stopMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  React.useEffect(() => {
    setCanRecord(typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia);
    return () => {
      cancelledRef.current = true;
      stopTimer();
      stopMeter();
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') rec.stop();
    };
  }, []);

  // auto-grow textarea (max ~5 lines)
  React.useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!ACCEPT.split(',').includes(f.type)) {
      setError(ar ? 'الملفات المسموحة: صور (PNG / JPG / WEBP) أو PDF' : 'Allowed files: images (PNG / JPG / WEBP) or PDF');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError(ar ? 'الملف أكبر من 4 ميجا' : 'The file is larger than 4 MB');
      return;
    }
    setError(null);
    setFile(f);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const t = text.trim();
    if (!t && !file) return;
    onSend({ text: t, file: file ?? undefined, kind: file ? 'file' : undefined });
    setText('');
    setFile(null);
    setError(null);
  };

  const startMeter = (stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      let last = 0;
      const loop = (now: number) => {
        rafRef.current = requestAnimationFrame(loop);
        if (now - last < 60) return;
        last = now;
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length / 255;
        setLevels((prev) => [...prev.slice(1), Math.max(0.12, Math.min(1, avg * 2.4))]);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      /* no analyser → bars stay idle, recording still works */
    }
  };

  const startRecording = async () => {
    if (busy) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
        stopMeter();
        setRecording(false);
        setLevels(Array(BARS).fill(0.15));
        const type = (rec.mimeType || mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (cancelledRef.current) return;
        if (blob.size < 1500) {
          setError(ar ? 'التسجيل قصير جداً، جرّب تاني' : 'The recording is too short, try again');
          return;
        }
        if (blob.size > MAX_FILE_BYTES) {
          setError(ar ? 'التسجيل طويل، سجّل أقل من دقيقة' : 'The recording is too long, keep it under a minute');
          return;
        }
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        onSendRef.current({ text: '', file: new File([blob], `voice.${ext}`, { type }), kind: 'voice' });
      };
      recorderRef.current = rec;
      rec.start();
      startMeter(stream);
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(ar ? 'مقدرتش أفتح الميكروفون. اسمح للموقع باستخدامه من إعدادات المتصفح.' : 'Could not access the microphone. Please allow it in your browser settings.');
    }
  };
  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  };
  const cancelRecording = () => {
    cancelledRef.current = true;
    stopRecording();
  };
  React.useEffect(() => {
    if (recording && seconds >= MAX_VOICE_SECONDS) stopRecording();
  }, [recording, seconds]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const hasContent = !!text.trim() || !!file;
  const mode: 'busy' | 'send' | 'mic' = busy ? 'busy' : hasContent || !canRecord ? 'send' : 'mic';
  const btn = compact ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <div className="space-y-1.5">
      {error && <p role="alert" className="px-2 text-xs text-destructive">{error}</p>}
      {file && !recording && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs">
          <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="min-w-0 flex-1 truncate" dir="ltr">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} aria-label={ar ? 'شيل الملف' : 'Remove file'} className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="glass flex items-end gap-1.5 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-ring">
        {recording ? (
          <>
            <button type="button" onClick={cancelRecording} aria-label={ar ? 'إلغاء' : 'Cancel'} className={cn('flex shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', btn)}>
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-11 min-w-0 flex-1 items-center gap-3 px-2" dir="ltr" aria-live="off">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-destructive" />
              <span className="w-11 shrink-0 text-sm tabular-nums">{mmss}</span>
              <div className="flex h-8 min-w-0 flex-1 items-center justify-between gap-[3px]" aria-hidden>
                {levels.map((v, i) => (
                  <span key={i} className="w-[3px] rounded-full bg-accent transition-[height] duration-100" style={{ height: `${Math.round(v * 100)}%` }} />
                ))}
              </div>
            </div>
            <button type="button" onClick={stopRecording} aria-label={ar ? 'إرسال التسجيل' : 'Send recording'} className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', btn)}>
              <Square className="h-4 w-4 fill-current" />
            </button>
          </>
        ) : (
          <>
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} aria-label={ar ? 'إرفاق صورة أو PDF' : 'Attach an image or PDF'} className={cn('flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', btn)}>
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              ref={taRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              dir="auto"
              disabled={busy}
              className="max-h-32 min-h-[2.75rem] min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="button"
              onClick={mode === 'mic' ? startRecording : mode === 'send' ? () => submit() : undefined}
              disabled={busy}
              aria-label={mode === 'mic' ? (ar ? 'تسجيل رسالة صوتية' : 'Record a voice message') : ar ? 'إرسال' : 'Send'}
              className={cn(
                'relative flex shrink-0 items-center justify-center rounded-full transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                btn,
                mode === 'mic' ? 'bg-muted text-foreground hover:bg-accent/15' : 'bg-brand-gradient text-primary-foreground shadow-glow hover:scale-105 active:scale-95',
                mode === 'send' && !hasContent && 'opacity-60'
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={mode} initial={{ opacity: 0, scale: 0.5, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 45 }} transition={{ duration: 0.15 }} className="flex">
                  {mode === 'busy' ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'mic' ? <Mic className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
