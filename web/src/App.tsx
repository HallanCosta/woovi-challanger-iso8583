import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/useToast"
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Info,
  RefreshCw,
  Wallet,
  X,
  XCircle,
} from "lucide-react"
import { ISO8583_RESPONSE_CODES } from "../../lib/iso8583/responseCodes"

import "./styles/globals.css"

// Feature flags para bandeiras
const mastercardEnabled = import.meta.env.VITE_BRAND_MASTERCARD_ENABLED === "true"
const visaEnabled = import.meta.env.VITE_BRAND_VISA_ENABLED === "true"
const pixEnabled = import.meta.env.VITE_BRAND_PIX_ENABLED === "true"

const FEATURE_FLAGS = {
  BRAND_MASTERCARD: mastercardEnabled,
  BRAND_VISA: visaEnabled,
  BRAND_PIX: pixEnabled,
}

const CARD_BRANDS = {
  BRAND_PIX: "3907",
  BRAND_MASTERCARD: "5162",
  BRAND_VISA: "4026",
}

const RESPONSE_CODE_LIST = ["00", "14", "51", "91"] as const
const RESPONSE_CODES = RESPONSE_CODE_LIST.map((code) => {
  const match = ISO8583_RESPONSE_CODES.find((item) => item.res === code || item.req === code)
  return match ? { code, desc: match.desc } : { code, desc: "" }
})

type LedgerTransfer = {
  id: string
  debit_account_id: string
  credit_account_id: string
  amount: string
  code: number
  ledger: number
  timestamp: string
}

type AccountView = {
  id: string
  name: string
  type?: "customer" | "clearing" | "merchant"
  credits_posted: string
  debits_posted: string
  balance: string
  last_debit_transfer: LedgerTransfer | null
}

type FormData = {
  cardNumber: string
  amount: string
  expiryDate: string
  cvv: string
}

type TransactionResponse = {
  success: boolean
  amount: string
  responseCode: string
  message: string
  type: string
  brandName: string
  stage?: string
}

type PostTransactionBalances = {
  debit?: AccountView
  merchant?: AccountView
}

type CardView = {
  pan: string
  accountId: string
  accountName: string
  brand: "MASTERCARD" | "VISA" | "PIX" | "UNKNOWN"
}

type CardAuthorizationResponse = {
  authorized: boolean
  rc: string
  message: string
  available?: string
  mti?: string
  type?: string
  brandName?: string
}

type CardAuthorizationForm = {
  cardNumber: string
  amount: string
}

type AccountLedgerResponse = {
  account: {
    id: string
    name: string
    type?: AccountView["type"]
    balance: string
    credits_posted: string
    debits_posted: string
  }
  transfers: LedgerTransfer[]
}

const MERCHANT_ACCOUNT_ID = "2001"

const accountBadgeFor = (account: Pick<AccountView, "type">) => {
  if (account.type === "merchant") {
    return { label: "Merchant", variant: "default" as const }
  }

  if (account.type === "clearing") {
    return { label: "Clearing", variant: "secondary" as const }
  }

  return { label: "Cliente", variant: "outline" as const }
}

const formatCentsToBRL = (value: string | number) => {
  const cents = typeof value === "string" ? Number.parseInt(value, 10) : value
  if (Number.isNaN(cents)) return "R$ 0,00"

  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)
}

const formatLedgerTimestamp = (value: string) => {
  try {
    const ms = Number(BigInt(value) / 1_000_000n)
    if (Number.isNaN(ms)) return value

    return new Date(ms).toLocaleString("pt-BR")
  } catch {
    return value
  }
}

const sanitizeCardNumber = (value: string) => value.replace(/\s+/g, "")

const detectBrand = (number: string) => {
  const cleaned = sanitizeCardNumber(number)

  if (cleaned.startsWith(CARD_BRANDS.BRAND_PIX)) return "PIX"
  if (cleaned.startsWith(CARD_BRANDS.BRAND_MASTERCARD)) return "MASTERCARD"
  if (cleaned.startsWith(CARD_BRANDS.BRAND_VISA)) return "VISA"
  return null
}

