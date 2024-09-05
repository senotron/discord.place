'use client';

import useAuthStore from '@/stores/auth';
import { useEffect } from 'react';
import { useRouter } from 'next-nprogress-bar';
import Sidebar from '@/app/(dashboard)/components/Sidebar';
import Home from '@/app/(dashboard)/components/Home';
import useDashboardStore from '@/stores/dashboard';
import { CgBlock, CgFormatSlash } from 'react-icons/cg';
import useThemeStore from '@/stores/theme';
import { motion, AnimatePresence } from 'framer-motion';
import MotionImage from '@/app/components/Motion/Image';
import cn from '@/lib/cn';
import { useMedia } from 'react-use';
import Queue from '@/app/(dashboard)/components/Queue';
import { MdEmojiEmotions, MdHttps, MdOpenInNew, MdStarRate, MdTimer, MdUpdate, MdVisibility } from 'react-icons/md';
import { FaCompass, FaCrown, FaEye, FaUserCircle } from 'react-icons/fa';
import { IoMdCheckmarkCircle, IoMdCloseCircle } from 'react-icons/io';
import { BiCloudDownload, BiSolidCategory } from 'react-icons/bi';
import downloadEmoji from '@/lib/utils/emojis/downloadEmoji';
import { showConfirmationModal, approveEmoji, denyEmoji, deleteEmoji, approveBot, denyBot, deleteBot, approveTemplate, denyTemplate, deleteTemplate, approveSound, denySound, deleteSound, approveReview, denyReview, deleteReview, deleteBlockedIP, deleteLink, deleteBotDenyRecord, deleteTimeout, deleteQuarantineRecord } from '@/app/(dashboard)/dashboard/utils';
import DenyDropdown from '@/app/(dashboard)/components/Dropdown/Deny';
import config from '@/config';
import sleep from '@/lib/sleep';
import { useShallow } from 'zustand/react/shallow';
import { HiTemplate } from 'react-icons/hi';
import { PiWaveformBold } from 'react-icons/pi';
import { FiLink } from 'react-icons/fi';
import { RiPencilFill } from 'react-icons/ri';
import { TbLockPlus } from 'react-icons/tb';
import CreateQuarantineModal from '@/app/(dashboard)//components/CreateQuarantineModal';
import useModalsStore from '@/stores/modals';

