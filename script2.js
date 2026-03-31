const ExcelJS = require('exceljs');
const fs = require('fs');

(async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('C:/Users/csm/Downloads/Matriz_HOSPITALIZACION_SAGRADA_FAMILIA_2026-03-30.xlsx');
    const ws = wb.getWorksheet('Matriz');
    let jsCode = `;
    
    // Hardcode known ranges
    const merges = ['B2:F5', 'G2:AE5', 'B7:L7', 'M7:AE7', 'B9:B10', 'C9:C10', 'D9:D10', 'E9:E10', 'F9:F10', 'G9:G10', 'H9:I9', 'J9:J10', 'K9:M9', 'N9:T9', 'U9:U10', 'V9:X9', 'Y9:AC9', 'AD9:AE9'];
    for (let i = 1; i <= 9; i++) {
        const row = ws.getRow(i);
        row.eachCell((c, col) => {
            if (c.isMerged && c.address !== c.master.address) return;
            let val = c.value;
            if (typeof val === 'object' && val !== null && val.richText) val = val.richText.map(t=>t.text).join('');
            if (val) jsCode += Cell \: \\n;
        });
    }
    fs.writeFileSync('headers_decoded.txt', jsCode);
})();
