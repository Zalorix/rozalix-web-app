"use client";

import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

/**
 * Notion-style block editor. Type "/" for the slash menu (headings, lists,
 * quotes, etc.). The page body is kept as Markdown so the live website keeps
 * reading the same field — we parse Markdown in on load and export it back out
 * on every edit.
 */
export function BlockEditor({
  initialMarkdown,
  onChange,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
}) {
  const editor = useCreateBlockNote();
  const ready = useRef(false);

  // Load the existing Markdown into blocks once, then start reporting edits.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown || "");
      if (cancelled) return;
      if (blocks.length) editor.replaceBlocks(editor.document, blocks);
      // Ignore the programmatic change above; only flag real edits as dirty.
      setTimeout(() => {
        ready.current = true;
      }, 60);
    })();
    return () => {
      cancelled = true;
    };
  }, [editor, initialMarkdown]);

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      onChange={() => {
        if (!ready.current) return;
        onChange(editor.blocksToMarkdownLossy(editor.document));
      }}
    />
  );
}
