'use client';

import Square from '@/app/components/Background/Square';
import cn from '@/lib/cn';
import { motion } from 'framer-motion';
import { Bricolage_Grotesque } from 'next/font/google';
import SearchInput from '@/app/components/SearchInput';
import Select from '@/app/components/Select';
import config from '@/config';
import Sounds from '@/app/(sounds)/sounds/components/Sounds';
import useSearchStore from '@/stores/sounds/search';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import { t } from '@/stores/language';

const BricolageGrotesque = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', adjustFontFallback: false });

export default function Content() {
  const { search, setPage, category, setCategory, sort, setSort, loading, fetchSounds } = useSearchStore(useShallow(state => ({
    search: state.search,
    setPage: state.setPage,
    category: state.category,
    setCategory: state.setCategory,
    sort: state.sort,
    setSort: state.setSort,
    loading: state.loading,
    fetchSounds: state.fetchSounds
  })));

  const sequenceTransition = {
    duration: 0.25,
    type: 'spring',
    stiffness: 260,
    damping: 20
  };

  
  useEffect(() => {
    fetchSounds('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <div className="z-0 relative flex flex-col pt-[14rem] items-center px-4 sm:px-0">
      <Square
        column='10'
        row='10'
        transparentEffectDirection='bottomToTop'
        blockColor='rgba(var(--bg-secondary))'
      />

      <div className='absolute top-[-15%] max-w-[800px] w-full h-[300px] rounded-[5rem] bg-[#ffffff10] blur-[15rem]' />

      <div className='max-w-[700px] flex flex-col w-full'>
        <motion.h1 
          className={cn(
            'text-5xl font-medium max-w-[700px] text-center text-primary',
            BricolageGrotesque.className
          )}
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...sequenceTransition, delay: 0.1 }}
        >
          {t('soundsPage.title')}
        </motion.h1>

        <motion.span className="sm:text-lg max-w-[700px] text-center mt-8 text-tertiary" initial={{ opacity: 0, y: -25 }} animate={{ opacity: 1, y: 0 }} transition={{ ...sequenceTransition, delay: 0.2 }}>
          {t('soundsPage.subtitle')}
        </motion.span>

        <div className='flex flex-col items-center justify-center w-full gap-2 mt-8 sm:flex-row'>
          <SearchInput
            placeholder={t('soundsPage.searchInputPlaceholder')}
            loading={false}
            search={search}
            fetchData={fetchSounds}
            setPage={setPage}
            animationDelay={0.3}
          />

          <motion.div
            className='flex flex-col items-center w-full gap-2 mobile:flex-row sm:w-max'
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...sequenceTransition, delay: 0.3 }}
          >
            <Select
              placeholder={t('soundsPage.categorySelectPlaceholder')}
              options={
                ['All', ...config.soundCategories]
                  .map(category => ({
                    label: <div className='flex items-center gap-x-2'>
                      <span className='text-tertiary'>
                        {config.soundCategoriesIcons[category]}
                      </span>

                      {t(`categories.${category}`)}
                    </div>,
                    value: category
                  }))
              }
              value={category}
              onChange={setCategory}
              disabled={loading}
            />

            <Select
              placeholder={t('soundsPage.sortSelect.placeholder')}
              options={[
                ...[
                  {
                    label: t('soundsPage.sortSelect.items.downloads'),
                    value: 'Downloads'
                  },
                  {
                    label: t('soundsPage.sortSelect.items.likes'),
                    value: 'Likes'
                  },
                  {
                    label: t('soundsPage.sortSelect.items.newest'),
                    value: 'Newest'
                  },
                  {
                    label: t('soundsPage.sortSelect.items.oldest'),
                    value: 'Oldest'
                  }
                ].map(option => ({
                  label: <div className='flex items-center gap-x-2'>
                    {config.sortIcons[option.value.replace(' ', '')]}
                    {option.label}
                  </div>,
                  value: option.value
                }))
              ]}
              value={sort}
              onChange={setSort}
              disabled={loading}
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        className='max-w-[1000px] my-16 w-full flex flex-col gap-y-8 lg:px-0 px-2 sm:px-4'
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...sequenceTransition, delay: 0.6 }}
      >
        <Sounds />
      </motion.div>
    </div>
  );
}