import { Button } from '@openfun/cunningham-react';
import Image from 'next/image';
import { ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import api from 'zotero-api-client';
import img403 from '@/assets/icons/icon-403.png';
import { Box, Icon, Text } from '@/components';
import { PageLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';


const StyledButton = styled(Button)`
  width: fit-content;
`;

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const fetchFromZotero = useCallback(async () => {
    const apiKey = '';
    const myapi = api(apiKey).library('user', 475425); //
    const itemsResponse = await myapi.items().get();

    console.log(itemsResponse);
  }, []);

  return (
    <Box
      $align="center"
      $margin="auto"
      $gap="1rem"
      $padding={{ bottom: '2rem' }}
    >
      <Image
        className="c__image-system-filter"
        src={img403}
        alt={t('Image 403')}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />

      <Box $align="center" $gap="0.8rem">
        <Text as="p" $textAlign="center" $maxWidth="350px" $theme="primary">
          {t(
            'It seems that the page you are looking for does not exist or cannot be displayed correctly.',
          )}
        </Text>

        <StyledButton
          onClick={() => fetchFromZotero()}

          icon={<Icon iconName="house" $color="white" />}>
          {t('Home')}
        </StyledButton>
      </Box>
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PageLayout withFooter={false}>{page}</PageLayout>;
};

export default Page;
