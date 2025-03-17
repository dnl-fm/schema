import 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface HTMLAttributes<T> {
      [key: string]: any;
    }
    
    interface SVGAttributes<T> {
      [key: string]: any;
    }
  }
}

// Add DOM type definitions
interface HTMLElement {}
interface HTMLDivElement extends HTMLElement {}
interface HTMLTextAreaElement extends HTMLElement {
  value: string;
}
interface FocusEvent {
  target: HTMLElement;
}
interface KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  preventDefault(): void;
}

// Declare global document
declare global {
  const document: {
    querySelector(selector: string): HTMLElement | null;
  };
} 