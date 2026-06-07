import React, { useState, useEffect } from 'react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { Money } from '../../domain/value-objects/Money';
import { CreditCard as CreditCardIcon, Wallet, X, Calculator, Receipt, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
  cardInvoice?: { cardId: string; name: string };
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, transaction, cardInvoice }) => {
  const { accounts, creditCards, updateTransaction, payTransactionWithCredit, payFullBillWithCredit } = useFinanceContext();
  
  const [paymentSource, setPaymentSource] = useState<'ACCOUNT' | 'CARD'>('ACCOUNT');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceFee, setServiceFee] = useState('0,00');
  const [iof, setIof] = useState('0,00');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (accounts.length > 0) setSelectedSourceId(accounts[0].id);
      setPaymentSource('ACCOUNT');
      setServiceFee('0,00');
      setIof('0,00');
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const description = transaction?.description || `Fatura ${cardInvoice?.name}`;
  const originalAmount = transaction?.amountCents || 0; // If it's a full bill, we'll calculate inside the hook or pass it
  
  const parseCurrency = (val: string) => {
    const clean = val.replace(/\D/g, '');
    return parseInt(clean || '0', 10);
  };

  const formatCurrencyInput = (val: string) => {
    const clean = val.replace(/\D/g, '');
    const amount = parseInt(clean || '0', 10);
    return (amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const feeCents = parseCurrency(serviceFee);
      const iofCents = parseCurrency(iof);

      if (paymentSource === 'ACCOUNT') {
        if (transaction) {
          await updateTransaction(transaction.id, { 
            status: 'PAID', 
            date: paymentDate,
            accountId: selectedSourceId,
            creditCardId: undefined 
          });
        } else if (cardInvoice) {
            // Logic for paying bill with bank account already exists in CartoesPage but we can unify here if needed
            // For now, let's focus on the credit card mechanism requested
        }
      } else {
        if (transaction) {
          await payTransactionWithCredit(transaction, selectedSourceId, feeCents, iofCents, paymentDate);
        } else if (cardInvoice) {
          await payFullBillWithCredit(cardInvoice.cardId, selectedSourceId, feeCents, iofCents, paymentDate);
        }
      }
      onClose();
    } catch (error) {
      alert('Erro ao processar pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0d1527] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div>
            <h3 className="text-lg font-bold text-white">Confirmar Pagamento</h3>
            <p className="text-xs text-white/50 mt-0.5">{description}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Valor Principal (Visual) */}
          {transaction && (
            <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
              <span className="text-sm text-white/40">Valor da Conta</span>
              <span className="text-xl font-bold text-white tabular-nums">{Money.fromCents(originalAmount).format()}</span>
            </div>
          )}

          {/* Origem do Pagamento */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Origem do Pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setPaymentSource('ACCOUNT'); if(accounts.length > 0) setSelectedSourceId(accounts[0].id); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                  paymentSource === 'ACCOUNT' 
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <Wallet className="w-6 h-6" />
                <span className="text-xs font-bold uppercase">Saldo Bancário</span>
              </button>
              <button
                onClick={() => { setPaymentSource('CARD'); if(creditCards.length > 0) setSelectedSourceId(creditCards[0].id); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                  paymentSource === 'CARD' 
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <CreditCardIcon className="w-6 h-6" />
                <span className="text-xs font-bold uppercase">Cartão Crédito</span>
              </button>
            </div>
          </div>

          {/* Seleção de Conta ou Cartão */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase block mb-2">{paymentSource === 'ACCOUNT' ? 'Selecionar Conta' : 'Selecionar Cartão'}</label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                {paymentSource === 'ACCOUNT' 
                  ? accounts.map(a => <option key={a.id} value={a.id} className="bg-[#0d1527]">{a.name}</option>)
                  : creditCards.map(c => <option key={c.id} value={c.id} className="bg-[#0d1527]">{c.name}</option>)
                }
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase block mb-2">Data do Pagamento</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Campos de Taxa e IOF - Apenas se for Cartão */}
            {paymentSource === 'CARD' && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-1">
                    <Calculator className="w-3 h-3" /> Taxa Serviço
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-bold">R$</span>
                    <input
                      type="text"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(formatCurrencyInput(e.target.value))}
                      className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-1">
                    <Receipt className="w-3 h-3" /> IOF
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-bold">R$</span>
                    <input
                      type="text"
                      value={iof}
                      onChange={(e) => setIof(formatCurrencyInput(e.target.value))}
                      className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 text-sm text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumo Total */}
          {paymentSource === 'CARD' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <div className="flex justify-between items-center text-xs text-white/50 mb-1">
                <span>Resumo no Cartão</span>
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[10px] text-white/30 space-y-0.5">
                  <p>Original: {Money.fromCents(originalAmount).format()}</p>
                  <p>Encargos: {Money.fromCents(parseCurrency(serviceFee) + parseCurrency(iof)).format()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase font-bold">Total a Pagar</p>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {Money.fromCents(originalAmount + parseCurrency(serviceFee) + parseCurrency(iof)).format()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-white/[0.02] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-white/5 text-white/60 text-sm font-bold hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !selectedSourceId}
            className={`flex-1 h-12 rounded-2xl bg-gradient-to-r ${
              paymentSource === 'ACCOUNT' ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-blue-600'
            } text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100`}
          >
            {isProcessing ? 'Processando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
