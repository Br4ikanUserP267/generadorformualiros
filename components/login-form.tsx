"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor complete todos los campos")
      return
    }

    const success = await login(email, password)
    if (!success) {
      setError("Credenciales incorrectas. Intente nuevamente.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f8f5] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(45,122,64,0.08),transparent_70%)]" />
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center">
          <img
            src="/matriz-riesgos/csmLOGO_1_.png"
            alt="Clínica Santa María S.A.S"
            className="mb-4 h-28 w-auto object-contain"
          />
          <h1 className="text-center text-2xl font-semibold text-[#1a5c2a] text-balance">
            Sistema de Gestión de Seguridad y Salud en el Trabajo
          </h1>
          <p className="mt-2 text-center text-sm text-[#6f8a75]">Clínica Santa María S.A.S</p>
        </div>

        <Card className="relative border border-[#dde8dd] bg-white shadow-[0_10px_30px_rgba(21,53,34,0.08)] rounded-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-xl text-[#153522]">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-[#6f8a75]">
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@clinicasantamaria.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-[#d7e5d7] bg-[#f7fbf7] focus-visible:ring-[#2d7a40]"
                    disabled={isLoading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-[#d7e5d7] bg-[#f7fbf7] focus-visible:ring-[#2d7a40] pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f8a75] hover:text-[#1a5c2a] transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <FieldError>{error}</FieldError>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#1a5c2a] text-white hover:bg-[#144721]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
