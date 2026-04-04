'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Mail, UtensilsCrossed } from 'lucide-react'
import { checkEmailAuthorized } from '@/actions/auth/check-auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setIsSuccess(false)

    try {
      // 1. Verificar se o email está autorizado
      const { authorized, error: authCheckError } = await checkEmailAuthorized(email)

      if (!authorized) {
        throw new Error(authCheckError || 'Email não autorizado.')
      }

      // 2. Enviar Magic Link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          shouldCreateUser: false,
        },
      })

      if (authError) throw authError

      setIsSuccess(true)
    } catch (err: any) {
      let message = err.message || 'Ocorreu um erro ao tentar entrar.'

      if (message.includes('only request this after')) {
        const seconds = message.match(/\d+/)?.[0] || ''
        message = `Por questões de segurança, aguarde ${seconds} segundos antes de tentar novamente.`
      } else if (message.includes('email rate limit exceeded')) {
        message = 'Limite de e-mails excedido. Aguarde alguns minutos e tente novamente.'
      }

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Gestor Pedidos</CardTitle>
          <CardDescription>
            Digite seu email para receber o link de acesso
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@restaurante.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md flex items-center gap-2 border border-green-200">
                <Mail className="h-4 w-4 shrink-0" />
                <span>Link de acesso enviado! Verifique sua caixa de entrada.</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading || isSuccess}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Link de Acesso'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
