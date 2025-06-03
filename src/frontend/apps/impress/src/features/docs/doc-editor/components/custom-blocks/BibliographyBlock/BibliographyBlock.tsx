/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BlockConfig, InlineContentSchema, StyleSchema } from '@blocknote/core';
import {
  ReactCustomBlockRenderProps,
  createReactBlockSpec,
} from '@blocknote/react';
// @ts-expect-error `citation-js` does not have types
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-csl';
import '@citation-js/plugin-doi';
import { useEffect, useState } from 'react';

export const bibliographyBlockConfig = {
  type: 'bibliography',
  propSchema: {
    bibTexJSON: {
      default: '[]',
    },
  },
  content: 'none',
  isSelectable: false,
} as const satisfies BlockConfig;

export const Bibliography = (
  props: ReactCustomBlockRenderProps<
    typeof bibliographyBlockConfig,
    InlineContentSchema,
    StyleSchema
  >,
) => {
  const [sources, setSources] = useState<
    {
      doi: string;
      format: (format: string) => string;
    }[]
  >([]);

  useEffect(() => {
    async function fetchBibliography() {
      const dois: string[] = JSON.parse(props.block.props.bibTexJSON);
      const sources: {
        doi: string;
        format: (format: string) => string;
      }[] = await Promise.all(dois.map((doi) => Cite.async(doi)));

      setSources(sources);
    }

    void fetchBibliography();
  }, [props.block.props.bibTexJSON]);

  return (
    <div>
      <h2>Bibliography</h2>
      <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
        {sources.map((source, index) => (
          <li key={index} style={{ marginBottom: '5px' }}>
            {source.format('bibliography')}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const BibliographyBlock = createReactBlockSpec(bibliographyBlockConfig, {
  render: Bibliography,
});
