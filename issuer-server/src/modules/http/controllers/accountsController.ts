import { ACCOUNTS, CLEARING, MERCHANTS } from '../../account/__fixtures__/accounts.ts';
import {
  findAccountMeta,
  mapTransferToLedgerTransfer,
} from '../../account/accountHelpers.ts';
import { getAccountWithLatestDebit } from '../../account/queries/getAccountWithLatestDebit.ts';
import { getAccountsByIds } from '../../account/queries/getAccountsByIds.ts';
import { getAllAccountsWithBalance } from '../../account/queries/getAllAccountsWithBalance.ts';
import { getAccountTransfers } from '../../ledger/queries/getAccountTransfers.ts';

type AccountContext = {
  params?: { id?: string };
  body: unknown;
  status: number;
};

export const listAccounts = async (ctx: AccountContext): Promise<void> => {
  try {
    ctx.body = await getAllAccountsWithBalance();
  } catch (error) {
    console.error('[HTTP][ACCOUNTS] Falha ao listar contas:', error);
    ctx.status = 500;
    ctx.body = { error: 'Erro ao consultar contas no TigerBeetle.' };
  }
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

export const showAccountLedger = async (ctx: AccountContext): Promise<void> => {
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
    const [account] = await getAccountsByIds([accountId]);
    if (!account) {
      ctx.status = 404;
      ctx.body = { error: 'Conta não encontrada no ledger.' };
      return;
    }

    const transfers = await getAccountTransfers(accountId);
    const meta = findAccountMeta(accountId, [...ACCOUNTS, ...MERCHANTS, CLEARING]);
    const balance = account.credits_posted - account.debits_posted;

    ctx.body = {
      account: {
        id: account.id.toString(),
        name: meta?.name ?? `Conta ${account.id.toString()}`,
        type: meta?.type ?? 'customer',
        balance: balance.toString(),
        credits_posted: account.credits_posted.toString(),
        debits_posted: account.debits_posted.toString(),
      },
      transfers: transfers.map(mapTransferToLedgerTransfer),
    };
  } catch (error) {
    console.error(`[HTTP][ACCOUNTS][${idParam}] Falha ao listar ledger:`, error);
    ctx.status = 500;
    ctx.body = { error: 'Erro ao consultar ledger no TigerBeetle.' };
  }
};
