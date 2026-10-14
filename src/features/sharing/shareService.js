export function eventPublicUrl(eventId, origin = window.location.origin) {
  return `${origin}/event/${encodeURIComponent(eventId)}`;
}

export function whatsappShareUrl(title, eventUrl) {
  return `https://wa.me/?text=${encodeURIComponent(`${title}: ${eventUrl}`)}`;
}

export function emailShareUrl(title, eventUrl) {
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(eventUrl)}`;
}