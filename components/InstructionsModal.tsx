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
    { id: 'valoracion', label: 'Tablas de Valoración' },
    { id: 'consecuencias', label: 'Riesgos y Consecuencias' },
  ]

  const instructivoData = [
    {
      id: 1,
      title: "1. Información de Procesos, Actividades y Tareas",
      color: "bg-[#f8b133]",
      items: [
        { item: "1.1", casilla: "Proceso", diligenciamiento: "Clasificar el tipo de proceso que se va a identificar. Ejemplo: Administrativo Financiero" },
        { item: "1.2", casilla: "Zona o Lugar", diligenciamiento: "Incluir el sitio donde se realizara el proceso. Ejemplo: Oficina de Contabilidad y Compras" },
        { item: "1.3", casilla: "Actividad", diligenciamiento: "Describir en detalle el tipo de actividad a realizar de acuerdo al proceso. Ejemplo: Dentro del proceso financiero se realizan las actividades de Tesoreria, Caja y Facturación." },
        { item: "1.4", casilla: "Tarea", diligenciamiento: "Identificar la tarea que se determinara de la actividad. Ejemplo: Digitar, Revisar documentos, colocar sellos, etc." },
        { item: "1.5", casilla: "Cargo", diligenciamiento: "Identifica el cargo que desempeña Ej: Medico, Jefe, Auxiliar, Adminstrativo u operativo." },
        { item: "1.6", casilla: "Rutinaria SI o No", diligenciamiento: "Identificar si la actividad es Rutinaria SI o No" },
      ]
    },
    {
      id: 2,
      title: "2. Identificación de Peligros",
      subtitle: "Identificar los peligros, incluir todos aquellos relacionados con cada actividad laboral. Considerar quien, cuando y como puede resultar afectado",
      color: "bg-[#1f7872]",
      items: [
        { item: "2.1", casilla: "Descripción", diligenciamiento: "Comentar los Peligros a los que esta expuesto el trabajador en cada una de las actividades. Ejemplo: Movimientos Repetitivos de miembros superiores." },
        { item: "2.2", casilla: "Clasificación", diligenciamiento: "Determine el tipo de peligro identificado en la casilla Descripción. Debe clasificarse en Biologico, Fisico, Quimico, Psicosocial, Biomecanico, Condiciones de Seguridad o Fenomenos Naturales" },
        { item: "2.3", casilla: "Efectos Posibles", diligenciamiento: "Considerar los efectos en la salud del individuo o seguridad de las instalaciones. Ejemplo: Tendinitis, Sindrome de Tunel del Carpo." },
      ]
    },
    {
      id: 3,
      title: "3. Identificación de Controles Existentes",
      subtitle: "Identificar los controles existentes. Relacionar todos los controles que la organización ha implementado para reducir el riesgo.",
      color: "bg-[#a64d4d]",
      items: [
        { item: "3.1", casilla: "Fuente", diligenciamiento: "Controles existentes a nivel de la fuente que genera el factor de riesgo. Si no existe debe colocar ninguno." },
        { item: "3.2", casilla: "Medio", diligenciamiento: "Controles existentes a nivel del medio de transmisión del factor de riesgo. Si no existen debe colocar ninguno." },
        { item: "3.3", casilla: "Individuo", diligenciamiento: "Controles existentes a nivel de la persona o receptor del factor de riesgo. Ejemplo: Se realizan pausas activas." },
      ]
    },
    {
      id: 4,
      title: "4. Evaluación del Riesgo",
      subtitle: "Determinar la probabilidad de que ocurran eventos específicos y la magnitud de sus consecuencias.",
      color: "bg-[#4d73a6]",
      items: [
        { item: "4.1", casilla: "Nivel de Deficiencia (ND)", diligenciamiento: "Magnitud de la relación entre el conjunto de peligros y su vinculación directa con posibles incidentes (10, 6, 2, 0)." },
        { item: "4.2", casilla: "Nivel de Exposición (NE)", diligenciamiento: "Situación de exposición a un peligro que se presenta en un tiempo determinado (4, 3, 2, 1)." },
        { item: "4.3", casilla: "Nivel de Probabilidad (NP)", diligenciamiento: "Producto de ND por NE. Determina la probabilidad de ocurrencia." },
        { item: "4.4", casilla: "Interpretación NP", diligenciamiento: "Significado cualitativo del nivel de probabilidad (Muy Alto, Alto, Medio o Bajo)." },
        { item: "4.5", casilla: "Nivel de Consecuencia (NC)", diligenciamiento: "Magnitud de los daños esperados (100, 60, 25, 10)." },
        { item: "4.6", casilla: "Nivel de Riesgo (NR)", diligenciamiento: "Producto de NP por NC. Magnitud del riesgo evaluado." },
        { item: "4.7", casilla: "Interpretación NR", diligenciamiento: "Significado del nivel de riesgo (I, II, III o IV)." },
        { item: "4.8", casilla: "Aceptabilidad del Riesgo", diligenciamiento: "Criterio de aceptabilidad según la organización y normatividad." },
      ]
    },
    {
      id: 5,
      title: "5. Criterios para Controles y Medidas de Intervención",
      subtitle: "Establecer la prioridad de los controles y determinar las medidas de intervención necesarias.",
      color: "bg-[#4da66a]",
      items: [
        { item: "5.1", casilla: "Nº Expuestos", diligenciamiento: "Número de trabajadores expuestos al peligro identificado." },
        { item: "5.2", casilla: "Peor Consecuencia", diligenciamiento: "Se determinara el mayor efecto posible en la salud del trabajador. Ejemplo: Perdida de la capacidad laboral." },
        { item: "5.3", casilla: "Requisito Legal", diligenciamiento: "Establecer si existe un requisito legal específico para la tarea evaluada." },
        { item: "6.1", casilla: "Eliminación", diligenciamiento: "Modificar un diseño para eliminar el peligro. Ejemplo: Introducir dispositivos mecánicos." },
        { item: "6.2", casilla: "Sustitución", diligenciamiento: "Reemplazar por un material o proceso menos peligroso." },
        { item: "6.3", casilla: "Controles Ingeniería", diligenciamiento: "Medidas técnicas para controlar el peligro en la fuente o medio." },
        { item: "6.4", casilla: "Controles Admin", diligenciamiento: "Señalización, advertencias, procedimientos de seguridad, etc." },
        { item: "6.5", casilla: "EPP", diligenciamiento: "Equipos de Protección Personal adecuados al riesgo." },
      ]
    }
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
              <h2 className="text-xl font-bold text-[#0f2b1a]">Instructivo Matriz IPVR</h2>
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
              {/* Indications Top Header */}
              <div className="border-2 border-black rounded-lg overflow-hidden">
                <div className="bg-[#ccc] p-2 text-center border-b-2 border-black font-bold uppercase text-xs tracking-wider">
                  Antes de comenzar a diligenciar la matriz de peligros tenga en cuenta las siguientes indicaciones:
                </div>
                <div className="grid grid-cols-[40px_1fr] text-xs">
                  {[
                    { i: "I", t: "Se debe clasificar los procesos, las actividades y las tareas." },
                    { i: "II", t: "Crear una lista por proceso donde se identifique las actividades, tareas, zona o lugar de ubicación, y si la actividad o tarea es o no rutinaria" },
                    { i: "III", t: "Se debe identificar los peligros a los cuales estna expuestos los trabajadores de cada área" },
                    { i: "IV", t: "Durante el recorrido y la toma de la información se debe observar que controles existen tanto en la fuente como en el medio y el trabajador" },
                    { i: "V", t: "Se debe de tener nota del numero de trabajadores expuestos por proceso" },
                    { i: "VI", t: "Al obtener la información y al evaluar los controles existentes observados procedemos a establecer las medidas de intervención necesarias" }
                  ].map((ind, idx) => (
                    <React.Fragment key={idx}>
                      <div className="border-r-2 border-b-2 border-black p-2 text-center font-bold bg-[#f3f3f3]">{ind.i}</div>
                      <div className="border-b-2 border-black p-2 bg-white">{ind.t}</div>
                    </React.Fragment>
                  ))}
                </div>
                <div className="bg-[#ccc] p-2 text-center font-bold uppercase text-xs tracking-wider">
                  A continuación encontraras la información necesaria para diligenciar cada una de las casillas
                </div>
              </div>

              {/* 5 Parts Sections */}
              <div className="space-y-12">
                {instructivoData.map((section) => (
                  <div key={section.id} className="border-2 border-black rounded-lg overflow-hidden shadow-md">
                    <div className={`${section.color} p-3 text-center border-b-2 border-black font-black uppercase text-sm`}>
                      {section.title}
                    </div>
                    {section.subtitle && (
                      <div className="bg-white p-3 text-center border-b-2 border-black italic text-xs">
                        {section.subtitle}
                      </div>
                    )}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#f3f3f3] text-[10px] uppercase font-black tracking-widest border-b-2 border-black">
                          <th className="w-[60px] p-2 border-r-2 border-black">Item</th>
                          <th className="w-[200px] p-2 border-r-2 border-black">Casilla</th>
                          <th className="p-2 text-left">Diligenciamiento</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {section.items.map((item, i) => (
                          <tr key={i} className="border-b-2 border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                            <td className="p-3 border-r-2 border-black text-center font-bold bg-[#f3f3f3]">{item.item}</td>
                            <td className="p-3 border-r-2 border-black text-center font-bold">{item.casilla}</td>
                            <td className="p-3 leading-relaxed">{item.diligenciamiento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
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
            <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-x-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Table 1 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[11px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 1 Determinación del nivel de deficiencia (ND)</td>
                    </tr>
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black w-1/4">Nivel de Deficiencia</td>
                      <td className="p-2 border-r-2 border-black w-16">Valor de ND</td>
                      <td className="p-2">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Muy Alto (MA)</td>
                      <td className="p-2 border-r-2 border-black font-bold">10</td>
                      <td className="p-2 text-left">Se han detectado peligros que determinan como muy posible la generación de incidentes...</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Alto (A)</td>
                      <td className="p-2 border-r-2 border-black font-bold">6</td>
                      <td className="p-2 text-left">Se han detectado algunos peligros que pueden dar lugar a consecuencias significativas...</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Medio (M)</td>
                      <td className="p-2 border-r-2 border-black font-bold">2</td>
                      <td className="p-2 text-left">Se han detectado peligros que pueden dar lugar a consecuencias poco significativas...</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">Bajo (B)</td>
                      <td className="p-2 border-r-2 border-black font-bold">No se asigna valor</td>
                      <td className="p-2 text-left">No se ha detectado anomalía destacable alguna...</td>
                    </tr>
                  </table>
                </div>

                {/* Table 2 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[11px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 2 Determinación del nivel de exposición (NE)</td>
                    </tr>
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black w-1/4">Nivel de Exposición</td>
                      <td className="p-2 border-r-2 border-black w-16">Valor de NE</td>
                      <td className="p-2">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Continua (EC)</td>
                      <td className="p-2 border-r-2 border-black font-bold">4</td>
                      <td className="p-2 text-left">La situación de exposición se presenta sin interrupción o varias veces con tiempo prolongado...</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Frecuente (EF)</td>
                      <td className="p-2 border-r-2 border-black font-bold">3</td>
                      <td className="p-2 text-left">La situación de exposición se presenta varias veces durante la jornada laboral por tiempos cortos.</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Ocasional (EO)</td>
                      <td className="p-2 border-r-2 border-black font-bold">2</td>
                      <td className="p-2 text-left">La situación de exposición se presenta alguna vez durante la jornada laboral y por un periodo de tiempo corto.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">Esporádica (EE)</td>
                      <td className="p-2 border-r-2 border-black font-bold">1</td>
                      <td className="p-2 text-left">La situación de exposición se presenta de manera eventual.</td>
                    </tr>
                  </table>
                </div>
              </div>

              {/* Table 3 (The Matrix from screenshot) */}
              <div className="space-y-4">
                <table className="w-full border-2 border-black text-[11px] text-center border-collapse">
                  <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                    <td colSpan={6} className="p-2 uppercase italic">Tabla No. 3 Determinación del nivel de probabilidad</td>
                  </tr>
                  <tr>
                    <td rowSpan={2} colSpan={2} className="bg-[#dce6d1] border-r-2 border-b-2 border-black font-bold p-4">Nivel de Probabilidad</td>
                    <td colSpan={4} className="bg-[#d9d9d9] border-b-2 border-black font-bold p-2">Nivel de Exposición (NE)</td>
                  </tr>
                  <tr className="border-b-2 border-black font-bold">
                    <td className="p-2 border-r-2 border-black w-1/5">4</td>
                    <td className="p-2 border-r-2 border-black w-1/5">3</td>
                    <td className="p-2 border-r-2 border-black w-1/5">2</td>
                    <td className="p-2 w-1/5">1</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td rowSpan={3} className="bg-[#d9d9d9] border-r-2 border-black font-bold p-4 w-24">Nivel de Deficiencia (ND)</td>
                    <td className="p-2 border-r-2 border-black font-bold bg-white">10</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold">MA-40</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold">MA-30</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold">A-20</td>
                    <td className="p-2 bg-[#941113] text-white font-bold">A-10</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="p-2 border-r-2 border-black font-bold bg-white">6</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold">MA-24</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold">A-18</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold">A-12</td>
                    <td className="p-2 bg-[#ffff00] font-bold">M-6</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r-2 border-black font-bold bg-white">2</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold">M-8</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold">M-6</td>
                    <td className="p-2 border-r-2 border-black bg-[#718f3f] text-white font-bold">B-4</td>
                    <td className="p-2 bg-[#718f3f] text-white font-bold">B-2</td>
                  </tr>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Table 4 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[11px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 4 Significado de los diferentes niveles de probabilidad</td>
                    </tr>
                    <tr className="font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black bg-[#dce6d1]">Nivel de probabilidad</td>
                      <td className="p-2 border-r-2 border-black bg-[#d9d9d9]">Valor de NP</td>
                      <td className="p-2 bg-[#dce6d1]">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white">Muy Alto (MA)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 40 y 24</td>
                      <td className="p-2 text-center">Situación deficiente con exposición continua o muy deficiente con exposición frecuente. normalmente la materialización del riesgo ocurre con frecuencia</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white">Alto (A)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 20 y 10</td>
                      <td className="p-2 text-center">Situación deficiente con exposición frecuente u ocasional, o bien situación muy deficiente con exposición ocasional o esporádica.  La materialización del riesgo es posible que suceda varias veces en la vida laboral</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#ffff00]">Medio (M)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 8 y 6</td>
                      <td className="p-2 text-center">Situación deficiente con exposición esporádica o bien situación mejorada con exposición continuada o frecuente. Es posible que suceda el daño alguna vez.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold bg-[#718f3f] text-white">Bajo (B)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 4 y 2</td>
                      <td className="p-2 text-center">Situación mejorable con exposición ocasional o esporadica, o situacion sin anomalia destacable con cualquier nivel de exposición.  No es esperable que se materialice el riesgo, aunque puede ser concebible</td>
                    </tr>
                  </table>
                </div>

                {/* Table 5 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[11px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 5 Determinación del nivel de consecuencia</td>
                    </tr>
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black">Nivel de Consecuencia</td>
                      <td className="p-2 border-r-2 border-black">NC</td>
                      <td className="p-2">Significado (Daños personales)</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Mortal o Catastrófico (M)</td>
                      <td className="p-2 border-r-2 border-black font-bold">100</td>
                      <td className="p-2 text-left">Muerte (s)</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Muy Grave (MG)</td>
                      <td className="p-2 border-r-2 border-black font-bold">60</td>
                      <td className="p-2 text-left">Lesiones o enfermedades graves irreparables (Incapacidad permanente parcial o invalidez)</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Grave (G)</td>
                      <td className="p-2 border-r-2 border-black font-bold">25</td>
                      <td className="p-2 text-left">Lesiones o enfermedades con incapacidad laboral temporal (ILT)</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">Leve (L)</td>
                      <td className="p-2 border-r-2 border-black font-bold">10</td>
                      <td className="p-2 text-left">Lesiones o enfermedades que no requieren incapacidad</td>
                    </tr>
                  </table>
                </div>
              </div>

              {/* Table 6 (NR Matrix) */}
              <div className="space-y-4">
                <table className="w-full border-2 border-black text-[11px] text-center border-collapse">
                  <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                    <td colSpan={6} className="p-2 uppercase italic">Tabla No. 6 Determinación del nivel de riesgo</td>
                  </tr>
                  <tr>
                    <td rowSpan={2} colSpan={2} className="bg-[#d9d9d9] border-r-2 border-b-2 border-black font-bold p-4">Nivel de Riesgo NR = NP x NC</td>
                    <td colSpan={4} className="bg-[#dce6d1] border-b-2 border-black font-bold p-2">Nivel de Probabilidad (NP)</td>
                  </tr>
                  <tr className="border-b-2 border-black font-bold bg-[#d9d9d9]">
                    <td className="p-2 border-r-2 border-black">40-24</td>
                    <td className="p-2 border-r-2 border-black">20-10</td>
                    <td className="p-2 border-r-2 border-black">8-6</td>
                    <td className="p-2">4-2</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td rowSpan={4} className="bg-[#d9d9d9] border-r-2 border-black font-bold p-4 w-24">Nivel de Consecuencia (NC)</td>
                    <td className="p-2 border-r-2 border-black font-bold bg-white">100</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 4000-2400</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 2000-1000</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 800-600</td>
                    <td className="p-2 bg-[#ffff00] font-bold italic border-b-2 border-black">II 400-200</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="p-2 border-r-2 border-black font-bold bg-white">60</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 2400-1440</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 1200-600</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold italic">II 480-360</td>
                    <td className="p-2 bg-[#ffff00] font-bold italic">II 240 / III 120</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="p-2 border-r-2 border-black font-bold bg-white">25</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 1000-600</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold italic">II 500-250</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold italic">II 200-150</td>
                    <td className="p-2 bg-[#718f3f] text-white font-bold italic">III 100-50</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r-2 border-black font-bold bg-white">10</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold italic">II 400-240</td>
                    <td className="p-2 border-r-2 border-black bg-[#718f3f] text-white font-bold italic">III 200-100</td>
                    <td className="p-2 border-r-2 border-black bg-[#718f3f] text-white font-bold italic">III 80-60</td>
                    <td className="p-2 bg-[#718f3f] text-white font-bold italic">IV 40-20</td>
                  </tr>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Table 7 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[11px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 7 Significado del nivel de riesgo</td>
                    </tr>
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black w-24">Nivel de Riesgo</td>
                      <td className="p-2 border-r-2 border-black w-24">Valor de NR</td>
                      <td className="p-2">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white">I</td>
                      <td className="p-2 border-r-2 border-black font-bold">4000-600</td>
                      <td className="p-2 text-left">Situación crítica. Suspender actividades hasta que el riesgo esté bajo control. Intervención urgente.</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#ffff00]">II</td>
                      <td className="p-2 border-r-2 border-black font-bold">500-150</td>
                      <td className="p-2 text-left">Corregir y adoptar medidas de control de inmediato...</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#718f3f] text-white">III</td>
                      <td className="p-2 border-r-2 border-black font-bold">120-40</td>
                      <td className="p-2 text-left">Mejorar, si es posible. Sería conveniente justificar la intervención y su rentabilidad.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold bg-[#718f3f] text-white">IV</td>
                      <td className="p-2 border-r-2 border-black font-bold">20</td>
                      <td className="p-2 text-left">Mantener las medidas de control existentes...</td>
                    </tr>
                  </table>
                </div>

                {/* Table 8 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[11px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={2} className="p-2 uppercase italic">Tabla No. 8 Aceptabilidad del riesgo</td>
                    </tr>
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black">Nivel de Riesgo</td>
                      <td className="p-2">Aceptabilidad</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white">I</td>
                      <td className="p-2 font-bold">No Aceptable</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#ffff00]">II</td>
                      <td className="p-2 font-bold">No Aceptable o Aceptable con control específico</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#718f3f] text-white">III</td>
                      <td className="p-2 font-bold">Aceptable</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold bg-[#718f3f] text-white">IV</td>
                      <td className="p-2 font-bold">Aceptable</td>
                    </tr>
                  </table>
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
