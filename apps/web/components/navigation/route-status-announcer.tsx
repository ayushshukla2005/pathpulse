interface RouteStatusAnnouncerProps {
  message: string;
}

export function RouteStatusAnnouncer({ message }: RouteStatusAnnouncerProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
