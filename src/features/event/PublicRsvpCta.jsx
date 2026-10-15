import { useEffect, useState } from 'react';

export default function PublicRsvpCta({ targetId }) {
  const [observerAvailable, setObserverAvailable] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const targets = [
      document.getElementById(targetId),
      document.getElementById('rsvp-inline'),
    ].filter(Boolean);
    if (targets.length === 0 || !('IntersectionObserver' in window)) return undefined;

    setObserverAvailable(true);
    const visibility = new Map(targets.map((target) => [target.id, false]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target.id, entry.isIntersecting));
      setTargetVisible([...visibility.values()].some(Boolean));
    }, { threshold: 0.01 });
    const handleFocus = () => setTargetVisible(true);

    targets.forEach((target) => {
      observer.observe(target);
      target.addEventListener('focusin', handleFocus);
    });
    return () => {
      observer.disconnect();
      targets.forEach((target) => target.removeEventListener('focusin', handleFocus));
    };
  }, [targetId]);

  function focusRsvpHeading() {
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.querySelector('h2')?.focus({ preventScroll: true });
    });
  }

  return (
    <a
      aria-controls={targetId}
      className="primary-button public-rsvp-sticky"
      href={`#${targetId}`}
      hidden={!observerAvailable || targetVisible}
      onClick={focusRsvpHeading}
    >
      Responder ao convite
    </a>
  );
}
