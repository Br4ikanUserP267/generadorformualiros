const id = '09e198de-d038-42c4-8087-1fa2a14fe706';
fetch('http://localhost:3000/api/riesgos/' + id, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    area: 'TEst Modified',
    responsable: 'Erika',
    fecha_elaboracion: '2026-03-19',
    fecha_actualizacion: '2026-03-19',
    procesos: [
      {
        nombre: 'Asistencial',
        zonas: [
          {
            nombre: 'Zona 1',
            actividades: [
              {
                nombre: 'Actividad 1',
                cargo: 'Médico',
                rutinario: true,
                peligros: [
                  {
                    descripcion: 'Peligro 1',
                    clasificacion: 'Físico',
                    efectos: 'Dolores',
                    controles: { fuente: '1', medio: '2', individuo: '3' },
                    evaluacion: { nd: '2', ne: '3', nc: '10', np: '6', nr: '60', interp_np: 'Medio', interp_nr: 'Medio', aceptabilidad: 'Aceptable' },
                    criterios: { num_expuestos: '5', peor_consecuencia: 'Muerte', requisito_legal: true },
                    intervencion: { eliminacion: '', sustitucion: '', controles_ingenieria: '', controles_administrativos: '', epp: 'Guantes', responsable: 
'Erika', fecha_ejecucion: '' }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  })
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Result:', await r.text());
}).catch(console.error);
