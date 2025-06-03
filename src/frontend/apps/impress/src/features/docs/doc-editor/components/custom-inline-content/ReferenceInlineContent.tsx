/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Block,
  BlockNoteEditor,
  BlockSchemaWithBlock,
  InlineContentConfig,
  InlineContentSchemaWithInlineContent,
  StyleSchema,
  checkBlockTypeInSchema,
} from '@blocknote/core';
import {
  ReactCustomInlineContentRenderProps,
  createReactInlineContentSpec,
  useComponentsContext,
} from '@blocknote/react';
// @ts-expect-error `citation-js` does not have types
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-csl';
import '@citation-js/plugin-doi';
import {
  useClick,
  // useDismiss,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react';
import { useCallback, useEffect, useState } from 'react';

import { Icon } from '@/components';

import { bibliographyBlockConfig } from '../custom-blocks';

export const referenceInlineContentConfig = {
  type: 'reference',
  propSchema: {
    doi: {
      default: '',
    },
  },
  content: 'none',
} satisfies InlineContentConfig;

const useFloatingHover = () => {
  const [isHovered, setIsHovered] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isHovered,
    onOpenChange: setIsHovered,
  });

  const hover = useHover(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return {
    isHovered,
    referenceElementProps: {
      ref: refs.setReference,
      ...getReferenceProps(),
    },
    floatingElementProps: {
      ref: refs.setFloating,
      style: floatingStyles,
      ...getFloatingProps(),
    },
  };
};

const useFloatingClick = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const open = useClick(context);
  // const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    open,
    // dismiss,
  ]);

  return {
    isOpen,
    referenceElementProps: {
      ref: refs.setReference,
      ...getReferenceProps(),
    },
    floatingElementProps: {
      ref: refs.setFloating,
      style: floatingStyles,
      ...getFloatingProps(),
    },
  };
};

export const Reference = (
  props: ReactCustomInlineContentRenderProps<
    typeof referenceInlineContentConfig,
    StyleSchema
  >,
) => {
  const Components = useComponentsContext();
  if (!Components) {
    throw new Error(
      'Components context is not available. Make sure this component is used within a BlockNote editor.',
    );
  }

  const referenceDetailsFloating = useFloatingHover();
  const referenceEditFloating = useFloatingClick();

  const [source, setSource] = useState<
    | {
        doi: string;
        format: (format: string) => string;
      }
    | undefined
  >(undefined);
  const [newDOI, setNewDOI] = useState(props.inlineContent.props.doi);

  useEffect(() => {
    const fetchSource = async () => {
      const source = await Cite.async(props.inlineContent.props.doi);
      setSource(source);
    };

    if (props.inlineContent.props.doi) {
      void fetchSource();
    } else {
      setSource(undefined);
    }
  }, [props.inlineContent.props]);

  const applyNewDOI = useCallback(() => {
    props.updateInlineContent({
      type: 'reference',
      props: {
        doi: newDOI,
      },
    });

    if (
      !checkBlockTypeInSchema(
        'bibliography',
        bibliographyBlockConfig,
        props.editor,
      )
    ) {
      return;
    }

    type BlockSchemaWithBibliography = BlockSchemaWithBlock<
      'bibliography',
      typeof bibliographyBlockConfig
    >;
    type InlineContentSchemaWithReference =
      InlineContentSchemaWithInlineContent<
        'reference',
        typeof referenceInlineContentConfig
      >;

    let bibliographyBlock:
      | Block<
          BlockSchemaWithBibliography,
          InlineContentSchemaWithReference,
          StyleSchema
        >
      | undefined = undefined;

    (
      props.editor as BlockNoteEditor<
        BlockSchemaWithBibliography,
        InlineContentSchemaWithReference,
        StyleSchema
      >
    ).forEachBlock((block) => {
      if (block.type === 'bibliography') {
        bibliographyBlock = block;
      }

      if (bibliographyBlock) {
        return false;
      }

      return true;
    });

    if (!bibliographyBlock) {
      (
        props.editor as BlockNoteEditor<
          BlockSchemaWithBibliography,
          InlineContentSchemaWithReference,
          StyleSchema
        >
      ).insertBlocks(
        [
          {
            type: 'bibliography',
            props: {
              bibTexJSON: JSON.stringify([newDOI]),
            },
          },
        ],
        props.editor.document[props.editor.document.length - 1],
        'after',
      );
    } else {
      const bibTexJSON = JSON.parse(
        (
          bibliographyBlock as Block<
            BlockSchemaWithBibliography,
            InlineContentSchemaWithReference,
            StyleSchema
          >
        ).props.bibTexJSON,
      );
      if (!bibTexJSON.includes(newDOI)) {
        bibTexJSON.push(newDOI);
        (
          props.editor as BlockNoteEditor<
            BlockSchemaWithBibliography,
            InlineContentSchemaWithReference,
            StyleSchema
          >
        ).updateBlock(bibliographyBlock, {
          type: 'bibliography',
          props: { bibTexJSON: JSON.stringify(bibTexJSON) },
        });
      }
    }
  }, [newDOI, props]);

  if (!source) {
    return (
      <span>
        <div className="bn-file-block-content-wrapper">
          <div
            className="bn-add-file-button"
            {...referenceEditFloating.referenceElementProps}
            style={{
              backgroundColor: 'var(--c--theme--colors--greyscale-100)',
              color: '#7d797a',
              fontSize: '0.9rem',
              padding: '0.8rem',
              borderRadius: 'var(--c--theme--spacings--3xs)',
              display: 'flex',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <Icon iconName="link" $color="#7d797a" />
            <p className="bn-add-file-button-text">Add Reference</p>
          </div>
        </div>
        {referenceEditFloating.isOpen && (
          <Components.FilePanel.Root
            className="bn-panel reference-panel"
            defaultOpenTab="DOI"
            openTab="DOI"
            setOpenTab={() => {
              // Do nothing until we have more tabs
            }}
            tabs={[
              {
                name: 'DOI',
                tabPanel: (
                  <Components.FilePanel.TabPanel className="bn-tab-panel">
                    <Components.FilePanel.TextInput
                      className="bn-text-input"
                      placeholder="Enter DOI"
                      value={newDOI}
                      onChange={(e) => setNewDOI(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applyNewDOI();
                        }
                      }}
                      data-test="embed-input"
                    />
                    <Components.FilePanel.Button
                      className="bn-button"
                      onClick={() => applyNewDOI()}
                      data-test="embed-input-button"
                    >
                      Update Reference
                    </Components.FilePanel.Button>
                  </Components.FilePanel.TabPanel>
                ),
              },
            ]}
            loading={false}
          />
        )}
      </span>
    );
  }

  return (
    <span>
      <span
        {...referenceDetailsFloating.referenceElementProps}
        style={{ cursor: 'pointer', color: 'var(--mantine-color-anchor)' }}
      >
        {source.format('citation')}
      </span>
      {referenceDetailsFloating.isHovered && (
        <div
          {...referenceDetailsFloating.floatingElementProps}
          style={{
            position: 'absolute',
          }}
        >
          {/* FIXME do not use `dangerouslySetInnerHTML` to embed citation */}
          <div
            style={{
              backgroundColor: 'var(--c--theme--colors--greyscale-100)',
              padding: '0.5rem',
              fontSize: '0.75rem',
              borderRadius: '0.25rem',
            }}
            dangerouslySetInnerHTML={{
              __html: source.format('bibliography'),
            }}
          />
        </div>
      )}
    </span>
  );
};

export const ReferenceInlineContent = createReactInlineContentSpec(
  referenceInlineContentConfig,
  { render: Reference },
);
