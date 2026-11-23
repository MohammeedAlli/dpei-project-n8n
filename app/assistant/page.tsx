'use client';

import { ChatPanel } from '@/components/chat/chat-panel';

/** Full-height chat. 4rem ≈ sticky header; dvh keeps the composer above mobile browser chrome. */
export default function AssistantPage() {
  return (
    <div className="bg-pcb">
      <div className="container px-0 sm:px-4 sm:py-6">
        <ChatPanel className="mx-auto h-[calc(100dvh-4rem)] max-w-4xl overflow-hidden bg-background/60 sm:h-[calc(100dvh-7rem)] sm:rounded-xl sm:border sm:border-border sm:shadow-3" />
      </div>
    </div>
  );
}
