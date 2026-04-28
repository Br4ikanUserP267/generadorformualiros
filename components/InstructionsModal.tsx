"use client"

import React, { useState, useEffect } from 'react'
import { INITIAL_RIESGOS_DATA } from '@/lib/riesgos-data'

function EditableCell({ value, onSave, className }: { value: string, onSave: (v: string) => void, className?: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(value)

  useEffect(() => { setVal(value) }, [value])

  if (isEditing) {
    return (
      <textarea
        autoFocus
        className={`w-full bg-white border-2 border-[#1F7D3E] p-1 text-black rounded resize-y min-h-[40px] outline-none ${className || ''}`}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => {
          setIsEditing(false)
          if (val !== value) onSave(val)
        }}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setVal(value)
            setIsEditing(false)
          }
        }}
      />
    )
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-black/10 min-h-[1.5rem] rounded px-1 transition-colors ${className || ''}`}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {val || <span className="italic opacity-50">Click para editar</span>}
    </div>
  )
}


interface InstructionsModalProps {
  open: boolean
  onClose: () => void
}

export function InstructionsModal({ open, onClose }: InstructionsModalProps) {
  const [activeTab, setActiveTab] = useState('instructivo')
  const [riesgosData, setRiesgosData] = useState(INITIAL_RIESGOS_DATA)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/configuracion?key=riesgos_data')
        if (res.ok) {
          const config = await res.json()
          if (config && config.valor) {
            let loadedData = config.valor;
            // Hotfix: Ensure NATURAL data is populated if it was missing in the DB
            const naturalIdx = loadedData.findIndex((g: any) => g.title === "NATURAL");
            if (naturalIdx !== -1 && (!loadedData[naturalIdx].categories || loadedData[naturalIdx].categories.length === 0)) {
               const initialNatural = INITIAL_RIESGOS_DATA.find((g: any) => g.title === "NATURAL");
               if (initialNatural) {
                 loadedData[naturalIdx].categories = initialNatural.categories;
                 // Database will be updated on next user edit, or we can just use the merged state
                 fetch('/api/configuracion?key=riesgos_data', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ valor: loadedData })
                 }).catch(console.error);
               }
            }
            setRiesgosData(loadedData)
          }
        }
      } catch (e) {
        console.error('Error loading riesgos data:', e)
      }
    }
    loadData()
  }, [])

  const handleSaveRiesgosData = async (newData: any) => {
    setRiesgosData(newData)
    try {
      await fetch('/api/configuracion?key=riesgos_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: newData })
      })
    } catch (e) {
      console.error('Error saving riesgos data:', e)
    }
  }

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
        { item: "1.1", casilla: "Proceso", diligenciamiento: "Clasificar el tipo de proceso que se va a identificar. Ejemplo: Administrativo Financiero." },
        { item: "1.2", casilla: "Zona o Lugar", diligenciamiento: "Incluir el sitio donde se realizara el proceso. Ejemplo: Oficina de Contabilidad y Compras." },
        { item: "1.3", casilla: "Actividad", diligenciamiento: "Describir en detalle el tipo de actividad a realizar de acuerdo al proceso. Ejemplo: Dentro del proceso financiero se realizan las actividades de Tesoreria, Caja y Facturación." },
        { item: "1.4", casilla: "Tarea", diligenciamiento: "Identificar la tarea que se determinara de la actividad. Ejemplo: Digitar, Revisar documentos, colocar sellos, etc." },
        { item: "1.5", casilla: "Cargo", diligenciamiento: "Identifica el cargo que desempeña Ej: Medico, Jefe, Auxiliar, Adminstrativo u operativo." },
        { item: "1.6", casilla: "Rutinaria SI o No", diligenciamiento: "Identificar si la actividad es Rutinaria SI o No." },
      ]
    },
    {
      id: 2,
      title: "2. Identificación de Peligros",
      subtitle: "Identificar los peligros, incluir todos aquellos relacionados con cada actividad laboral. Considerar quien, cuando y como puede resultar afectado.",
      color: "bg-[#1f7872]",
      items: [
        { item: "2.1", casilla: "Descripción", diligenciamiento: "Comentar los Peligros a los que esta expuesto el trabajador en cada una de las actividades. Ejemplo: Movimientos Repetitivos de miembros superiores." },
        { item: "2.2", casilla: "Clasificación", diligenciamiento: "Determine el tipo de peligro identificado en la casilla Descripción. Debe clasificarse en Biologico, Fisico, Quimico, Psicosocial, Biomecanico, Condiciones de Seguridad o Fenomenos Naturales." },
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
      subtitle: "Evaluar el riesgo, calificando el riesgo asociado a cada peligro, incluyendo los controles existentes que estan implementados.",
      color: "bg-[#4d73a6]",
      items: [
        { item: "4.1", casilla: "Nivel de Deficiencia (ND)", diligenciamiento: "Colocar 0 si es bajo, 2 si es medio, 6 si es alto y 10 si es muy alto (Ver en Tablas de Valoración la Tabla 1: Determinación del Nivel de Deficiencia)." },
        { item: "4.2", casilla: "Nivel de Exposición (NE)", diligenciamiento: "Colocar 4 si es continua, 3 si es frecuente, 2 si es ocasional y 1 si es esporádico (Ver en Tablas de Valoración la Tabla 2: Determinación del Nivel de Exposición)." },
        { item: "4.3", casilla: "Nivel de Probabilidad (NP)", diligenciamiento: "Este valor lo calcula automáticamente la matriz. El resultado se obtiene al multiplicar el valor asignado de Deficiencia por el valor de Exposición. (Ver en Tablas de Valoración la Tabla 3: Determinación del Nivel de Probabilidad)." },
        { item: "4.4", casilla: "Interpretación NP", diligenciamiento: "Este valor lo calcula automáticamente la matriz. De acuerdo al valor de nivel de probabilidad se interpretará de acuerdo a la tabla. Significado de los diferentes niveles de probabilidad en (Muy Alto, Alto, Medio o Bajo). (Ver en Tablas de Valoración la Tabla 4: Significado de Diferentes Niveles de Probabilidad)." },
        { item: "4.5", casilla: "Nivel de Consecuencia (NC)", diligenciamiento: "Coloque 10 si es Leve, 25 si es Grave, 60 si es Muy Grave y 100 si es Catastrófico o Mortal. Para evaluar el Nivel de Consecuencia, tenga en cuenta la consecuencia directa más grave que se pueda presentar en la actividad valorada (Ver en Tablas de Valoración la Tabla 5: Determinación del Nivel de Consecuencia)." },
        { item: "4.6", casilla: "Nivel de Riesgo (NR) e Interpretación", diligenciamiento: "Este valor lo calcula automáticamente la matriz. Los resultados se obtendrán de multiplicar los resultados del Nivel de Probabilidad por el Nivel de Consecuencia. (Ver en Tablas de Valoración la Tabla 6: Determinación del Nivel de Riesgo)." },
        { item: "4.7", casilla: "Interpretación del Riesgo", diligenciamiento: "Este valor lo calcula automáticamente la matriz. Para obtener el resultado de interpretación se interpretará de acuerdo a los criterios de la Tabla 7: Significado del Nivel de Riesgo)." },
        { item: "4.8", casilla: "Aceptabilidad del Riesgo", diligenciamiento: "Este valor lo calcula automáticamente la matriz. El resultado se dará de acuerdo al significado de interpretación del riesgo. (Ver en Tablas de Valoración la Tabla 8: Aceptabilidad del Riesgo)." },
      ]
    },
    {
      id: 5,
      title: "5. Criterios para establecer Controles",
      subtitle: "Si existe una identificación de los peligros y valoración de los riesgos en forma detallada es mucho más fácil para la organización su intervención y control.",
      color: "bg-[#4da66a]",
      items: [
        { item: "5.1", casilla: "Nº Expuestos", diligenciamiento: "Número de Trabajadores involucrados." },
        { item: "5.2", casilla: "Peor Consecuencia", diligenciamiento: "Se determinará el mayor efecto posible en la salud del trabajador. Ejemplo: Pérdida de la capacidad laboral, lumbalgia con incapacidad permanente parcial." },
        { item: "5.3", casilla: "Requisito Legal", diligenciamiento: "La organización establece si existe o no un requisito legal específico a la tarea que se está evaluando para tener parámetros en priorización en la implementación de medidas de intervención." },
      ]
    },
    {
      id: 6,
      title: "6. Medidas de Intervención",
      subtitle: "Una vez completada la valoración de los riesgos, la organización debería estar en capacidad de determinar los controles que se aplicarán",
      color: "bg-[#718f3f]",
      items: [
        { item: "6.1", casilla: "Eliminación", diligenciamiento: "Modificar un diseño para eliminar el peligro, por ejemplo: Introducir dispositivos mecánicos de alzamiento para eliminar el peligro de manipulación manual." },
        { item: "6.2", casilla: "Sustitución", diligenciamiento: "Reemplazar por un material menos peligroso o reducir energia del sistema, por Ejemplo: Reducir la fuerza, el amperaje, la presión, la temperatura, etc." },
        { item: "6.3", casilla: "Controles de Ingeniería", diligenciamiento: "Instalar Sistemas de Ventilación, Protección para las Máquinas, Enclavamiento, Cerramientos Acústicos, etc." },
        { item: "6.4", casilla: "Controles Administrativos", diligenciamiento: "Señalización, Advertencias, Instalación de Alarmas, Procedimientos de Seguridad, Inspección de Equipos, Controles de Acceso de Capacitación de personal." },
        { item: "6.5", casilla: "Equipos y Elementos de Protección Personal", diligenciamiento: "Dar recomendaciones referentes al control de EPP o equipos que sean necesarios, por Ejemplo: Gafas de Seguridad, Protección Auditiva, Mascaras Faciales, Sistema de Detección de Caídas, Respiradores y Guantes, Etc." },
      ]
    }
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-[#e2e9e4]">
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
                    { i: "II", t: "Crear una lista por proceso donde se identifique las actividades, tareas, zona o lugar de ubicación, y si la actividad o tarea es o no rutinaria." },
                    { i: "III", t: "Se debe identificar los peligros a los cuales estna expuestos los trabajadores de cada área." },
                    { i: "IV", t: "Durante el recorrido y la toma de la información se debe observar que controles existen tanto en la fuente como en el medio y el trabajador." },
                    { i: "V", t: "Se debe de tener nota del numero de trabajadores expuestos por proceso." },
                    { i: "VI", t: "Al obtener la información y al evaluar los controles existentes observados procedemos a establecer las medidas de intervención necesarias." }
                  ].map((ind, idx) => (
                    <React.Fragment key={idx}>
                      <div className="border-r-2 border-b-2 border-black p-2 text-center font-bold bg-[#f3f3f3]">{ind.i}</div>
                      <div className="border-b-2 border-black p-2 bg-white">{ind.t}</div>
                    </React.Fragment>
                  ))}
                </div>
                <div className="bg-[#ccc] p-2 text-center font-bold uppercase text-xs tracking-wider">
                  A continuación encontraras la información necesaria para diligenciar cada una de las casillas.
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
                      <th className="px-6 py-4 border-r border-white/10 text-left min-w-[300px]">Psicosocial</th>
                      <th className="px-6 py-4 border-r border-white/10 text-left">Biomecánico</th>
                      <th className="px-6 py-4 border-r border-white/10 text-left min-w-[300px]">Condiciones de Seguridad</th>
                      <th className="px-6 py-4 text-left min-w-[150px]">Fenómenos Naturales</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#2c3630] divide-y divide-[#e2e9e4]">
                    <tr className="align-top divide-x divide-[#e2e9e4] hover:bg-[#f8faf9] transition-colors">
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Virus.</div>
                        <div className="font-bold">• Bacterias.</div>
                        <div className="font-bold">• Hongos.</div>
                        <div className="font-bold">• Rickettsias.</div>
                        <div className="font-bold">• Parásitos.</div>
                        <div className="font-bold">• Picaduras.</div>
                        <div className="font-bold">• Fluidos O Excrementos.</div>
                        <div className="font-bold">• Mordeduras de Animales Ponzoñosos.</div>
                        <div className="font-bold">• Mordeduras de Animales No Ponzoñosos.</div>
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
                          <div>Calor o frío.</div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Presión:</span>
                          <div>Atmosférica normal y ajustada.</div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-[#1F7D3E]">Radiaciones:</span>
                          <div>Ionizantes (Rayos X, Rayos Gamma) y No Ionizantes (Laser, Ultravioleta, Infrarroja, Radiofrecuencia, Microondas).</div>
                        </div>
                      </td>
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Polvos (Organicos o Inorganicos).</div>
                        <div className="font-bold">• Fibras.</div>
                        <div className="font-bold">• Líquidos (Nieblas y rocíos).</div>
                        <div className="font-bold">• Gases y vapores.</div>
                        <div className="font-bold">• Humos metálicos y no metálicos.</div>
                        <div className="font-bold">• Material particulado.</div>
                      </td>
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Gestión organizacional (Estilo de Mando, Pago de Contratación, Participación, Inducción y Capacitación, Bienestar Social, Evaluación del Desempeño, Manejo de Cambios).</div>
                        <div className="font-bold">• Características de la organización del trabajo (Comunicación, Tecnología, Organización del Trabajo, Demandas Cualitativas y Cuantitativas de la Labor).</div>
                        <div className="font-bold">• Características del grupo social del trabajo (Relaciones, Cohesión, Calidad de Interacción, Trabajo en Equipo).</div>
                        <div className="font-bold">• Condiciones de la Tarea (Carga Mental, Contenido de la Tarea, Demandas Emocionales, Sistemas de Control, Definición de Roles, Monotonía, etc.).</div>
                        <div className="font-bold">• Interfase Persona - Tarea (Conocimientos, Habilidad en relación con la Demanda de la Tarea, Iniciativa, Autonomía y Reconocimiento, Identificación de la Persona con la Tarea y la Organización).</div>
                        <div className="font-bold">• Jornada de Trabajo (Pausas, Trabajo Nocturno, Rotación, Horas Extras, Descansos).</div>
                      </td>
                      <td className="p-5 space-y-2">
                        <div className="font-bold">• Postura (Prolongada, Mantenida, Forzada, Antigravitacional,Agachado,Acurrucado).</div>
                        <div className="font-bold">• Sobre Esfuerzo.</div>
                        <div className="font-bold">• Movimiento Repetitivo.</div>
                        <div className="font-bold">• Manipulación Manual de Cargas.</div>
                        <div className="font-bold">• Fuerza, Repeticion.</div>
                        <div className="font-bold">• Posicion Sedente o Bipeda.</div>
                      </td>
                      <td className="p-5 space-y-3">
                        <div><span className="font-bold">Mecánico:</span> Elementos o Partes De Maquina, Herramientas, Equipos, Piezas A Trabajar, Materiales Proyectados Solidos O Fluidos.</div>
                        <div><span className="font-bold">Eléctrico:</span> Alta y Baja Tensión, Estática.</div>
                        <div><span className="font-bold">Locativo:</span> Sistemas Y Medios De Almacenamiento, Superficies De Trabajo (Irregulares, Deslizantes, Con Diferencia Del Nivel), Condiciones De Orden Y Aseo, Caidas De Objeto.</div>
                        <div><span className="font-bold">Tecnológico:</span> Explosión, fuga, derrame, incendio.</div>
                        <div><span className="font-bold">Accidentes:</span> Tránsito.</div>
                        <div><span className="font-bold">Públicos:</span> Robos, atracos, atentados, orden público.</div>
                        <div className="font-bold">• Trabajo en alturas.</div>
                        <div className="font-bold">• Espacios confinados.</div>
                        <div className="font-bold">• Atrapamientos, Atropellamiento, Choque o Volcamiento.</div>
                        <div className="font-bold">• Ahogamiento.</div>
                        <div className="font-bold">• Materiales Cortantes.</div>
                      </td>
                      <td className="p-5 space-y-2 text-blue-800">
                        <div className="font-bold">• Sismo.</div>
                        <div className="font-bold">• Terremoto.</div>
                        <div className="font-bold">• Vendaval.</div>
                        <div className="font-bold">• Inundación.</div>
                        <div className="font-bold">• Derrumbe.</div>
                        <div className="font-bold">• Precipitaciones (Lluvias, Granizadas, Heladas).</div>
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
                  <table className="w-full border-2 border-black text-[10px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 1 Determinación del nivel de deficiencia (ND)</td>
                    </tr>
                    <tr className="bg-[#dce6d1] border-r-2 font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black w-1/4">Nivel de Deficiencia</td>
                      <td className="p-2 border-r-2 border-black w-16">Valor de ND</td>
                      <td className="p-2">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Muy Alto (MA)</td>
                      <td className="p-2 border-r-2 border-black font-bold">10</td>
                      <td className="p-2 text-center">Se ha (n) detectado peligro (s) que determina(n) como posible la generación de incidentes o consecuencias muy significativas, o la eficacia del conjunto de medidas preventivas existentes respecto al riesgo es nula o no existe, o ambas.</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Alto (A)</td>
                      <td className="p-2 border-r-2 border-black font-bold">6</td>
                      <td className="p-2 text-center">Se ha (n) detectada algún (os) peligro (s) que pueden dar lugar a consecuencias significativa (s), o la eficacia del conjunto de medidas preventivas existentes es baja, o ambas.</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Medio (M)</td>
                      <td className="p-2 border-r-2 border-black font-bold">2</td>
                      <td className="p-2 text-center">Se han detectado peligros que pueden dar lugar a consecuencias poco significativas o de menor importancia, o la eficacia del conjunto de medidas preventivas existentes es moderada, o ambas.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">Bajo (B)</td>
                      <td className="p-2 border-r-2 border-black font-bold">No se asigna valor</td>
                      <td className="p-2 text-center">No se ha detectado consecuencia alguna, o la eficacia del conjunto de medidas preventivas existentes es alta, o ambas. El riesgo está controlado.</td>
                    </tr>
                  </table>
                </div>

                {/* Table 2 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[10px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 2 Determinación del nivel de exposición (NE)</td>
                    </tr>
                    <tr className="bg-[#dce6d1] border-r-2 font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black w-1/4">Nivel de Exposición</td>
                      <td className="p-2 border-r-2 border-black w-16">Valor de NE</td>
                      <td className="p-2">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Continua (EC)</td>
                      <td className="p-2 border-r-2 border-black font-bold">4</td>
                      <td className="p-2 text-center">La situación de exposición se presenta sin interrupción o varias veces con tiempo prolongado durante la jornada laboral</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Frecuente (EF)</td>
                      <td className="p-2 border-r-2 border-black font-bold">3</td>
                      <td className="p-2 text-center">La situación de exposición se presenta varias veces durante la jornada laboral por tiempos cortos</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Ocasional (EO)</td>
                      <td className="p-2 border-r-2 border-black font-bold">2</td>
                      <td className="p-2 text-center">La situación de exposición se presenta alguna vez durante la jornada laboral y por un período de tiempo corto</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">Esporádica (EE)</td>
                      <td className="p-2 border-r-2 border-black font-bold">1</td>
                      <td className="p-2 text-center">La situación de exposición se presenta de manera eventual</td>
                    </tr>
                  </table>
                </div>
              </div>

              {/* Table 3 */}
              <div className="space-y-4">
                <table className="w-full border-2 border-black text-[10px] text-center border-collapse">
                  <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                    <td colSpan={6} className="p-2 uppercase italic">Tabla No. 3 Determinación del nivel de probabilidad</td>
                  </tr>
                  <tr>
                    <td rowSpan={2} colSpan={2} className="bg-[#dce6d1] border-r-2 border-b-2 border-black font-bold p-4">Nivel de Probabilidad</td>
                    <td colSpan={4} className="bg-[#dce6d1] border-r-2 border-b-2 border-black font-bold p-2">Nivel de Exposición (NE)</td>
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
                  <table className="w-full border-2 border-black text-[10px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 4 Significado de los diferentes niveles de probabilidad</td>
                    </tr>
                    <tr className="font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black bg-[#dce6d1]">Nivel de probabilidad</td>
                      <td className="p-2 border-r-2 border-black bg-[#dce6d1]">Valor de NP</td>
                      <td className="p-2 bg-[#dce6d1]">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white">Muy Alto (MA)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 40 y 24</td>
                      <td className="p-2 text-center">Situación deficiente con exposición continua o muy deficiente con exposición frecuente. Normalmente la materialización del riesgo ocurre con frecuencia.</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white">Alto (A)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 20 y 10</td>
                      <td className="p-2 text-center">Situación deficiente con exposición frecuente u ocasional, o bien situación muy deficiente con exposición ocasional o esporádica. La materialización del riesgo es posible que suceda varias veces en la vida laboral.</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold bg-[#ffff00]">Medio (M)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 8 y 6</td>
                      <td className="p-2 text-center">Situación deficiente con exposición esporádica o bien situación mejorada con exposición continuada o frecuente. Es posible que suceda el daño alguna vez.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold bg-[#718f3f] text-white">Bajo (B)</td>
                      <td className="p-2 border-r-2 border-black font-bold">Entre 4 y 2</td>
                      <td className="p-2 text-center">Situación mejorable con exposición ocasional o esporádica, o situacion sin anomalía destacable con cualquier nivel de exposición. No es esperable que se materialice el riesgo, aunque puede ser concebible.</td>
                    </tr>
                  </table>
                </div>

                {/* Table 5 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[10px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 5 Determinación del nivel de consecuencia</td>
                    </tr>
                    <tr className="bg-[#dce6d1] border-r-2 font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black">Nivel de Consecuencia</td>
                      <td className="p-2 border-r-2 border-black">Valor de NC</td>
                      <td className="p-2">Significado (Daños personales)</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Mortal o Catastrófico (M)</td>
                      <td className="p-2 border-r-2 border-black font-bold">100</td>
                      <td className="p-2 text-center">Muerte (s).</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Muy Grave (MG)</td>
                      <td className="p-2 border-r-2 border-black font-bold">60</td>
                      <td className="p-2 text-center">Lesiones o enfermedades graves irreparables (incapacidad permanente parcial o invalidez).</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">Grave (G)</td>
                      <td className="p-2 border-r-2 border-black font-bold">25</td>
                      <td className="p-2 text-center">Lesiones o enfermedades con incapacidad laboral temporal (ILT).</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">Leve (L)</td>
                      <td className="p-2 border-r-2 border-black font-bold">10</td>
                      <td className="p-2 text-center">Lesiones o enfermedades que no requieren incapacidad.</td>
                    </tr>
                  </table>
                </div>
              </div>

              {/* Table 6 */}
              <div className="space-y-4">
                <table className="w-full border-2 border-black text-[10px] text-center border-collapse">
                  <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                    <td colSpan={6} className="p-2 uppercase italic">Tabla No. 6 Determinación del nivel de riesgo</td>
                  </tr>
                  <tr>
                    <td rowSpan={2} colSpan={2} className="bg-[#dce6d1] border-r-2 border-b-2 border-black font-bold p-4">Nivel de Riesgo NR = NP x NC</td>
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
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 2000-1200</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 800-600</td>
                    <td className="p-2 bg-[#ffff00] font-bold italic border-b-2 border-black">II 400-200</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="p-2 border-r-2 border-black font-bold bg-white">60</td>
                    <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white italic">I 2400-1440</td>
                    <td className="p-2 border-r-2 border-black font-bold bg-[#941113] text-white italic">I 1200-600</td>
                    <td className="p-2 border-r-2 border-black font-bold bg-[#ffff00] italic">II 480 - 360</td>
                    <td className="p-0 font-bold italic align-middle">
                      <div 
                        className="relative w-full h-full min-h-[60px]"
                        style={{ background: 'linear-gradient(to bottom right, #ffff00 0%, #ffff00 calc(50% - 1px), #000 calc(50% - 1px), #000 calc(50% + 1px), #718f3f calc(50% + 1px), #718f3f 100%)' }}
                      >
                        <div className="absolute top-1 left-2 text-[#2c3630]">II 240</div>
                        <div className="absolute bottom-1 right-2 text-white">III 120</div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="p-2 border-r-2 border-black font-bold bg-white">25</td>
                    <td className="p-2 border-r-2 border-black bg-[#941113] text-white font-bold italic">I 1000-600</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold italic">II 500 -250</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold italic">II 200 -150</td>
                    <td className="p-2 bg-[#718f3f] text-white font-bold italic">III 100-50</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r-2 border-black font-bold bg-white">10</td>
                    <td className="p-2 border-r-2 border-black bg-[#ffff00] font-bold italic">II 400-240</td>
                    <td className="p-0 border-r-2 border-black font-bold italic align-middle">
                      <div 
                        className="relative w-full h-full min-h-[60px]"
                        style={{ background: 'linear-gradient(to bottom right, #ffff00 0%, #ffff00 calc(50% - 1px), #000 calc(50% - 1px), #000 calc(50% + 1px), #718f3f calc(50% + 1px), #718f3f 100%)' }}
                      >
                        <div className="absolute top-1 left-2 text-[#2c3630]">II 200</div>
                        <div className="absolute bottom-1 right-2 text-white">III 100</div>
                      </div>
                    </td>
                    <td className="p-2 border-r-2 border-black bg-[#718f3f] text-white font-bold italic">III 80-60</td>
                    <td className="p-0 font-bold italic align-middle">
                      <div 
                        className="relative w-full h-full min-h-[60px]"
                        style={{ background: 'linear-gradient(to bottom right, #718f3f 0%, #718f3f calc(50% - 1px), #000 calc(50% - 1px), #000 calc(50% + 1px), #718f3f calc(50% + 1px), #718f3f 100%)' }}
                      >
                        <div className="absolute top-1 left-2 text-white">III 40</div>
                        <div className="absolute bottom-1 right-2 text-white">IV 20</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Table 7 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[10px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={3} className="p-2 uppercase italic">Tabla No. 7 Significado del nivel de riesgo</td>
                    </tr>
                    <tr className="bg-[#dce6d1] border-r-2 font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black w-24">Nivel de Riesgo</td>
                      <td className="p-2 border-r-2 border-black w-24">Valor de NR</td>
                      <td className="p-2">Significado</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">I</td>
                      <td className="p-2 border-r-2 border-black font-bold">400-600</td>
                      <td className="p-2 text-center">Situación crítica. Suspender actividades hasta que el riesgo esté bajo control. Intervención urgente</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">II</td>
                      <td className="p-2 border-r-2 border-black font-bold">500-150</td>
                      <td className="p-2 text-center">Corregir y adoptar medidas de control de inmediato. Sin embargo, suspenda actividades si el nivel de riesgo está por encima o igual de 360</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">III</td>
                      <td className="p-2 border-r-2 border-black font-bold">120-40</td>
                      <td className="p-2 text-center">Mejorar si es posible. Sería conveniente justificar la intervención y su rentabilidad.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">IV</td>
                      <td className="p-2 border-r-2 border-black font-bold">20</td>
                      <td className="p-2 text-center">Mantener las medidas de control existentes, pero se deberían considerar soluciones o mejoras y se deben hacer comprobaciones periódicas para asegurar que el riesgo aún es aceptable.</td>
                    </tr>
                  </table>
                </div>

                {/* Table 8 */}
                <div className="space-y-4">
                  <table className="w-full border-2 border-black text-[10px] text-center">
                    <tr className="bg-[#d9d9d9] font-bold border-b-2 border-black">
                      <td colSpan={2} className="p-2 uppercase italic">Tabla No. 8 Aceptabilidad del riesgo</td>
                    </tr>
                    <tr className="bg-[#dce6d1] border-r-2 font-bold border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black">Nivel de Riesgo</td>
                      <td className="p-2">Aceptabilidad</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">I</td>
                      <td className="p-2 font-bold">No aceptable</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">II</td>
                      <td className="p-2 font-bold">No aceptable o Aceptable con Control Específico</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-2 border-r-2 border-black font-bold">III</td>
                      <td className="p-2 font-bold">Mejorable</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r-2 border-black font-bold">IV</td>
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
                {riesgosData.map((group: any, idx: number) => {
                  const getCategoryColors = (title: string) => {
                    switch(title) {
                      case "BIOLOGICO": return { header: "bg-[#e5b8b7]", text: "text-black", row: "bg-[#f2dcdb]" };
                      case "FISICO": return { header: "bg-[#8db4e2]", text: "text-black", row: "bg-[#c6d9f0]" };
                      case "QUIMICO": return { header: "bg-[#fabf8f]", text: "text-black", row: "bg-[#fcd5b4]" };
                      case "BIOMECANICOS": return { header: "bg-[#b8cce4]", text: "text-black", row: "bg-[#dce6f1]" };
                      case "LOCATIVO": return { header: "bg-[#ccc0da]", text: "text-black", row: "bg-[#e4dfec]" };
                      case "DEPORTIVO/CULTURAL": return { header: "bg-[#fac090]", text: "text-black", row: "bg-[#fcd5b4]" };
                      case "MECANICO": return { header: "bg-[#ffc000]", text: "text-black", row: "bg-[#fff2cc]" };
                      case "PSICOSOCIAL": return { header: "bg-[#b3a2c7]", text: "text-black", row: "bg-[#e4dfec]" };
                      case "ELECTRICO": return { header: "bg-[#95b3d7]", text: "text-black", row: "bg-[#dce6f1]" };
                      case "TECNOLOGICO": return { header: "bg-[#d99694]", text: "text-black", row: "bg-[#f2dcdb]" };
                      case "PUBLICO": return { header: "bg-[#c4bd97]", text: "text-black", row: "bg-[#ebf1dd]" };
                      case "NATURAL": return { header: "bg-[#00B050]", text: "text-white", row: "bg-[#C4D79B]" };
                      default: return { header: "bg-[#1F7D3E]", text: "text-white", row: "bg-white" };
                    }
                  };
                  const colors = getCategoryColors(group.title);
                  
                  return (
                  <div key={idx} className="border-2 border-black overflow-hidden flex flex-col h-full">
                    <div className={`${colors.header} ${colors.text} p-3 font-black text-center tracking-wider text-sm border-b-2 border-black`}>
                      {group.title}
                    </div>
                    <div className={`${colors.row} flex-1 overflow-auto max-h-[600px] h-full`}>
                      <div className="flex flex-col h-full">
                        {group.categories.map((cat: any, cIdx: number) => (
                          <div key={cIdx} className="flex flex-col flex-1">
                            {cat.category && (
                              <div className={`font-bold ${colors.text} ${colors.header} border-b-2 border-black p-2 text-center text-xs`}>
                                {cat.category}
                              </div>
                            )}
                            <table className="w-full text-[10px] text-center flex-1 h-full">
                              {cIdx === 0 && (
                                <thead>
                                  <tr className={`border-b-2 border-black ${colors.header} ${colors.text}`}>
                                    <th className="p-2 font-bold w-1/2 border-r-2 border-black">PELIGRO</th>
                                    <th className="p-2 font-bold w-1/2">CONSECUENCIAS</th>
                                  </tr>
                                </thead>
                              )}
                              <tbody>
                                {cat.risks.map((r: any, rIdx: number) => (
                                  <tr key={rIdx} className={rIdx !== cat.risks.length - 1 || cIdx !== group.categories.length - 1 ? "border-b-2 border-black" : ""}>
                                    <td className="p-2 border-r-2 border-black text-[#2c3630] align-middle font-medium w-1/2">
                                      <EditableCell 
                                        value={r.p} 
                                        onSave={(newVal) => {
                                          const newData = JSON.parse(JSON.stringify(riesgosData));
                                          newData[idx].categories[cIdx].risks[rIdx].p = newVal;
                                          handleSaveRiesgosData(newData);
                                        }} 
                                      />
                                    </td>
                                    <td className="p-2 text-[#2c3630] align-middle w-1/2">
                                      <EditableCell 
                                        value={r.c} 
                                        onSave={(newVal) => {
                                          const newData = JSON.parse(JSON.stringify(riesgosData));
                                          newData[idx].categories[cIdx].risks[rIdx].c = newVal;
                                          handleSaveRiesgosData(newData);
                                        }} 
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )})}
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
