import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/useToast"
import { CheckCircle2, XCircle, AlertCircle, CreditCard, Info } from "lucide-react"

import './styles/globals.css'

// Feature flags para bandeiras
const FEATURE_FLAGS = {
  BRAND_MASTERCARD: false,
  BRAND_VISA: false,
  BRAND_PIX: true,
}

const CARD_BRANDS = {
  BRAND_PIX: "3907",
  BRAND_MASTERCARD: "5162",
  BRAND_VISA: "4026",
}

const RESPONSE_CODES = [
  { req: "00", res: "00", desc: "Success/Approved" },
  { req: "03", res: "03", desc: "Invalid Merchant" },
  { req: "12", res: "12", desc: "Wrong Transaction Date/Time" },
  { req: "14", res: "14", desc: "Invalid Card" },
  { req: "57", res: "57", desc: "Refund Not Allowed" },
  { req: "58", res: "58", desc: "Invalid Transaction" },
  { req: "94", res: "94", desc: "Duplicate Transaction" },
]

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
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<TransactionResponse | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    defaultValues: {
      cardNumber: "",
      amount: "",
      expiryDate: "12/35",
      cvv: "123",
    },
  })

  const cardNumber = watch("cardNumber")
  const amount = watch("amount")

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, "");
    digitsOnly = digitsOnly.slice(0, 16); // limita 16 dígitos

    const formatted = digitsOnly.replace(/(.{4})/g, "$1 ").trim();

    setValue("cardNumber", formatted, { shouldValidate: true, shouldDirty: true });
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, "");
  
    // evita string vazia
    if (!digitsOnly) {
      setValue("amount", "", { shouldValidate: true });
      return;
    }
  
    // transforma para centavos
    const numeric = (parseInt(digitsOnly, 10) / 100).toFixed(2);
  
    // formata para 1.234,56
    const formatted = numeric
      .replace(".", ",")                 // vírgula
      .replace(/\B(?=(\d{3})+(?!\d))/g, "."); // pontos nos milhares
  
    setValue("amount", formatted, { shouldValidate: true, shouldDirty: true });
  }

  // Detecta a bandeira do cartão
  const detectBrand = (number: string) => {
    if (number.startsWith(CARD_BRANDS.BRAND_PIX)) return "PIX"
    if (number.startsWith(CARD_BRANDS.BRAND_MASTERCARD)) return "MASTERCARD"
    if (number.startsWith(CARD_BRANDS.BRAND_VISA)) return "VISA"
    return null
  }

  // Verifica se a bandeira está habilitada
  const isBrandEnabled = (brand: string | null) => {
    if (!brand) return false

    return FEATURE_FLAGS[`BRAND_${brand}` as keyof typeof FEATURE_FLAGS]
  }

  // Formata o valor em reais
  const formatCurrency = (value: string) => {
    const numValue = Number.parseFloat(value)
  
    if (isNaN(numValue)) return "R$ 0,00"
  
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue)
  }
  

  const convertAmountToInteger = (value: string) => {
    const cleanValue = value.replace(/\./g, "").replace(",", ".")
    const numValue = Number.parseFloat(cleanValue)

    if (isNaN(numValue)) return "000000000000"

    const cents = Math.round(numValue * 100)
    return cents.toString().padStart(12, "0")
  }

  const formatResponseAmount = (value: string) => {
    const cents = parseInt(value, 10)
    if (isNaN(cents)) return "R$ 0,00"
    
    const reais = (cents / 100).toFixed(2)
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(reais))
  }

  const onSubmit = async (data: FormData) => {
    const brand = detectBrand(data.cardNumber)

    if (!isBrandEnabled(brand)) {
      toast({
        title: "❌ Bandeira desativada",
        description: `A bandeira ${brand || "detectada"} está desativada. Use a bandeira PIX (3907).`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setLastResponse(null)

    try {
      const payload = {
        cardNumber: data.cardNumber.trim(),
        amount: convertAmountToInteger(data.amount),
        transactionId: "000123",
        acquirerInstitution: "01020000000",
        merchantId: "WOOVIMERCHANT001",
        currency: "764",
      }

      const response = await fetch("http://localhost:4000/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result: TransactionResponse = await response.json()
      setLastResponse(result)

      if (result.success) {
        toast({
          title: "✅ Transação autorizada",
          description: `${result.message} - Código: ${result.responseCode}`,
          variant: "default",
          className: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
        })
      } else {
        toast({
          title: "❌ Transação rejeitada",
          description: `${result.message} - Código: ${result.responseCode}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "⚠️ Erro de conexão",
        description: "Não foi possível conectar ao servidor. Verifique se está rodando em http://localhost:4000",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentBrand = detectBrand(cardNumber)
  const brandEnabled = isBrandEnabled(currentBrand)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Testar bandeiras</h1>
          <p className="text-muted-foreground">Ferramenta para testar transações com o servidor de pagamentos</p>
        </div>

        {/* Instruções */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>Como usar</CardTitle>
            </div>
            <CardDescription>Instruções para testar diferentes cenários de transação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Bandeiras disponíveis:</h3>
              <div className="grid gap-2 md:grid-cols-3">
                {Object.entries(CARD_BRANDS).map(([brandKey, prefix]) => {
                  const brand = brandKey.replace("BRAND_", "") // Ex: BRAND_PIX → PIX
                  const enabled = FEATURE_FLAGS[brandKey as keyof typeof FEATURE_FLAGS]

                  return (
                    <div
                      key={brandKey}
                      className={`flex items-center justify-between rounded-lg border p-3 transition
                        ${enabled ? "bg-card" : "bg-muted/50 opacity-60"}
                      `}
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
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Como testar erros:</h3>
              <div className="rounded-lg bg-muted p-4 space-y-2 font-mono text-sm">
                <p className="text-muted-foreground">
                  O resultado da transação é determinado pelos <strong>centavos</strong> do valor:
                </p>
                <ul className="space-y-1 ml-4 text-xs">
                  <li>
                    • R$ 52,<strong>00</strong> → Código 00 (Aprovada)
                  </li>
                  <li>
                    • R$ 52,<strong>14</strong> → Código 14 (Cartão Inválido)
                  </li>
                  <li>
                    • R$ 52,<strong>03</strong> → Código 03 (Comerciante Inválido)
                  </li>
                  <li>
                    • R$ 52,<strong>12</strong> → Código 12 (Data/Hora Errada)
                  </li>
                  <li>
                    • R$ 52,<strong>57</strong> → Código 57 (Reembolso Não Permitido)
                  </li>
                  <li>
                    • R$ 52,<strong>58</strong> → Código 58 (Transação Inválida)
                  </li>
                  <li>
                    • R$ 52,<strong>94</strong> → Código 94 (Transação Duplicada)
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Códigos de resposta:</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {RESPONSE_CODES.map((code) => (
                  <div key={code.req} className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm">
                    <Badge variant="outline" className="font-mono">
                      {code.res}
                    </Badge>
                    <span className="text-muted-foreground">{code.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Dados da Transação</CardTitle>
              </div>
              <CardDescription>Preencha os dados para testar a transação</CardDescription>
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
                      <Badge variant={brandEnabled ? "default" : "destructive"} className="font-mono">
                        {currentBrand || "Desconhecida"}
                      </Badge>
                      {!brandEnabled && currentBrand && <p className="text-xs text-destructive">Bandeira desativada</p>}
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

                  { amount && 
                    <p className="text-sm text-muted-foreground">
                      Valor formatado: {formatCurrency(amount.replace(/\./g, "").replace(",", "."))}
                    </p>
                  }
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Processando...
                    </>
                  ) : (
                    "Processar Transação"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resultado */}
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
                  <Alert
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
                  </Alert>

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
                      <Badge>{formatResponseAmount(lastResponse.amount)}</Badge>
                    </div>
                  </div>

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
    </div>
  )
}
