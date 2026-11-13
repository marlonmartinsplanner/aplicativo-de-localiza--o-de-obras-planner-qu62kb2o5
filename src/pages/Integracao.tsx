import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { listarObras } from '@/services/obras'
import {
  obterConfig,
  salvarDestinoObraPrima,
  regenerarTokenApi,
  enviarParaObraPrima,
  urlExportacao,
  montarExportacao,
  gerarCsv,
  baixarArquivo,
  dataHoraBrasil,
  type IntegracaoConfig,
  type ResultadoEnvio,
} from '@/services/integracao'
import type { Obra } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Link2,
  Copy,
  CheckCircle2,
  Send,
  RefreshCw,
  AlertTriangle,
  Clock,
  Database,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import logoPlanner from '@/assets/construtora-planner-engenharia-60ea4.png'

export default function Integracao() {
  const { toast } = useToast()

  const [obras, setObras] = useState<Obra[]>([])
  const [config, setConfig] = useState<IntegracaoConfig | null>(null)
  const [carregando, setCarregando] = useState(true)

  const [urlObraPrima, setUrlObraPrima] = useState('')
  const [tokenObraPrima, setTokenObraPrima] = useState('')
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [resultadoEnvio, setResultadoEnvio] = useState<ResultadoEnvio | null>(null)
  const [alertaRegenerar, setAlertaRegenerar] = useState(false)

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [listaObras, cfg] = await Promise.all([listarObras(), obterConfig()])
      setObras(listaObras)
      setConfig(cfg)
      if (cfg) {
        setUrlObraPrima(cfg.obra_prima_url || '')
        setTokenObraPrima(cfg.obra_prima_token || '')
      }
    } catch (e) {
      console.error('Erro ao carregar dados da integração:', e)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const copiar = async (texto: string, descricao: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      toast({ title: 'Copiado', description: `${descricao} copiado para a área de transferência.` })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Não foi possível copiar',
        description: 'Copie manualmente selecionando o texto.',
      })
    }
  }

  const exportacao = montarExportacao(obras)

  const baixarJson = () => {
    const payload = {
      sistema: 'Planner Engenharia',
      gerado_em: new Date().toISOString(),
      total: exportacao.length,
      obras: exportacao,
    }
    baixarArquivo(
      JSON.stringify(payload, null, 2),
      `planner-obras-${new Date().toISOString().substring(0, 10)}.json`,
      'application/json',
    )
    toast({ title: 'JSON baixado', description: `${exportacao.length} obras exportadas.` })
  }

  const baixarCsv = () => {
    baixarArquivo(
      gerarCsv(obras),
      `planner-obras-${new Date().toISOString().substring(0, 10)}.csv`,
      'text/csv;charset=utf-8',
    )
    toast({ title: 'CSV baixado', description: `${exportacao.length} obras exportadas.` })
  }

  const handleSalvarDestino = async () => {
    if (!urlObraPrima.trim()) {
      toast({
        variant: 'destructive',
        title: 'URL obrigatória',
        description: 'Informe a URL da API do Obra Prima antes de salvar.',
      })
      return
    }
    if (!/^https?:\/\//i.test(urlObraPrima.trim())) {
      toast({
        variant: 'destructive',
        title: 'URL inválida',
        description: 'A URL deve começar com http:// ou https://.',
      })
      return
    }
    setSalvandoConfig(true)
    try {
      if (!config) throw new Error('Configuração não carregada')
      const atualizada = await salvarDestinoObraPrima(config.id, {
        obra_prima_url: urlObraPrima.trim(),
        obra_prima_token: tokenObraPrima.trim(),
      })
      setConfig(atualizada)
      toast({
        title: 'Destino salvo',
        description: 'A URL e o token do Obra Prima foram salvos no banco de dados.',
      })
    } catch (e) {
      console.error(e)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração do Obra Prima.',
      })
    } finally {
      setSalvandoConfig(false)
    }
  }

  const handleEnviarAgora = async () => {
    if (!urlObraPrima.trim()) {
      setResultadoEnvio({
        ok: false,
        mensagem: 'URL do Obra Prima não configurada. Cole a URL da API e salve antes de enviar.',
      })
      return
    }
    setEnviando(true)
    setResultadoEnvio(null)
    const resultado = await enviarParaObraPrima()
    setResultadoEnvio(resultado)
    setEnviando(false)
    // recarrega config para mostrar data/hora do último envio
    const cfg = await obterConfig()
    if (cfg) setConfig(cfg)
  }

  const handleRegenerarToken = async () => {
    try {
      if (!config) throw new Error('Configuração não carregada')
      const atualizada = await regenerarTokenApi(config.id)
      setConfig(atualizada)
      setAlertaRegenerar(false)
      toast({
        title: 'Token regenerado',
        description: 'O token anterior deixou de funcionar imediatamente.',
      })
    } catch (e) {
      console.error(e)
      toast({ variant: 'destructive', title: 'Erro ao regenerar o token.' })
    }
  }

  const ultimoEnvioOk = config?.ultimo_envio_status === 'sucesso'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar totalObras={obras.length} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <img src={logoPlanner} alt="" className="h-8 w-auto" />
            Integração Obra Prima
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Construtora Planner Engenharia — troca de dados de obras com o sistema externo Obra
            Prima
          </p>
        </div>

        {/* ============ 1. Exportar dados ============ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-planner-blue-dark dark:text-planner-blue-light">
              <Download className="w-5 h-5 text-planner-blue" />
              Exportar dados
            </CardTitle>
            <CardDescription className="text-xs">
              Baixe todas as {obras.length} obras (código, nome, município, região, situação, avanço
              %, custo, coordenadas e engenheiro responsável) para importar em outro sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={baixarJson}
                disabled={carregando || obras.length === 0}
                className="bg-planner-blue hover:bg-planner-blue-dark text-white gap-1.5"
              >
                <FileJson className="w-4 h-4" />
                Baixar JSON ({obras.length} obras)
              </Button>
              <Button
                onClick={baixarCsv}
                disabled={carregando || obras.length === 0}
                variant="outline"
                className="border-planner-blue/40 text-planner-blue-dark dark:text-planner-blue-light hover:bg-planner-blue/10 gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Baixar CSV
              </Button>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Fonte: coleção obras + engenheiro atribuído (somente leitura)
              </span>
            </div>
            {carregando && <p className="text-xs text-slate-400">Carregando obras...</p>}
          </CardContent>
        </Card>

        {/* ============ 2. API para o Obra Prima puxar ============ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-planner-blue-dark dark:text-planner-blue-light">
              <Link2 className="w-5 h-5 text-planner-blue" />
              API para o Obra Prima puxar dados
            </CardTitle>
            <CardDescription className="text-xs">
              Compartilhe esta URL e o token de acesso com o Obra Prima. A chamada precisa do header{' '}
              <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                Authorization: Bearer &lt;token&gt;
              </code>{' '}
              — sem token, a rota recusa o acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL da API</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={urlExportacao()}
                  className="h-9 text-xs font-mono bg-slate-50 dark:bg-slate-800/60"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => copiar(urlExportacao(), 'URL da API')}
                  title="Copiar URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <a
                  href={urlExportacao()}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir no navegador"
                >
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Token de acesso</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={config?.api_token || '—'}
                  className="h-9 text-xs font-mono bg-slate-50 dark:bg-slate-800/60"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => copiar(config?.api_token || '', 'Token')}
                  title="Copiar token"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs text-planner-red hover:bg-planner-red/10 border-planner-red/30 shrink-0 gap-1.5"
                  onClick={() => setAlertaRegenerar(true)}
                  disabled={!config}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerar
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Ao regenerar, o token anterior deixa de funcionar imediatamente — atualize o Obra
                Prima.
              </p>
            </div>

            <Separator />

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-planner-blue" />
                Exemplo de chamada (para enviar ao Obra Prima)
              </p>
              <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                {`curl "${urlExportacao()}" \\\n  -H "Authorization: Bearer ${config?.api_token || '<token>'}"`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* ============ 3. Enviar dados para o Obra Prima ============ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-planner-blue-dark dark:text-planner-blue-light">
              <Send className="w-5 h-5 text-planner-blue" />
              Enviar dados para o Obra Prima
            </CardTitle>
            <CardDescription className="text-xs">
              O app envia todas as obras em JSON para a API do Obra Prima, via backend (o navegador
              não precisa estar aberto durante a chamada externa).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="url-op" className="text-xs font-semibold">
                  URL da API do Obra Prima
                </Label>
                <Input
                  id="url-op"
                  placeholder="https://obraprima.exemplo.com/api/obras"
                  value={urlObraPrima}
                  onChange={(e) => setUrlObraPrima(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="token-op" className="text-xs font-semibold">
                  Token do Obra Prima (opcional)
                </Label>
                <Input
                  id="token-op"
                  placeholder="Token/opcional informado pelo sistema"
                  value={tokenObraPrima}
                  onChange={(e) => setTokenObraPrima(e.target.value)}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleSalvarDestino}
                disabled={salvandoConfig}
                variant="outline"
                className="border-planner-blue/40 text-planner-blue-dark dark:text-planner-blue-light hover:bg-planner-blue/10 gap-1.5"
              >
                {salvandoConfig ? 'Salvando...' : 'Salvar destino'}
              </Button>
              <Button
                onClick={handleEnviarAgora}
                disabled={enviando || !config?.obra_prima_url}
                className="bg-planner-blue hover:bg-planner-blue-dark text-white gap-1.5"
              >
                <Send className="w-4 h-4" />
                {enviando ? 'Enviando...' : 'Enviar dados agora'}
              </Button>
              {config?.ultimo_envio && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Último envio: {dataHoraBrasil(config.ultimo_envio)}
                  <Badge
                    variant="outline"
                    className={
                      ultimoEnvioOk
                        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-300 text-[10px]'
                        : 'bg-planner-red/10 text-planner-red border-planner-red/30 text-[10px]'
                    }
                  >
                    {ultimoEnvioOk ? 'sucesso' : 'falha'}
                  </Badge>
                </span>
              )}
            </div>

            {resultadoEnvio && (
              <div
                className={`rounded-lg border p-3 flex items-start gap-2.5 ${
                  resultadoEnvio.ok
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                    : 'border-planner-red/30 bg-planner-red/5 dark:border-planner-red/40 dark:bg-planner-red/10'
                }`}
              >
                {resultadoEnvio.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-planner-red shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      resultadoEnvio.ok
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-planner-red dark:text-planner-red-light'
                    }`}
                  >
                    {resultadoEnvio.mensagem}
                  </p>
                  {resultadoEnvio.detalhe && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 break-all">
                      {resultadoEnvio.detalhe}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirmação: regenerar token */}
      <AlertDialog open={alertaRegenerar} onOpenChange={setAlertaRegenerar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-planner-red">
              <RefreshCw className="w-5 h-5 text-planner-red" />
              Regenerar token de acesso?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              O token atual deixará de funcionar imediatamente. Quem usa a API (o Obra Prima)
              precisará receber o novo token para continuar puxando os dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerarToken}
              className="bg-planner-red hover:bg-planner-red-dark text-white"
            >
              Regenerar token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
