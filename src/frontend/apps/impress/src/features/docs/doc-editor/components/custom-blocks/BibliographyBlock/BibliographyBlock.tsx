/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BlockConfig } from '@blocknote/core';
import {
  ReactCustomBlockRenderProps,
  createReactBlockSpec,
} from '@blocknote/react';
// @ts-ignore
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
  props: ReactCustomBlockRenderProps<typeof bibliographyBlockConfig, any, any>,
) => {
  const [bibliography, setBibliography] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBibliography() {
      const dois: string[] = JSON.parse(props.block.props.bibTexJSON);
      const cites = await Promise.all(dois.map((doi) => Cite.async(doi)));

      setBibliography(cites);
    }

    fetchBibliography();
  }, [props.block.props.bibTexJSON]);

  return (
    <div>
      <h2>Bibliography</h2>
      <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
        {bibliography.map((cite: any) => (
          <li key={cite.id} style={{ marginBottom: '5px' }}>
            {cite.format('bibliography')}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const BibliographyBlock = createReactBlockSpec(bibliographyBlockConfig, {
  render: Bibliography,
});
