// JSX dell'app in sviluppo (npm run dev): stesso comportamento di jsx-runtime.js
import { jsxDEV as reactJsxDEV, Fragment } from 'react/jsx-dev-runtime';
import { emojifyProps } from './emojify';

export { Fragment };
export function jsxDEV(type, props, key, isStatic, source, self) {
  return reactJsxDEV(type, emojifyProps(type, props), key, isStatic, source, self);
}
