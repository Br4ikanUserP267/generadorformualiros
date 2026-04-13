const ExcelJS = require('exceljs')

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile('C:/Users/csm/Downloads/Matriz_HOSPITALIZACION_SAGRADA_FAMILIA_2026-03-30.xlsx')
  const ws = wb.getWorksheet('Matriz')

  function normalizeValue(v) {
    if (v && typeof v === 'object' && Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('')
    if (v && typeof v === 'object' && typeof v.text === 'string') return v.text
    return v
  }

  function rowVals(r) {
    const row = ws.getRow(r)
    const out = []
    for (let c = 2; c <= 31; c++) {
      let v = normalizeValue(row.getCell(c).value)
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        out.push(c + ':' + String(v).replace(/\n/g, ' '))
      }
    }
    return out.join(' | ')
  }

  for (let r = 495; r <= 505; r++) {
    console.log('R' + r, rowVals(r))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
