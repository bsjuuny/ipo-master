import { BrokerCompetition } from '@/types/ipo';
import { TrendingUp } from 'lucide-react';

interface CompetitionTableProps {
  data: BrokerCompetition[];
}

export default function CompetitionTable({ data }: CompetitionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            <th className="pb-4 pt-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">증권사</th>
            <th className="pb-4 pt-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">경쟁률</th>
            <th className="pb-4 pt-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">균등 배정</th>
            <th className="pb-4 pt-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">비례 배정</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((item, idx) => (
            <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
              <td className="py-3 md:py-5">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] md:text-xs font-bold text-slate-300">
                    {item.brokerName.substring(0, 1)}
                  </div>
                  <span className="text-xs md:text-base font-bold text-slate-200">{item.brokerName}</span>
                </div>
              </td>
              <td className="py-3 md:py-5">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                  <span className="text-xs md:text-base font-black text-blue-500">{item.competitionRate}</span>
                </div>
              </td>
              <td className="py-3 md:py-5 text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="text-xs md:text-base font-medium">{item.equalAllocation || '-'}</span>
                </div>
              </td>
              <td className="py-3 md:py-5 text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="text-xs md:text-base font-medium">{item.proportionalAllocation || '-'}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
