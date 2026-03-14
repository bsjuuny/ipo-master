'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IPO } from '@/types/ipo';
import CompetitionTable from '@/components/CompetitionTable';
import { ChevronDown, ChevronUp, Activity, BarChart3, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/ipo_list.json`)
      .then(res => res.json())
      .then((data: IPO[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter: Remove past items with missing competition data
        const filteredData = data.filter(ipo => {
          const startYear = ipo.subscriptionStart.split('.')[0];
          let endStr = ipo.subscriptionEnd;
          if (endStr.split('.').length === 2) {
            endStr = `${startYear}.${endStr}`;
          }
          const endDate = new Date(endStr.replace(/\./g, '-'));
          const isPast = endDate < today;
          
          if (isPast) {
            // Remove if no competition data or still in "collecting" status
            return ipo.totalCompetition && ipo.totalCompetition !== '집계 중...' && ipo.totalCompetition !== 'N/A';
          }
          return true; // Keep all upcoming/active items
        });

        // Sort: Non-past items first, then by date within groups
        const sortedData = filteredData.sort((a, b) => {
          const startYearA = a.subscriptionStart.split('.')[0];
          let endStrA = a.subscriptionEnd;
          if (endStrA.split('.').length === 2) endStrA = `${startYearA}.${endStrA}`;
          const endA = new Date(endStrA.replace(/\./g, '-'));

          const startYearB = b.subscriptionStart.split('.')[0];
          let endStrB = b.subscriptionEnd;
          if (endStrB.split('.').length === 2) endStrB = `${startYearB}.${endStrB}`;
          const endB = new Date(endStrB.replace(/\./g, '-'));
          
          const isPastA = endA < today;
          const isPastB = endB < today;

          if (isPastA !== isPastB) {
            return isPastA ? 1 : -1; // Past items at the end
          }

          // Within same group, sort by date (upcoming/active first, recent past first)
          return isPastA ? endB.getTime() - endA.getTime() : endA.getTime() - endB.getTime();
        });

        setIpos(sortedData);
        if (data[0]?.updatedAt) {
          setUpdatedAt(new Date(data[0].updatedAt).toLocaleString('ko-KR', {
            month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getCompetitionStatus = (ipo: IPO) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse subscriptionStart (Format: YYYY.MM.DD)
    const startDate = new Date(ipo.subscriptionStart.replace(/\./g, '-'));
    
    if (startDate > today) {
      return '청약 전';
    }
    
    return ipo.totalCompetition || '집계 중...';
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* ... Hero Section and Stats Quick View remain same ... */}
      {/* Hero Section */}
      <section className="relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="relative z-10 space-y-6 px-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            실시간 인텔리전스
          </div>
          {updatedAt && (
            <p className="text-[11px] text-slate-600 font-medium">
              마지막 업데이트 {updatedAt} · 평일 오전 자동 수집
            </p>
          )}
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]">
            데이터 기반 <br />
            <span className="premium-gradient-text">공모주 투자.</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
            실시간 증권사별 경쟁률, 정밀한 수요예측 분석, <br />
            그리고 과거 수익률 데이터를 기반으로 성공적인 투자를 시작하세요.
          </p>
        </div>
      </section>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '진행 중인 청약', value: ipos.length, unit: '건', color: 'text-blue-500', icon: Activity },
          { label: '최근 평균 경쟁률', value: '1,240', unit: ':1', color: 'text-indigo-400', icon: BarChart3 },
          { label: '최근 평균 수익률', value: '+85', unit: '%', color: 'text-emerald-400', icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="glass-morphism p-8 flex flex-col gap-1 hover:border-white/20 transition-all cursor-default group hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-slate-400 font-bold">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main List */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-black premium-gradient-text tracking-tight">공모주 브리핑</h2>
          <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="h-64 glass-morphism flex items-center justify-center text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em]">
              데이터 동기화 중...
            </div>
          ) : ipos.length > 0 ? (
            ipos.map(ipo => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const startYear = ipo.subscriptionStart.split('.')[0];
              let endStr = ipo.subscriptionEnd;
              if (endStr.split('.').length === 2) {
                endStr = `${startYear}.${endStr}`;
              }
              const isPast = new Date(endStr.replace(/\./g, '-')) < today;

              return (
                <div key={ipo.id} className={`glass-morphism transition-all duration-500 overflow-hidden ${expandedId === ipo.id ? 'ring-1 ring-blue-500/40 bg-white/[0.04]' : 'hover:bg-white/[0.05]'} ${isPast ? 'opacity-70 grayscale-[0.4] pointer-events-auto bg-black/10' : ''}`}>
                  <div className="p-8 relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                      {/* Clickable Data Area */}
                      <div 
                        className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8 items-center cursor-pointer"
                        onClick={() => toggleExpand(ipo.id)}
                      >
                        <div className="space-y-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isPast ? 'bg-slate-500/10 text-slate-500' : 'bg-blue-500/10 text-blue-400'}`}>
                            {isPast ? '청약 완료' : 'IPO 일정'}
                          </span>
                          <h3 className={`text-2xl font-black tracking-tight transition-colors ${isPast ? 'text-slate-500' : 'group-hover:text-blue-400'}`}>{ipo.companyName}</h3>
                          <p className="text-slate-500 text-sm font-medium">{ipo.subscriptionStart} ~ {ipo.subscriptionEnd}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">공모가</span>
                          <p className={`text-xl font-black ${isPast ? 'text-slate-600' : ''}`}>{ipo.offeringPrice.toLocaleString()} KRW</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">통합 경쟁률</span>
                          <p className={`text-xl font-black ${getCompetitionStatus(ipo) === '청약 전' || isPast ? 'text-slate-500' : 'text-blue-500'}`}>
                            {getCompetitionStatus(ipo)}
                          </p>
                        </div>
                      </div>

                      {/* Explicit Action Area */}
                      <div className="md:col-span-1 flex justify-end items-center gap-4">
                        <Link 
                          href={`/ipo/${ipo.id}`}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isPast ? 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40'}`}
                        >
                          분석 리포트
                        </Link>
                        <button 
                          onClick={() => toggleExpand(ipo.id)}
                          className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                          {expandedId === ipo.id ? <ChevronUp className="h-6 w-6 text-slate-500" /> : <ChevronDown className="h-6 w-6 text-slate-500" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedId === ipo.id && (
                    <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="pt-8 border-t border-white/5 space-y-8">
                        <div className="flex items-center gap-3">
                          <BarChart3 className={`h-5 w-5 ${isPast ? 'text-slate-500' : 'text-blue-400'}`} />
                          <h4 className={`text-lg font-black tracking-tight ${isPast ? 'text-slate-500' : ''}`}>실시간 증권사 현황</h4>
                        </div>
                        {ipo.competitionData && ipo.competitionData.length > 0 ? (
                          <CompetitionTable data={ipo.competitionData} />
                        ) : (
                          <div className="py-20 text-center glass-morphism bg-white/[0.02] border-dashed">
                            <p className="text-slate-500 font-black tracking-tighter">실시간 데이터가 아직 집계되지 않았습니다</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-64 glass-morphism flex flex-col items-center justify-center text-slate-500 gap-4 border-dashed border-white/5">
              <span className="text-lg font-bold">진행 중인 공모주가 없습니다.</span>
              <p className="text-sm">상장 일정을 확인해 보세요.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
