'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'

interface TiptapEditorProps {
  value: string
  onChange: (html: string) => void
}

// Barre d'outils de l'éditeur - boutons de mise en forme + toggle HTML
function BarreOutils({ editor, modeHtml, onToggleHtml }: {
  editor: ReturnType<typeof useEditor>
  modeHtml: boolean
  onToggleHtml: () => void
}) {
  if (!editor) return null

  const btnClass = (actif: boolean) =>
    `px-2 py-1 text-sm rounded border transition-colors ${
      actif
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-lg">
      {!modeHtml && (
        <>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>G</button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>I</button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))}>S</button>
          <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>H2</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))}>H3</button>
          <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>- Liste</button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>1. Liste</button>
          <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))}>Quote</button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)}>---</button>
          <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`${btnClass(false)} disabled:opacity-40 disabled:cursor-not-allowed`}>Annuler</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`${btnClass(false)} disabled:opacity-40 disabled:cursor-not-allowed`}>Refaire</button>
          <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
        </>
      )}
      {/* Bouton bascule mode HTML brut */}
      <button
        type="button"
        onClick={onToggleHtml}
        className={`px-2 py-1 text-sm rounded border font-mono transition-colors ${
          modeHtml
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
        title={modeHtml ? 'Revenir à l\'éditeur visuel' : 'Éditer le HTML brut'}
      >
        &lt;/&gt; HTML
      </button>
    </div>
  )
}

// Éditeur de texte riche Tiptap - utilisé pour le contenu des articles de blog
export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const [modeHtml, setModeHtml] = useState(false)
  const [htmlBrut, setHtmlBrut] = useState(value)

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none',
      },
    },
  })

  // Synchronise le contenu si la valeur change de l'extérieur (mode edition)
  useEffect(() => {
    if (editor && !modeHtml && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor, modeHtml])

  // Bascule vers le mode HTML : copie le contenu de l'éditeur dans la zone texte
  function activerModeHtml() {
    if (editor) setHtmlBrut(editor.getHTML())
    setModeHtml(true)
  }

  // Bascule vers le mode visuel : injecte le HTML brut dans l'éditeur
  function activerModeVisuel() {
    if (editor) {
      editor.commands.setContent(htmlBrut)
      onChange(htmlBrut)
    }
    setModeHtml(false)
  }

  // Mise a jour du HTML brut dans la zone texte
  function handleHtmlChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setHtmlBrut(e.target.value)
    onChange(e.target.value)
  }

  function handleToggleHtml() {
    if (modeHtml) activerModeVisuel()
    else activerModeHtml()
  }

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
      {editor && <BarreOutils editor={editor} modeHtml={modeHtml} onToggleHtml={handleToggleHtml} />}

      {modeHtml ? (
        // Zone de texte HTML brut
        <textarea
          value={htmlBrut}
          onChange={handleHtmlChange}
          className="w-full min-h-[300px] p-4 font-mono text-sm bg-slate-900 text-green-400 focus:outline-none resize-y"
          placeholder="Collez votre HTML ici..."
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}
