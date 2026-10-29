// JSX dell'app in sviluppo (npm run dev): stesso comportamento di jsx-runtime.js
import { jsxDEV as reactJsxDEV, Fragment } from 'react/jsx-dev-runtime';
import { emojifyProps, appType } from './emojify';

export { Fragment };
export function jsxDEV(type, props, key, isStatic, source, self) {
  const t = appType(type, props);
  return reactJsxDEV(t, emojifyProps(t, props), key, isStatic, source, self);
}
