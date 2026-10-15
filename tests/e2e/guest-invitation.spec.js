import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('invitation is localized, welcoming, and leads to RSVP on a mobile viewport', async ({ page }) => {
  const hostEmail = await registerHost(page);
  await createDraftEvent(page, 'Uma festa especial para a família');
  await page.getByRole('button', { name: 'Publicar evento' }).click();
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  const eventUrl = await page.getByLabel('Link público do evento').inputValue();

  await page.goto('/host');
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(eventUrl);

  await expect(page.getByText('Você está convidado')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Uma festa especial para a família' })).toBeVisible();
  await expect(page.getByText('8 de maio de 2027')).toBeVisible();
  await expect(page.getByText('19h30')).toBeVisible();
  await expect(page.getByText(hostEmail, { exact: true })).toHaveCount(0);
  const palette = await page.locator('.public-experience').evaluate((root) => {
    const styles = getComputedStyle(root);
    const cta = getComputedStyle(root.querySelector('#rsvp-inline'));
    const rgb = (value) => value.match(/\d+/g).slice(0, 3).map(Number);
    const luminance = (value) => rgb(value)
      .map((channel) => channel / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = luminance(cta.color);
    const background = luminance(cta.backgroundColor);
    return {
      swatches: ['--ux-lavender', '--ux-lilac', '--ux-periwinkle', '--ux-blue-lavender', '--ux-sky']
        .map((token) => styles.getPropertyValue(token).trim()),
      ctaBackground: cta.backgroundColor,
      ctaContrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
      coverBackground: getComputedStyle(root.querySelector('.public-event-cover')).backgroundColor,
    };
  });
  expect(palette.swatches).toEqual(['#dfc5ff', '#bcb3e8', '#d2d6ff', '#b3c6e8', '#c5e9ff']);
  expect(palette.ctaBackground).toBe('rgb(91, 75, 134)');
  expect(palette.ctaContrast).toBeGreaterThan(4.5);
  expect(palette.coverBackground).toBe('rgb(223, 197, 255)');

  const inlineCta = page.locator('#rsvp-inline');
  const stickyCta = page.locator('.public-rsvp-sticky');
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect.poll(() => page.locator('.public-event-hero').evaluate((hero) => (
      getComputedStyle(hero).gridTemplateColumns.trim().split(/\s+/).length
    ))).toBe(width < 701 ? 1 : 2);
    await expect(inlineCta).toBeVisible();
    if (width < 701) {
      await expect(stickyCta).toHaveCSS('position', 'fixed');
      await expect(stickyCta).toBeHidden();
    } else {
      await expect(inlineCta).toHaveCSS('position', 'static');
      await expect(stickyCta).toBeHidden();
    }
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await inlineCta.click();
  await expect(page.locator('#rsvp')).toBeInViewport();
  await expect(stickyCta).toBeHidden();
});
