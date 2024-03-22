'use client';

import CopyButton from '@/app/components/CopyButton';
import MotionLink from '@/app/components/Motion/Link';
import { AnimatePresence, motion } from 'framer-motion';
import { BiPencil, BiSolidEnvelope } from 'react-icons/bi';
import { PiShareFat, PiShareFatFill } from 'react-icons/pi';
import { MdFlag } from 'react-icons/md';
import config from '@/config';
import { TbLoader, TbSquareRoundedChevronUpFilled, TbSquareRoundedChevronUp } from 'react-icons/tb';
import useAuthStore from '@/stores/auth';
import cn from '@/lib/cn';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import voteServer from '@/lib/request/servers/voteServer';
import Countdown from '@/app/components/Countdown';
import Tooltip from '@/app/components/Tooltip';

export default function Actions({ server }) {
  const [serverVotes, setServerVotes] = useState(server.votes);
  const [voteTimeout, setVoteTimeout] = useState(server.vote_timeout);
  const loggedIn = useAuthStore(state => state.loggedIn);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  });

  const captchaRef = useRef(null);
  const captchaIntervalRef = useRef(null);

  useEffect(() => {
    if (showCaptcha) {
      if (!window.turnstile) return setShowCaptcha(false);
      
      setLoading(true);
      const turnstile = window.turnstile;
      turnstile?.render('.cf-turnstile');

      captchaIntervalRef.current = setInterval(() => {
        const response = turnstile?.getResponse();
        if (response) {
          setShowCaptcha(false);
          clearInterval(captchaIntervalRef.current);

          toast.promise(voteServer(server.id, response), {
            loading: `Voting ${server.name}..`,
            success: () => {
              setLoading(false);
              setServerVotes(serverVotes + (server.badges.includes('Premium') ? 2 : 1));
              setVoteTimeout({ createdAt: new Date().getTime() + 86400000 });

              return `Successfully voted for ${server.name}!`;
            },
            error: error => {
              setLoading(false);
              return error;
            }
          });
        }
      }, 100);
    } else clearInterval(captchaIntervalRef.current);

    return () => clearInterval(captchaIntervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCaptcha]);

  return (
    <div>
      <motion.h2 
        className='text-xl font-semibold' 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10 }}
      >
        Actions
      </motion.h2>

      <motion.div 
        className='grid grid-cols-1 gap-2 mt-4 mobile:grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10, delay: .15 }}
      >
        {loggedIn && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async={true}
            defer={true}
          />
        )}
        
        <AnimatePresence>
          {showCaptcha && (
            <motion.div className="cf-turnstile [&>iframe]:max-w-[100%]" data-sitekey={process.env.NEXT_PUBLIC_CF_SITE_KEY} ref={captchaRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          )}
        </AnimatePresence>

        <motion.button 
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-white bg-black rounded-lg group gap-x-2 hover:bg-black/70 dark:bg-white dark:text-black dark:hover:bg-white/70',
            (loading || voteTimeout) && 'cursor-default !opacity-70 hover:bg-black dark:hover:bg-white'
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10 }}
          onClick={() => {
            if (!loggedIn) return toast.error('You need to be logged in to vote for a server.');
            if (voteTimeout) return;
            
            setShowCaptcha(true);
          }}
        >
          <div className='flex gap-x-1.5 items-center'>
            {loading && <TbLoader className='animate-spin' />}
            {voteTimeout ? (
              <Countdown date={new Date(voteTimeout.createdAt).getTime() + 86400000} />
            ) : 'Vote'}
          </div>

          <div className='flex items-center font-bold gap-x-1'>
            <div className='relative'>
              <TbSquareRoundedChevronUpFilled className='absolute transition-transform opacity-0 group-hover:opacity-100 group-hover:scale-[1.2]' />
              <TbSquareRoundedChevronUp className='opacity-100 transition-[transform] group-hover:opacity-0' />
            </div>
            {formatter.format(serverVotes)}
          </div>
        </motion.button>
        
        {server.invite_code.type === 'Deleted' ? (
          <Tooltip content='No invite link available for this server.'>
            <motion.div
              className='flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg cursor-default !opacity-70 bg-secondary gap-x-2 text-secondary'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10 }}
            >
              <s>Join Server</s>
              <BiSolidEnvelope />
            </motion.div>
          </Tooltip>
        ) : (
          <MotionLink 
            className='flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg group disabled:pointer-events-none disabled:opacity-70 hover:text-primary hover:bg-tertiary bg-secondary gap-x-2 text-secondary'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10 }}
            href={server.vanity_url ? server.vanity_url : `https://discord.com/invite/${server.invite_code.code}`}
          >
            Join Server
            <BiSolidEnvelope />
          </MotionLink>
        )}
        
        <motion.button className='cursor-auto' initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10 }}>
          <CopyButton
            className='flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer group disabled:pointer-events-none disabled:opacity-70 hover:text-primary hover:bg-tertiary bg-secondary gap-x-2 text-secondary'
            successText='Server URL copied to clipboard!'
            copyText={server.vanity_url ? server.vanity_url : `https://discord.com/invite/${server.invite_code.code}`}
            defaultIcon={PiShareFat}
            hoverIcon={PiShareFatFill}
          >
            Share Server
          </CopyButton>
        </motion.button>

        <MotionLink
          className='flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg group disabled:pointer-events-none disabled:opacity-70 hover:text-primary hover:bg-tertiary bg-secondary gap-x-2 text-secondary'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10 }}
          href={config.supportInviteUrl}
        >
          Report Server
          <MdFlag />
        </MotionLink>

        {server.permissions.canEdit && (
          <MotionLink
            className='flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg group disabled:pointer-events-none disabled:opacity-70 hover:text-primary hover:bg-tertiary bg-secondary gap-x-2 text-secondary'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 10 }}
            href={`/servers/${server.id}/manage`}
          >
            Manage Server
            <BiPencil />
          </MotionLink>
        )}
      </motion.div>
    </div>
  );
}