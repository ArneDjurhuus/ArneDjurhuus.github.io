declare module '@tiptap/react' {
  export const EditorContent: any;
  export function useEditor(config?: any): any;
}

declare module '@tiptap/starter-kit' {
  const StarterKit: any;
  export default StarterKit;
}

declare module '@tiptap/extension-collaboration' {
  const Collaboration: any;
  export default Collaboration;
}

declare module '@tiptap/extension-collaboration-cursor' {
  const CollaborationCursor: any;
  export default CollaborationCursor;
}

declare module 'y-prosemirror' {
  export const ySyncPlugin: any;
}
