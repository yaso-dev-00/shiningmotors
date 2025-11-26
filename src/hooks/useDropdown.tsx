import { useState, useCallback, useEffect, useRef } from "react";

interface UseDropdownOptions {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

export function useDropdown(options: UseDropdownOptions = {}) {
  const {
    defaultOpen = false,
    onOpenChange,
    closeOnOutsideClick = true,
    closeOnEscape = true,
  } = options;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(target) &&
        !contentRef.current.contains(target)
      ) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeOnOutsideClick, close]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    triggerRef,
    contentRef,
  };
}


