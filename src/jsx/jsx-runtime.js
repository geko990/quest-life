// JSX dell'app (#54): come quello di React, ma i testi con emoji diventano disegni Fluent (vedi emojify.js)
import { jsx as reactJsx, jsxs as reactJsxs, Fragment } from 'react/jsx-runtime';
import { emojifyProps, appType } from './emojify';

export { Fragment };
// I <select> diventano il menu dell'app (#57, appType)
export function jsx(type, props, key) { const t = appType(type, props); return reactJsx(t, emojifyProps(t, props), key); }
export function jsxs(type, props, key) { const t = appType(type, props); return reactJsxs(t, emojifyProps(t, props), key); }
