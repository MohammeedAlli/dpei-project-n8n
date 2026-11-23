import * as React from 'react';

// بيعرض رد الشات سطر بسطر، وكل سطر بيحدّد اتجاهه لوحده (عربي يمين / إنجليزي شمال).
// ده بيمنع تلخبط الترتيب لما العربي والإنجليزي والأرقام يتخلطوا في نفس السطر.
export function ChatText({ text }: { text: string }) {
  const lines = String(text ?? '').split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-1.5" />
        ) : (
          <p
            key={i}
            dir="auto"
            className="leading-relaxed"
            style={{ textAlign: 'start', unicodeBidi: 'plaintext' }}
          >
            {line}
          </p>
        )
      )}
    </div>
  );
}
