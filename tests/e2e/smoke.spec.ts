import { test, expect } from './fixtures';

// Um artigo que existe nas duas línguas, faz parte de uma série e tem palestra ligada.
const POST = {
  en: '/posts/hugo-sessionize-cron-blog-setup/',
  pt: '/pt-br/posts/hugo-sessionize-cron-blog-setup/',
};

const HOMES = [
  { lang: 'en', path: '/', htmlLang: 'en' },
  { lang: 'pt', path: '/pt-br/', htmlLang: 'pt-br' },
];

for (const home of HOMES) {
  test(`home (${home.lang}) carrega com título e lista de artigos`, async ({ page, consoleErrors }) => {
    const res = await page.goto(home.path);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Luiz Schons/);
    await expect(page.locator('html')).toHaveAttribute('lang', home.htmlLang);
    await expect(page.locator('h1')).toHaveText('Luiz Schons');
    const posts = page.locator('.home-recent .home-post h3 a');
    expect(await posts.count()).toBeGreaterThan(0);
    await expect(page.locator('form.newsletter-form')).toHaveCount(1);
    await page.waitForLoadState('load');
    expect(consoleErrors, 'erros no console').toEqual([]);
  });
}

for (const [lang, other] of [['en', 'pt'], ['pt', 'en']] as const) {
  test(`artigo (${lang}) carrega e o link de idioma leva à tradução`, async ({ page, consoleErrors }) => {
    const res = await page.goto(POST[lang]);
    expect(res?.status()).toBe(200);
    await expect(page.locator('header.article-header h1')).not.toBeEmpty();
    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator('.article-content')).not.toBeEmpty();

    // Comentários (giscus) e newsletter existem, sem chamar os serviços externos.
    await expect(page.locator('section.article-comments script[src*="giscus.app"]')).toHaveCount(1);
    await expect(page.locator('form.newsletter-form input[type=email]')).toHaveCount(1);

    // Caixa da série no fim do artigo.
    await expect(page.locator('aside.article-series')).toBeVisible();

    await page.waitForLoadState('load');
    expect(consoleErrors, 'erros no console').toEqual([]);

    await page.locator('a.article-translation').first().click();
    await expect(page).toHaveURL(new RegExp(POST[other].replace(/\//g, '\\/') + '$'));
    await expect(page.locator('header.article-header h1')).not.toBeEmpty();
  });
}

for (const path of ['/series/studying-out-of-curiosity/', '/pt-br/series/estudos-por-curiosidade/']) {
  test(`série ${path} lista pelo menos um artigo`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('.series-header h1')).not.toBeEmpty();
    expect(await page.locator('.series-posts article.series-post a').count()).toBeGreaterThan(0);
  });
}

for (const path of ['/speakers/', '/pt-br/speakers/']) {
  test(`palestras ${path} renderiza os dados do Sessionize`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('.profile-header h1')).not.toBeEmpty();
    expect(await page.locator('.talk-card').count()).toBeGreaterThan(0);
  });
}

test('feedback /pt-br/feedback/ renderiza o formulário com palestras e eventos', async ({ page }) => {
  const res = await page.goto('/pt-br/feedback/');
  expect(res?.status()).toBe(200);
  const form = page.locator('form.feedback-form');
  await expect(form).toHaveCount(1);
  // Opções vindas do Sessionize, além de "escolha" e "outra".
  expect(await form.locator('select[name=talk] option').count()).toBeGreaterThan(2);
  expect(await form.locator('select[name=event] option').count()).toBeGreaterThan(2);
});

test('página que não existe devolve 404 e leva para a home', async ({ page }) => {
  const res = await page.request.get('/esta-pagina-nao-existe/');
  expect(res.status()).toBe(404);
  expect(await res.text()).toContain('noindex');
  await page.goto('/esta-pagina-nao-existe/');
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
});

for (const path of ['/index.xml', '/pt-br/index.xml', '/sitemap.xml', '/en/sitemap.xml', '/pt-br/sitemap.xml']) {
  test(`${path} é XML válido e não vazio`, async ({ page }) => {
    const res = await page.request.get(path);
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const result = await page.evaluate((text) => {
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      const err = doc.getElementsByTagName('parsererror')[0];
      return {
        error: err ? err.textContent : null,
        root: doc.documentElement.nodeName,
        items: doc.getElementsByTagName('item').length,
        urls: doc.getElementsByTagName('url').length + doc.getElementsByTagName('sitemap').length,
      };
    }, xml);
    expect(result.error).toBeNull();
    if (path.endsWith('index.xml')) {
      expect(result.root).toBe('rss');
      expect(result.items).toBeGreaterThan(0);
    } else {
      expect(['urlset', 'sitemapindex']).toContain(result.root);
      expect(result.urls).toBeGreaterThan(0);
    }
  });
}