const formatPan = (pan: string) => sanitizeCardNumber(pan).replace(/(.{4})/g, "$1 ").trim()

const resolveDebitAccountId = (cardNumber: string, cards: CardView[]) => {
  const cleaned = sanitizeCardNumber(cardNumber)
  const match = cards.find((card) => sanitizeCardNumber(card.pan) === cleaned)

  return match ? match.accountId : null
}

const isBrandEnabled = (brand: string | null) => {
  if (!brand) return true

  return FEATURE_FLAGS[`BRAND_${brand}` as keyof typeof FEATURE_FLAGS]
}

const convertAmountToInteger = (value: string) => {
  const centsOnly = value.replace(/\D/g, "")
  if (!centsOnly) return "000000000000"

  return centsOnly.padStart(12, "0")
}

const numericOnly = (value: string | number) => String(value ?? "").replace(/\D/g, "")

const padNumeric = (value: string | number, length: number) => numericOnly(value).padStart(length, "0").slice(-length)

const formatMerchantId = (value: string) => value.trim().replace(/\s+/g, "").toUpperCase()

const DEFAULT_TRANSACTION_ID = "000123"
const DEFAULT_ACQUIRER_INSTITUTION = "01020000000"
const DEFAULT_MERCHANT_ID = "WOOVIMERCHANT001"
const DEFAULT_CURRENCY_CODE = "764"

