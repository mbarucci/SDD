function eventPhotos(event) {
  return Array.isArray(event?.photos)
    ? event.photos
    : Object.values(event?.photos ?? {});
}

function isSecureImage(url) {
  return typeof url === 'string' && url.startsWith('https://');
}

export function getEventCover(event) {
  if (isSecureImage(event?.locationImageUrl)) {
    return {
      url: event.locationImageUrl,
      altText: event.locationImageAltText || '',
    };
  }

  const firstSecurePhoto = eventPhotos(event).find((photo) => isSecureImage(photo?.url));
  return firstSecurePhoto
    ? { url: firstSecurePhoto.url, altText: firstSecurePhoto.altText || '' }
    : null;
}

export function formatEventDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return 'Data a confirmar';

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) {
    return 'Data a confirmar';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatEventTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value ?? '');
  if (!match) return 'Horário a confirmar';
  return `${Number(match[1])}h${match[2]}`;
}
