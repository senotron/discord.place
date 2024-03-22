import cn from '@/lib/cn';

export default function Layout({ children }) {
  return (
    <div className='flex justify-center w-full px-8 mt-48 mb-16 lg:px-0'>
      <div className={cn(
        'max-w-[800px] flex flex-col markdown w-full',
        'prose-sm lg:prose-base prose',
        'prose-h1:text-primary',
        'prose-h2:text-primary',
        'prose-h3:text-secondary',
        'prose-h4:text-secondary',
        'prose-p:text-tertiary prose-p:my-1',
        'prose-a:text-secondary hover:prose-a:text-primary',
        'prose-strong:text-secondary',
        'prose-li:text-tertiary prose-li:my-0'
      )}>
        {children}
      </div>
    </div>
  );
}