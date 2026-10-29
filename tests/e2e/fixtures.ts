import { test as base, expect } from '@playwright/test';

// Todo pedido para fora do site local é bloqueado: os testes não dependem de
// giscus, Umami, Buttondown, Sessionize ou fontes externas, e não geram tráfego
// para esses serviços. Erros de console causados por esse bloqueio são ignorados
// (veja isExternalNoise); qualquer outro erro de console faz o teste falhar.
const LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//;

type Fixtures = { consoleErrors: string[] };

function isExternalNoise(text: string, url: string): boolean {
  if (url && !LOCAL.test(url)) return true; // erro vindo de script/recurso externo
  // Pedido externo abortado por nós aparece como "Failed to load resource: net::ERR_FAILED".
  if (/net::ERR_(FAILED|BLOCKED_BY_CLIENT|NAME_NOT_RESOLVED|INTERNET_DISCONNECTED)/.test(text)) return true;
  return false;
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (LOCAL.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
      return route.abort('blockedbyclient');
    });
    await use(page);
  },
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const url = msg.location()?.url ?? '';
      if (!isExternalNoise(msg.text(), url)) errors.push(`${msg.text()} (${url})`);
    });
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    await use(errors);
  },
});

export { expect };
