import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const OUT = process.env.OUT ?? 'e2e/out'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
})
const run = async (name, viewport, isMobile) => {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await ctx.addInitScript(() => localStorage.setItem('medanatomy.onboarded.v1', '1'))
  const logs = []
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(6000)
  await page.screenshot({ path: `${OUT}/${name}-1-explore.png` })
  // Mở danh sách, chọn tâm thất trái
  await page.getByRole('button', { name: /Cấu trúc/ }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/${name}-2-list.png` })
  await page.getByRole('button', { name: /^Tâm thất trái/ }).first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/${name}-3-selected.png` })
  await page.getByRole('button', { name: 'Đóng' }).last().click()
  await page.waitForTimeout(500)
  // Xuyên thấu
  await page.getByRole('button', { name: /Xuyên thấu/ }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/${name}-4-xray.png` })
  await page.getByRole('button', { name: /Xuyên thấu/ }).click()
  // Quiz
  await page.getByRole('button', { name: /Bắt đầu kiểm tra/ }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${name}-5a-setup.png` })
  await page.getByRole('dialog').getByRole('button', { name: 'Van tim' }).click()
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/${name}-5-quiz.png` })
  const q = await page.locator('aside').last().innerText()
  console.log(`${name} quiz text:`, q.replace(/\n/g, ' | ').slice(0, 200))
  console.log(`${name} console:`, logs.filter((l) => !/\[(debug|log)\]/.test(l)).slice(0, 15))
  await ctx.close()
}
await run('desktop', { width: 1280, height: 800 }, false)
await run('mobile', { width: 390, height: 844 }, true)
await browser.close()
