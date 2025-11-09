"use client"

import { useEffect } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListItemNode, ListNode } from "@lexical/list"
import { LinkNode } from "@lexical/link"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot, $insertNodes, EditorState } from "lexical"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import ToolbarPlugin from "./LexicalToolbar"

const theme = {
  paragraph: "mb-2",
  quote: "border-l-4 border-gray-300 pl-4 italic my-4",
  heading: {
    h1: "text-3xl font-bold mb-4",
    h2: "text-2xl font-bold mb-3",
    h3: "text-xl font-bold mb-2",
  },
  list: {
    nested: {
      listitem: "ml-4",
    },
    ol: "list-decimal ml-6 my-2",
    ul: "list-disc ml-6 my-2",
    listitem: "mb-1",
  },
  link: "text-blue-600 underline cursor-pointer hover:text-blue-800",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-gray-100 px-1 py-0.5 rounded font-mono text-sm",
  },
}

function onError(error: Error) {
  console.error(error)
}

interface InitialValuePluginProps {
  value: string
}

function InitialValuePlugin({ value }: InitialValuePluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!value) return

    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(value, "text/html")
      const nodes = $generateNodesFromDOM(editor, dom)
      const root = $getRoot()
      root.clear()
      root.select()
      $insertNodes(nodes)
    })
  }, [editor, value])

  return null
}

interface OnChangePluginWrapperProps {
  onChange: (html: string) => void
}

function OnChangePluginWrapper({ onChange }: OnChangePluginWrapperProps) {
  const [editor] = useLexicalComposerContext()

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const html = $generateHtmlFromNodes(editor)
      onChange(html)
    })
  }

  return <OnChangePlugin onChange={handleChange} />
}

interface LexicalEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function LexicalEditor({
  value,
  onChange,
  placeholder = "Start typing...",
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "LexicalEditor",
    theme,
    onError,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative border border-input rounded-md bg-background">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] px-4 py-3 outline-none prose max-w-none" />
            }
            placeholder={
              <div className="absolute top-3 left-4 text-muted-foreground pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <AutoFocusPlugin />
        <InitialValuePlugin value={value} />
        <OnChangePluginWrapper onChange={onChange} />
      </div>
    </LexicalComposer>
  )
}

