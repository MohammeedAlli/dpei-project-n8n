'use client';

import * as React from 'react';
import { Send, Paperclip, Mic, Square, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_VOICE_SECONDS = 60;
const ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf';

export type ChatSendPayload = { text: string; file?: File; kind?: 'voice' | 'file' };

type Props = {
  busy: boolean;
  placeholder: string;
  lang: 'ar' | 'en';
  compact?: boolean;
  onSend: (payload: ChatSendPayload) => void;
};

// صندوق الكتابة: نص + إرفاق ملف (صورة / PDF) + تسجيل صوتي
export function ChatComposer({ busy, placeholder, lang, compact, onSend }: Props) {
  const ar = lang === 'ar';
  const [text, setText] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [canRecord, setCanRecord] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const cancelledRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const onSendRef = React.useRef(onSend);
  onSendRef.current = onSend;

  React.useEffect(() => {
    setCanRecord(
      typeof window !== 'undefined' &&
        'MediaRecorder' in window &&
        !!navigator.mediaDevices?.getUserMedia
    );
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') rec.stop();
    };
  }, []);

  const size = compact ? 'h-9 w-9' : 'h-10 w-10';
  const inputClass = compact ? 'h-9 text-sm' : '';

  // ───────── ملف ─────────
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const t = text.trim();
    if (!t && !file) return;
    onSend({ text: t, file: file ?? undefined, kind: file ? 'file' : undefined });
    setText('');
    setFile(null);
    setError(null);
  };

  // ───────── تسجيل صوتي ─────────
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (busy) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(
        (m) => MediaRecorder.isTypeSupported(m)
      );
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;

      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
        setRecording(false);
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
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(
        ar
          ? 'مقدرتش أفتح الميكروفون. اسمح للموقع باستخدامه من إعدادات المتصفح.'
          : 'Could not access the microphone. Please allow it in your browser settings.'
      );
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

  // أقصى مدة للتسجيل
  React.useEffect(() => {
    if (recording && seconds >= MAX_VOICE_SECONDS) stopRecording();
  }, [recording, seconds]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const showMic = canRecord && !text.trim() && !file;

  return (
    <div className="space-y-1.5">
      {error && <div className="px-1 text-xs text-destructive">{error}</div>}

      {file && !recording && (
        <div className="flex items-center gap-2 rounded-md border bg-muted px-2 py-1 text-xs">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate" dir="ltr">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            aria-label={ar ? 'شيل الملف' : 'Remove file'}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {recording ? (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-destructive" />
          <span className="flex-1 text-sm tabular-nums">
            {mmss} · {ar ? 'بسجّل... اضغط ■ للإرسال' : 'Recording... press ■ to send'}
          </span>
          <Button type="button" variant="ghost" size="icon" className={size} onClick={cancelRecording} aria-label={ar ? 'إلغاء' : 'Cancel'}>
            <X className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" className={size} onClick={stopRecording} aria-label={ar ? 'إرسال التسجيل' : 'Send recording'}>
            <Square className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`${size} shrink-0`}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            aria-label={ar ? 'إرفاق صورة أو PDF' : 'Attach an image or PDF'}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            disabled={busy}
            className={inputClass}
          />
          {showMic ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={`${size} shrink-0`}
              disabled={busy}
              onClick={startRecording}
              aria-label={ar ? 'تسجيل رسالة صوتية' : 'Record a voice message'}
            >
              <Mic className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={`${size} shrink-0`}
              disabled={busy || (!text.trim() && !file)}
              aria-label={ar ? 'إرسال' : 'Send'}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
