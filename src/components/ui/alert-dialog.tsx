import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function AlertDialog({ open = false, onOpenChange, children }: AlertDialogProps) {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const contextValue = React.useMemo(
    () => ({
      open: isOpen,
      setOpen: (value: boolean) => {
        setIsOpen(value);
        onOpenChange?.(value);
      },
    }),
    [isOpen, onOpenChange]
  );

  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = React.useContext(AlertDialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button onClick={() => setOpen(true)} type="button">
      {children}
    </button>
  );
}

interface AlertDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export function AlertDialogContent({ className, children }: AlertDialogContentProps) {
  const { open, setOpen } = React.useContext(AlertDialogContext);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative bg-white rounded-lg shadow-xl animate-in fade-in zoom-in duration-200",
            "w-full max-w-md p-6",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export function AlertDialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mb-4 space-y-2", className)}>{children}</div>;
}

export function AlertDialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>;
}

export function AlertDialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm text-gray-500", className)}>{children}</p>;
}

export function AlertDialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {children}
    </div>
  );
}

export function AlertDialogAction({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { setOpen } = React.useContext(AlertDialogContext);

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "bg-red-600 text-white hover:bg-red-700",
        "h-10 px-4 py-2",
        className
      )}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { setOpen } = React.useContext(AlertDialogContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "border border-gray-300 bg-white hover:bg-gray-50",
        "h-10 px-4 py-2",
        "mt-2 sm:mt-0",
        className
      )}
    >
      {children}
    </button>
  );
}