export default function Page() {
  const user = useAuthStore(state => state.user);
  const loggedIn = useAuthStore(state => state.loggedIn);
  const router = useRouter();

  useEffect(() => {
    if (loggedIn && !user.can_view_dashboard) return router.push('/error?code=401');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, user]);

  const { activeTab, loading, setLoading, data, selectedIndexes, setSelectedIndexes } = useDashboardStore(useShallow(state => ({
    activeTab: state.activeTab,
    loading: state.loading,
    setLoading: state.setLoading,
    data: state.data,
    selectedIndexes: state.selectedIndexes,
    setSelectedIndexes: state.setSelectedIndexes
  })));

  const openModal = useModalsStore(state => state.openModal);

  async function bulkAction(params) {
    const selectedIndexes = useDashboardStore.getState().selectedIndexes;
    const data = selectedIndexes.map(index => params.data[index]);

    setSelectedIndexes([]);
    setLoading(true);

    if (data.length === 1) {
      await params.action(data[0]);

      setLoading(true);

      await sleep(config.dashboardRequestDelay);

      fetchData([params.fetchKey]);
    }

    for (const item of data) {
      params.action(item);

      if (data.indexOf(item) !== data.length - 1) await sleep(config.dashboardRequestDelay);
    }

    fetchData([params.fetchKey]);
  }

  async function bulkActionWithConfirmationModal(params) {
    return showConfirmationModal(
      `You are about to delete ${selectedIndexes.length} ${params.name}${selectedIndexes.length > 1 ? 's' : ''}. This action is irreversible.`,
      async () => {
        bulkAction(params);
      }
    );
  }

  const tabs = [
    {
      id: 'home',
      name: 'Home',
      component: <Home />
    },
    {
      id: 'emojisQueue',
      name: 'Emojis Queue',
      data: {
        title: 'Emojis Queue',
        subtitle: 'Here you can see the all the emojis that published on discord.place.',
        totalCount: data?.queue?.emojis?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Waiting Approval',
              count: data?.queue?.emojis?.filter(emoji => !emoji.approved).length,
              columns: data?.queue?.emojis?.filter(emoji => !emoji.approved).map(emoji => [
                {
                  type: emoji.emoji_ids ? 'emojiPack' : 'emoji',
                  id: emoji.id,
                  name: emoji.name,
                  animated: emoji.animated,
                  emoji_ids: emoji.emoji_ids
                },
                {
                  type: 'user',
                  id: emoji.user.id,
                  username: emoji.user.username,
                  avatar: emoji.user.avatar
                },
                {
                  type: 'date',
                  value: new Date(emoji.created_at)
                }
              ]),
              rows: [
                {
                  name: 'Emoji',
                  icon: MdEmojiEmotions
                },
                {
                  name: 'Publisher',
                  icon: FaUserCircle
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const emoji = data.queue.emojis[selectedIndex];
                    
                    router.push(`/emojis/${emoji.emoji_ids ? 'packages/' : ''}${emoji.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Approve',
                  icon: IoMdCheckmarkCircle,
                  action: () => bulkAction({
                    data: data.queue.emojis,
                    action: item => approveEmoji(item.id),
                    fetchKey: 'emojis'
                  }),
                  hide: !data.permissions?.canApproveEmojis
                },
                {
                  name: 'Deny',
                  icon: IoMdCloseCircle,
                  trigger: DenyDropdown,
                  triggerProps: {
                    description: 'Please select a reason to deny.',
                    reasons: config.emojisDenyReasons,
                    onDeny: reason => bulkAction({
                      data: data.queue.emojis,
                      action: item => denyEmoji(item.id, reason),
                      fetchKey: 'emojis'
                    })
                  },
                  hide: !data.permissions?.canApproveEmojis
                }
              ]
            },
            {
              label: 'Approved',
              count: data?.queue?.emojis?.filter(emoji => emoji.approved).length,
              columns: data?.queue?.emojis?.filter(emoji => emoji.approved).map(emoji => [
                {
                  type: emoji.emoji_ids ? 'emojiPack' : 'emoji',
                  id: emoji.id,
                  name: emoji.name,
                  animated: emoji.animated,
                  emoji_ids: emoji.emoji_ids
                },
                {
                  type: 'user',
                  id: emoji.user.id,
                  username: emoji.user.username,
                  avatar: emoji.user.avatar
                },
                {
                  type: 'date',
                  value: new Date(emoji.created_at)
                }
              ]),
              rows: [
                {
                  name: 'Emoji',
                  icon: MdEmojiEmotions
                },
                {
                  name: 'Publisher',
                  icon: FaUserCircle
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const emoji = data.queue.emojis[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/emojis/${emoji.emoji_ids ? 'packages/' : ''}${emoji.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Download',
                  icon: BiCloudDownload,
                  action: selectedIndexes => {
                    const emojis = selectedIndexes.map(index => data.queue.emojis[index]);

                    setSelectedIndexes([]);
                    
                    emojis.forEach(emoji => downloadEmoji(emoji));
                  }
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'emoji',
                    data: data.queue.emojis,
                    action: item => deleteEmoji(item.id),
                    fetchKey: 'emojis'
                  }),
                  hide: !data.permissions?.canDeleteEmojis
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'botsQueue',
      name: 'Bots Queue',
      data: {
        title: 'Bots Queue',
        subtitle: 'Here you can see the all the bots that listed on discord.place.',
        totalCount: data?.queue?.bots?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Waiting Approval',
              count: data?.queue?.bots?.filter(bot => !bot.verified).length,
              columns: data?.queue?.bots?.filter(bot => !bot.verified).map(bot => [
                {
                  type: 'bot',
                  id: bot.id,
                  username: bot.username,
                  discriminator: bot.discriminator,
                  avatar: bot.avatar
                },
                {
                  type: 'user',
                  id: bot.owner.id,
                  username: bot.owner.username,
                  avatar: bot.owner.avatar
                },
                {
                  type: 'category',
                  value: bot.categories,
                  icons: config.botCategoriesIcons
                },
                {
                  type: 'date',
                  value: new Date(bot.created_at)
                }
              ]),
              rows: [
                {
                  name: 'Bot',
                  icon: FaUserCircle
                },
                {
                  name: 'Owner',
                  icon: FaCrown
                },
                {
                  name: 'Categories',
                  icon: BiSolidCategory
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const bot = data.queue.bots[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/bots/${bot.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Approve',
                  icon: IoMdCheckmarkCircle,
                  action: () => bulkAction({
                    data: data.queue.bots,
                    action: item => approveBot(item.id),
                    fetchKey: 'bots'
                  }),
                  hide: !data.permissions?.canApproveBots
                }, 
                {
                  name: 'Deny',
                  icon: IoMdCloseCircle,
                  trigger: DenyDropdown,
                  triggerProps: {
                    description: 'Please select a reason to deny.',
                    reasons: config.botsDenyReasons,
                    onDeny: reason => bulkAction({
                      data: data.queue.bots,
                      action: item => denyBot(item.id, reason),
                      fetchKey: 'bots'
                    })
                  },
                  hide: !data.permissions?.canApproveBots
                }
              ]
            },
            {
              label: 'Approved',
              count: data?.queue?.bots?.filter(bot => bot.verified).length,
              columns: data?.queue?.bots?.filter(bot => bot.verified).map(bot => [
                {
                  type: 'bot',
                  id: bot.id,
                  username: bot.username,
                  discriminator: bot.discriminator,
                  avatar: bot.avatar
                },
                {
                  type: 'user',
                  id: bot.owner.id,
                  username: bot.owner.username,
                  avatar: bot.owner.avatar
                },
                {
                  type: 'category',
                  value: bot.categories,
                  icons: config.botCategoriesIcons
                },
                {
                  type: 'date',
                  value: new Date(bot.created_at)
                }
              ]),
              rows: [
                {
                  name: 'Bot',
                  icon: FaUserCircle
                },
                {
                  name: 'Owner',
                  icon: FaCrown
                },
                {
                  name: 'Categories',
                  icon: BiSolidCategory
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const bot = data.queue.bots[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/bots/${bot.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'bot',
                    data: data.queue.bots,
                    action: item => deleteBot(item.id),
                    fetchKey: 'bots'
                  }),
                  hide: !data.permissions?.canDeleteBots
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'templatesQueue',
      name: 'Templates Queue',
      data: {
        title: 'Templates Queue',
        subtitle: 'Here you can see the all the templates that published on discord.place.',
        totalCount: data?.queue?.templates?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Waiting Approval',
              count: data?.queue?.templates?.filter(template => !template.approved).length,
              columns: data?.queue?.templates?.filter(template => !template.approved).map(template => [
                {
                  type: 'template',
                  id: template.id,
                  name: template.name
                },
                {
                  type: 'user',
                  id: template.user.id,
                  username: template.user.username,
                  avatar: template.user.avatar
                },
                {
                  type: 'category',
                  value: template.categories,
                  icons: config.templateCategoriesIcons
                },
                {
                  type: 'date',
                  value: new Date(template.created_at)
                }
              ]),
              rows: [
                {
                  name: 'Template',
                  icon: HiTemplate
                },
                {
                  name: 'Publisher',
                  icon: FaUserCircle
                },
                {
                  name: 'Categories',
                  icon: BiSolidCategory
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const template = data.queue.templates[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/templates/${template.id}/preview`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Approve',
                  icon: IoMdCheckmarkCircle,
                  action: () => bulkAction({
                    data: data.queue.templates,
                    action: item => approveTemplate(item.id),
                    fetchKey: 'templates'
                  }),
                  hide: !data.permissions?.canApproveTemplates
                },
                {
                  name: 'Deny',
                  icon: IoMdCloseCircle,
                  trigger: DenyDropdown,
                  triggerProps: {
                    description: 'Please select a reason to deny.',
                    reasons: config.templatesDenyReasons,
                    onDeny: reason => bulkAction({
                      data: data.queue.templates,
                      action: item => denyTemplate(item.id, reason),
                      fetchKey: 'templates'
                    })
                  },
                  hide: !data.permissions?.canApproveTemplates
                }
              ]
            },
            {
              label: 'Approved',
              count: data?.queue?.templates?.filter(template => template.approved).length,
              columns: data?.queue?.templates?.filter(template => template.approved).map(template => [
                {
                  type: 'template',
                  id: template.id,
                  name: template.name
                },
                {
                  type: 'user',
                  id: template.user.id,
                  username: template.user.username,
                  avatar: template.user.avatar
                },
                {
                  type: 'category',
                  value: template.categories,
                  icons: config.templateCategoriesIcons
                },
                {
                  type: 'date',
                  value: new Date(template.created_at)
                }
              ]),
              rows: [
                {
                  name: 'Template',
                  icon: HiTemplate
                },
                {
                  name: 'Publisher',
                  icon: FaUserCircle
                },
                {
                  name: 'Categories',
                  icon: BiSolidCategory
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const template = data.queue.templates[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/templates/${template.id}/preview`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'template',
                    data: data.queue.templates,
                    action: item => deleteTemplate(item.id),
                    fetchKey: 'templates'
                  }),
                  hide: !data.permissions?.canDeleteTemplates
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'soundsQueue',
      name: 'Sounds Queue',
      data: {
        title: 'Sounds Queue',
        subtitle: 'Here you can see the all the sounds that published on discord.place.',
        totalCount: data?.queue?.sounds?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Waiting Approval',
              count: data?.queue?.sounds?.filter(sound => !sound.approved).length,
              columns: data?.queue?.sounds?.filter(sound => !sound.approved).map(sound => [
                {
                  type: 'sound',
                  id: sound.id,
                  name: sound.name
                },
                {
                  type: 'user',
                  id: sound.publisher.id,
                  username: sound.publisher.username,
                  avatar: sound.publisher.avatar
                },
                {
                  type: 'category',
                  value: sound.categories,
                  icons: config.soundCategoriesIcons
                },
                {
                  type: 'date',
                  value: new Date(sound.createdAt)
                }
              ]),
              rows: [
                {
                  name: 'Sound',
                  icon: PiWaveformBold
                },
                {
                  name: 'Publisher',
                  icon: FaUserCircle
                },
                {
                  name: 'Categories',
                  icon: BiSolidCategory
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const sound = data.queue.sounds[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/sounds/${sound.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Approve',
                  icon: IoMdCheckmarkCircle,
                  action: () => bulkAction({
                    data: data.queue.sounds,
                    action: item => approveSound(item.id),
                    fetchKey: 'sounds'
                  }),
                  hide: !data.permissions?.canApproveSounds
                },
                {
                  name: 'Deny',
                  icon: IoMdCloseCircle,
                  trigger: DenyDropdown,
                  triggerProps: {
                    description: 'Please select a reason to deny.',
                    reasons: config.soundsDenyReasons,
                    onDeny: reason => bulkAction({
                      data: data.queue.sounds,
                      action: item => denySound(item.id, reason),
                      fetchKey: 'sounds'
                    })
                  },
                  hide: !data.permissions?.canApproveSounds
                }
              ]
            },
            {
              label: 'Approved',
              count: data?.queue?.sounds?.filter(sound => sound.approved).length,
              columns: data?.queue?.sounds?.filter(sound => sound.approved).map(sound => [
                {
                  type: 'sound',
                  id: sound.id,
                  name: sound.name
                },
                {
                  type: 'user',
                  id: sound.publisher.id,
                  username: sound.publisher.username,
                  avatar: sound.publisher.avatar
                },
                {
                  type: 'category',
                  value: sound.categories,
                  icons: config.soundCategoriesIcons
                },
                {
                  type: 'date',
                  value: new Date(sound.createdAt)
                }
              ]),
              rows: [
                {
                  name: 'Sound',
                  icon: PiWaveformBold
                },
                {
                  name: 'Publisher',
                  icon: FaUserCircle
                },
                {
                  name: 'Categories',
                  icon: BiSolidCategory
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const sound = data.queue.sounds[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/sounds/${sound.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'sound',
                    data: data.queue.sounds,
                    action: item => deleteSound(item.id),
                    fetchKey: 'sounds'
                  }),
                  hide: !data.permissions?.canDeleteSounds
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'reviewsQueue',
      name: 'Reviews Queue',
      data: {
        title: 'Reviews Queue',
        subtitle: 'Here you can see the all the reviews that published on discord.place.',
        totalCount: data?.queue?.reviews?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Waiting Approval',
              count: data?.queue?.reviews?.filter(review => !review.approved).length,
              columns: data?.queue?.reviews?.filter(review => !review.approved).map(review => [
                {
                  type: 'text',
                  value: review.server ? review.server.id : review.bot.id
                },
                {
                  type: 'user',
                  id: review.user.id,
                  username: review.user.username,
                  avatar: review.user.avatar
                },
                {
                  type: 'rating',
                  value: review.rating
                },
                {
                  type: 'long-text',
                  value: review.content
                },
                {
                  type: 'date',
                  value: new Date(review.createdAt)
                }
              ]),
              rows: [
                {
                  name: 'Server/Bot ID',
                  icon: FaCompass
                },
                {
                  name: 'User',
                  icon: FaUserCircle
                },
                {
                  name: 'Rating',
                  icon: MdStarRate
                },
                {
                  name: 'Content',
                  icon: FaEye
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const review = data.queue.reviews[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/${review.server ? 'servers' : 'bots'}/${review.server ? review.server.id : review.bot.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Approve',
                  icon: IoMdCheckmarkCircle,
                  action: () => bulkAction({
                    data: data.queue.reviews,
                    action: item => approveReview(item.server ? 'server' : 'bot', item.server ? item.server.id : item.bot.id, item._id),
                    fetchKey: 'reviews'
                  }),
                  hide: !data.permissions?.canApproveReviews
                },
                {
                  name: 'Deny',
                  icon: IoMdCloseCircle,
                  trigger: DenyDropdown,
                  triggerProps: {
                    description: 'Add a custom reason to deny this review.',
                    reasons: {},
                    onDeny: reason => bulkAction({
                      data: data.queue.reviews,
                      action: item => denyReview(item.server ? 'server' : 'bot', item.server ? item.server.id : item.bot.id, item._id, reason),
                      fetchKey: 'reviews'
                    }),
                    customReason: true
                  },
                  hide: !data.permissions?.canApproveReviews
                }
              ]
            },
            {
              label: 'Approved',
              count: data?.queue?.reviews?.filter(review => review.approved).length,
              columns: data?.queue?.reviews?.filter(review => review.approved).map(review => [
                {
                  type: 'text',
                  value: review.server ? review.server.id : review.bot.id
                },
                {
                  type: 'user',
                  id: review.user.id,
                  username: review.user.username,
                  avatar: review.user.avatar
                },
                {
                  type: 'rating',
                  value: review.rating
                },
                {
                  type: 'long-text',
                  value: review.content
                },
                {
                  type: 'date',
                  value: new Date(review.createdAt)
                }
              ]),
              rows: [
                {
                  name: 'Server/Bot ID',
                  icon: FaCompass
                },
                {
                  name: 'User',
                  icon: FaUserCircle
                },
                {
                  name: 'Rating',
                  icon: MdStarRate
                },
                {
                  name: 'Content',
                  icon: FaEye
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const review = data.queue.reviews[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/${review.server ? 'servers' : 'bots'}/${review.server ? review.server.id : review.bot.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'review',
                    data: data.queue.reviews,
                    action: item => deleteReview(item.server ? 'server' : 'bot', item.server ? item.server.id : item.bot.id, item._id),
                    fetchKey: 'reviews'
                  }),
                  hide: !data.permissions?.canDeleteReviews
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'blockedIPs',
      name: 'Blocked IPs',
      data: {
        title: 'Blocked IPs',
        subtitle: 'Here you can see the all the IPs that have been blocked by the system.',
        totalCount: data?.blockedIps?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Blocked IPs',
              count: data?.blockedIps?.length,
              columns: data?.blockedIps?.map(item => [
                {
                  type: 'ipAddress',
                  value: item.ip
                },
                {
                  type: 'date',
                  value: new Date(item.createdAt)
                }
              ]),
              rows: [
                {
                  name: 'IP',
                  icon: MdHttps
                },
                {
                  name: 'Date Blocked',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'Delete',
                  icon: IoMdCheckmarkCircle,
                  action: () => bulkAction({
                    data: data.blockedIps,
                    action: item => deleteBlockedIP(item.id),
                    fetchKey: 'blockedips'
                  }),
                  hide: !data.permissions?.canDeleteBlockedIps
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'links',
      name: 'Links',
      data: {
        title: 'Links',
        subtitle: 'Here you can see the all the links that have been created.',
        totalCount: data?.links?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Links',
              count: data?.links?.length,
              columns: data?.links?.map(item => [
                {
                  type: 'link',
                  name: item.name,
                  redirectTo: item.redirectTo
                },
                {
                  type: 'number',
                  value: item.visits
                },
                {
                  type: 'user',
                  id: item.createdBy.id,
                  username: item.createdBy.username,
                  avatar: item.createdBy.avatar
                },
                {
                  type: 'date',
                  value: new Date(item.createdAt)
                }
              ]),
              rows: [
                {
                  name: 'URL',
                  icon: FiLink
                },
                {
                  name: 'Visits',
                  icon: MdVisibility
                },
                {
                  name: 'Created By',
                  icon: FaUserCircle
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'Visit',
                  icon: MdOpenInNew,
                  action: selectedIndex => {
                    const link = data.links[selectedIndex];
                    
                    setSelectedIndexes([]);

                    window.open(link.redirectTo, '_blank');
                  }
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'link',
                    data: data.links,
                    action: item => deleteLink(item.id),
                    fetchKey: 'links'
                  }),
                  hide: !data.permissions?.canDeleteLinks
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'botDenies',
      name: 'Bot Denies',
      data: {
        title: 'Bot Denies',
        subtitle: 'Here you can see the all the bot denies that have been recorded. (last 6 hours only)',
        totalCount: data?.botDenies?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Denied Bots',
              count: data?.botDenies?.length,
              columns: data?.botDenies?.map(item => [
                {
                  type: 'bot',
                  id: item.bot.id,
                  username: item.bot.username,
                  discriminator: item.bot.discriminator,
                  avatar: item.bot.avatar
                },
                {
                  type: 'user',
                  id: item.user.id,
                  username: item.user.username,
                  avatar: item.user.avatar
                },
                {
                  type: 'user',
                  id: item.reviewer.id,
                  username: item.reviewer.username,
                  avatar: item.reviewer.avatar
                },
                {
                  type: 'reason',
                  value: item.reason
                },
                {
                  type: 'date',
                  value: new Date(item.createdAt)
                }
              ]),
              rows: [
                {
                  name: 'Bot',
                  icon: FaUserCircle
                },
                {
                  name: 'User',
                  icon: FaUserCircle
                },
                {
                  name: 'Reviewer',
                  icon: FaUserCircle
                },
                {
                  name: 'Reason',
                  icon: RiPencilFill
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                }
              ],
              actions: [
                {
                  name: 'View',
                  icon: FaEye,
                  action: selectedIndex => {
                    const botDeny = data.botDenies[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/bots/${botDeny.bot.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'bot deny',
                    data: data.botDenies,
                    action: item => deleteBotDenyRecord(item.id),
                    fetchKey: 'botdenies'
                  }),
                  hide: !data.permissions?.canDeleteBotDenies
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'timeouts',
      name: 'Timeouts',
      data: {
        title: 'Timeouts',
        description: 'Here you can see the all the vote timeouts that have been recorded.',
        totalCount: data?.timeouts?.length || 0,
        tableData: {
          tabs: [
            {
              label: 'Timeouts',
              count: data?.timeouts?.length,
              columns: data?.timeouts?.map(item => [
                typeof item.bot === 'object' ? 
                  {
                    type: 'bot',
                    id: item.bot.id,
                    username: item.bot.username,
                    discriminator: item.bot.discriminator,
                    avatar: item.bot.avatar
                  } :
                  {
                    type: 'server',
                    id: item.guild.id,
                    name: item.guild.name,
                    icon: item.guild.icon
                  },
                {
                  type: 'user',
                  id: item.user.id,
                  username: item.user.username,
                  avatar: item.user.avatar
                },
                {
                  type: 'date',
                  value: new Date(item.createdAt)
                },
                {
                  type: 'countdown',
                  value: new Date(item.createdAt).getTime() + 86400000
                }
              ]),
              rows: [
                {
                  name: 'Bot/Server',
                  icon: FaUserCircle
                },
                {
                  name: 'User',
                  icon: FaUserCircle
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                },
                {
                  name: 'Ends In',
                  icon: MdTimer
                }
              ],
              actions: [
                {
                  name: 'View Bot',
                  icon: FaEye,
                  action: selectedIndex => {
                    const timeout = data.timeouts[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/bots/${timeout.bot.id}`);
                  },
                  hide: selectedIndexes => {
                    if (selectedIndexes.length !== 1) return true;

                    const timeout = data.timeouts[selectedIndexes[0]];

                    return typeof timeout.bot !== 'object';
                  }
                },
                {
                  name: 'View Server',
                  icon: FaEye,
                  action: selectedIndex => {
                    const timeout = data.timeouts[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/servers/${timeout.server.id}`);
                  },
                  hide: selectedIndexes => {
                    if (selectedIndexes.length !== 1) return true;

                    const timeout = data.timeouts[selectedIndexes[0]];

                    return typeof timeout.server !== 'object';
                  }
                },
                {
                  name: 'View User',
                  icon: FaEye,
                  action: selectedIndex => {
                    const timeout = data.timeouts[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/profile/u/${timeout.user.id}`);
                  },
                  hide: selectedIndexes => selectedIndexes.length !== 1
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'timeout',
                    data: data.timeouts,
                    action: item => deleteTimeout(typeof item.bot === 'object' ? 'bot' : 'server', item._id),
                    fetchKey: 'timeouts'
                  }),
                  hide: !data.permissions?.canDeleteTimeouts
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: 'quarantines',
      name: 'Quarantines',
      data: {
        title: 'Quarantines',
        description: 'Here you can see the all the quarantines that have been created and not yet expired.',
        totalCount: data?.quarantines?.length || 0,
        actionButton: {
          name: 'Create Quarantine',
          icon: TbLockPlus,
          action: () => {
            openModal('create-quarantine-record', {
              title: 'Create Quarantine Record',
              description: 'You are going to create a new quarantine record.',
              content: <CreateQuarantineModal />
            });
          },
          hide: !data.permissions?.canCreateQuarantines
        },
        tableData: {
          tabs: [
            {
              label: 'Quarantines',
              count: data?.quarantines?.length,
              columns: data?.quarantines?.map(item => [
                item.type === 'USER_ID' ?
                  {
                    type: 'user',
                    id: item.user.id,
                    username: item.user.username,
                    avatar: item.user.avatar
                  } : 
                  {
                    type: 'server',
                    id: item.guild.id,
                    name: 'Unknown',
                    icon: null
                  },
                {
                  type: 'user',
                  id: item.created_by.id,
                  username: item.created_by.username,
                  avatar: item.created_by.avatar
                },
                {
                  type: 'restriction',
                  value: item.restriction
                },
                {
                  type: 'long-text',
                  value: item.reason
                },
                {
                  type: 'date',
                  value: new Date(item.created_at)
                },
                {
                  type: 'countdown',
                  value: new Date(item.expire_at).getTime()
                }
              ]),
              rows: [
                {
                  name: 'User/Server',
                  icon: FaUserCircle
                },
                {
                  name: 'Created By',
                  icon: FaUserCircle
                },
                {
                  name: 'Restriction',
                  icon: CgBlock
                },
                {
                  name: 'Reason',
                  icon: RiPencilFill
                },
                {
                  name: 'Date Added',
                  icon: MdUpdate
                },
                {
                  name: 'Ends In',
                  icon: MdTimer
                }
              ],
              actions: [
                {
                  name: 'View User',
                  icon: FaEye,
                  action: selectedIndex => {
                    const quarantine = data.quarantines[selectedIndex];
                    
                    setSelectedIndexes([]);

                    router.push(`/profile/u/${quarantine.user.id}`);
                  },
                  hide: selectedIndexes => {
                    if (selectedIndexes.length !== 1) return true;

                    const quarantine = data.quarantines[selectedIndexes[0]];

                    return quarantine.type !== 'USER_ID';
                  }
                },
                {
                  name: 'Delete',
                  icon: IoMdCloseCircle,
                  action: () => bulkActionWithConfirmationModal({
                    name: 'quarantine',
                    data: data.quarantines,
                    action: item => deleteQuarantineRecord(item.id),
                    fetchKey: 'quarantines'
                  }),
                  hide: !data.permissions?.canDeleteQuarantines
                }
              ]
            }
          ]
        }
      }
    }
  ];

  const fetchData = useDashboardStore(state => state.fetchData);

  useEffect(() => {
    setSelectedIndexes([]);

    switch (activeTab) {
      case 'home':
        fetchData(['stats']);
        break;
      case 'emojisQueue':
        fetchData(['emojis']);
        break;
      case 'botsQueue':
        fetchData(['bots']);
        break;
      case 'templatesQueue':
        fetchData(['templates']);
        break;
      case 'soundsQueue':
        fetchData(['sounds']);
        break;
      case 'reviewsQueue':
        fetchData(['reviews']);
        break;
      case 'blockedIPs':
        fetchData(['blockedips']);
        break;
      case 'botDenies':
        fetchData(['botdenies']);
        break;
      case 'timeouts':
        fetchData(['timeouts']);
        break;
      case 'quarantines':
        fetchData(['quarantines']);
        break;
      case 'links':
        fetchData(['links']);
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const theme = useThemeStore(state => state.theme);
  const transition = { duration: 0.25, type: 'spring', damping: 10, stiffness: 100 };

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else document.body.style.overflow = 'auto';
    
    return () => document.body.style.overflow = 'auto';
  }, [loading]);

  const isCollapsed = useDashboardStore(state => state.isCollapsed);
  const isMobile = useMedia('(max-width: 768px)', false);

  return (
    <div className='relative flex'>
      <Sidebar />
      
      <div className={cn(
        'relative z-[5] flex flex-1 w-full min-h-[100dvh] max-w-[calc(100%_-_300px)]',
        isCollapsed && 'max-w-[90%]',
        isMobile && !isCollapsed && 'max-w-full'
      )}>
        <div className='flex-1 w-full'>
          <div className='flex items-center mt-4 ml-6 text-sm font-medium sm:mt-12 sm:ml-12'>
            <span className='text-tertiary'>
              Dashboard
            </span>

            <CgFormatSlash className='text-lg text-tertiary' />

            <span className='text-primary'>
              {tabs.find(tab => tab.id === activeTab)?.name}
            </span>
          </div>

          <AnimatePresence>
            {isMobile && !isCollapsed && (
              <motion.div
                className='absolute top-0 left-0 w-full h-full dark:bg-black/70 bg-white/70 z-[1]'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className='mt-4 ml-4 sm:mt-12 sm:ml-12'>
            {tabs.find(tab => tab.id === activeTab)?.component || <Queue key={activeTab} {...tabs.find(tab => tab.id === activeTab)?.data} />}
          </div>

          {loading && (
            <AnimatePresence>
              <div className="absolute top-0 left-0 flex flex-col items-center justify-center w-full h-[100dvh] bg-background z-[10]">
                <MotionImage
                  className='w-[64px] h-[64px]'
                  src={theme === 'dark' ? '/symbol_white.png' : '/symbol_black.png'} 
                  alt="discord.place Logo" 
                  width={256} 
                  height={256}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                />
            
                <motion.div 
                  className='overflow-hidden mt-8 bg-tertiary w-[150px] h-[6px] rounded-full relative'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                >
                  <div
                    className='absolute h-[6px] dark:bg-white bg-black rounded-full animate-loading' style={{
                      width: '50%',
                      transform: 'translateX(-100%)'
                    }} 
                  />
                </motion.div>
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}