import { JSX } from 'solid-js';
import { Accessor } from 'solid-js';

declare module 'solid-js' {
  export function Show<T>(props: {
    when: T | undefined | null | false;
    fallback?: JSX.Element;
    children: JSX.Element | ((item: NonNullable<T>) => JSX.Element);
    keyed?: boolean;
  }): JSX.Element;

  export function For<T, U extends JSX.Element>(props: {
    each: readonly T[] | undefined | null | false;
    fallback?: JSX.Element;
    children: (item: T, index: Accessor<number>) => U;
  }): JSX.Element;
} 