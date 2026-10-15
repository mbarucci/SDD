import { expect, test } from '@playwright/test';
import { createDraftEvent, registerHost } from './helpers.js';

test('host UI keeps readable text, visible keyboard focus, contrast, and layout at 200% text zoom', async ({ page }) => {
  await registerHost(page);
  await createDraftEvent(page, 'A festa da família');
  await page.getByLabel('Título').focus();
  await page.keyboard.press('Tab');

  const focusedControl = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      isKeyboardFocus: document.activeElement.matches(':focus-visible'),
    };
  });
  expect(focusedControl).toMatchObject({
    outlineStyle: 'solid',
    isKeyboardFocus: true,
  });
  expect(focusedControl.outlineWidth).toBeGreaterThanOrEqual(3);

  const primaryButton = page.getByRole('button', { name: 'Salvar rascunho' });
  const buttonSize = await primaryButton.evaluate((button) => ({
    height: button.getBoundingClientRect().height,
    foreground: getComputedStyle(button).color,
    background: getComputedStyle(button).backgroundColor,
  }));
  expect(buttonSize.height).toBeGreaterThanOrEqual(44);
  const contrast = await page.evaluate(({ foreground, background, statusForeground, statusBackground, focusColor }) => {
    function luminance(color) {
      const channels = color.match(/\d+/gu).slice(0, 3).map((channel) => {
        const value = Number(channel) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }
    function ratio(left, right) {
      const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    }
    return {
      primary: ratio(foreground, background),
      status: ratio(statusForeground, statusBackground),
      focus: ratio(focusColor, getComputedStyle(document.activeElement).backgroundColor),
    };
  }, {
    ...buttonSize,
    ...await page.locator('.event-status-draft').evaluate((status) => ({
      statusForeground: getComputedStyle(status).color,
      statusBackground: getComputedStyle(status).backgroundColor,
    })),
    focusColor: focusedControl ? await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor) : '',
  });
  expect(contrast.primary).toBeGreaterThanOrEqual(4.5);
  expect(contrast.status).toBeGreaterThanOrEqual(4.5);
  expect(contrast.focus).toBeGreaterThanOrEqual(3);

  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  expect(await page.locator('.host-shell').evaluate((shell) => Number.parseFloat(getComputedStyle(shell).fontSize))).toBeGreaterThanOrEqual(36);
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll('body *')]
        .map((element) => ({ element, bounds: element.getBoundingClientRect() }))
        .filter(({ bounds }) => bounds.right > window.innerWidth + 1)
        .slice(0, 5)
        .map(({ element, bounds }) => `${element.className || element.tagName}: ${Math.round(bounds.right)}px`),
    }));
    expect(layout.document, `Horizontal overflow at ${width}px: ${layout.overflowing.join(', ')}`).toBeLessThanOrEqual(layout.viewport);
  }
});
