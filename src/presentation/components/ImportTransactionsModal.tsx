import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useFinanceContext } from '../../application/hooks/useFinanceData';
import { ApiRepository } from '../../infrastructure/repositories/ApiRepository';
import { v4 as uuidv4 } from 'uuid';
import { Money } from '../../domain/value-objects/Money';
import { format, parseISO } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultDestinationType?: 'ACCOUNT' | 'CREDIT_CARD';
}

interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  type: 'INCOME' | 'EXPENSE';
  selected: boolean;
  category?: string;
}

export const ImportTransactionsModal: React.FC<Props> = ({ isOpen, onClose, defaultDestinationType }) => {
  const { creditCards, accounts, categories, addTransactionsBulk } = useFinanceContext();
  
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');
  const [rawText, setRawText] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinationType, setDestinationType] = useState<'ACCOUNT' | 'CREDIT_CARD'>(defaultDestinationType || 'CREDIT_CARD');
  const [selectedId, setSelectedId] = useState('');
  const [overrideMonth, setOverrideMonth] = useState(format(new Date(), 'yyyy-MM'));

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (destinationType === 'CREDIT_CARD' && creditCards.length > 0 && !selectedId) {
      setSelectedId(creditCards[0].id);
    } else if (destinationType === 'ACCOUNT' && accounts.length > 0 && !selectedId) {
      setSelectedId(accounts[0].id);
    }
  }, [creditCards, accounts, destinationType]);

  if (!isOpen) return null;

  const parseOFX = (text: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = stmtTrnRegex.exec(text)) !== null) {
      const content = match[1];
      
      // Captura campos ignorando tags de fechamento ou quebras de linha
      const getValue = (tag: string) => {
        const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
        const m = content.match(regex);
        return m ? m[1].trim() : null;
      };

      const typeRaw = getValue('TRNTYPE');
      const dateRaw = getValue('DTPOSTED');
      const amountRaw = getValue('TRNAMT');
      const memoRaw = getValue('MEMO') || getValue('NAME') || getValue('PAYEE');

      if (dateRaw && amountRaw && memoRaw) {
        // Formato data: YYYYMMDDHHMMSS
        const y = dateRaw.substring(0, 4);
        const m = dateRaw.substring(4, 6);
        const d = dateRaw.substring(6, 8);
        const hh = dateRaw.substring(8, 10) || '00';
        const mm = dateRaw.substring(10, 12) || '00';
        const ss = dateRaw.substring(12, 14) || '00';

        const dateStr = `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
        const amountValue = parseFloat(amountRaw.replace(',', '.'));
        const amountCents = Math.abs(Math.round(amountValue * 100));
        
        transactions.push({
          id: uuidv4(),
          date: dateStr,
          description: memoRaw.replace(/<\/?[^>]+(>|$)/g, "").trim(),
          amountCents: amountCents,
          type: amountValue < 0 ? 'EXPENSE' : 'INCOME',
          selected: true
        });
      }
    }
    return transactions;
  };

  const parseCSV = (text: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];
    
    // Tenta normalizar o texto se ele estiver todo em uma linha só (comum em cópias de PDF)
    // Se encontrar "DD/MM/YYYY," ou "YYYY-MM-DD," precedido por espaço, assume que é uma nova linha
    const normalizedText = text.replace(/ (\d{2}\/\d{2}\/\d{4},)/g, '\n$1')
                               .replace(/ (\d{4}-\d{2}-\d{2},)/g, '\n$1');
                               
    const lines = normalizedText.split(/\r?\n/);
    
    // Ignora o cabeçalho se existir (tenta detectar se a primeira linha tem "data" ou "valor")
    const startIdx = lines[0].toLowerCase().includes('data') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Suporta ponto e vírgula ou vírgula
      const parts = line.includes(';') ? line.split(';') : line.split(',');
      if (parts.length >= 3) {
        const dateRaw = parts[0];
        const amountRaw = parts[parts.length - 1];
        const description = parts.slice(1, -1).join(', ').trim();
        
        // Tenta converter data DD/MM/YYYY para YYYY-MM-DD
        let dateStr = dateRaw.trim();
        if (dateStr.includes('/')) {
          const [d, m, y] = dateStr.split('/');
          dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        // Lógica inteligente para converter valor (suporta 1.000,00 ou 1000.00)
        const amountClean = amountRaw.trim().replace('R$', '').trim();
        const amountValue = amountClean.includes(',') && amountClean.includes('.')
          ? parseFloat(amountClean.replace(/\./g, '').replace(',', '.'))
          : parseFloat(amountClean.replace(',', '.'));

        const amountCents = Math.abs(Math.round(amountValue * 100));

        transactions.push({
          id: uuidv4(),
          date: dateStr,
          description: description.trim(),
          amountCents: amountCents,
          type: amountValue < 0 ? 'EXPENSE' : 'INCOME',
          selected: true
        });
      }
    }
    return transactions;
  };

  const downloadCsvModel = () => {
    const content = "Data,Descricao,Valor\n01/05/2026,Compra Exemplo,-50.00\n02/05/2026,Venda Exemplo,100.00";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const result = event.target?.result as string | ArrayBuffer;
      
      if (file.name.toLowerCase().endsWith('.ofx')) {
        const txs = parseOFX(result as string);
        if (txs.length > 0) {
          setParsedTransactions(txs);
          setStep('PREVIEW');
        } else {
          setError('Nenhuma transação encontrada no arquivo OFX.');
        }
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        const txs = parseCSV(result as string);
        if (txs.length > 0) {
          setParsedTransactions(txs);
          setStep('PREVIEW');
        } else {
          setError('Nenhuma transação encontrada no arquivo CSV.');
        }
      } else if (isImage) {
        // Se for imagem, processa via Vision
        handleAiProcess('', result as string);
      } else if (isPdf) {
        try {
          setIsProcessing(true);
          const text = await extractTextFromPDF(result as ArrayBuffer);
          setRawText(text);
          handleAiProcess(text);
        } catch (err) {
          setError('Erro ao ler o PDF. Tente tirar um print da tela e importar como imagem.');
          setIsProcessing(false);
        }
      } else {
        // Se não for OFX, imagem nem PDF, tenta como texto
        setRawText(result as string);
        handleAiProcess(result as string);
      }
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else if (isPdf) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const extractTextFromPDF = async (data: ArrayBuffer) => {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }
    
    return fullText;
  };

  const handleAiProcess = async (text: string, image?: string) => {
    if (!text.trim() && !image) return;
    setIsProcessing(true);
    setError(null);

    try {
      const isPayroll = text.toLowerCase().includes('holerite') || text.toLowerCase().includes('demonstrativo de pagamento') || text.toLowerCase().includes('salario');
      
      const prompt = text 
        ? `Analise o seguinte texto de ${isPayroll ? 'holerite/demonstrativo de pagamento' : 'extrato bancário'} e retorne APENAS um JSON plano contendo uma lista de objetos com os campos: "date" (YYYY-MM-DD), "description" e "amountCents" (valor positivo em centavos). Determine se é "EXPENSE" ou "INCOME" baseado no sinal ou contexto.
        
        ${isPayroll ? 'Para holerites: Proventos/Vencimentos são INCOME, Descontos são EXPENSE.' : ''}
        
        Texto:
        ${text.substring(0, 5000)}
        
        IMPORTANTE: O ano atual é ${new Date().getFullYear()}.` 
        : `Extraia as transações desta imagem de ${isPayroll ? 'holerite' : 'extrato'}. O ano atual é ${new Date().getFullYear()}.`;

      const response = await ApiRepository.getAiInsights(prompt, image);

      const insightsText = response.insights;

      // Tenta extrair o JSON da resposta da IA
      let txs: any[] = [];
      try {
        // Remove blocos de código se existirem
        const cleanJson = insightsText.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        txs = Array.isArray(parsed) ? parsed : (parsed.transactions || []);
      } catch (e) {
        // Fallback: tenta encontrar algo que pareça um array
        const jsonMatch = insightsText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          txs = JSON.parse(jsonMatch[0]);
        }
      }

      if (txs.length > 0) {
        const validatedTxs = txs.map((t: any) => ({
          id: uuidv4(),
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || 'Transação Importada',
          amountCents: Math.abs(Number(t.amountCents)) || 0,
          type: t.type || 'EXPENSE',
          selected: true
        }));
        
        setParsedTransactions(validatedTxs);
        setStep('PREVIEW');
      } else {
        throw new Error('Não foi possível identificar as transações no texto.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar com IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiCategorize = async () => {
    const selectedTxs = parsedTransactions.filter(t => t.selected);
    if (selectedTxs.length === 0) return;

    setIsCategorizing(true);
    try {
      const categoryNames = categories.map(c => c.name);
      const result = await ApiRepository.categorizeTransactions(
        selectedTxs.map(t => ({ id: t.id, description: t.description })),
        categoryNames
      );

      const items = result.categorization;
      if (items && Array.isArray(items)) {
        const newList = [...parsedTransactions];
        items.forEach(item => {
          const idx = newList.findIndex(t => t.id === item.id);
          if (idx !== -1) {
            newList[idx] = { ...newList[idx], category: item.category };
          }
        });
        setParsedTransactions(newList);
      }
    } catch (err: any) {
      setError('Erro ao categorizar: ' + err.message);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedId) {
      alert(`Por favor, selecione o ${destinationType === 'CREDIT_CARD' ? 'cartão' : 'conta'} de destino.`);
      return;
    }

    const finalTransactions = parsedTransactions
      .filter(t => t.selected)
      .map(t => {
        // Usa a data que está na linha (que pode ter sido editada pelo usuário ou vir do OFX)
        let rowDate = new Date(t.date);
        
        // Se a data for inválida (ex: formato YYYY-MM-DD sem T...), tenta adicionar o meio-dia
        if (isNaN(rowDate.getTime())) {
          rowDate = new Date(t.date + 'T12:00:00');
        }

        const [year, month] = overrideMonth.split('-').map(Number);
        
        // Se ainda for inválida, usa a data atual como fallback para não quebrar
        const day = isNaN(rowDate.getTime()) ? new Date().getDate() : rowDate.getDate();
        const adjustedDate = new Date(year, month - 1, day);
        const dateStr = adjustedDate.toISOString().split('T')[0];

        return {
          id: uuidv4(),
          date: dateStr,
          description: t.description,
          amountCents: t.amountCents,
          type: t.type,
          creditCardId: destinationType === 'CREDIT_CARD' ? selectedId : undefined,
          accountId: destinationType === 'ACCOUNT' ? selectedId : (creditCards.find(c => c.id === selectedId)?.accountId || ''),
          status: destinationType === 'CREDIT_CARD' ? 'PENDING' as const : 'PAID' as const,
          category: t.category || 'Importado',
          isInstallment: false
        };
      });

    await addTransactionsBulk(finalTransactions);
    onClose();
    setStep('UPLOAD');
    setParsedTransactions([]);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-[#0d1527] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Importar Transações
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-6">
          {step === 'UPLOAD' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* File Upload Zone */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest ml-1">Arquivo Bancário</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative h-[220px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <Upload className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="text-center px-4 relative z-10">
                      <p className="font-bold text-white/90 text-lg">Selecionar Arquivo</p>
                      <p className="text-sm text-white/40 mt-1">OFX, PDF ou Extrato em Imagem</p>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".ofx,.pdf,.csv,image/*" onChange={handleFileUpload} />
                  </div>
                </div>

                {/* AI Paste Zone */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest ml-1">Copiar e Colar Texto</label>
                  <div className="flex-1 min-h-[220px] relative group">
                    <textarea 
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Cole aqui o texto do extrato ou print..."
                      className="w-full h-full rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none font-mono"
                    />
                    <div className="absolute bottom-4 right-4">
                      <button 
                        disabled={!rawText || isProcessing}
                        onClick={() => handleAiProcess(rawText)}
                        className="h-10 px-6 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Processar com IA
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="pt-6 border-t border-white/5 flex flex-col items-center">
                <p className="text-[10px] text-white/20 mb-3">Dificuldades com o arquivo? Use nosso modelo:</p>
                <button 
                  type="button"
                  onClick={downloadCsvModel}
                  className="text-[11px] text-blue-400/60 hover:text-blue-400 flex items-center gap-2 transition-colors py-2 px-4 rounded-xl hover:bg-blue-400/5"
                >
                  <Upload className="w-3 h-3 rotate-180" /> Baixar Modelo CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Destino</label>
                    <select 
                      value={destinationType}
                      onChange={(e) => {
                        const newType = e.target.value as 'ACCOUNT' | 'CREDIT_CARD';
                        setDestinationType(newType);
                        setSelectedId('');
                      }}
                      className="bg-transparent text-[10px] text-white/40 font-bold uppercase focus:outline-none"
                    >
                      <option value="CREDIT_CARD" className="bg-[#1a2333]">Cartão</option>
                      <option value="ACCOUNT" className="bg-[#1a2333]">Conta</option>
                    </select>
                  </div>
                  <select 
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="bg-transparent text-white font-bold text-lg focus:outline-none cursor-pointer hover:text-blue-400 transition-colors"
                  >
                    <option value="" disabled className="bg-[#1a2333]">Selecionar...</option>
                    {destinationType === 'CREDIT_CARD' 
                      ? creditCards.map(c => <option key={c.id} value={c.id} className="bg-[#1a2333]">{c.name}</option>)
                      : accounts.map(a => <option key={a.id} value={a.id} className="bg-[#1a2333]">{a.name}</option>)
                    }
                  </select>
                </div>
                <div className="h-10 w-px bg-white/10 hidden sm:block" />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Mês de Referência</label>
                  <input 
                    type="month"
                    value={overrideMonth}
                    onChange={(e) => setOverrideMonth(e.target.value)}
                    className="bg-transparent text-white font-bold text-lg focus:outline-none cursor-pointer hover:text-blue-400 transition-colors"
                  />
                </div>
                <div className="h-10 w-px bg-white/10 hidden sm:block" />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Total a Importar</p>
                  <p className="text-2xl font-black text-white tabular-nums">
                    {Money.fromCents(parsedTransactions.filter(t => t.selected).reduce((acc, t) => acc + t.amountCents, 0)).format()}
                  </p>
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto rounded-2xl border border-white/5 bg-white/[0.01] custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#161e31]/95 backdrop-blur-md border-b border-white/10">
                      <th className="px-5 py-4 text-left w-10">
                        <input 
                          type="checkbox" 
                          checked={parsedTransactions.length > 0 && parsedTransactions.every(t => t.selected)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setParsedTransactions(parsedTransactions.map(t => ({ ...t, selected: checked })));
                          }}
                          className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                        />
                      </th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-white/40 uppercase tracking-widest">Data</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-white/40 uppercase tracking-widest">Descrição</th>
                      <th className="px-5 py-4 text-left text-[10px] font-bold text-white/40 uppercase tracking-widest">Categoria</th>
                      <th className="px-5 py-4 text-right text-[10px] font-bold text-white/40 uppercase tracking-widest">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedTransactions.map((tx, i) => (
                      <tr key={tx.id} className={`hover:bg-white/[0.03] transition-colors group ${!tx.selected ? 'opacity-40' : ''}`}>
                        <td className="px-5 py-4 text-left">
                          <input 
                            type="checkbox" 
                            checked={tx.selected}
                            onChange={() => {
                              const newList = [...parsedTransactions];
                              newList[i].selected = !newList[i].selected;
                              setParsedTransactions(newList);
                            }}
                            className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input 
                            type="date"
                            value={tx.date.includes('T') ? tx.date.split('T')[0] : tx.date}
                            onChange={(e) => {
                              const newList = [...parsedTransactions];
                              newList[i].date = e.target.value;
                              setParsedTransactions(newList);
                            }}
                            className="bg-transparent border-none text-white/50 text-[11px] tabular-nums font-medium focus:ring-1 focus:ring-blue-500/50 rounded px-1 -ml-1 hover:bg-white/5 transition-colors"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input 
                            type="text"
                            value={tx.description}
                            onChange={(e) => {
                              const newList = [...parsedTransactions];
                              newList[i].description = e.target.value;
                              setParsedTransactions(newList);
                            }}
                            className="w-full bg-transparent border-none text-white/90 font-medium focus:ring-1 focus:ring-blue-500/50 rounded px-2 -ml-2 hover:bg-white/5 transition-colors"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <select 
                            value={tx.category || 'Importado'}
                            onChange={(e) => {
                              const newList = [...parsedTransactions];
                              newList[i].category = e.target.value;
                              setParsedTransactions(newList);
                            }}
                            className="bg-transparent border-none text-blue-400 text-[11px] font-bold focus:ring-1 focus:ring-blue-500/50 rounded px-1 -ml-1 hover:bg-white/5 transition-colors cursor-pointer appearance-none"
                          >
                            <option value="Importado" className="bg-[#1a2333]">Importado</option>
                            {categories.map(c => <option key={c.id} value={c.name} className="bg-[#1a2333]">{c.name}</option>)}
                          </select>
                        </td>
                        <td className={`px-5 py-4 text-right font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{Money.fromCents(tx.amountCents).format()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setStep('UPLOAD')}
                  className="flex-1 h-14 rounded-2xl bg-white/5 text-white/60 font-bold hover:bg-white/10 transition-all border border-white/5"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleAiCategorize}
                  disabled={isCategorizing || parsedTransactions.filter(t => t.selected).length === 0}
                  className="flex-1 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Categorizar IA
                </button>
                <button 
                  onClick={handleConfirmImport}
                  className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-black text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  <Check className="w-6 h-6" />
                  Importar {parsedTransactions.filter(t => t.selected).length} Itens
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
