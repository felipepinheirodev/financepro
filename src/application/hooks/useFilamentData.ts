import { useState, useEffect, useCallback } from 'react';
import { ApiRepository } from '../../infrastructure/repositories/ApiRepository';

export function useFilamentData() {
  const [filaments, setFilaments] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  // Novos estados para o módulo de Gestão de Impressão 3D e Produção
  const [printers, setPrinters] = useState<any[]>([]);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const [f, p, s, sum, sup, pts, accs, jbs] = await Promise.all([
        ApiRepository.getFilaments(),
        ApiRepository.getFilamentPurchases(),
        ApiRepository.getFilamentStocks(),
        ApiRepository.getFilamentSummary(),
        ApiRepository.getSuppliers(),
        ApiRepository.getPrinters(),
        ApiRepository.getAccessories(),
        ApiRepository.getPrintJobs(),
      ]);
      setFilaments(f);
      setPurchases(p);
      setStocks(s);
      setSummary(sum);
      setSuppliers(sup);
      setPrinters(pts);
      setAccessories(accs);
      setJobs(jbs);
    } catch (err) {
      console.error('useFilamentData: load failed', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addFilament = async (data: any) => { await ApiRepository.saveFilament(data); await loadData(); };
  const updateFilament = async (id: string, data: any) => { await ApiRepository.updateFilament(id, data); await loadData(); };
  const deleteFilament = async (id: string) => { await ApiRepository.deleteFilament(id); await loadData(); };

  const addPurchase = async (data: any) => { await ApiRepository.saveFilamentPurchase(data); await loadData(); };
  const updatePurchase = async (id: string, data: any) => { await ApiRepository.updateFilamentPurchase(id, data); await loadData(); };
  const deletePurchase = async (id: string) => { await ApiRepository.deleteFilamentPurchase(id); await loadData(); };

  const addStock = async (data: any) => { await ApiRepository.saveFilamentStock(data); await loadData(); };
  const updateStock = async (id: string, data: any) => { await ApiRepository.updateFilamentStock(id, data); await loadData(); };
  const deleteStock = async (id: string) => { await ApiRepository.deleteFilamentStock(id); await loadData(); };

  const addSupplier = async (data: any) => { await ApiRepository.saveSupplier(data); await loadData(); };
  const deleteSupplier = async (id: string) => { await ApiRepository.deleteSupplier(id); await loadData(); };

  // Mutações adicionadas para o módulo de Gestão de Impressão 3D e Produção
  const addPrinter = async (data: any) => { await ApiRepository.savePrinter(data); await loadData(); };
  const updatePrinter = async (id: string, data: any) => { await ApiRepository.updatePrinter(id, data); await loadData(); };
  const deletePrinter = async (id: string) => { await ApiRepository.deletePrinter(id); await loadData(); };

  const addAccessory = async (data: any) => { await ApiRepository.saveAccessory(data); await loadData(); };
  const updateAccessory = async (id: string, data: any) => { await ApiRepository.updateAccessory(id, data); await loadData(); };
  const deleteAccessory = async (id: string) => { await ApiRepository.deleteAccessory(id); await loadData(); };

  const addJob = async (data: any) => { await ApiRepository.savePrintJob(data); await loadData(); };
  const updateJob = async (id: string, data: any) => { await ApiRepository.updatePrintJob(id, data); await loadData(); };
  const completeJob = async (id: string) => { await ApiRepository.completePrintJob(id); await loadData(); };
  const deleteJob = async (id: string) => { await ApiRepository.deletePrintJob(id); await loadData(); };

  return {
    filaments, purchases, stocks, suppliers, summary, isLoading,
    printers, accessories, jobs,
    addFilament, updateFilament, deleteFilament,
    addPurchase, updatePurchase, deletePurchase,
    addStock, updateStock, deleteStock,
    addSupplier, deleteSupplier,
    addPrinter, updatePrinter, deletePrinter,
    addAccessory, updateAccessory, deleteAccessory,
    addJob, updateJob, completeJob, deleteJob,
    reload: loadData,
  };
}
