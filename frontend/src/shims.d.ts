declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module '*.css';

declare module '*.ftl?raw' {
  const source: string;
  export default source;
}

declare module '*.svg?raw' {
  const source: string;
  export default source;
}
