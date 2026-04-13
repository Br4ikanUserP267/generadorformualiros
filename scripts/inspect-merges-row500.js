const ExcelJS = require('exceljs')

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile('C:/Users/csm/Downloads/Matriz_HOSPITALIZACION_SAGRADA_FAMILIA_2026-03-30.xlsx')
  const ws = wb.getWorksheet('Matriz')
  const merges = ws.model.merges || []
  const row = 500
  for (const m of merges) {
    const [start, end] = m.split(':')
    const startMatch = start.match(/([A-Z]+)(\d+)/)
    const endMatch = end.match(/([A-Z]+)(\d+)/)
    if (!startMatch || !endMatch) continue
    const s = Number(startMatch[2])
    const e = Number(endMatch[2])
    if (row >= s && row <= e) {
      console.log(m)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
