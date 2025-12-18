import { getAccountWithLatestDebit } from '../../account/queries/getAccountWithLatestDebit.ts';

type AccountContext = {
  params?: { id?: string };
  body: unknown;
  status: number;
};

export const showAccountWithLatestDebit = async (ctx: AccountContext): Promise<void> => {
  const idParam = ctx.params?.id;

  if (!idParam) {
    ctx.status = 400;
    ctx.body = { error: 'Parâmetro id é obrigatório.' };
    return;
  }

  let accountId: bigint;
  try {
    accountId = BigInt(idParam);
  } catch {
    ctx.status = 400;
    ctx.body = { error: 'Parâmetro id inválido: use um número inteiro.' };
    return;
  }

  try {
    const account = await getAccountWithLatestDebit(accountId);

    if (!account) {
      ctx.status = 404;
      ctx.body = { error: 'Usuário não encontrado no ledger.' };
      return;
    }

    ctx.body = account;
  } catch (error) {
    console.error(`[HTTP][USER][${idParam}] Falha ao buscar usuário:`, error);
    ctx.status = 500;
    ctx.body = { error: 'Erro ao consultar dados no TigerBeetle.' };
  }
};
