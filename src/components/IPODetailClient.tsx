'use client';

import React from 'react';
import { 
  ArrowLeft, 
  BadgeCheck, 
  Info, 
  Zap, 
  AlertTriangle, 
  Building2, 
  Users, 
  Coins, 
  LineChart,
  ShieldCheck,
  Star
} from 'lucide-react';
import { IPO } from '@/types/ipo';
import Link from 'next/link';

interface IPODetailClientProps {
  ipo: IPO;
}

export default function IPODetailClient({ ipo }: IPODetailClientProps) {
  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Back Button */}
      <header className="space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">목록으로 돌아가기</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                {ipo.sector || '공모주 분석'}
              </span>
              <span className="text-slate-600 font-bold text-xs">{ipo.id}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">{ipo.companyName}</h1>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {ipo.offeringPrice > 0 ? (
              <>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">확정 공모가</span>
                <span className="text-3xl font-black premium-gradient-text">{ipo.offeringPrice.toLocaleString()}원</span>
              </>
            ) : ipo.priceBandLow ? (
              <>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">희망 공모가</span>
                <span className="text-2xl font-black text-slate-300">
                  {ipo.priceBandLow.toLocaleString()}{ipo.priceBandHigh && ipo.priceBandHigh !== ipo.priceBandLow ? ` ~ ${ipo.priceBandHigh.toLocaleString()}` : ''}원
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">공모가</span>
                <span className="text-3xl font-black text-slate-600">미정</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* AI Verdict Card */}
      <section className="glass-morphism overflow-hidden relative group">
        <div className="absolute inset-0 bg-blue-600/5 blur-[100px] -z-10 group-hover:bg-indigo-600/10 transition-colors duration-700" />
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:scale-110">
          <Star className="h-32 w-32 text-blue-400 fill-blue-400" />
        </div>
        <div className="relative z-10 p-8 md:p-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Master Verdict</h2>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-200 leading-tight">
            "{ipo.aiVerdict || '분석 데이터를 수집 중입니다. 잠시만 기다려 주세요.'}"
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Analysis */}
        <div className="lg:col-span-2 space-y-8">
          {/* Institutional Demand Results */}
          <div className="glass-morphism p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">기관 수요예측 결과</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">기관 경쟁률</p>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-4xl font-black text-white">{ipo.institutionalCompetition || '집계 중'}</span>
                  <span className="text-slate-500 font-bold">:1</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">의무보유 확약비율</p>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-4xl font-black text-rose-400">
                    {ipo.lockupRatio?.replace('%', '') || '0'}
                  </span>
                  <span className="text-rose-500/50 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Points & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-morphism p-8 space-y-6 border-rose-500/10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-black text-rose-400 uppercase tracking-tight">투자 포인트</h3>
              </div>
              <ul className="space-y-4">
                {(ipo.investmentPoints || [
                  "동종 업계 대비 높은 매출 성장세",
                  "자체 원천 기술 기반의 시장 경쟁력",
                  "주요 고객사와의 장기 공급 계약 체결"
                ]).map((pt, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-slate-300 leading-relaxed">
                    <span className="text-rose-500 font-black">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-morphism p-8 space-y-6 border-blue-500/10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-black text-blue-400 uppercase tracking-tight">리스크 요인</h3>
              </div>
              <ul className="space-y-4">
                {(ipo.riskFactors || [
                  "원자재 가격 상승에 따른 수익성 저하 리스크",
                  "유통 가능 물량(오버행) 부담 존재",
                  "글로벌 경쟁 심화에 따른 시장 점유율 하락 우려"
                ]).map((rf, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-slate-300 leading-relaxed">
                    <span className="text-blue-500 font-black">•</span>
                    {rf}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Company Info */}
        <div className="space-y-8">
          <div className="glass-morphism p-8 space-y-8">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-black text-white uppercase tracking-tight">기업 상세 정보</h3>
            </div>
            
            <div className="space-y-6">
              {[
                { label: 'CEO', value: ipo.ceo || '정보 없음', icon: Users },
                { label: '본사 소재지', value: ipo.headOffice || '정보 없음', icon: Building2 },
                { label: '매출액 (최근)', value: ipo.sales || '정보 없음', icon: Coins },
                { label: '당기순이익', value: ipo.netIncome || '정보 없음', icon: LineChart },
              ].map((info, i) => (
                <div key={i} className="flex gap-4">
                  <div className="p-2 bg-white/5 rounded-lg h-fit">
                    <info.icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{info.label}</p>
                    <p className="text-sm font-bold text-slate-200">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-morphism p-8 space-y-4 bg-blue-500/5 border-blue-500/10">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">데이터 안내</p>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              본 리포트의 AI Verdict는 과거 통계와 수요예측 결과를 바탕으로 한 참조용 데이터이며, 실제 투자 수익을 보장하지 않습니다. 모든 투자의 책임은 투자자 본인에게 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
