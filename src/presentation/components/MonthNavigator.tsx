import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  selectedMonth: string; // YYYY-MM
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onChange: (month: string) => void;
}

export const MonthNavigator: React.FC<Props> = ({ selectedMonth, onPrevious, onNext, onToday, onChange }) => {
  const date = parse(`${selectedMonth}-15`, 'yyyy-MM-dd', new Date());
  const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleLabelClick = () => {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (input) {
      if (input.showPicker) {
        try {
          input.showPicker();
        } catch (e) {
          input.focus();
        }
      } else {
        input.focus();
        input.click();
      }
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={onToday}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-semibold hover:bg-white/10 hover:text-white transition-all"
        title="Voltar para hoje"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Hoje</span>
      </button>

      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={onPrevious}
          className="p-2.5 hover:bg-white/10 text-white/40 hover:text-white transition-colors border-r border-white/5"
          title="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div 
          onClick={handleLabelClick}
          className="relative cursor-pointer group min-w-[140px] sm:min-w-[180px] flex items-center justify-center"
        >
          <input 
            ref={inputRef}
            type="month" 
            value={selectedMonth}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 pointer-events-none"
          />
          <span className="px-4 py-2 text-sm font-bold capitalize text-center text-white/80 group-hover:text-blue-400 transition-colors">
            {label}
          </span>
        </div>

        <button
          onClick={onNext}
          className="p-2.5 hover:bg-white/10 text-white/40 hover:text-white transition-colors border-l border-white/5"
          title="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
