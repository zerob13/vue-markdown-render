import type {
  AdmonitionNode,
  BlockquoteNode,
  CheckboxNode,
  CodeBlockNode,
  DefinitionListNode,
  EmojiNode,
  FootnoteNode,
  FootnoteReferenceNode,
  HardBreakNode,
  HeadingNode,
  HighlightNode,
  ImageNode,
  InlineCodeNode,
  InsertNode,
  LinkNode,
  ListItemNode,
  ListNode,
  MarkdownRender,
  MathBlockNode,
  MathInlineNode,
  MermaidBlockNode,
  ParagraphNode,
  StrikethroughNode,
  StrongNode,
  SubscriptNode,
  SuperscriptNode,
  TableNode,
  TextNode,
  ThematicBreakNode,
} from 'vue-renderer-markdown'

declare module 'vue' {
  export interface GlobalComponents {
    MarkdownRender: typeof MarkdownRender
    AdmonitionNode: typeof AdmonitionNode
    BlockquoteNode: typeof BlockquoteNode
    CheckboxNode: typeof CheckboxNode
    CodeBlockNode: typeof CodeBlockNode
    DefinitionListNode: typeof DefinitionListNode
    EmojiNode: typeof EmojiNode
    FootnoteNode: typeof FootnoteNode
    FootnoteReferenceNode: typeof FootnoteReferenceNode
    HardBreakNode: typeof HardBreakNode
    HeadingNode: typeof HeadingNode
    HighlightNode: typeof HighlightNode
    ImageNode: typeof ImageNode
    InlineCodeNode: typeof InlineCodeNode
    InsertNode: typeof InsertNode
    LinkNode: typeof LinkNode
    ListItemNode: typeof ListItemNode
    ListNode: typeof ListNode
    MathBlockNode: typeof MathBlockNode
    MathInlineNode: typeof MathInlineNode
    MermaidBlockNode: typeof MermaidBlockNode
    ParagraphNode: typeof ParagraphNode
    StrikethroughNode: typeof StrikethroughNode
    StrongNode: typeof StrongNode
    SubscriptNode: typeof SubscriptNode
    SuperscriptNode: typeof SuperscriptNode
    TableNode: typeof TableNode
    ThematicBreakNode: typeof ThematicBreakNode
    TextNode: typeof TextNode
  }
}
