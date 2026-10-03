import { chromium } from 'playwright'
const OUT = process.env.OUT ?? 'e2e/out'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
await ctx.addInitScript(() => localStorage.setItem('medanatomy.onboarded.v1', '1'))
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' }); await page.waitForTimeout(4000)
await page.getByRole('button', { name: /Cấu trúc/ }).click()
await page.getByRole('button', { name: /^Van hai lá/ }).first().click(); await page.waitForTimeout(1500)
await page.getByText(/Tài liệu tham khảo/).click(); await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/desktop-7-refs.png` })
await browser.close()
