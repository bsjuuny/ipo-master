'use client';

import { useEffect, useState } from 'react';
import { IPO } from '@/types/ipo';
import { Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface TimelineEvent {
  date: string;
  type: 'subscription' | 'subscriptionEnd' | 'refund' | 'listing';
  companyName: string;
  ipo: IPO;
}

type FilterType = 'all' | 'subscription' | 'subscriptionEnd' | 'refund' | 'listing';

const FILTERS: { value: FilterType; label: string; activeClass: string }[] = [
  { value: 'all',             label: '전체',     activeClass: 'bg-white/10 text-white border-white/30' },
  { value: 'subscription',    label: '청약 시작', activeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  { value: 'subscriptionEnd', label: '청약 마감', activeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { value: 'refund',          label: '환불일',   activeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' },
  { value: 'listing',         label: '상장일',   activeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/data/ipo_list.json`)
      .then(res => res.json())
      .then((data: IPO[]) => {
        const timelineEvents: TimelineEvent[] = [];
        
        const parseDateString = (dateStr: string, ipo: IPO) => {
          if (!dateStr || dateStr === '-') return null;
          let endStr = dateStr;
          if (endStr.split('.').length === 2) {
            const startYear = ipo.subscriptionStart.split('.')[0];
            endStr = `${startYear}.${endStr}`;
          }
          return new Date(endStr.replace(/\./g, '-'));
        };

        data.forEach(ipo => {
          const normalize = (d: string) => {
            if (!d || d === '-') return null;
            if (d.split('.').length === 2) {
              const startYear = ipo.subscriptionStart.split('.')[0];
              return `${startYear}.${d}`;
            }
            return d;
          };

          // Add subscription start events
          const subDateStr = normalize(ipo.subscriptionStart);
          if (subDateStr) {
            timelineEvents.push({
              date: subDateStr,
              type: 'subscription',
              companyName: ipo.companyName,
              ipo
            });
          }

          // Add subscription end events
          const subEndDateStr = normalize(ipo.subscriptionEnd);
          if (subEndDateStr) {
            timelineEvents.push({
              date: subEndDateStr,
              type: 'subscriptionEnd',
              companyName: ipo.companyName,
              ipo
            });
          }

          // Add refund events
          const refDateStr = normalize(ipo.refundDate);
          if (refDateStr) {
            timelineEvents.push({
              date: refDateStr,
              type: 'refund',
              companyName: ipo.companyName,
              ipo
            });
          }
          
          // Add listing events
          const listDateStr = normalize(ipo.listingDate);
          if (listDateStr) {
            timelineEvents.push({
              date: listDateStr,
              type: 'listing',
              companyName: ipo.companyName,
              ipo
            });
          }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Sort by date
        timelineEvents.sort((a, b) => {
          const dateA = parseDateString(a.date, a.ipo)?.getTime() || 0;
          const dateB = parseDateString(b.date, b.ipo)?.getTime() || 0;
          return dateA - dateB;
        });

        // Filter past events (older than 7 days) to keep it relevant
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const filteredEvents = timelineEvents.filter(event => {
          const eventDate = parseDateString(event.date, event.ipo);
          return eventDate && eventDate >= sevenDaysAgo;
        });

        setEvents(filteredEvents);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // 오늘 날짜로 자동 스크롤
  useEffect(() => {
    if (!loading && events.length > 0) {
      const timer = setTimeout(() => {
        const todayEl = document.getElementById('today-section');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, events.length]);

  const getEventBadge = (type: TimelineEvent['type'], dateStr: string, ipo: IPO) => {
    const past = isPast(dateStr, ipo);
    switch (type) {
      case 'subscription':
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${past ? 'bg-slate-500/10 text-slate-500' : 'bg-blue-500/10 text-blue-400'}`}>
          {past ? '청약 시작 완료' : '청약 시작'}
        </span>;
      case 'subscriptionEnd':
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${past ? 'bg-slate-500/10 text-slate-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
          {past ? '청약 마감 완료' : '청약 마감'}
        </span>;
      case 'refund':
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${past ? 'bg-slate-500/10 text-slate-500' : 'bg-indigo-500/10 text-indigo-400'}`}>환불일</span>;
      case 'listing':
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${past ? 'bg-slate-500/10 text-slate-500' : 'bg-rose-500/10 text-rose-400'}`}>상장일</span>;
    }
  };

  const isToday = (dateStr: string, ipo: IPO) => {
    // 한국 시간(KST) 기준 오늘 날짜 문자열 'YYYY.MM.DD' 생성
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const kstToday = kstDate.toISOString().split('T')[0].replace(/-/g, '.');
    
    let fullDateStr = dateStr;
    if (fullDateStr.split('.').length === 2) {
      const startYear = ipo.subscriptionStart.split('.')[0];
      fullDateStr = `${startYear}.${fullDateStr}`;
    }
    
    return fullDateStr === kstToday;
  };

  const isPast = (dateStr: string, ipo: IPO) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let fullDateStr = dateStr;
    if (fullDateStr.split('.').length === 2) {
      const startYear = ipo.subscriptionStart.split('.')[0];
      fullDateStr = `${startYear}.${fullDateStr}`;
    }
    const date = new Date(fullDateStr.replace(/\./g, '-'));
    return date < today;
  };

  // Apply type filter then group by date
  const filteredByType = activeFilter === 'all' ? events : events.filter(e => e.type === activeFilter);

  const groupedEvents = filteredByType.reduce((groups, event) => {
    const date = event.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className="space-y-12 pb-20">
      <section className="relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="relative z-10 space-y-6 px-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
            <CalendarIcon className="h-3 w-3" />
            인텔리전트 캘린더
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]">
            공모 <br />
            <span className="premium-gradient-text">타임라인.</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
            청약부터 환불, 상장까지 <br />
            당신의 투자 여정을 한눈에 관리하세요.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label, activeClass }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-200 ${
              activeFilter === value
                ? activeClass
                : 'bg-transparent text-slate-500 border-white/10 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-16 relative">
        {/* Timeline Path */}
        <div className="absolute left-[19px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-indigo-500/50 to-transparent hidden md:block" />

        {loading ? (
          <div className="h-64 glass-morphism flex items-center justify-center text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em]">
            스케줄링 중...
          </div>
        ) : Object.keys(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date} className="relative group" id={isToday(date, dateEvents[0].ipo) ? 'today-section' : undefined}>
              {/* Date Header */}
              <div
                className="sticky top-28 z-20 mb-8 md:text-center"
              >
                <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 glass-morphism shadow-2xl transition-all duration-500 ${isToday(date, dateEvents[0].ipo) ? 'ring-2 ring-blue-500/50 bg-blue-500/5 scale-110' : ''}`}>
                  <Clock className={`h-4 w-4 ${isToday(date, dateEvents[0].ipo) ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                  <span className={`text-sm font-black tracking-tight ${isToday(date, dateEvents[0].ipo) ? 'text-white' : 'text-slate-400'}`}>
                    {date} {isToday(date, dateEvents[0].ipo) && <span className="ml-2 text-blue-400 uppercase text-[10px]">오늘</span>}
                  </span>
                </div>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6 relative px-4">
                {dateEvents.map((event, idx) => (
                  <div 
                    key={`${event.companyName}-${event.type}`}
                    className={`relative ${idx % 2 === 0 ? 'md:text-right' : 'md:translate-y-8'} group/event`}
                  >
                    {/* Event Card */}
                    <div className={`glass-morphism p-6 hover:bg-white/[0.05] transition-all duration-300 border-white/5 group-hover/event:border-white/20 ${isPast(date, event.ipo) ? 'opacity-70 grayscale-[0.4] bg-black/20' : ''}`}>
                      <div className={`flex flex-col gap-3 ${idx % 2 === 0 ? 'md:items-end' : 'md:items-start'}`}>
                        {getEventBadge(event.type, event.date, event.ipo)}
                        <h4 className="text-xl font-black text-white group-hover/event:text-blue-400 transition-colors uppercase tracking-tight">
                          {event.companyName}
                        </h4>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tabular-nums">
                          <span>
                            {event.ipo.offeringPrice > 0 ? (
                              `공모가 ${event.ipo.offeringPrice.toLocaleString()}원`
                            ) : event.ipo.priceBandLow ? (
                              `희망 ${event.ipo.priceBandLow.toLocaleString()}${event.ipo.priceBandHigh && event.ipo.priceBandHigh !== event.ipo.priceBandLow ? `~${event.ipo.priceBandHigh.toLocaleString()}` : ''}원`
                            ) : (
                              '공모가 미정'
                            )}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        {event.ipo.underwriter && (
                          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold truncate">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold tracking-wide">주관사</span>
                            <span className="text-slate-300">{event.ipo.underwriter}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Timeline Dot (Desktop) */}
                    <div className={`absolute top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center ${idx % 2 === 0 ? '-right-[51px]' : '-left-[51px]'}`}>
                      <div className={`w-3 h-3 rounded-full border-2 border-slate-900 z-10 transition-all duration-500 ${isToday(date, event.ipo) ? 'bg-blue-500 scale-150 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="h-64 glass-morphism flex flex-col items-center justify-center text-slate-500 gap-4 border-dashed border-white/5">
            <span className="text-lg font-bold">예정된 일정이 없습니다.</span>
            <p className="text-sm">
              {activeFilter === 'all'
                ? '데이터가 업데이트되는 대로 표시됩니다.'
                : `'${FILTERS.find(f => f.value === activeFilter)?.label}' 일정이 없습니다.`}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <section className="glass-morphism p-8 flex flex-wrap gap-8 justify-center border-dashed border-white/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">청약 완료/상장 완료</span>
        </div>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">청약 진행/예정</span>
        </div>
      </section>
    </div>
  );
}
