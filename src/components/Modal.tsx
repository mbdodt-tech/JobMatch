'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name for the dialog (visually hidden — render your own heading inside if you want it visible). */
  title: string;
  variant?: 'sheet' | 'center';
  children: ReactNode;
  /** z-index / colour tweaks for the backdrop. */
  overlayClassName?: string;
  /** Styling for the animated content box (background, radius, size, scroll). */
  contentClassName?: string;
  /** Announce urgently for celebratory dialogs. */
  ariaLive?: 'off' | 'polite' | 'assertive';
}

/**
 * Accessible modal built on Radix Dialog — gives focus trapping, focus
 * return to the trigger, Escape-to-close, aria-modal and body scroll locking
 * for free, while keeping the app's framer-motion enter animation.
 *
 * `sheet`  — slides up from the bottom; the box itself scrolls.
 * `center` — scales in the middle of the screen.
 *
 * Radix mounts the content only while `open`, so guard your children with the
 * source value (e.g. `{selected && <>…</>}`) to avoid null access.
 */
export default function Modal({
  open,
  onOpenChange,
  title,
  variant = 'sheet',
  children,
  overlayClassName = 'z-[60] bg-black/60 backdrop-blur-sm',
  contentClassName = '',
  ariaLive,
}: ModalProps) {
  const isSheet = variant === 'sheet';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 ${overlayClassName}`}
          />
        </Dialog.Overlay>

        <Dialog.Content asChild aria-describedby={undefined} aria-live={ariaLive}>
          <motion.div
            initial={isSheet ? { y: '100%' } : { opacity: 0, scale: 0.9 }}
            animate={isSheet ? { y: 0 } : { opacity: 1, scale: 1 }}
            transition={
              isSheet
                ? { type: 'spring', damping: 25, stiffness: 300 }
                : { type: 'spring', stiffness: 200, damping: 18 }
            }
            className={
              isSheet
                ? `fixed inset-x-0 bottom-0 z-[61] outline-none ${contentClassName}`
                : `fixed left-1/2 top-1/2 z-[61] -translate-x-1/2 -translate-y-1/2 outline-none ${contentClassName}`
            }
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {children}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
