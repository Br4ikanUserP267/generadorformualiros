const ExcelJS = require('exceljs')

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile('C:/Users/csm/Downloads/Matriz_HOSPITALIZACION_SAGRADA_FAMILIA_2026-03-30.xlsx')
  const ws = wb.getWorksheet('Matriz')
  const row = ws.getRow(500)
  console.log('rowCount', ws.rowCount)
  row.eachCell({ includeEmpty: false }, (cell, col) => {
    console.log('COL', col, 'ADDR', cell.address, 'TYPE', cell.type, 'VALUE', JSON.stringify(cell.value))
  })
}

main().catch((e) => { console.error(e); process.exit(1) })
