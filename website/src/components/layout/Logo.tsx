import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Full horizontal lockup (icon + wordmark), dark-theme artwork. */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-transparent-dark.png"
      alt="create-meno-app"
      width={1741}
      height={382}
      priority
      className={cn('h-7 w-auto', className)}
    />
  );
}

/** Square mark only, dark-theme artwork. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/icon-transparent-dark.png"
      alt="create-meno-app"
      width={428}
      height={428}
      priority
      className={cn('h-8 w-8', className)}
    />
  );
}
