import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';
import { cn } from '~/lib/utils';

/* ================= CONTEXT TYPES ================= */

interface AccordionContextType {
  activeItems: string[];
  toggleItem: (id: string) => void;
  isItemActive: (id: string) => boolean;
}

/* ================= CONTEXT ================= */

const AccordionContext = createContext<AccordionContextType | undefined>(
  undefined,
);

/* ================= CUSTOM HOOK ================= */

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion must be used inside <Accordion>');
  }
  return context;
};

/* ================= MAIN ACCORDION ================= */

interface AccordionProps {
  children: ReactNode;
  defaultOpen?: string;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  defaultOpen,
  allowMultiple = false,
  className = '',
}) => {
  const [activeItems, setActiveItems] = useState<string[]>(
    defaultOpen ? [defaultOpen] : [],
  );

  const toggleItem = (id: string) => {
    setActiveItems((prev) => {
      if (allowMultiple) {
        return prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id];
      } else {
        return prev.includes(id) ? [] : [id];
      }
    });
  };

  const isItemActive = (id: string) => activeItems.includes(id);

  return (
    <AccordionContext.Provider
      value={{ activeItems, toggleItem, isItemActive }}
    >
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

/* ================= ITEM ================= */

interface AccordionItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={cn('border-b border-gray-200', className)}>{children}</div>
  );
};

/* ================= HEADER ================= */

interface AccordionHeaderProps {
  itemId: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AccordionHeader: React.FC<AccordionHeaderProps> = ({
  itemId,
  children,
  className = '',
  icon,
  iconPosition = 'right',
}) => {
  const { toggleItem, isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);

  const defaultIcon = (
    <svg
      className={cn('w-5 h-5 transition-transform duration-200', {
        'rotate-180': isActive,
      })}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <button
      onClick={() => toggleItem(itemId)}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 text-left transition',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {iconPosition === 'left' && (icon || defaultIcon)}
        <span>{children}</span>
      </div>

      {iconPosition === 'right' && (icon || defaultIcon)}
    </button>
  );
};

/* ================= CONTENT ================= */

interface AccordionContentProps {
  itemId: string;
  children: ReactNode;
  className?: string;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  itemId,
  children,
  className = '',
}) => {
  const { isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300',
        isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        className,
      )}
    >
      <div className="px-4 py-3">{children}</div>
    </div>
  );
};
