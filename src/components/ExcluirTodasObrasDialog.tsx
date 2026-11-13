import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle } from 'lucide-react'

const PALAVRA_CONFIRMACAO = 'EXCLUIR'

interface ExcluirTodasObrasDialogProps {
  aberto: boolean
  aoFechar: () => void
  totalObras: number
  processando: boolean
  aoConfirmar: () => void
}

/**
 * Confirmação em duas etapas para excluir todas as obras:
 * (1) aviso de irreversibilidade; (2) digitar "EXCLUIR" para habilitar a confirmação final.
 */
export function ExcluirTodasObrasDialog({
  aberto,
  aoFechar,
  totalObras,
  processando,
  aoConfirmar,
}: ExcluirTodasObrasDialogProps) {
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [digitado, setDigitado] = useState('')

  // Sempre que o diálogo fecha (cancelar, Esc ou sucesso), a próxima abertura começa na etapa 1
  useEffect(() => {
    if (!aberto) {
      setEtapa(1)
      setDigitado('')
    }
  }, [aberto])

  const confirmacaoValida = digitado === PALAVRA_CONFIRMACAO

  return (
    <AlertDialog open={aberto} onOpenChange={(open) => !open && !processando && aoFechar()}>
      <AlertDialogContent>
        {etapa === 1 ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-planner-red">
                <AlertTriangle className="w-5 h-5 text-planner-red" />
                Excluir todas as obras?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                Esta ação é <strong>irreversível</strong>. Serão apagadas as{' '}
                <strong>{totalObras} obras</strong> cadastradas, junto com todas as atribuições e o
                histórico de atribuições. Engenheiros e usuários não serão afetados. Um backup está
                disponível em backup/obras-removidas-2026.json.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button
                onClick={() => setEtapa(2)}
                className="bg-planner-red hover:bg-planner-red-dark text-white"
              >
                Continuar
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-planner-red">
                <AlertTriangle className="w-5 h-5 text-planner-red" />
                Confirmação final
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                Para confirmar, digite <strong>{PALAVRA_CONFIRMACAO}</strong> no campo abaixo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              placeholder={PALAVRA_CONFIRMACAO}
              disabled={processando}
              autoComplete="off"
              className="h-9 text-sm"
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
              <Button
                onClick={aoConfirmar}
                disabled={!confirmacaoValida || processando}
                className="bg-planner-red hover:bg-planner-red-dark text-white"
              >
                {processando ? 'Excluindo...' : 'Excluir todas as obras'}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
