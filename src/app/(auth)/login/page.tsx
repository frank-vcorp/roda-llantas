"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

/**
 * IMPL-20260129-SPRINT1, FIX-20260212-03
 * Página de login - Formulario de autenticación
 * Usa API Route en lugar de Server Action para evitar
 * errores de serialización JSON en Vercel
 */

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (result.success) {
        window.location.href = "/dashboard";
        return;
      }

      setError(result.error || "Error al iniciar sesión");
      toast.error("Error", {
        description: result.error || "Credenciales inválidas",
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      toast.error("Error", { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 pointer-events-none"></div>
      <Card className="relative z-10 bg-card/80 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="space-y-3 pb-8 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-black text-xl">R</span>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Llantera Pro
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1">
                <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                className="h-12 bg-background/50 border-muted-foreground/10 focus:bg-background transition-all rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="username"
                name="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Contraseña
                </Label>
                <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight opacity-70">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 bg-background/50 border-muted-foreground/10 focus:bg-background transition-all rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                name="password"
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-xl shadow-primary/10 transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : "Entrar al Panel"}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground/60 font-medium">
              V2.2 - Sistema de Gestión de Llantas
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
