// JSX dell'app (#54): come quello di React, ma i testi con emoji diventano disegni Fluent (vedi emojify.js)
import { jsx as reactJsx, jsxs as reactJsxs, Fragment } from 'react/jsx-runtime';
import { emojifyProps } from './emojify';

export { Fragment };
export function jsx(type, props, key) { return reactJsx(type, emojifyProps(type, props), key); }
export function jsxs(type, props, key) { return reactJsxs(type, emojifyProps(type, props), key); }
