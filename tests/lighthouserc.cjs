// Lighthouse CI: mede o site gerado em tests/.site (mesmo build dos testes Playwright).
// Os limites vêm das notas medidas em 29/10/2026 menos uma margem; ficam como "warn"
// porque a nota de performance varia de uma máquina para outra (veja README).
// Notas medidas (mediana de 3): /pt-br/ 94/91/100/100, post PT 90/91/100/100, / 92/90/100/100
// (performance/acessibilidade/boas práticas/SEO). Limites: 80/85/95/95.
const PORT = 4173;
const base = `http://127.0.0.1:${PORT}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npx http-server .site -p ${PORT} -a 127.0.0.1 -c-1`,
      startServerReadyPattern: 'Available on',
      url: [
        `${base}/pt-br/`,
        `${base}/pt-br/posts/hugo-sessionize-cron-blog-setup/`,
        `${base}/`,
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['warn', { minScore: 0.85, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci/reports',
    },
  },
};
