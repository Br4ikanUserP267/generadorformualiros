const fs = require('fs');
let code = fs.readFileSync('pages/api/export/matriz.ts', 'utf8');

const startMarker = '    // Header structure rows';
const endMarker = '    // Column Headers (Row 8 & 9)';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = \    // Header structure rows
    // Row 1
    ws.getRow(1).height = 10

    // Row 2
    ws.mergeCells('B2:C5')
    ws.getCell('B2').value = 'LOGO' // Base para la imagen (se insertará abajo)
    ws.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' }
    
    ws.mergeCells('D2:AC2')
    ws.getCell('D2').value = 'SISTEMAS INTEGRADOS GESTIÓN'
    ws.getCell('D2').alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getCell('D2').font = { bold: true, name: 'Arial', size: 10 }
    
    ws.getCell('AD2').value = 'Código:'
    ws.getCell('AD2').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE2').value = '45.17-FOR-38'
    ws.getCell('AE2').alignment = { horizontal: 'center' }

    // Row 3
    ws.mergeCells('D3:AC3')
    ws.getCell('D3').value = 'CLINICA SANTA MARIA S.A.S.'
    ws.getCell('D3').alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getCell('D3').font = { bold: true, name: 'Arial', size: 10 }
    
    ws.getCell('AD3').value = 'Versión:'
    ws.getCell('AD3').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE3').value = '02'
    ws.getCell('AE3').alignment = { horizontal: 'center' }

    // Row 4
    ws.mergeCells('D4:AC5')
    ws.getCell('D4').value = 'MATRIZ DE IDENTIFICACIÓN DE PELIGROS Y VALORACIÓN DE RIESGOS'
    ws.getCell('D4').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    ws.getCell('D4').font = { bold: true, name: 'Arial', size: 10 }
    
    ws.getCell('AD4').value = 'Fecha:'
    ws.getCell('AD4').font = { bold: true, name: 'Arial', size: 10 }
    // Asignar string
    ws.getCell('AE4').value = formatDate(matrizData.fecha_elaboracion) || '26/4/2019'
    ws.getCell('AE4').alignment = { horizontal: 'center' }

    // Row 5
    ws.getCell('AD5').value = 'Página:'
    ws.getCell('AD5').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE5').value = '1 de 1'
    ws.getCell('AE5').alignment = { horizontal: 'center' }

    // Row 7 (Info row)
    ws.mergeCells('B7:C7')
    ws.getCell('B7').value = 'ÁREA / PROCESO'
    ws.getCell('B7').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } }

    ws.mergeCells('D7:H7')
    ws.getCell('D7').value = matrizData.area || ''
    ws.getCell('D7').alignment = { horizontal: 'center' }

    ws.mergeCells('I7:J7')
    ws.getCell('I7').value = 'RESPONSABLE'
    ws.getCell('I7').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('I7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } }

    ws.mergeCells('K7:M7')
    ws.getCell('K7').value = matrizData.responsable || ''
    ws.getCell('K7').alignment = { horizontal: 'center' }

    // Apply borders to rows 2-5 and 7
    for (let r = 2; r <= 5; r++) {
        for (let c = 2; c <= 31; c++) {
            const letter = ws.getColumn(c).letter;
            const cell = ws.getCell(letter + r);
            if (!cell.border) cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        }
    }
    for (let c = 2; c <= 31; c++) {
        const letter = ws.getColumn(c).letter;
        const cell = ws.getCell(letter + '7');
        if (!cell.border && cell.value !== null && cell.value !== '') cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
    }

\ + '\\n';

    code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
    fs.writeFileSync('pages/api/export/matriz.ts', code);
    console.log('Successfully replaced headers block');
} else {
    console.log('Markers not found', startIndex, endIndex);
}
