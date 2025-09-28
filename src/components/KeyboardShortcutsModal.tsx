"use client";

import { useEffect } from "react";

interface ShortcutItem {
  keys: string;
  description: string;
}

interface KeyboardShortcutsModalProps {
  shortcuts: ShortcutItem[];
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function KeyboardShortcutsModal({ shortcuts, open, onClose, title = "keyboard shortcuts" }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-black dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between border-b border-black dark:border-gray-700 px-5 py-3">
          <h2 className="text-base font-medium uppercase tracking-wide dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-sm uppercase tracking-wide hover:underline dark:text-gray-200"
          >
            close
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.keys} className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">{shortcut.description}</span>
              <span className="font-mono text-xs uppercase tracking-widest text-gray-800 dark:text-gray-200">
                {shortcut.keys}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
