"use client"

import React, { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ActivityDetailPanelProps {
  description: string
  tasksString: string
  cargo?: string
  onUpdateDescription: (desc: string) => void
  onUpdateTasks: (tasks: string) => void
}

function parseTasksList(raw: string): string[] {
  if (!raw || !raw.trim()) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^(\d+[\.\)\-:]|\-|\*|\•)\s*/, '').trim())
    .filter(Boolean)
}

function stringifyTasksList(items: string[]): string {
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
}

export function ActivityDetailPanel({
  description,
  tasksString,
  cargo = '',
  onUpdateDescription,
  onUpdateTasks,
}: ActivityDetailPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Description inline editing state
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(description || '')

  // Tasks inline editing state
  const tasksList = parseTasksList(tasksString)
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null)
  const [taskDraft, setTaskDraft] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskDraft, setNewTaskDraft] = useState('')

  useEffect(() => {
    setDescDraft(description || '')
  }, [description])

  const handleSaveDescription = () => {
    onUpdateDescription(descDraft.trim())
    setIsEditingDesc(false)
  }

  const handleCancelDescription = () => {
    setDescDraft(description || '')
    setIsEditingDesc(false)
  }

  const handleSaveTaskItem = (index: number) => {
    if (!taskDraft.trim()) return
    const updated = [...tasksList]
    updated[index] = taskDraft.trim()
    onUpdateTasks(stringifyTasksList(updated))
    setEditingTaskIndex(null)
    setTaskDraft('')
  }

  const handleDeleteTaskItem = (index: number) => {
    const updated = tasksList.filter((_, i) => i !== index)
    onUpdateTasks(stringifyTasksList(updated))
    if (editingTaskIndex === index) {
      setEditingTaskIndex(null)
    }
  }

  const handleAddNewTask = () => {
    if (!newTaskDraft.trim()) return
    const updated = [...tasksList, newTaskDraft.trim()]
    onUpdateTasks(stringifyTasksList(updated))
    setNewTaskDraft('')
    setIsAddingTask(false)
  }

  return (
    <div className="rounded-2xl border border-[#dfe9e2] bg-white shadow-2xs overflow-hidden transition-all duration-200">
      {/* Header bar with collapse toggle */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-3.5 bg-[linear-gradient(180deg,#fcfdfc_0%,#f5f9f6_100%)] border-b border-[#dfe9e2] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#edf5ef] transition-colors select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="size-8 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d1e2d6]">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#163522] tracking-tight">
              Detalle de la actividad
            </h3>
            {isCollapsed && (
              <p className="text-xs text-[#7a9182] font-medium truncate">
                {tasksList.length} {tasksList.length === 1 ? 'tarea' : 'tareas'} · Cargo: {cargo || 'Sin cargo'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="size-7 rounded-lg bg-white border border-[#d1e2d6] flex items-center justify-center text-[#5e6b62]">
            {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </span>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#fbfdfb]">
          {/* LEFT: Descripción de la actividad */}
          <div className="rounded-xl border border-[#dfe9e2] bg-white p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1F7D3E]">
                <FileText className="size-4" />
                <span>Descripción de la actividad</span>
              </div>

              {!isEditingDesc && (
                <button
                  type="button"
                  onClick={() => {
                    setDescDraft(description || '')
                    setIsEditingDesc(true)
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F7D3E] hover:text-[#186331] hover:underline"
                >
                  <Pencil className="size-3" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[110px]">
              {isEditingDesc ? (
                <div className="space-y-3">
                  <Textarea
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    placeholder="Describe las labores y responsabilidades de esta actividad..."
                    rows={4}
                    className="w-full text-xs sm:text-sm font-medium leading-relaxed rounded-xl border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white text-[#163522] focus:ring-[#1F7D3E]/20"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelDescription}
                      className="rounded-lg text-xs font-bold text-[#5e6b62] h-8"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveDescription}
                      className="rounded-lg bg-[#1F7D3E] hover:bg-[#186331] text-xs font-bold text-white h-8 px-3"
                    >
                      Guardar descripción
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setDescDraft(description || '')
                    setIsEditingDesc(true)
                  }}
                  className="p-3 rounded-xl border border-transparent hover:border-[#dfe9e2] hover:bg-[#fcfdfc] transition-all cursor-pointer group"
                  title="Clic para editar descripción"
                >
                  {description && description.trim() ? (
                    <p className="text-xs sm:text-sm leading-relaxed text-[#355244] font-medium whitespace-pre-wrap">
                      {description}
                    </p>
                  ) : (
                    <p className="text-xs text-[#a3b8aa] italic">
                      Sin descripción registrada. Haz clic aquí para añadir una descripción detallada.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Tareas registradas */}
          <div className="rounded-xl border border-[#dfe9e2] bg-white p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1F7D3E]">
                <ListTodo className="size-4" />
                <span>Tareas registradas ({tasksList.length})</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewTaskDraft('')
                  setIsAddingTask(true)
                }}
                className="rounded-lg border-[#d1e2d6] text-[#1F7D3E] hover:bg-[#eef7f0] hover:border-[#1F7D3E] font-bold text-xs h-7 px-2.5 shadow-2xs"
              >
                <Plus className="size-3 mr-1" />
                Agregar tarea
              </Button>
            </div>

            {/* Tasks List */}
            <div className="flex-1 space-y-2">
              {tasksList.length === 0 && !isAddingTask ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-[#dfe9e2] bg-[#fbfdfb]">
                  <ListTodo className="size-6 text-[#a3b8aa] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-[#5e6b62]">
                    No hay tareas registradas para esta actividad.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(true)}
                    className="mt-2 text-xs font-bold text-[#1F7D3E] hover:underline"
                  >
                    + Registrar primera tarea
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {tasksList.map((task, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start justify-between gap-2.5 p-2.5 rounded-xl border border-[#edf2ed] bg-[#fcfdfc] hover:bg-white hover:border-[#d1e2d6] transition-all"
                    >
                      {editingTaskIndex === idx ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <span className="size-5 rounded-full bg-[#1F7D3E] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <Input
                            value={taskDraft}
                            onChange={(e) => setTaskDraft(e.target.value)}
                            className="h-8 text-xs font-medium rounded-lg border-[#d1e2d6] bg-white flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTaskItem(idx)
                              if (e.key === 'Escape') setEditingTaskIndex(null)
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTaskItem(idx)}
                            className="p-1.5 rounded-md bg-[#1F7D3E] text-white hover:bg-[#186331]"
                            title="Guardar tarea"
                          >
                            <Check className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaskIndex(null)}
                            className="p-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                            title="Cancelar"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            onClick={() => {
                              setTaskDraft(task)
                              setEditingTaskIndex(idx)
                            }}
                            className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                            title="Clic para editar tarea"
                          >
                            <span className="size-5 rounded-full bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-[#2c3630] font-medium leading-relaxed break-words">
                              {task}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setTaskDraft(task)
                                setEditingTaskIndex(idx)
                              }}
                              className="p-1 rounded-md text-[#5e6b62] hover:text-[#1F7D3E] hover:bg-[#eef7f0]"
                              title="Editar tarea"
                            >
                              <Pencil className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTaskItem(idx)}
                              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Add Task Form */}
              {isAddingTask && (
                <div className="pt-2 border-t border-[#edf2ed] flex items-center gap-2">
                  <span className="size-5 rounded-full bg-[#1F7D3E] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {tasksList.length + 1}
                  </span>
                  <Input
                    value={newTaskDraft}
                    onChange={(e) => setNewTaskDraft(e.target.value)}
                    placeholder="Escribe la nueva tarea..."
                    className="h-8 text-xs font-medium rounded-lg border-[#d1e2d6] bg-white flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNewTask()
                      if (e.key === 'Escape') setIsAddingTask(false)
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewTask}
                    className="h-8 bg-[#1F7D3E] hover:bg-[#186331] text-xs font-bold text-white rounded-lg px-2.5"
                  >
                    Añadir
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingTask(false)}
                    className="h-8 text-xs font-bold text-[#5e6b62] rounded-lg px-2"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
