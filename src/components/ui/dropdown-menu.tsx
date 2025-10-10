import * as React from "react";
import * as ReactDOM from "react-dom";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement> | null;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: null,
});

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(open || false);
  const triggerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleSetOpen = React.useCallback(
    (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen: handleSetOpen, triggerRef }}>
      <div className="relative inline-block text-left" style={{ position: 'static' }}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function DropdownMenuTrigger({ children, asChild, className }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: handleClick,
      className: cn((children as React.ReactElement<any>).props.className, className),
    });
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={handleClick}
      className={cn("inline-flex justify-center", className)}
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
}

export function DropdownMenuContent({
  children,
  align = "end",
  sideOffset = 4,
  className,
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number; right?: number }>({ top: 0, left: 0 });

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  // Calculate position relative to trigger
  React.useEffect(() => {
    if (open && triggerRef?.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top = triggerRect.bottom + sideOffset;
      let left = triggerRect.left;
      let right: number | undefined;

      // Align based on prop
      if (align === 'end') {
        right = viewportWidth - triggerRect.right;
        left = triggerRect.right - 192; // min-w-[8rem] = 128px, using 192px for safety
      } else if (align === 'center') {
        left = triggerRect.left + (triggerRect.width / 2) - 96;
      }

      // Check if menu would overflow bottom
      if (top + 200 > viewportHeight) {
        top = triggerRect.top - 200 - sideOffset;
      }

      setPosition({ top, left, right });
    }
  }, [open, align, sideOffset, triggerRef]);

  if (!open) return null;

  // Create portal to render dropdown at body level
  const dropdownElement = (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] min-w-[12rem] overflow-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: position.right !== undefined ? 'auto' : `${position.left}px`,
        right: position.right !== undefined ? `${position.right}px` : 'auto',
      }}
    >
      {children}
    </div>
  );

  if (typeof window !== 'undefined') {
    return ReactDOM.createPortal(dropdownElement, document.body);
  }

  return null;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSelect?: () => void;
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  className,
  disabled,
  onSelect,
  destructive,
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect();
      setOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        disabled
          ? "pointer-events-none opacity-50"
          : destructive
          ? "hover:bg-red-100 hover:text-red-900 focus:bg-red-100 focus:text-red-900"
          : "hover:bg-gray-100 focus:bg-gray-100",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} />;
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-2 py-1.5 text-xs font-semibold text-gray-900", className)}>
      {children}
    </div>
  );
}