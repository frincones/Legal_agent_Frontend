/**
 * Sprint I · FontSize · extiende TextStyle con atributo fontSize.
 *
 * TipTap no provee una extensión oficial para fontSize, así que la
 * implementamos como un mark extension simple que sólo añade el atributo
 * `fontSize` al mark `textStyle` que ya viene en @tiptap/extension-text-style.
 *
 * Uso desde toolbar:
 *   editor.chain().focus().setMark('textStyle', { fontSize: '12pt' }).run()
 */

import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.style.fontSize ? element.style.fontSize : null,
            renderHTML: (attributes: { fontSize?: string | null }) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});
