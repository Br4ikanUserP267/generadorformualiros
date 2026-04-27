"use client"

import React, { useState } from 'react'

interface InstructionsModalProps {
  open: boolean
  onClose: () => void
}

export function InstructionsModal({ open, onClose }: InstructionsModalProps) {
  const [activeTab, setActiveTab] = useState('instructivo')

  if (!open) return null

  const tabs = [
    { id: 'instructivo', label: 'Instructivo Detallado' },
    { id: 'peligros', label: 'Clasificación de Peligros' },
    { id: 'valoracion', label: '8 Tablas de Valoración' },
    { id: 'consecuencias', label: 'Riesgos y Consecuencias' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-[#e2e9e4]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#e2e9e4] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#f0f9f1] flex items-center justify-center text-[#1F7D3E] shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0f2b1a]">Manual Maestro de Matriz IPVR</h2>
              <p className="text-sm text-[#5e6b62]">Guía completa de identificación, valoración y control según GTC 45</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-[#8aa08f] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 bg-[#f8faf9] border-b border-[#e2e9e4] flex gap-8 overflow-x-auto no-scrollbar shadow-inner">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'border-[#1F7D3E] text-[#1F7D3E]' 
                : 'border-transparent text-[#8aa08f] hover:text-[#5e6b62]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-white scroll-smooth">
          {activeTab === 'instructivo' && (
            <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Introduction Section */}
              <section className="space-y-6">
                <div className="bg-[#f0f9f1] p-6 rounded-2xl border border-[#d1e2d6]">
                  <h3 className="text-lg font-bold text-[#1F7D3E] mb-4">Indicaciones Generales</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#2c3630]">
                    <li className="flex gap-3"><span className="text-[#1F7D3E] font-bold">I.</span> Clasificar procesos, actividades y tareas.</li>
                    <li className="flex gap-3"><span className="text-[#1F7D3E] font-bold">II.</span> Identificar zona, lugar y si la tarea es rutinaria.</li>
                    <li className="flex gap-3"><span className="text-[#1F7D3E] font-bold">III.</span> Identificar peligros por cada área expuesta.</li>
                    <li className="flex gap-3"><span className="text-[#1F7D3E] font-bold">IV.</span> Observar controles existentes (Fuente, Medio, Individuo).</li>
                    <li className="flex gap-3"><span className="text-[#1F7D3E] font-bold">V.</span> Registrar número de trabajadores expuestos.</li>
                    <li className="flex gap-3"><span className="text-[#1F7D3E] font-bold">VI.</span> Establecer medidas de intervención necesarias.</li>
                  </ul>
                </div>

                <div className="space-y-6">
                  {[
                    { 
                      title: "1. Procesos y Actividades", 
                      items: [
                        { label: "1.1 Proceso", desc: "Clasificar el tipo de proceso (Estratégico, Misional, Apoyo). Ej: Administrativo Financiero." },
                        { label: "1.2 Zona o Lugar", desc: "Sitio exacto donde se realiza. Ej: Oficina de Contabilidad y Compras." },
                        { label: "1.3 Actividad", desc: "Detalle de la labor. Ej: Tesorería, Caja y Facturación." },
                        { label: "1.4 Tarea", desc: "Acción específica. Ej: Digitar, revisar documentos, sellar." },
                        { label: "1.5 Cargo", desc: "Puesto de quien ejecuta. Ej: Médico, Auxiliar, Administrativo." },
                        { label: "1.6 Rutinaria", desc: "Definir si se realiza habitualmente (SÍ o NO)." }
                      ]
                    },
                    { 
                      title: "2. Identificación de Peligros", 
                      items: [
                        { label: "2.1 Descripción", desc: "Detalle del peligro. Ej: Movimientos repetitivos de miembros superiores." },
                        { label: "2.2 Clasificación", desc: "Elegir entre Biológico, Físico, Químico, Psicosocial, Biomecánico, Seguridad o Natural." },
                        { label: "2.3 Efectos", desc: "Daños potenciales a la salud o instalaciones. Ej: Tendinitis, Túnel del Carpo." }
                      ]
                    },
                    { 
                      title: "3. Controles Existentes", 
                      items: [
                        { label: "3.1 Fuente", desc: "Controles donde se origina el riesgo. Si no hay, colocar 'Ninguno'." },
                        { label: "3.2 Medio", desc: "Controles en la transmisión del riesgo. Ej: Barreras, señalización." },
                        { label: "3.3 Individuo", desc: "Controles en la persona. Ej: EPP, pausas activas, capacitación." }
                      ]
                    },
                    { 
                      title: "4. Evaluación y Valoración", 
                      items: [
                        { label: "4.1 Nivel de Deficiencia (ND)", desc: "Magnitud de la vinculación del peligro con incidentes (0, 2, 6, 10)." },
                        { label: "4.2 Nivel de Exposición (NE)", desc: "Frecuencia de exposición (1, 2, 3, 4)." },
                        { label: "4.3 Nivel de Probabilidad (NP)", desc: "Multiplicación de ND x NE. Indica qué tan posible es el daño." },
                        { label: "4.4 Interpretación NP", desc: "Significado cualitativo (Muy Alto, Alto, Medio, Bajo)." },
                        { label: "4.5 Nivel Consecuencia (NC)", desc: "Gravedad del daño más probable (10, 25, 60, 100)." },
                        { label: "4.6 Nivel de Riesgo (NR)", desc: "Resultado de NP x NC. Define la prioridad de intervención." },
                        { label: "4.7 Interpretación NR", desc: "Categoría de riesgo (I, II, III, IV)." },
                        { label: "4.8 Aceptabilidad", desc: "Decisión sobre si el riesgo es tolerable o requiere control inmediato." }
                      ]
                    }
                  ].map((section, idx) => (
                    <div key={idx} className="space-y-4">
                      <h4 className="text-sm font-black text-[#1F7D3E] uppercase tracking-widest flex items-center gap-3">
                        <span className="h-[2px] w-8 bg-[#1F7D3E]"></span>
                        {section.title}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {section.items.map((item, i) => (
                          <div key={i} className="p-4 rounded-xl border border-[#e2e9e4] hover:border-[#1F7D3E] transition-all group">
                            <span className="text-[10px] font-bold text-[#1F7D3E] uppercase block mb-1">{item.label}</span>
                            <p className="text-xs text-[#5e6b62] leading-relaxed group-hover:text-[#2c3630]">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'peligros' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="overflow-x-auto rounded-2xl border border-[#e2e9e4] shadow-sm">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#1F7D3E] text-white text-[10px] uppercase font-black tracking-widest">
                      <th className="px-6 py-4 border-r border-white/10 text-left">Biológico</th>
                      <th className="px-6 py-4 border-r border-white/10 text-left">Físico</th>
                      <th className="px-6 py-4 border-r border-white/10 text-left">Químico</th>
                      <th className="px-6 py-4 border-r border-white/10 text-left">Psicosocial</th>
                      <th className="px-6 py-4 border-r border-white/10 text-left">Biomecánico</th>
                      <th className="px-6 py-4 border-r border-white/10 text-left">Condiciones de Seguridad</th>
                      <th className="px-6 py-4 text-left">Fenómenos Naturales</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#2c3630] divide-y divide-[#e2e9e4]">
                    <tr className="align-top divide-x divide-[#e2e9e4] hover:bg-[#f8faf9] transition-colors">
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Virus</div>
                        <div className="font-bold">• Bacterias</div>
                        <div className="font-bold">• Hongos</div>
                        <div className="font-bold">• Rickettsias</div>
                        <div className="font-bold">• Parásitos</div>
                        <div className="font-bold">• Picaduras</div>
                        <div className="font-bold">• Mordeduras</div>
                        <div className="font-bold">• Fluidos / Excrementos</div>
                      </td>
                      <td className="p-5 space-y-3">
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Ruido:</span>
                          <div>Impacto, intermitente, continuo.</div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Iluminación:</span>
                          <div>Exceso o deficiencia.</div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Vibración:</span>
                          <div>Cuerpo entero, segmentaria.</div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Temperaturas:</span>
                          <div>Calor o frío extremo.</div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Presión:</span>
                          <div>Atmosférica normal / ajustada.</div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Radiaciones:</span>
                          <div>Ionizantes (X, Gama) y No Ionizantes (Laser, UV, IR).</div>
                        </div>
                      </td>
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Polvos (Org / Inorg)</div>
                        <div className="font-bold">• Fibras</div>
                        <div className="font-bold">• Líquidos (Nieblas, rocíos)</div>
                        <div className="font-bold">• Gases y vapores</div>
                        <div className="font-bold">• Humos metálicos</div>
                        <div className="font-bold">• Material particulado</div>
                      </td>
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Gestión organizacional</div>
                        <div className="font-bold">• Características organización</div>
                        <div className="font-bold">• Grupo social de trabajo</div>
                        <div className="font-bold">• Condiciones de la tarea</div>
                        <div className="font-bold">• Interfaz persona-tarea</div>
                        <div className="font-bold">• Jornada de trabajo</div>
                      </td>
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Postura (prolongada, forzada)</div>
                        <div className="font-bold">• Esfuerzo</div>
                        <div className="font-bold">• Movimiento repetitivo</div>
                        <div className="font-bold">• Manipulación de cargas</div>
                      </td>
                      <td className="p-5 space-y-3">
                        <div><span className="font-bold">Mecánico:</span> Herramientas, máquinas, piezas.</div>
                        <div><span className="font-bold">Eléctrico:</span> Alta/Baja tensión, estática.</div>
                        <div><span className="font-bold">Locativo:</span> Almacenamiento, superficies, orden.</div>
                        <div><span className="font-bold">Tecnológico:</span> Explosión, fuga, derrame, incendio.</div>
                        <div><span className="font-bold">Accidentes:</span> Tránsito.</div>
                        <div><span className="font-bold">Públicos:</span> Robos, asaltos, orden público.</div>
                        <div className="font-bold">• Trabajo en alturas</div>
                        <div className="font-bold">• Espacios confinados</div>
                      </td>
                      <td className="p-5 space-y-2 text-blue-800">
                        <div className="font-bold">• Sismo</div>
                        <div className="font-bold">• Terremoto</div>
                        <div className="font-bold">• Vendaval</div>
                        <div className="font-bold">• Inundación</div>
                        <div className="font-bold">• Derrumbe</div>
                        <div className="font-bold">• Precipitaciones</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'valoracion' && (
            <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Table 1 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 1: Nivel de Deficiencia (ND)</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px]">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">ND</td>
                        <td className="p-2 border">Significado</td>
                      </tr>
                      <tr><td className="p-2 border font-bold text-red-600 text-center">10</td><td className="p-2 border">Muy Alto (MA): Peligros muy significativos, eficacia de medidas nula o inexistente.</td></tr>
                      <tr><td className="p-2 border font-bold text-orange-500 text-center">6</td><td className="p-2 border">Alto (A): Peligros con consecuencias significativas, eficacia baja.</td></tr>
                      <tr><td className="p-2 border font-bold text-yellow-600 text-center">2</td><td className="p-2 border">Medio (M): Consecuencias poco significativas, eficacia moderada.</td></tr>
                      <tr><td className="p-2 border font-bold text-green-600 text-center">0</td><td className="p-2 border">Bajo (B): Sin anomalía destacable, riesgo controlado.</td></tr>
                    </table>
                  </div>
                </div>

                {/* Table 2 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 2: Nivel de Exposición (NE)</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px]">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">NE</td>
                        <td className="p-2 border">Significado</td>
                      </tr>
                      <tr><td className="p-2 border font-bold text-red-600 text-center">4</td><td className="p-2 border">Continua (EC): Sin interrupción o tiempos prolongados.</td></tr>
                      <tr><td className="p-2 border font-bold text-orange-500 text-center">3</td><td className="p-2 border">Frecuente (EF): Varias veces durante la jornada por tiempos cortos.</td></tr>
                      <tr><td className="p-2 border font-bold text-yellow-600 text-center">2</td><td className="p-2 border">Ocasional (EO): Alguna vez durante la jornada por tiempo corto.</td></tr>
                      <tr><td className="p-2 border font-bold text-green-600 text-center">1</td><td className="p-2 border">Esporádica (EE): De manera eventual.</td></tr>
                    </table>
                  </div>
                </div>
              </div>

              {/* Table 3 & 4 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 3: Nivel de Probabilidad (NP = ND x NE)</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px] text-center">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border" rowSpan={2}>ND</td>
                        <td className="p-2 border" colSpan={4}>NE</td>
                      </tr>
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">4</td><td className="p-2 border">3</td><td className="p-2 border">2</td><td className="p-2 border">1</td>
                      </tr>
                      <tr><td className="p-2 border font-bold bg-[#f8faf9]">10</td><td className="p-2 border bg-red-100 text-red-700 font-bold">40</td><td className="p-2 border bg-red-50 text-red-600">30</td><td className="p-2 border bg-orange-50 text-orange-600">20</td><td className="p-2 border bg-orange-50 text-orange-600">10</td></tr>
                      <tr><td className="p-2 border font-bold bg-[#f8faf9]">6</td><td className="p-2 border bg-red-50 text-red-600">24</td><td className="p-2 border bg-orange-50 text-orange-600">18</td><td className="p-2 border bg-orange-50 text-orange-600">12</td><td className="p-2 border bg-yellow-50 text-yellow-600">6</td></tr>
                      <tr><td className="p-2 border font-bold bg-[#f8faf9]">2</td><td className="p-2 border bg-yellow-50 text-yellow-600">8</td><td className="p-2 border bg-yellow-50 text-yellow-600">6</td><td className="p-2 border bg-green-50 text-green-600">4</td><td className="p-2 border bg-green-50 text-green-600">2</td></tr>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 4: Significado de NP</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px]">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">Nivel</td><td className="p-2 border">NP</td><td className="p-2 border">Significado</td>
                      </tr>
                      <tr className="bg-red-50"><td className="p-2 border font-bold text-red-700">Muy Alto (MA)</td><td className="p-2 border text-center">40-24</td><td className="p-2 border">Materialización del riesgo ocurre con frecuencia.</td></tr>
                      <tr className="bg-orange-50"><td className="p-2 border font-bold text-orange-700">Alto (A)</td><td className="p-2 border text-center">20-10</td><td className="p-2 border">Es posible que suceda varias veces en la vida laboral.</td></tr>
                      <tr className="bg-yellow-50"><td className="p-2 border font-bold text-yellow-700">Medio (M)</td><td className="p-2 border text-center">8-6</td><td className="p-2 border">Es posible que suceda el daño alguna vez.</td></tr>
                      <tr className="bg-green-50"><td className="p-2 border font-bold text-green-700">Bajo (B)</td><td className="p-2 border text-center">4-2</td><td className="p-2 border">No es esperable, aunque puede ser concebible.</td></tr>
                    </table>
                  </div>
                </div>
              </div>

              {/* Table 5 & 6 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 5: Nivel de Consecuencia (NC)</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px]">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">Valor</td><td className="p-2 border">Significado (Daños Personales)</td>
                      </tr>
                      <tr><td className="p-2 border font-bold text-red-600 text-center">100</td><td className="p-2 border">Mortal o Catastrófico (M): Muerte(s).</td></tr>
                      <tr><td className="p-2 border font-bold text-orange-600 text-center">60</td><td className="p-2 border">Muy Grave (MG): Incapacidad permanente parcial o invalidez.</td></tr>
                      <tr><td className="p-2 border font-bold text-yellow-600 text-center">25</td><td className="p-2 border">Grave (G): Incapacidad laboral temporal (ILT).</td></tr>
                      <tr><td className="p-2 border font-bold text-green-600 text-center">10</td><td className="p-2 border">Leve (L): Lesiones que no requieren incapacidad.</td></tr>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 6: Nivel de Riesgo (NR = NP x NC)</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px] text-center">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border" rowSpan={2}>NC</td>
                        <td className="p-2 border" colSpan={4}>Nivel de Probabilidad (NP)</td>
                      </tr>
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">40-24</td><td className="p-2 border">20-10</td><td className="p-2 border">8-6</td><td className="p-2 border">4-2</td>
                      </tr>
                      <tr><td className="p-2 border font-bold">100</td><td className="p-2 border bg-red-100">I 4000-2400</td><td className="p-2 border bg-red-100">I 2000-1000</td><td className="p-2 border bg-red-100">I 800-600</td><td className="p-2 border bg-orange-100">II 400-200</td></tr>
                      <tr><td className="p-2 border font-bold">60</td><td className="p-2 border bg-red-100">I 2400-1440</td><td className="p-2 border bg-red-100">I 1200-600</td><td className="p-2 border bg-orange-100">II 480-360</td><td className="p-2 border bg-orange-100 text-[8px]">II 240 / III 120</td></tr>
                      <tr><td className="p-2 border font-bold">25</td><td className="p-2 border bg-red-100">I 1000-600</td><td className="p-2 border bg-orange-100">II 500-250</td><td className="p-2 border bg-orange-100">II 200-150</td><td className="p-2 border bg-yellow-100">III 100-50</td></tr>
                      <tr><td className="p-2 border font-bold">10</td><td className="p-2 border bg-orange-100">II 400-240</td><td className="p-2 border bg-yellow-100">III 200-100</td><td className="p-2 border bg-yellow-100">III 80-60</td><td className="p-2 border bg-green-100">IV 40-20</td></tr>
                    </table>
                  </div>
                </div>
              </div>

              {/* Table 7 & 8 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 7: Significado del NR</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px]">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">NR</td><td className="p-2 border">Significado</td>
                      </tr>
                      <tr className="bg-red-50"><td className="p-2 border font-bold text-red-700">I</td><td className="p-2 border">Situación crítica. Suspender actividades. Intervención urgente.</td></tr>
                      <tr className="bg-orange-50"><td className="p-2 border font-bold text-orange-700">II</td><td className="p-2 border">Corregir y adoptar medidas de inmediato. Suspender si NR ≥ 360.</td></tr>
                      <tr className="bg-yellow-50"><td className="p-2 border font-bold text-yellow-700">III</td><td className="p-2 border">Mejorar si es posible. Justificar rentabilidad.</td></tr>
                      <tr className="bg-green-50"><td className="p-2 border font-bold text-green-700">IV</td><td className="p-2 border">Mantener medidas. Comprobaciones periódicas.</td></tr>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-tighter">Tabla 8: Aceptabilidad del Riesgo</h4>
                  <div className="overflow-hidden border border-[#e2e9e4] rounded-xl">
                    <table className="w-full text-[10px]">
                      <tr className="bg-[#f0f9f1] font-bold text-[#1F7D3E]">
                        <td className="p-2 border">Nivel NR</td><td className="p-2 border">Aceptabilidad</td>
                      </tr>
                      <tr><td className="p-2 border font-bold text-red-700">I</td><td className="p-2 border">No Aceptable</td></tr>
                      <tr><td className="p-2 border font-bold text-orange-700">II</td><td className="p-2 border">No Aceptable o Aceptable con Control Específico</td></tr>
                      <tr><td className="p-2 border font-bold text-yellow-700">III</td><td className="p-2 border">Mejorable (Aceptable)</td></tr>
                      <tr><td className="p-2 border font-bold text-green-700">IV</td><td className="p-2 border">Aceptable</td></tr>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consecuencias' && (
            <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "BIOLÓGICO",
                    risks: [
                      { p: "Mordedura perros/gatos", c: "Heridas, rabia." },
                      { p: "Mordedura ratones", c: "Leptospirosis." },
                      { p: "Serpientes", c: "Envenenamiento, muerte." },
                      { p: "Abejas/Avispas", c: "Reacción alérgica, celulitis." },
                      { p: "Microorganismos", c: "Infecciones según el germen." },
                      { p: "Fluidos (Sangre)", c: "Hepatitis, VIH." }
                    ]
                  },
                  {
                    title: "FÍSICO",
                    risks: [
                      { p: "Ruido de impacto", c: "Trauma acústico, estrés." },
                      { p: "Ruido intermitente", c: "Cefaleas, hipoacusia." },
                      { p: "Iluminación (exceso/def)", c: "Fatiga visual, cefalea." },
                      { p: "Vibración (cuerpo entero)", c: "Dificultad equilibrio, mareo." },
                      { p: "Radiación X/Gama", c: "Cáncer, leucemia, muerte." },
                      { p: "Laser/UV", c: "Quemaduras retina, cataratas." }
                    ]
                  },
                  {
                    title: "QUÍMICO",
                    risks: [
                      { p: "Polvos orgánicos", c: "Bisinosis, asma ocupacional." },
                      { p: "Polvos inorgánicos", c: "Silicosis, asbestosis." },
                      { p: "Líquidos/Nieblas", c: "Quemaduras, intoxicación." },
                      { p: "Gases/Vapores", c: "Intoxicación crónica respiratoria." },
                      { p: "Humos metálicos", c: "Fibrosis pulmonar." }
                    ]
                  },
                  {
                    title: "BIOMECÁNICO",
                    risks: [
                      { p: "Postura sentada/pie", c: "Lesiones espalda, varices." },
                      { p: "Postura arrodillado", c: "Lesiones rodilla, tendinitis." },
                      { p: "Postura forzada", c: "Manguito rotador, epicondilitis." },
                      { p: "Esfuerzo excesivo", c: "Hernias discales, lumbalgias." },
                      { p: "Mov. Repetitivo", c: "Túnel carpiano, tenosinovitis." }
                    ]
                  },
                  {
                    title: "SEGURIDAD",
                    risks: [
                      { p: "Mecánico (Máquinas)", c: "Amputaciones, cortes, golpes." },
                      { p: "Eléctrico (Alta/Baja)", c: "Electrocución, paro cardiaco." },
                      { p: "Locativo (Caída objetos)", c: "Trauma craneal, aplastamiento." },
                      { p: "Tecnológico (Incendio)", c: "Quemaduras 3°, asfixia." },
                      { p: "Alturas", c: "Politraumatismo, muerte." }
                    ]
                  },
                  {
                    title: "PSICOSOCIAL",
                    risks: [
                      { p: "Gestión Organizacional", c: "Demandas cualitativas, estrés." },
                      { p: "Interfaz persona-tarea", c: "Falta de reconocimiento, fatiga." },
                      { p: "Jornada de trabajo", c: "Rotación nocturna, agotamiento." }
                    ]
                  }
                ].map((cat, i) => (
                  <div key={i} className="rounded-2xl border border-[#e2e9e4] overflow-hidden flex flex-col">
                    <div className="bg-[#1F7D3E] px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest">{cat.title}</div>
                    <div className="p-4 space-y-3 flex-1 bg-[#f8faf9]">
                      {cat.risks.map((r, j) => (
                        <div key={j} className="space-y-1">
                          <p className="text-[10px] font-bold text-[#1F7D3E] leading-tight">{r.p}</p>
                          <p className="text-[10px] text-[#5e6b62] pl-2 border-l border-[#d1e2d6]">{r.c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#f8faf9] border-t border-[#e2e9e4] flex items-center justify-between">
          <div className="flex gap-4">
            <span className="text-[9px] text-[#8aa08f] uppercase font-bold tracking-widest bg-white px-3 py-1 rounded-full border">Referencia: GTC 45:2012</span>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-[#1F7D3E] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#1F7D3E]/20 hover:bg-[#186331] hover:scale-105 transition-all"
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
