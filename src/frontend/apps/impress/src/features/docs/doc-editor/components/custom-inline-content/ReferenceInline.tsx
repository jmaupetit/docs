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

export const Reference = (props: any) => {
  const editor = useBlockNoteEditor()!;
  const Components = useComponentsContext()!;

  const referenceDetailsFloating = useFloatingHover();
  const referenceEditFloating = useFloatingClick();

  const citation = props.inlineContent.props;

  const [newDOI, setNewDOI] = useState(citation.doi);

  const [source, setSource] = useState<any>(undefined);

  useEffect(() => {
    const fetchSource = async () => {
      const data = await fetch(
        `https://api.datacite.org/dois/${props.inlineContent.props.doi}`,
      );

      setSource(await data.json());
    };

    if (props.inlineContent.props.doi) {
      fetchSource();
    } else {
      setSource(undefined);
    }
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
      if ((block.type as any) === 'bibliography') {
        bibliographyBlock = block as any;
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

  if (!source) {
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

  // console.log(source);

  const firstAuthorFormattedName = `${source.data.attributes.creators[0].name
    .split(', ')
    .reverse()
    .join(' ')}${source.data.attributes.creators.length > 1 ? ' et al.' : ''}`;
  const issuedDate = source.data.attributes.dates.find(
    (date: any) => date.dateType === 'Issued',
  ).date;

  return (
    <span>
      <span {...referenceDetailsFloating.referenceElementProps}>
        {`(${firstAuthorFormattedName}, ${issuedDate})`}
      </span>
      {referenceDetailsFloating.isHovered && (
        <div
          className="floating"
          {...referenceDetailsFloating.floatingElementProps}
        >
          <div>{firstAuthorFormattedName}</div>
        </div>
      )}
    </span>
  );
};

export const ReferenceInlineContent = createReactInlineContentSpec(
  referenceInlineContentConfig,
  { render: Reference },
);
