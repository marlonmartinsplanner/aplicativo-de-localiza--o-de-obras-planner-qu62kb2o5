import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { Usuario } from '@/types'
import { isEmailCorporativo, MSG_EMAIL_CORPORATIVO } from '@/utils/auth'

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  carregando: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  recuperarSenha: (email: string) => Promise<void>
  atualizarAvatar: (arquivo: File) => Promise<void>
  estaAutenticado: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const r = pb.authStore.record
      return {
        id: r.id,
        email: r.email,
        name: r.name || r.email.split('@')[0],
        avatar: r.avatar,
      }
    }
    return null
  })

  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Sincroniza listener do authStore do PocketBase
    const unsubscribe = pb.authStore.onChange((newToken, record) => {
      setToken(newToken)
      if (record) {
        setUsuario({
          id: record.id,
          email: record.email,
          name: record.name || record.email.split('@')[0],
          avatar: record.avatar,
        })
      } else {
        setUsuario(null)
      }
    })

    setCarregando(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    if (!isEmailCorporativo(email)) {
      throw new Error(MSG_EMAIL_CORPORATIVO)
    }
    const authData = await pb.collection('users').authWithPassword(email, pass)
    setUsuario({
      id: authData.record.id,
      email: authData.record.email,
      name: authData.record.name || authData.record.email.split('@')[0],
      avatar: authData.record.avatar,
    })
    setToken(authData.token)
  }

  const logout = () => {
    pb.authStore.clear()
    setUsuario(null)
    setToken(null)
  }

  const recuperarSenha = async (email: string) => {
    if (!isEmailCorporativo(email)) {
      throw new Error(MSG_EMAIL_CORPORATIVO)
    }
    await pb.collection('users').requestPasswordReset(email)
  }

  // Upload da foto de perfil do usuário logado (arquivo de imagem já validado
  // pela navbar — tipo e tamanho). O PocketBase grava o arquivo e o authStore
  // é atualizado, propagando o novo avatar para toda a aplicação.
  const atualizarAvatar = async (arquivo: File) => {
    const registro = pb.authStore.record
    if (!registro) throw new Error('Usuário não autenticado.')

    const form = new FormData()
    form.append('avatar', arquivo)

    const atualizado = await pb.collection('users').update(registro.id, form)
    // Força o authStore a refletir o novo registro (novo token com avatar)
    pb.authStore.save(atualizado.token ?? pb.authStore.token, atualizado)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        carregando,
        login,
        logout,
        recuperarSenha,
        atualizarAvatar,
        estaAutenticado: Boolean(usuario && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
