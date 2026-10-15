import { describe, expect, it } from 'vitest';
import {
  formatEventDate,
  formatEventTime,
  getEventCover,
} from '../../src/features/event/eventPresentation.js';

describe('getEventCover', () => {
  it('prefers a secure location image and preserves its alternative text', () => {
    expect(getEventCover({
      locationImageUrl: 'https://images.example.test/location.jpg',
      locationImageAltText: 'Mesa no jardim',
      photos: [{ url: 'https://images.example.test/gallery.jpg', altText: 'Flores' }],
    })).toEqual({
      url: 'https://images.example.test/location.jpg',
      altText: 'Mesa no jardim',
    });
  });

  it('uses the first secure gallery photo when no secure location image exists', () => {
    expect(getEventCover({
      locationImageUrl: 'http://images.example.test/location.jpg',
      photos: [
        { url: 'http://images.example.test/unsafe.jpg', altText: 'Insegura' },
        { url: 'https://images.example.test/gallery.jpg', altText: 'Flores' },
      ],
    })).toEqual({
      url: 'https://images.example.test/gallery.jpg',
      altText: 'Flores',
    });
  });

  it('returns no cover when no secure image is available', () => {
    expect(getEventCover({ photos: [] })).toBeNull();
  });
});

describe('event date and time formatting', () => {
  it('formats a calendar date in Brazilian Portuguese without a UTC day shift', () => {
    expect(formatEventDate('2027-05-08')).toBe('8 de maio de 2027');
  });

  it('uses a clear fallback for a missing or invalid date', () => {
    expect(formatEventDate('')).toBe('Data a confirmar');
    expect(formatEventDate('2027-02-30')).toBe('Data a confirmar');
  });

  it('formats a valid time and uses a clear fallback otherwise', () => {
    expect(formatEventTime('19:30')).toBe('19h30');
    expect(formatEventTime('')).toBe('Horário a confirmar');
    expect(formatEventTime('25:70')).toBe('Horário a confirmar');
  });
});
