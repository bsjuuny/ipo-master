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
        <div className="relative z-10 space-y-4 md:space-y-6 px-1 md:px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-2 md:mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            인텔리전스
          </div>
          {updatedAt && (
            <p className="text-[10px] md:text-[11px] text-slate-600 font-medium">
              마지막 업데이트 {updatedAt} · 평일 오전 자동 수집
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tight leading-[1.1] md:leading-[0.9]">
            데이터 기반 <br className="hidden sm:block" />
            <span className="premium-gradient-text">공모주 투자.</span>
          </h1>
          <p className="max-w-xl text-base md:text-lg text-slate-400 font-medium leading-relaxed">
            증권사별 경쟁률, 정밀한 수요예측 분석, <br className="hidden md:block" />
            데이터 기반으로 성공적인 투자를 시작하세요.
          </p>
        </div>
      </section>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {[
          { label: '진행 중 청약', value: ipos.length, unit: '건', color: 'text-blue-500', icon: Activity, className: 'col-span-2 md:col-span-1' },
          { label: '평균 경쟁률', value: '1,240', unit: ':1', color: 'text-indigo-400', icon: BarChart3, className: '' },
          { label: '평균 수익률', value: '+85', unit: '%', color: 'text-rose-400', icon: TrendingUp, className: '' },
        ].map((stat, i) => (
          <div key={i} className={`glass-morphism p-5 md:p-8 flex flex-col gap-1 hover:border-white/20 transition-all cursor-default group hover:-translate-y-1 ${stat.className}`}>
            <div className="flex justify-between items-start">
              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 tracking-[0.1em] md:tracking-[0.2em]">{stat.label}</span>
              <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl md:text-4xl font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] md:text-sm text-slate-400 font-bold">{stat.unit}</span>
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
                <div key={ipo.id} className={`glass-morphism premium-card-hover transition-all duration-500 overflow-hidden ${expandedId === ipo.id ? 'ring-1 ring-blue-500/40 bg-white/[0.04]' : ''} ${isPast ? 'opacity-80 grayscale-[0.2] pointer-events-auto bg-black/10' : ''}`}>
                  <div className="p-5 md:p-8 relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col md:grid md:grid-cols-4 gap-6 md:gap-8 items-start md:items-center">
                      {/* Clickable Data Area */}
                      <div 
                        className="w-full md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 items-start cursor-pointer"
                        onClick={() => toggleExpand(ipo.id)}
                      >
                        <div className="col-span-2 md:col-span-1 space-y-2">
                          <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase ${isPast ? 'bg-slate-500/10 text-slate-500' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                            {isPast ? '청약 완료' : 'IPO 인텔리전스'}
                          </span>
                          <h3 className={`text-xl md:text-2xl font-black tracking-tight transition-colors ${isPast ? 'text-slate-500' : 'group-hover:text-blue-400'}`}>{ipo.companyName}</h3>
                          <p className="text-slate-500 text-[11px] md:text-sm font-medium">{ipo.subscriptionStart} ~ {ipo.subscriptionEnd}</p>
                        </div>
                        
                        <div className="space-y-0.5 md:space-y-1 tabular-nums">
                          {ipo.offeringPrice > 0 ? (
                            <>
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 tracking-widest uppercase">확정 공모가</span>
                              <p className={`text-base md:text-xl font-black ${isPast ? 'text-slate-600' : ''}`}>{ipo.offeringPrice.toLocaleString()}원</p>
                            </>
                          ) : ipo.priceBandLow ? (
                            <>
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 tracking-widest uppercase">희망 공모가</span>
                              <p className={`text-sm md:text-lg font-black ${isPast ? 'text-slate-600' : 'text-slate-300'}`}>
                                {ipo.priceBandLow.toLocaleString()}{ipo.priceBandHigh && ipo.priceBandHigh !== ipo.priceBandLow ? `~${ipo.priceBandHigh.toLocaleString()}` : ''}원
                              </p>
                            </>
                          ) : (
                            <>
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-500 tracking-widest uppercase">공모가</span>
                              <p className="text-base md:text-xl font-black text-slate-600">미정</p>
                            </>
                          )}
                        </div>

                        <div className="space-y-0.5 md:space-y-1 tabular-nums">
                          <span className="text-[9px] md:text-[10px] font-bold text-slate-500 tracking-widest uppercase">통합 경쟁률</span>
                          <p className={`text-base md:text-xl font-black ${getCompetitionStatus(ipo) === '청약 전' || isPast ? 'text-slate-500' : 'text-blue-500'}`}>
                            {getCompetitionStatus(ipo)}
                          </p>
                        </div>
                      </div>

                      {/* Explicit Action Area */}
                      <div className="w-full md:col-span-1 flex md:flex-row justify-between md:justify-end items-center gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                        <Link 
                          href={`/ipo/${ipo.id}`}
                          className={`flex-1 md:flex-none text-center px-4 py-2.5 md:py-2 rounded-xl md:rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all ${isPast ? 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40'}`}
                        >
                          분석 리포트
                        </Link>
                        <button 
                          onClick={() => toggleExpand(ipo.id)}
                          className="p-3 md:p-2 bg-white/5 md:bg-transparent rounded-xl md:rounded-full transition-colors"
                        >
                          {expandedId === ipo.id ? <ChevronUp className="h-5 w-5 md:h-6 md:w-6 text-slate-400" /> : <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>

                   {expandedId === ipo.id && (
                    <div className="px-5 md:px-8 pb-5 md:pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="pt-6 md:pt-8 border-t border-white/5 space-y-6 md:space-y-8">
                        <div className="flex items-center gap-3">
                          <BarChart3 className={`h-4 w-4 md:h-5 md:w-5 ${isPast ? 'text-slate-500' : 'text-blue-400'}`} />
                          <h4 className={`text-base md:text-lg font-black tracking-tight ${isPast ? 'text-slate-500' : ''}`}>증권사 현황</h4>
                        </div>
                        {ipo.competitionData && ipo.competitionData.length > 0 ? (
                          <CompetitionTable data={ipo.competitionData} />
                        ) : (
                          <div className="py-12 md:py-20 text-center glass-morphism bg-white/[0.02] border-dashed">
                            <p className="text-xs md:text-sm text-slate-500 font-black tracking-tighter uppercase">데이터 집계 중</p>
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
