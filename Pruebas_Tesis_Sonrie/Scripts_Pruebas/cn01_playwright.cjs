// No captura cuerpos de peticiones, contraseñas, tokens ni almacenamiento de sesión.
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(__dirname, 'Navegadores');
const { chromium } = require('C:/Users/angel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const observations = {caso: 'CN-01', formulario_observado: false, login_http: null, dashboard_observado: false};
  page.on('response', async response => {
    if (response.url() === 'http://localhost:5000/api/auth/login' && response.request().method() === 'POST') {
      observations.login_http = response.status();
      observations.fecha_respuesta = new Date().toISOString();
      console.log('Respuesta de login observada: HTTP ' + response.status());
    }
  });
  await page.goto('http://localhost:3000', {waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: /iniciar sesi[oó]n/i}).waitFor({timeout: 15000});
  observations.formulario_observado = true;
  console.log('FORMULARIO_LISTO: introduce las credenciales ficticias en Chromium y pulsa Iniciar sesión; deja Recordarme desmarcado.');
  await page.waitForURL('http://localhost:3000/dashboard', {timeout: 0});
  await page.getByRole('heading', {name: /dashboard|panel|bienvenido/i}).first().waitFor({timeout:15000}).catch(() => {});
  await page.screenshot({path: path.join(root, 'Evidencias_Caja_Negra', 'CN-01_dashboard_playwright.png'), fullPage: true});
  observations.dashboard_observado = true;
  observations.url = page.url();
  observations.fecha_captura = new Date().toISOString();
  fs.writeFileSync(path.join(root, 'Evidencias_Caja_Negra', 'CN-01_observaciones_playwright.json'), JSON.stringify(observations,null,2));
  console.log('DASHBOARD_CAPTURADO: ' + JSON.stringify(observations));
  // Conservar la ventana sin exportar cookies ni credenciales.
  await new Promise(resolve => browser.on('disconnected', resolve));
})().catch(() => { console.error('La automatización no pudo completar el paso. No se registran detalles que puedan contener credenciales.'); process.exitCode=1; });
