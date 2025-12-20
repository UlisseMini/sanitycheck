// ABOUTME: Type declarations for experimental browser APIs.
// ABOUTME: Extends lib.dom.d.ts types for CSS Custom Highlight API and caretRangeFromPoint.

// Extend the Highlight interface from lib.dom.d.ts to include Set-like methods
// The built-in types are incomplete
interface Highlight {
  add(range: AbstractRange): this
  delete(range: AbstractRange): boolean
  has(range: AbstractRange): boolean
  clear(): void
  readonly size: number
  forEach(callback: (value: AbstractRange, key: AbstractRange, set: Highlight) => void, thisArg?: unknown): void
  entries(): IterableIterator<[AbstractRange, AbstractRange]>
  keys(): IterableIterator<AbstractRange>
  values(): IterableIterator<AbstractRange>
  [Symbol.iterator](): IterableIterator<AbstractRange>
  priority: number
  type: HighlightType
}

// Extend HighlightRegistry to include Map-like methods
interface HighlightRegistry {
  get(name: string): Highlight | undefined
  set(name: string, highlight: Highlight): this
  has(name: string): boolean
  delete(name: string): boolean
  clear(): void
  readonly size: number
  entries(): IterableIterator<[string, Highlight]>
  keys(): IterableIterator<string>
  values(): IterableIterator<Highlight>
  [Symbol.iterator](): IterableIterator<[string, Highlight]>
}

// caretRangeFromPoint is WebKit/Blink specific
interface Document {
  caretRangeFromPoint?(x: number, y: number): Range | null
}
