/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BlockNoteEditor,
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from '@blocknote/core';
import { DefaultReactSuggestionItem } from '@blocknote/react';

export const getBibliographyReactSlashMenuItems = <
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(
  editor: BlockNoteEditor<B, I, S>,
) => {
  const items: DefaultReactSuggestionItem[] = [];

  if (
    // checkInlineContentTypeInSchema(
    //   'reference',
    //   referenceInlineContentConfig,
    //   editor,
    // )
    true
  ) {
    items.push({
      title: 'Reference',
      subtext: 'Reference to a bibliography block source',
      // icon: <RiLink size={18} />,
      aliases: ['ciataion', 'cite', 'bib'],
      onItemClick: () => {
        editor.insertInlineContent([
          {
            type: 'reference',
          } as any,
        ]);
      },
    });
  }

  // const bibliographyBlockInSchema = checkBlockTypeInSchema(
  //   'bibliography',
  //   bibliographyBlockConfig,
  //   editor,
  // );
  let bibliographyBlockAlreadyExists = false;
  editor.forEachBlock((block) => {
    if (block.type === 'bibliography') {
      bibliographyBlockAlreadyExists = true;
      return false;
    }
    return true;
  });

  if (!bibliographyBlockAlreadyExists) {
    items.push({
      title: 'Bibliography',
      subtext: 'Insert a bibliography block',
      // icon: <RiFileListFill size={18} />,
      onItemClick: () => {
        editor.insertBlocks(
          [
            {
              type: 'bibliography',
            },
          ],
          editor.document[editor.document.length - 1],
          'after',
        );
      },
    });
  }

  return items;
};
