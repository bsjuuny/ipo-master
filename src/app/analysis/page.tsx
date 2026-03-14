'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  Activity,
  Award,
  Zap,
  BadgePercent
} from 'lucide-react';
import { IPO, IPOHistory } from '@/types/ipo';

export default function AnalysisPage() {
  const [history, setHistory] = useState<IPOHistory[]>([]);
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/ipo_history.json`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/ipo_list.json`).then(res => res.json())
    ])
    .then(([historyData, ipoData]) => {
      // Filter out items that haven't listed yet or have invalid price data
      const validHistory = (historyData as IPOHistory[]).filter(h => h.openingPrice > 0);
      setHistory(validHistory);
      setIpos(ipoData);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const avgOpeningReturn = history.reduce((acc, curr) => acc + curr.openingReturn, 0) / history.length;
    const winCount = history.filter(h => h.openingReturn > 0).length;
    const winRate = (winCount / history.length) * 100;
    
    const bestPerformer = [...history].sort((a, b) => b.openingReturn - a.openingReturn)[0];
    
    return {
      avgOpeningReturn,
      winRate,
      bestPerformer,
      totalCount: history.length
    };
  }, [history]);

  const filteredHistory = history.filter(h => 
    h.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const correlationStats = useMemo(() => {
    if (history.length === 0 || ipos.length === 0) return null;

    const normalize = (name: string) => name.replace(/\s+/g, '').replace(/\(.*\)/g, '').trim();
    
    // Join Data
    const joined = history.map(h => {
      const ipo = ipos.find(i => normalize(i.companyName) === normalize(h.companyName));
      const compVal = ipo?.totalCompetition ? parseFloat(ipo.totalCompetition.replace(/[^0-9.]/g, '')) || 0 : 0;
      return { ...h, competition: compVal };
    }).filter(j => j.competition > 0);

    if (joined.length === 0) return null;

    const brackets = [
      { label: 'High (>1000:1)', filter: (j: any) => j.competition > 1000 },
      { label: 'Mid (500-1000:1)', filter: (j: any) => j.competition > 500 && j.competition <= 1000 },
      { label: 'Low (<500:1)', filter: (j: any) => j.competition <= 500 && j.competition > 0 },
    ];

    return brackets.map(b => {
      const items = joined.filter(b.filter);
      const avgReturn = items.length > 0 ? items.reduce((acc, curr) => acc + curr.openingReturn, 0) / items.length : 0;
      return { label: b.label, avgReturn, count: items.length };
    });
  }, [history, ipos]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">인텔리전스 엔진 가동 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Activity className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter premium-gradient-text uppercase">Returns Analysis</h1>
        </div>
        <p className="text-slate-400 font-medium max-w-2xl leading-relaxed">
          과거 상장 종목의 시초가 대비 공모 수익률을 분석하여 최적의 매도 타이밍과 
          <span className="text-blue-400"> 통계적 우위</span>를 확보하세요.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-morphism p-8 space-y-2 group hover:border-blue-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">평균 시초 수익률</span>
            <TrendingUp className="h-4 w-4 text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white">+{stats?.avgOpeningReturn.toFixed(1)}</span>
            <span className="text-blue-400 font-bold">%</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">최근 {stats?.totalCount}개 종목 기준</p>
        </div>

        <div className="glass-morphism p-8 space-y-2 group hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">공모 성공 승률</span>
            <Award className="h-4 w-4 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white">{stats?.winRate.toFixed(1)}</span>
            <span className="text-emerald-400 font-bold">%</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">공모가 상회 종목 비중</p>
        </div>

        <div className="glass-morphism p-8 space-y-2 group hover:border-indigo-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">최고 수익 종목</span>
            <Zap className="h-4 w-4 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white truncate">{stats?.bestPerformer?.companyName}</span>
            <span className="text-2xl font-black text-indigo-400">+{stats?.bestPerformer?.openingReturn}%</span>
          </div>
        </div>

        <div className="glass-morphism p-8 space-y-2 group hover:border-blue-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">분석 데이터 세트</span>
            <BarChart3 className="h-4 w-4 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white">{stats?.totalCount}</span>
            <span className="text-slate-400 font-bold">SET</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">실시간 업데이트 반영</p>
        </div>
      </div>

      {/* Correlation Section */}
      {correlationStats && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight">경쟁률 - 수익률 상관성</h2>
            <p className="text-slate-500 text-sm font-medium">청약 경쟁률 구간별 상장 당일 평균 수익률 분석</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {correlationStats.map((stat, i) => (
              <div key={i} className="glass-morphism p-8 space-y-6 border-white/5 hover:border-blue-500/20 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-300">{stat.label}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{stat.count} 종목</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-black text-white">+{stat.avgReturn.toFixed(1)}%</span>
                    <BadgePercent className="h-4 w-4 text-blue-500/50" />
                  </div>
                  {/* Progress Bar Mockup */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000"
                      style={{ width: `${Math.min(stat.avgReturn, 100)}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  {stat.avgReturn > 50 
                    ? '강력한 상방 압력이 확인되는 구간입니다. 적극적인 공모 참여가 유리할 수 있습니다.' 
                    : '안정적인 수익권이지만, 상장일 매도 타이밍에 주의가 필요한 구간입니다.'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Analysis Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight">수익률 타임라인</h2>
            <p className="text-slate-500 text-sm font-medium">상장 일자별 성과 히스토리</p>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              placeholder="종목명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all w-full md:w-64"
            />
          </div>
        </div>

        <div className="glass-morphism overflow-hidden border-white/5">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">종목명 / 상장일</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">공모가</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">시초가</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">수익률</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">종가</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">결과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredHistory.map((item, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-base font-black text-white group-hover:text-blue-400 transition-colors">{item.companyName}</div>
                      <div className="text-xs text-slate-500 font-bold tracking-tight">{item.listingDate}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-white tracking-widest">{item.offeringPrice.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-bold text-white tracking-widest">{item.openingPrice.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <div className={`inline-flex items-center gap-1 font-black px-3 py-1 rounded-full text-xs ${item.openingReturn >= 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {item.openingReturn >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(item.openingReturn).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-white tracking-widest">{item.closingPrice.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.closingReturn >= item.openingReturn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {item.closingReturn >= item.openingReturn ? '상승 마감' : '하락 마감'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
