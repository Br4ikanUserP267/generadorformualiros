const ExcelJS = require('exceljs');
const fs = require('fs');
(async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('C:/Users/csm/Downloads/Matriz_HOSPITALIZACION_SAGRADA_FAMILIA_2026-03-30.xlsx');
    const ws = wb.getWorksheet('Matriz');
    let logs = [];
    for(let i=1; i<=9; i++) {
        const r = ws.getRow(i);
        r.eachCell((c, col) => {
            if (c.isMerged && c.address !== c.master.address) return;
            let m = null;
            if (c.isMerged && c.address === c.master.address) {
                m = ws.model.merges.find(x => x && x.startsWith(c.address + ':'));
            }
            logs.push({
                row: i,
                addr: c.address, 
                val: c.value, 
                merge: m
            });
        });
    }
    fs.writeFileSync('temp_header.json', JSON.stringify(logs, null, 2));
})();
