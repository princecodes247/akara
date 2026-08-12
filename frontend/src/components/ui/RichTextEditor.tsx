"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Undo, Redo, Code } from 'lucide-react';
import React, { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const toggleBtnClass = (isActive: boolean) =>
    `p-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-accent/15 text-accent'
        : 'text-foreground-muted hover:bg-surface hover:text-foreground'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-surface/30 rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={toggleBtnClass(editor.isActive('bold'))}
        title="Bold"
      >
        <Bold size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={toggleBtnClass(editor.isActive('italic'))}
        title="Italic"
      >
        <Italic size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={toggleBtnClass(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={toggleBtnClass(editor.isActive('code'))}
        title="Code"
      >
        <Code size={15} />
      </button>

      <div className="w-px h-4 bg-border mx-1"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={toggleBtnClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={toggleBtnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={toggleBtnClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 size={15} />
      </button>

      <div className="w-px h-4 bg-border mx-1"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={toggleBtnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={toggleBtnClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <ListOrdered size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={toggleBtnClass(editor.isActive('blockquote'))}
        title="Quote"
      >
        <Quote size={15} />
      </button>

      <div className="flex-1"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 text-foreground-muted/40 hover:text-foreground disabled:opacity-30 rounded-lg transition-colors"
        title="Undo"
      >
        <Undo size={15} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 text-foreground-muted/40 hover:text-foreground disabled:opacity-30 rounded-lg transition-colors"
        title="Redo"
      >
        <Redo size={15} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder = "Start typing..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[250px] p-4 outline-none font-sans focus:outline-none focus:ring-0',
      },
    },
  });

  // Re-sync initial content if it loads asynchronously
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (editor.isEmpty && content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col w-full bg-background border border-border rounded-xl overflow-hidden focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/15 transition-all">
      <MenuBar editor={editor} />
      <div className="bg-background cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
