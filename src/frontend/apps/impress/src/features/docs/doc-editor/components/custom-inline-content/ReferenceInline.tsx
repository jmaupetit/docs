/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { InlineContentConfig } from '@blocknote/core';
import {
  createReactInlineContentSpec,
  useBlockNoteEditor,
  useComponentsContext,
} from '@blocknote/react';
// @ts-ignore
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
    any
  >,
) => {
  const Components = useComponentsContext()!;

  const editor = useBlockNoteEditor()!;
  const referenceDetailsFloating = useFloatingHover();
  const referenceEditFloating = useFloatingClick();

  const citation = props.inlineContent.props;

  const [newDOI, setNewDOI] = useState(citation.doi);

  const [bibliography, setBibliography] = useState<any>(null);

  useEffect(() => {
    Cite.async(props.inlineContent.props.doi).then(setBibliography);
  }, [props.inlineContent.props]);

  const applyNewDOI = useCallback(() => {
    props.updateInlineContent({
      type: 'reference',
      props: {
        ...citation,
        doi: newDOI,
      },
    });

    let bibliographyBlock: any = undefined;

    editor.forEachBlock((block) => {
      if (block.type === 'bibliography') {
        bibliographyBlock = block;
      }

      if (bibliographyBlock) {
        return false;
      }

      return true;
    });

    if (!bibliographyBlock) {
      editor.insertBlocks(
        [
          {
            type: 'bibliography' as any,
            props: {
              bibTexJSON: JSON.stringify([newDOI]),
            } as any,
          },
        ],
        editor.document[editor.document.length - 1],
        'after',
      );
    }
  }, [citation, editor, newDOI, props]);

  if (!bibliography) {
    return <span>Loading...</span>;
  }

  if (!citation.doi) {
    return (
      <span>
        <button {...referenceEditFloating.referenceElementProps}>
          Add Reference
        </button>
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
      <span {...referenceDetailsFloating.referenceElementProps}>
        {bibliography.format('citation')}
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
              __html: bibliography.format('bibliography'),
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
