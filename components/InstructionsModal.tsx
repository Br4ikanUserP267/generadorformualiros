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
    { id: 'instructivo', label: 'Instructivo' },
    { id: 'peligros', label: 'Clasificación de Peligros' },
    { id: 'valoracion', label: 'Tablas de Valoración' },
    { id: 'consecuencias', label: 'Riesgos y Consecuencias' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#e2e9e4] flex items-center justify-between bg-white sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#f0f9f1] flex items-center justify-center text-[#1F7D3E]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0f2b1a]">Guía de Construcción de Matriz</h2>
              <p className="text-sm text-[#5e6b62]">Instructivos y tablas de referencia según GTC 45</p>
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
        <div className="px-8 bg-gray-50 border-b border-[#e2e9e4] flex gap-8 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
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
        <div className="flex-1 overflow-auto p-8 bg-white">
          {activeTab === 'instructivo' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-[#1F7D3E]">Proceso de Identificación de Peligros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl border border-[#e2e9e4] bg-[#f8faf9] space-y-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1F7D3E] text-white flex items-center justify-center font-bold">1</span>
                    <h4 className="font-bold text-[#0f2b1a]">Definir Instrumento</h4>
                    <p className="text-sm text-[#5e6b62] leading-relaxed">
                      Utilizar la metodología GTC 45 para la identificación de peligros y valoración de riesgos.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-[#e2e9e4] bg-[#f8faf9] space-y-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1F7D3E] text-white flex items-center justify-center font-bold">2</span>
                    <h4 className="font-bold text-[#0f2b1a]">Clasificar Procesos</h4>
                    <p className="text-sm text-[#5e6b62] leading-relaxed">
                      Dividir las actividades por procesos (Estratégicos, Misionales, de Apoyo o Evaluación).
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-[#e2e9e4] bg-[#f8faf9] space-y-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1F7D3E] text-white flex items-center justify-center font-bold">3</span>
                    <h4 className="font-bold text-[#0f2b1a]">Identificar Peligros</h4>
                    <p className="text-sm text-[#5e6b62] leading-relaxed">
                      Observar las condiciones de trabajo y consultar la tabla de clasificación de peligros.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-[#e2e9e4] bg-[#f8faf9] space-y-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1F7D3E] text-white flex items-center justify-center font-bold">4</span>
                    <h4 className="font-bold text-[#0f2b1a]">Valorar Riesgos</h4>
                    <p className="text-sm text-[#5e6b62] leading-relaxed">
                      Asignar niveles de deficiencia (ND), exposición (NE) y consecuencia (NC).
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'peligros' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <table className="w-full border-collapse rounded-xl overflow-hidden border border-[#e2e9e4]">
                <thead>
                  <tr className="bg-[#1F7D3E] text-white text-[10px] uppercase tracking-widest">
                    <th className="px-4 py-3 border-r border-white/10">Biológico</th>
                    <th className="px-4 py-3 border-r border-white/10">Físico</th>
                    <th className="px-4 py-3 border-r border-white/10">Químico</th>
                    <th className="px-4 py-3 border-r border-white/10">Psicosocial</th>
                    <th className="px-4 py-3 border-r border-white/10">Biomecánico</th>
                    <th className="px-4 py-3 border-r border-white/10">Condiciones de Seguridad</th>
                    <th className="px-4 py-3">Fenómenos Naturales</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-[#2c3630]">
                  <tr className="align-top divide-x divide-[#e2e9e4] bg-white">
                    <td className="p-3 space-y-1">
                      <div>• Virus</div>
                      <div>• Bacterias</div>
                      <div>• Hongos</div>
                      <div>• Rickettsias</div>
                      <div>• Parásitos</div>
                      <div>• Picaduras</div>
                      <div>• Mordeduras</div>
                      <div>• Fluidos o excrementos</div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div className="font-bold">Ruido:</div>
                      <div>• De impacto</div>
                      <div>• Continuo</div>
                      <div className="font-bold pt-2">Iluminación:</div>
                      <div>• Exceso o deficiencia</div>
                      <div className="font-bold pt-2">Vibración:</div>
                      <div>• Cuerpo entero</div>
                      <div>• Segmentaria</div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div>• Polvos orgánicos inorgánicos</div>
                      <div>• Fibras</div>
                      <div>• Líquidos (nieblas y rocíos)</div>
                      <div>• Gases y vapores</div>
                      <div>• Humos metálicos, no metálicos</div>
                      <div>• Material particulado</div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div>• Gestión organizacional</div>
                      <div>• Características de la organización</div>
                      <div>• Características del grupo social</div>
                      <div>• Condiciones de la tarea</div>
                      <div>• Interfaz persona-tarea</div>
                      <div>• Jornada de trabajo</div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div>• Postura (prolongada, mantenida, forzada, antigravitacional)</div>
                      <div>• Esfuerzo</div>
                      <div>• Movimiento repetitivo</div>
                      <div>• Manipulación manual de cargas</div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div>• Mecánico</div>
                      <div>• Eléctrico</div>
                      <div>• Locativo</div>
                      <div>• Tecnológico</div>
                      <div>• Accidentes de tránsito</div>
                      <div>• Públicos (Robos, asaltos, atentados)</div>
                      <div>• Trabajo en alturas</div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div>• Sismo</div>
                      <div>• Terremoto</div>
                      <div>• Vendaval</div>
                      <div>• Inundación</div>
                      <div>• Derrumbe</div>
                      <div>• Precipitaciones</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'valoracion' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <h4 className="text-sm font-extrabold text-[#1F7D3E] uppercase tracking-wider">Nivel de Deficiencia (ND)</h4>
                  <table className="w-full text-xs border border-[#e2e9e4]">
                    <tr className="bg-[#f0f9f1] font-bold">
                      <td className="p-2 border">Valor</td>
                      <td className="p-2 border">Significado</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-red-600 text-center">10</td>
                      <td className="p-2 border">Muy Alto (MA): Peligros significativos detectados.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-orange-500 text-center">6</td>
                      <td className="p-2 border">Alto (A): Peligros que pueden dar lugar a incidentes.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-yellow-600 text-center">2</td>
                      <td className="p-2 border">Medio (M): Peligros que pueden dar lugar a incidentes leves.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-green-600 text-center">0</td>
                      <td className="p-2 border">Bajo (B): No se ha detectado anomalía destacable.</td>
                    </tr>
                  </table>
                </section>

                <section className="space-y-4">
                  <h4 className="text-sm font-extrabold text-[#1F7D3E] uppercase tracking-wider">Nivel de Exposición (NE)</h4>
                  <table className="w-full text-xs border border-[#e2e9e4]">
                    <tr className="bg-[#f0f9f1] font-bold">
                      <td className="p-2 border">Valor</td>
                      <td className="p-2 border">Significado</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-red-600 text-center">4</td>
                      <td className="p-2 border">Continua: Sin interrupción en la jornada.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-orange-500 text-center">3</td>
                      <td className="p-2 border">Frecuente: Varias veces al día.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-yellow-600 text-center">2</td>
                      <td className="p-2 border">Ocasional: Alguna vez en la jornada.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold text-green-600 text-center">1</td>
                      <td className="p-2 border">Esporádica: Eventualmente.</td>
                    </tr>
                  </table>
                </section>
              </div>

              <section className="space-y-4">
                <h4 className="text-sm font-extrabold text-[#1F7D3E] uppercase tracking-wider text-center">Nivel de Consecuencia (NC)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-center">
                    <span className="text-2xl font-black text-red-600 block">100</span>
                    <span className="text-[10px] font-bold uppercase text-red-700">Mortal o Catastrófico</span>
                  </div>
                  <div className="p-4 rounded-xl border border-orange-200 bg-orange-50 text-center">
                    <span className="text-2xl font-black text-orange-600 block">60</span>
                    <span className="text-[10px] font-bold uppercase text-orange-700">Muy Grave (Incap. Perm.)</span>
                  </div>
                  <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-center">
                    <span className="text-2xl font-black text-yellow-600 block">25</span>
                    <span className="text-[10px] font-bold uppercase text-yellow-700">Grave (Incap. Temp.)</span>
                  </div>
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-center">
                    <span className="text-2xl font-black text-green-600 block">10</span>
                    <span className="text-[10px] font-bold uppercase text-green-700">Leve (Lesiones leves)</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'consecuencias' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-[#e2e9e4] space-y-4">
                  <h4 className="font-bold text-[#1F7D3E] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1F7D3E]"></span>
                    Físicos
                  </h4>
                  <div className="text-xs space-y-2">
                    <p><strong>Ruido:</strong> Disminución de la capacidad auditiva, estrés, cefaleas.</p>
                    <p><strong>Vibración:</strong> Afectación osteoarticular, vascular, neurológica.</p>
                    <p><strong>Radiación:</strong> Dermatitis, quemaduras, cáncer de piel.</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-[#e2e9e4] space-y-4">
                  <h4 className="font-bold text-[#1F7D3E] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1F7D3E]"></span>
                    Psicosociales
                  </h4>
                  <div className="text-xs space-y-2">
                    <p><strong>Estrés laboral:</strong> Ansiedad, depresión, burnout.</p>
                    <p><strong>Carga mental:</strong> Fatiga mental, errores, accidentes.</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-[#e2e9e4] space-y-4">
                  <h4 className="font-bold text-[#1F7D3E] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1F7D3E]"></span>
                    Biomecánicos
                  </h4>
                  <div className="text-xs space-y-2">
                    <p><strong>Manipulación cargas:</strong> Lumbalgias, hernias, lesiones musculares.</p>
                    <p><strong>Mov. Repetitivo:</strong> Síndrome de túnel carpiano, tendinitis.</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-[#e2e9e4] space-y-4">
                  <h4 className="font-bold text-[#1F7D3E] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1F7D3E]"></span>
                    Condiciones de Seguridad
                  </h4>
                  <div className="text-xs space-y-2">
                    <p><strong>Mecánico:</strong> Atrapamientos, cortes, golpes, amputaciones.</p>
                    <p><strong>Eléctrico:</strong> Quemaduras, electrocución, muerte.</p>
                    <p><strong>Alturas:</strong> Caídas, politraumatismos, muerte.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-[#e2e9e4] flex items-center justify-between">
          <p className="text-[10px] text-[#8aa08f] uppercase font-bold tracking-widest">Metodología Basada en GTC 45:2012</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#1F7D3E] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#1F7D3E]/20 hover:bg-[#186331] transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