const buildAcquirerPayload = (data: FormData) => ({
  cardNumber: sanitizeCardNumber(data.cardNumber),
  amount: convertAmountToInteger(data.amount),
  transactionId: padNumeric(DEFAULT_TRANSACTION_ID, 6),
  acquirerInstitution: padNumeric(DEFAULT_ACQUIRER_INSTITUTION, 11),
  merchantId: formatMerchantId(DEFAULT_MERCHANT_ID),
  currency: padNumeric(DEFAULT_CURRENCY_CODE, 3),
})

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState<AccountView[]>([])
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [cards, setCards] = useState<CardView[]>([])
  const [cardsError, setCardsError] = useState<string | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [lastResponse, setLastResponse] = useState<TransactionResponse | null>(null)
  const [postTxBalances, setPostTxBalances] = useState<PostTransactionBalances | null>(null)
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false)
  const [ledgerAccount, setLedgerAccount] = useState<AccountView | null>(null)
  const [ledgerData, setLedgerData] = useState<AccountLedgerResponse | null>(null)
  const [isLoadingLedger, setIsLoadingLedger] = useState(false)
  const [ledgerError, setLedgerError] = useState<string | null>(null)
  const [authResult, setAuthResult] = useState<CardAuthorizationResponse | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      cardNumber: "",
      amount: "",
      expiryDate: "12/35",
      cvv: "123",
    },
  })

  const cardNumber = watch("cardNumber")

  const {
    register: registerAuth,
    handleSubmit: handleSubmitAuth,
    formState: { errors: authErrors },
    watch: watchAuth,
    setValue: setAuthValue,
  } = useForm<CardAuthorizationForm>({
    defaultValues: {
      cardNumber: "",
      amount: "",
    },
  })

  const authCardNumber = watchAuth("cardNumber")

  // const nodeEnv = import.meta.env.VITE_NODE_ENV
  const acquirerBaseUrl = import.meta.env.VITE_BASE_URL_ACQUIRER_API
  const issuerBaseUrl = import.meta.env.VITE_BASE_URL_ISSUER_API

  const debitAccountId = useMemo(() => resolveDebitAccountId(cardNumber, cards), [cardNumber, cards])
  const selectedDebitAccount = useMemo(
    () => (debitAccountId ? accounts.find((account) => account.id === debitAccountId) ?? null : null),
    [accounts, debitAccountId]
  )
  const merchantAccount = useMemo(
    () => accounts.find((account) => account.type === "merchant" || account.id === MERCHANT_ACCOUNT_ID) ?? null,
    [accounts]
  )
  const testCards = useMemo(
    () => [
      ...cards.map((card) => ({ ...card, invalid: false })),
      { pan: "9999 9999 9999 9999", accountId: "", accountName: "Cartão inválido", brand: "UNKNOWN", invalid: true },
    ],
    [cards]
  )
  const cardsByAccount = useMemo(() => {
    const groups = new Map<
      string,
      { accountId: string; accountName: string; type?: AccountView["type"]; cards: CardView[] }
    >()

    cards.forEach((card) => {
      const accountMeta = accounts.find((account) => account.id === card.accountId)
      const accountName = accountMeta?.name ?? card.accountName

      if (!groups.has(card.accountId)) {
        groups.set(card.accountId, { accountId: card.accountId, accountName, type: accountMeta?.type, cards: [] })
      }

      groups.get(card.accountId)?.cards.push(card)
    })

    return Array.from(groups.values()).sort((a, b) => a.accountName.localeCompare(b.accountName))
  }, [accounts, cards])

  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts])

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, "")
    digitsOnly = digitsOnly.slice(0, 16) // limita 16 dígitos

    const formatted = digitsOnly.replace(/(.{4})/g, "$1 ").trim()
    setValue("cardNumber", formatted, { shouldValidate: true, shouldDirty: true })
  }

  const handlePresetClick = (pan: string) => {
    setValue("cardNumber", pan, { shouldValidate: true, shouldDirty: true })
    setAuthValue("cardNumber", pan, { shouldValidate: true, shouldDirty: true })
  }

  const handleAuthCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, "")
    digitsOnly = digitsOnly.slice(0, 16)

    const formatted = digitsOnly.replace(/(.{4})/g, "$1 ").trim()
    setAuthValue("cardNumber", formatted, { shouldValidate: true, shouldDirty: true })
  }

  const handleRefresh = () => {
    loadAccounts()
    loadCards()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, "")

    if (!digitsOnly) {
      setValue("amount", "", { shouldValidate: true })
      return
    }

    const numeric = (Number.parseInt(digitsOnly, 10) / 100).toFixed(2)
    const formatted = numeric.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    setValue("amount", formatted, { shouldValidate: true, shouldDirty: true })
  }

  const handleAuthAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, "")

    if (!digitsOnly) {
      setAuthValue("amount", "", { shouldValidate: true })
      return
    }

    const numeric = (Number.parseInt(digitsOnly, 10) / 100).toFixed(2)
    const formatted = numeric.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    setAuthValue("amount", formatted, { shouldValidate: true, shouldDirty: true })
  }

  const loadAccounts = useCallback(async (): Promise<AccountView[]> => {
    if (!issuerBaseUrl) {
      setAccountsError("Configure a URL do issuer no arquivo .env da pasta web.")
      return []
    }

    setIsLoadingAccounts(true)
    setAccountsError(null)

    try {
      console.log("link:", `${issuerBaseUrl}/accounts`)
      const response = await fetch(`${issuerBaseUrl}/accounts`)

      if (!response.ok) {
        throw new Error(`Issuer HTTP ${response.status}`)
      }

      const data: AccountView[] = await response.json()
      setAccounts(data)

      return data
    } catch (error) {
      console.error("[WEB] Falha ao consultar contas do issuer", error)
      setAccountsError("Não foi possível carregar as contas diretamente do issuer.")
      return []
    } finally {
      setIsLoadingAccounts(false)
    }
  }, [issuerBaseUrl])

  const loadCards = useCallback(async (): Promise<CardView[]> => {
    if (!issuerBaseUrl) {
      setCardsError("Configure a URL do issuer no arquivo .env da pasta web.")
      return []
    }

    setIsLoadingCards(true)
    setCardsError(null)

    try {
      const response = await fetch(`${issuerBaseUrl}/cards`)
      if (!response.ok) {
        throw new Error(`Issuer HTTP ${response.status}`)
      }

      const data: CardView[] = await response.json()
      setCards(data)
      return data
    } catch (error) {
      console.error("[WEB] Falha ao consultar cartões do issuer", error)
      setCardsError("Não foi possível carregar os cartões diretamente do issuer.")
      return []
    } finally {
      setIsLoadingCards(false)
    }
  }, [issuerBaseUrl])

  const loadAccountLedger = useCallback(
    async (accountId: string): Promise<AccountLedgerResponse | null> => {
      if (!issuerBaseUrl) {
        setLedgerData(null)
        setLedgerError("Configure a URL do issuer no arquivo .env da pasta web.")
        return null
      }

      setIsLoadingLedger(true)
      setLedgerError(null)
      setLedgerData(null)

      try {
        const response = await fetch(`${issuerBaseUrl}/accounts/${accountId}/ledger`)
        if (!response.ok) {
          throw new Error(`Issuer HTTP ${response.status}`)
        }

        const data: AccountLedgerResponse = await response.json()
        setLedgerData(data)
        return data
      } catch (error) {
        console.error(`[WEB] Falha ao consultar ledger da conta ${accountId}`, error)
        setLedgerError("Não foi possível carregar o extrato desta conta.")
        return null
      } finally {
        setIsLoadingLedger(false)
      }
    },
    [issuerBaseUrl]
  )

  const handleAccountCardClick = (account: AccountView) => {
    setLedgerAccount(account)
    setLedgerError(null)
    setIsLedgerModalOpen(true)
    void loadAccountLedger(account.id)
  }

  const handleCloseLedgerModal = () => {
    setIsLedgerModalOpen(false)
    setLedgerAccount(null)
    setLedgerData(null)
    setLedgerError(null)
  }

  useEffect(() => {
    loadAccounts()
    loadCards()
  }, [loadAccounts, loadCards])

  const onSubmitAuth = async (data: CardAuthorizationForm) => {
    const brand = detectBrand(data.cardNumber)

    if (brand && !isBrandEnabled(brand)) {
      toast({
        title: "❌ Bandeira desativada",
        description: `A bandeira ${brand} está desativada para testes.`,
        variant: "destructive",
      })
      return
    }

    if (!issuerBaseUrl) {
      toast({
        title: "⚠️ URL do issuer não configurada",
        description: "Defina VITE_BASE_URL_ISSUER_API no .env da pasta web.",
        variant: "destructive",
      })
      return
    }

    setIsAuthLoading(true)
    setAuthResult(null)

    try {
      const payload = {
        cardNumber: sanitizeCardNumber(data.cardNumber),
        amount: convertAmountToInteger(data.amount),
      }

      const response = await fetch(`${issuerBaseUrl}/cards/authorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result: CardAuthorizationResponse = await response.json()
      setAuthResult(result)

      toast({
        title: result.authorized ? "✅ Cartão autorizado" : "❌ Cartão não autorizado",
        description: `autorizado para operação`,
        variant: result.authorized ? "default" : "destructive",
      })
    } catch (error) {
      console.error("[WEB] Falha ao consultar autorização", error)

      const fallback: CardAuthorizationResponse = {
        authorized: false,
        rc: "91",
        message: "Emissor inoperante",
      }
      setAuthResult(fallback)
      toast({
        title: "❌ Cartão não autorizado",
        description: `${fallback.message} - Code: ${fallback.rc}`,
        variant: "destructive",
      })
    } finally {
      setIsAuthLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    const brand = detectBrand(data.cardNumber)
    const debitFromCard = resolveDebitAccountId(data.cardNumber, cards)

    if (brand && !isBrandEnabled(brand)) {
      toast({
        title: "❌ Bandeira desativada",
        description: `A bandeira ${brand} está desativada para testes.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setLastResponse(null)
    setPostTxBalances(null)

    try {
      if (!acquirerBaseUrl) {
        throw new Error("URL do acquirer não configurada em .env")
      }

      const payload = buildAcquirerPayload(data)

      console.log("payload:", payload)
      const response = await fetch(`${acquirerBaseUrl}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result: TransactionResponse = await response.json()
      setLastResponse(result)

      if (result.success) {
        toast({
          title: "✅ Transação concluída",
          // description: `${result.message} - Code: ${result.responseCode}`,
          description: 'Transação autorizada e concluída com sucesso.',
          variant: "default",
          className: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
        })
      } else {
        toast({
          title: "❌ Transação rejeitada",
          description: `${result.message} - Code: ${result.responseCode}`,
          variant: "destructive",
        })
      }

      const refreshedAccounts = await loadAccounts()
      if (refreshedAccounts.length) {
        setPostTxBalances({
          debit: debitFromCard ? refreshedAccounts.find((account) => account.id === debitFromCard) : undefined,
          merchant: refreshedAccounts.find((account) => account.id === MERCHANT_ACCOUNT_ID),
        })
      }
    } catch (error) {
      console.error("[WEB] Erro ao enviar transação", error)
      toast({
        title: "⚠️ Erro de conexão",
        description: `Não foi possível conectar ao servidor do acquirer (${acquirerBaseUrl || "URL não definida"})`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentBrand = detectBrand(cardNumber)
  const brandAllowed = isBrandEnabled(currentBrand)
  const authBrand = detectBrand(authCardNumber ?? "")
  const authBrandAllowed = isBrandEnabled(authBrand)
  const selectedLedgerAccountId = ledgerAccount?.id ?? ledgerData?.account.id ?? null
  const selectedLedgerName = ledgerAccount?.name ?? ledgerData?.account.name
  const selectedLedgerType = ledgerAccount?.type ?? ledgerData?.account.type
  const selectedLedgerBalance = ledgerData?.account.balance ?? ledgerAccount?.balance
  const ledgerBadge = selectedLedgerType ? accountBadgeFor({ type: selectedLedgerType }) : null

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Testador de emissor de cartão, adquirente e bandeira</h1>
          <p className="text-muted-foreground">Ferramenta para testar transações com o servidor de pagamentos</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>Como usar</CardTitle>
            </div>
            <CardDescription>Orquestração entre acquirer → brand → issuer e como forçar erros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(CARD_BRANDS).map(([brandKey, prefix]) => {
                const brand = brandKey.replace("BRAND_", "")
                const enabled = FEATURE_FLAGS[brandKey as keyof typeof FEATURE_FLAGS]

                return (
                  <div
                    key={brandKey}
                    className={`flex items-center justify-between rounded-lg border p-3 transition ${
                      enabled ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{brand}</p>
                      <p className="text-sm text-muted-foreground">Prefixo: {prefix}</p>
                    </div>

                    {enabled ? (
                      <Badge variant="default" className="bg-emerald-500">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Desativada</Badge>
                    )}
                  </div>
                )
              })}
            </div>

            <Separator />

            <div className="space-y-3">
              {cardsByAccount.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Cartões de testes por conta</h4>
                  <p className="text-xs text-muted-foreground">
                    Hallan 1 e Hallan 2 têm Mastercard, Visa e PIX; clique para auto preencher o PAN. Transações sempre
                    debitam a conta do cartão e creditam a Merchant (Loja).
                  </p>
                  {isLoadingCards && (
                    <p className="text-xs text-muted-foreground">Carregando cartões do issuer...</p>
                  )}
                  {cardsError && (
                    <Alert variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{cardsError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {cardsByAccount.map((group) => {
                      const accountMeta = accounts.find((account) => account.id === group.accountId)
                      const badge = accountMeta ? accountBadgeFor(accountMeta) : null

                      return (
                        <div key={group.accountId} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">Conta: {group.accountName}</p>
                            {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
                          </div>
                          <p className="text-xs text-muted-foreground">ID: {group.accountId}</p>
                          <div className="space-y-1">
                            {group.cards.map((card) => {
                              const isActive = sanitizeCardNumber(cardNumber) === sanitizeCardNumber(card.pan)

                              return (
                                <button
                                  key={card.pan}
                                  type="button"
                                  onClick={() => handlePresetClick(formatPan(card.pan))}
                                  className={`flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-xs transition cursor-pointer
                                  ${
                                    isActive ? "border-primary ring-2 ring-primary/30" : "hover:border-primary"
                                  }`}
                                >
                                  <div className="flex flex-col text-left">
                                    <span className="font-mono">{formatPan(card.pan)}</span>
                                    <span className="text-[11px] text-muted-foreground">
                                      Crédito: Merchant
                                    </span>
                                  </div>
                                  <Badge variant="outline">{card.brand}</Badge>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <Badge variant="destructive">Testar erros</Badge>
              <div className="rounded-lg border bg-destructive/5 p-3 text-sm ">
                <p>
                  Cartão inválido: Use um cartão que não exista, 9999 9999 9999 9999 (PAN inválido) ou qualquer PAN fora da lista de cartões → RC 14
                </p>
              </div>
              <div className="rounded-lg border bg-destructive/5 p-3 text-sm">
                <p>
                  Saldo insuficiente: Use qualquer cartão válido e coloque um valor maior que o saldo da conta → RC 51
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Códigos de resposta</h3>
              <div className="grid gap-2 md:grid-cols-3">
                {RESPONSE_CODES.map((code) => (
                  <div key={code.code} className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm">
                    <Badge variant="outline" className="font-mono">
                      {code.code}
                    </Badge>
                    <span className="text-muted-foreground">{code.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <CardTitle>Saldos do Emissor</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingAccounts || isLoadingCards}>
                <RefreshCw className={`h-4 w-4 ${isLoadingAccounts || isLoadingCards ? "animate-spin" : ""}`} />
                <span className="ml-2 cursor-pointer">Atualizar</span>
              </Button>
            </div>
            <CardDescription>
              Saldo das contas envolvidas: dono do cartão, Merchant (Loja) e clearing
              <ul className="list-disc pl-4">
                <li>Hállan 1: Conta do dono do cartão</li>
                <li>Hállan 2: Conta do dono do cartão</li>
                <li>Merchant: Conta da loja a qual é dono da maquinha</li>
                <li>Clearing: Conta de Compensação, emitido pela entidade responsável pela compensação e liquidação</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
                Carregando contas do issuer...
              </div>
            ) : accountsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{accountsError}</AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {accounts.map((account) => {
                  const badge = accountBadgeFor(account)

                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => handleAccountCardClick(account)}
                      className="flex w-full flex-col rounded-lg border p-3 text-left transition hover:border-primary hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{account.name}</p>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {account.id}</p>
                      <p className="mt-1 font-mono text-sm">{formatCentsToBRL(account.balance)}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">Clique para ver o extrato da conta</p>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Autorização de Cartão</CardTitle>
            </div>
            <CardDescription>
              Verifica se o cartão pode ser autorizado para o valor informado, sem lançar no ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAuth(onSubmitAuth)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authCardNumber">Número do Cartão</Label>
                <Input
                  id="authCardNumber"
                  placeholder="3907 0000 0000 0000"
                  {...registerAuth("cardNumber", {
                    required: "Número do cartão é obrigatório",
                    minLength: {
                      value: 19,
                      message: "Mínimo de 16 dígitos",
                    },
                  })}
                  onChange={handleAuthCardNumberChange}
                  className={authErrors.cardNumber ? "border-destructive" : ""}
                />
                {authErrors.cardNumber && <p className="text-sm text-destructive">{authErrors.cardNumber.message}</p>}

                {authCardNumber && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={authBrand ? (authBrandAllowed ? "default" : "destructive") : "secondary"}
                      className="font-mono"
                    >
                      {authBrand || "Bandeira desconhecida"}
                    </Badge>
                    {!authBrandAllowed && authBrand && (
                      <p className="text-xs text-destructive">Bandeira desativada</p>
                    )}
                    {!authBrand && (
                      <p className="text-xs text-muted-foreground">Enviaremos mesmo assim (deve retornar RC 14)</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authAmount">Valor (R$)</Label>
                <Input
                  id="authAmount"
                  type="text"
                  step="0.01"
                  placeholder="52,00"
                  {...registerAuth("amount", {
                    required: "Valor é obrigatório",
                    min: {
                      value: 0.01,
                      message: "Valor mínimo de R$ 0,01",
                    },
                  })}
                  onChange={handleAuthAmountChange}
                  className={authErrors.amount ? "border-destructive" : ""}
                />
                {authErrors.amount && <p className="text-sm text-destructive">{authErrors.amount.message}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="authExpiry">Validade</Label>
                  <Input id="authExpiry" placeholder="12/35" value="12/35" disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authCvv">CVV</Label>
                  <Input id="authCvv" placeholder="123" value="123" disabled className="bg-muted" />
                </div>
              </div>

              <Button type="submit" className="w-full cursor-pointer" disabled={isAuthLoading}>
                {isAuthLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Consultando...
                  </>
                ) : (
                  "Verificar autorização"
                )}
              </Button>
            </form>

            {authResult && (
              <div className="mt-4 space-y-2 rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Resposta do autorizador</span>
                  <Badge variant={authResult.authorized ? "default" : "destructive"}>
                    {authResult.authorized ? "Autorizado" : "Negado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Código</span>
                  <Badge variant="outline" className="font-mono">
                    {authResult.rc}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{authResult.message || "Sem descrição"}</p>
                {authResult.available && (
                  <p className="text-xs text-muted-foreground">
                    Saldo disponível: {formatCentsToBRL(authResult.available)}
                  </p>
                )}
                <div className="rounded-lg bg-muted p-3">
                  <p className="mb-1 text-[11px] font-medium text-muted-foreground">Resposta completa (JSON):</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(authResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Transação com o Cartão</CardTitle>
              </div>
              <CardDescription>Preencha o cartão; o débito segue o dono do cartão e o crédito vai para a Merchant (Loja)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    placeholder="3907 0000 0000 0000"
                    {...register("cardNumber", {
                      required: "Número do cartão é obrigatório",
                      minLength: {
                        value: 19,
                        message: "Mínimo de 16 dígitos",
                      },
                    })}
                    onChange={handleCardNumberChange}
                    className={errors.cardNumber ? "border-destructive" : ""}
                  />

                  {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber.message}</p>}

                  {cardNumber && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={currentBrand ? (brandAllowed ? "default" : "destructive") : "secondary"}
                        className="font-mono"
                      >
                        {currentBrand || "Bandeira desconhecida"}
                      </Badge>
                      {!brandAllowed && currentBrand && (
                        <p className="text-xs text-destructive">Bandeira desativada</p>
                      )}
                      {!currentBrand && (
                        <p className="text-xs text-muted-foreground">Enviaremos mesmo assim (deve retornar RC 14)</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="text"
                    step="0.01"
                    placeholder="52,00"
                    {...register("amount", {
                      required: "Valor é obrigatório",
                      min: {
                        value: 0.01,
                        message: "Valor mínimo de R$ 0,01",
                      },
                    })}
                    onChange={handleAmountChange}
                    className={errors.amount ? "border-destructive" : ""}
                  />
                  {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Validade</Label>
                    <Input
                      id="expiryDate"
                      placeholder="12/35"
                      {...register("expiryDate")}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" {...register("cvv")} disabled className="bg-muted" />
                  </div>
                </div>

                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Processando...
                    </>
                  ) : (
                    "Comprar"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultado da Transação</CardTitle>
              <CardDescription>
                {lastResponse ? "Última resposta do servidor" : "Envie uma transação de teste"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!lastResponse ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <AlertCircle className="mb-4 h-12 w-12 opacity-20" />
                  <p className="text-sm">Nenhuma transação processada ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/*<Alert
                    variant={lastResponse.success ? "default" : "destructive"}
                    className={
                      lastResponse.success
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                        : ""
                    }
                  >
                    {lastResponse.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle className="font-semibold">
                      {lastResponse.success ? "Transação autorizada" : "Transação Rejeitada"}
                    </AlertTitle>
                    <AlertDescription>{lastResponse.message}</AlertDescription>
                  </Alert>*/}

                  <div className="space-y-3 rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Código de Resposta</span>
                      <Badge variant="outline" className="font-mono">
                        {lastResponse.responseCode}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tipo</span>
                      <Badge>{lastResponse.type}</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={lastResponse.success ? "default" : "destructive"}>
                        {lastResponse.success ? "Sucesso" : "Falha"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor</span>
                      <Badge>{formatCentsToBRL(lastResponse.amount)}</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nome da Bandeira</span>
                      <Badge>{lastResponse.brandName}</Badge>
                    </div>
                  </div>

                  {postTxBalances && (
                    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Saldos após a transação</span>
                        <Badge variant="secondary">Issuer</Badge>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="rounded-md border bg-card p-3">
                          <p className="text-xs text-muted-foreground">Conta débito</p>
                          <p className="font-semibold">{postTxBalances.debit?.name ?? "Conta não encontrada"}</p>
                          <p className="text-sm text-muted-foreground">
                            Saldo: {postTxBalances.debit ? formatCentsToBRL(postTxBalances.debit.balance) : "--"}
                          </p>
                        </div>

                        <div className="rounded-md border bg-card p-3">
                          <p className="text-xs text-muted-foreground">Conta crédito (Merchant)</p>
                          <p className="font-semibold">
                            {postTxBalances.merchant?.name ?? "Merchant não encontrada"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Saldo: {postTxBalances.merchant ? formatCentsToBRL(postTxBalances.merchant.balance) : "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Resposta completa (JSON):</p>
                  <pre className="overflow-x-auto text-xs">{JSON.stringify(lastResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
          </Card>
        </div>
      </div>

      {isLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b bg-muted/40 px-6 py-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Extrato do issuer</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{selectedLedgerName ?? "Conta"}</h3>
                  {ledgerBadge ? <Badge variant={ledgerBadge.variant}>{ledgerBadge.label}</Badge> : null}
                </div>
                {selectedLedgerAccountId ? (
                  <p className="text-xs text-muted-foreground">
                    ID: {selectedLedgerAccountId} • Saldo:{" "}
                    {formatCentsToBRL(selectedLedgerBalance ?? "0")}
                  </p>
                ) : null}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleCloseLedgerModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
              {ledgerError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{ledgerError}</AlertDescription>
                </Alert>
              ) : null}

              {isLoadingLedger ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
                  Carregando extrato...
                </div>
              ) : ledgerError ? null : ledgerData?.transfers?.length ? (
                <div className="space-y-3">
                  {ledgerData.transfers.map((transfer) => {
                    const isDebit = selectedLedgerAccountId === transfer.debit_account_id
                    const counterpartyId = isDebit ? transfer.credit_account_id : transfer.debit_account_id
                    const counterparty = counterpartyId ? accountMap.get(counterpartyId) : null
                    const directionLabel = isDebit ? "Débito" : "Crédito"
                    const amountLabel = `${isDebit ? "-" : "+"}${formatCentsToBRL(transfer.amount)}`

                    return (
                      <div key={transfer.id} className="rounded-lg border bg-card p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {isDebit ? (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            )}
                            <div>
                              <p className="font-semibold">
                                {counterparty?.name ?? `Conta ${counterpartyId}`}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {directionLabel} • Ledger {transfer.ledger}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={isDebit ? "destructive" : "outline"}>{directionLabel}</Badge>
                            <p className={`font-mono ${isDebit ? "text-destructive" : "text-emerald-600"}`}>
                              {amountLabel}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>Transfer #{transfer.id}</span>
                          <span>•</span>
                          <span>{formatLedgerTimestamp(transfer.timestamp)}</span>
                          <span>•</span>
                          <span>De: {transfer.debit_account_id}</span>
                          <span>•</span>
                          <span>Para: {transfer.credit_account_id}</span>
                          <span>•</span>
                          <span>Código: {transfer.code}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  Nenhuma transação encontrada para esta conta.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
