'use client';

import { useState, useEffect } from 'react';
import { IPO, BrokerCompetition } from '@/types/ipo';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? '';

// ":1" 제거 (입력 표시용)
function stripRate(v?: string) { return v ? v.replace(/:1$/, '').trim() : ''; }
// ":1" 추가 (저장용)
function appendRate(v: string) { return v && !v.endsWith(':1') ? `${v}:1` : v; }
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? '';
const GITHUB_REPO = 'bsjuuny/ipo-master';
const OVERRIDE_PATH = 'public/data/competition_override.json';
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type Overrides = Record<string, { totalCompetition?: string; competitionData?: BrokerCompetition[] }>;

async function fetchOverridesFromGitHub(): Promise<{ content: Overrides; sha: string }> {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${OVERRIDE_PATH}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const decoded = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
  return { content: decoded, sha: data.sha };
}

async function saveOverridesToGitHub(overrides: Overrides, sha: string): Promise<string> {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(overrides, null, 2))));
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${OVERRIDE_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'data: update competition override', content, sha }),
  });
  if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status}`);
  const data = await res.json();
  return data.content.sha;
}

export default function AdminPage() {
  const [input, setInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [ipoList, setIpoList] = useState<IPO[]>([]);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [sha, setSha] = useState('');
  const [edits, setEdits] = useState<Overrides>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!authed) return;

    // Load IPO list — 청약 중인 항목만 표시
    fetch(`${BASE}/data/ipo_list.json`)
      .then(r => r.json())
      .then((data: IPO[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        const active = data.filter(ipo => {
          const startYear = ipo.subscriptionStart.split('.')[0];
          let endStr = ipo.subscriptionEnd;
          if (endStr.split('.').length === 2) endStr = `${startYear}.${endStr}`;
          const end = new Date(endStr.replace(/\./g, '-'));
          return end >= threeDaysAgo;
        });
        setIpoList(active);
      })
      .catch(() => setLoadError('ipo_list.json 로드 실패'));

    // Load overrides from GitHub
    fetchOverridesFromGitHub()
      .then(({ content, sha }) => {
        setOverrides(content);
        // 입력 표시용: :1 제거
        const stripped = Object.fromEntries(Object.entries(content).map(([id, v]) => [id, {
          ...v,
          ...(v.totalCompetition ? { totalCompetition: stripRate(v.totalCompetition) } : {}),
          ...(v.competitionData ? { competitionData: v.competitionData.map(r => ({ ...r, competitionRate: stripRate(r.competitionRate) })) } : {}),
        }]));
        setEdits(stripped);
        setSha(sha);
      })
      .catch(e => setLoadError(`GitHub 로드 실패: ${e.message}`));
  }, [authed]);

  function login() {
    if (!input) return;
    if (!ADMIN_KEY) { alert('설정 오류: NEXT_PUBLIC_ADMIN_KEY가 비어있습니다.'); return; }
    if (input === ADMIN_KEY) setAuthed(true);
    else alert('비밀번호가 틀렸습니다.');
  }

  function setTotal(id: string, value: string) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], totalCompetition: value } }));
  }

  function setBrokerRow(id: string, idx: number, field: keyof BrokerCompetition, value: string) {
    setEdits(prev => {
      const rows = [...(prev[id]?.competitionData ?? [])];
      rows[idx] = { ...rows[idx], [field]: field === 'minSubscriptionAmount' ? Number(value) : value };
      return { ...prev, [id]: { ...prev[id], competitionData: rows } };
    });
  }

  function addBrokerRow(id: string) {
    setEdits(prev => {
      const rows = [...(prev[id]?.competitionData ?? [])];
      rows.push({ brokerName: '', competitionRate: '' });
      return { ...prev, [id]: { ...prev[id], competitionData: rows } };
    });
  }

  function removeBrokerRow(id: string, idx: number) {
    setEdits(prev => {
      const rows = [...(prev[id]?.competitionData ?? [])];
      rows.splice(idx, 1);
      return { ...prev, [id]: { ...prev[id], competitionData: rows } };
    });
  }

  async function save(id: string) {
    setSaving(id);
    const edit = edits[id] ?? {};
    const newOverrides = { ...overrides };
    const totalCompetition = appendRate(edit.totalCompetition ?? '');
    const competitionData = (edit.competitionData ?? []).filter(r => r.brokerName).map(r => ({ ...r, competitionRate: appendRate(r.competitionRate) }));

    if (!totalCompetition && competitionData.length === 0) {
      delete newOverrides[id];
    } else {
      newOverrides[id] = {
        ...(totalCompetition ? { totalCompetition } : {}),
        ...(competitionData.length > 0 ? { competitionData } : {}),
      };
    }

    try {
      const newSha = await saveOverridesToGitHub(newOverrides, sha);
      setOverrides(newOverrides);
      setSha(newSha);
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    } catch (e: unknown) {
      alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(null);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 p-8 rounded-xl space-y-4 w-80">
          <h1 className="text-white font-bold text-lg">Admin</h1>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="비밀번호"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              className="w-full px-4 py-2 pr-12 rounded bg-gray-800 text-white outline-none border border-gray-700 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
            >
              {showPw ? '숨김' : '보기'}
            </button>
          </div>
          <button onClick={login} className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
            입력
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-2">공모주 경쟁률 입력</h1>
      <p className="text-gray-500 text-sm mb-2">저장하면 GitHub에 바로 커밋됩니다. PM2 다음 실행 시 자동 반영.</p>
      {loadError && <p className="text-red-400 text-sm mb-4">{loadError}</p>}

      {ipoList.length === 0 && !loadError && (
        <p className="text-gray-500 text-sm">현재 청약 중이거나 최근 마감된 공모주가 없습니다.</p>
      )}

      <div className="space-y-8 mt-6">
        {ipoList.map(ipo => {
          const edit = edits[ipo.id] ?? {};
          const brokers = edit.competitionData ?? [];
          const isSaving = saving === ipo.id;
          const isSaved = saved === ipo.id;
          const hasOverride = !!overrides[ipo.id];

          return (
            <div key={ipo.id} className={`rounded-xl p-5 border ${hasOverride ? 'border-blue-600/40 bg-blue-950/20' : 'border-gray-800 bg-gray-900'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">{ipo.companyName}</h2>
                  <p className="text-gray-500 text-xs">{ipo.subscriptionStart} ~ {ipo.subscriptionEnd}</p>
                </div>
                {hasOverride && <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded">저장됨</span>}
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 block">통합 경쟁률</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={edit.totalCompetition ?? ''}
                    onChange={e => setTotal(ipo.id, e.target.value)}
                    placeholder="예: 1,234.56"
                    className="w-40 px-3 py-2 rounded bg-gray-800 text-white text-sm border border-gray-700 focus:border-blue-500 outline-none"
                  />
                  <span className="text-gray-400 text-sm font-bold">:1</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">증권사별 경쟁률</label>
                <div className="space-y-2">
                  {brokers.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center flex-wrap">
                      <input
                        type="text"
                        value={row.brokerName}
                        onChange={e => setBrokerRow(ipo.id, idx, 'brokerName', e.target.value)}
                        placeholder="증권사명"
                        className="px-2 py-1.5 rounded bg-gray-800 text-white text-sm border border-gray-700 focus:border-blue-500 outline-none w-28"
                      />
                      <input
                        type="text"
                        value={row.competitionRate}
                        onChange={e => setBrokerRow(ipo.id, idx, 'competitionRate', e.target.value)}
                        placeholder="경쟁률"
                        className="px-2 py-1.5 rounded bg-gray-800 text-white text-sm border border-gray-700 focus:border-blue-500 outline-none w-24"
                      />
                      <span className="text-gray-400 text-sm font-bold">:1</span>
                      <input
                        type="text"
                        value={row.equalAllocation ?? ''}
                        onChange={e => setBrokerRow(ipo.id, idx, 'equalAllocation', e.target.value)}
                        placeholder="균등"
                        className="px-2 py-1.5 rounded bg-gray-800 text-white text-sm border border-gray-700 focus:border-blue-500 outline-none w-20"
                      />
                      <input
                        type="text"
                        value={row.proportionalAllocation ?? ''}
                        onChange={e => setBrokerRow(ipo.id, idx, 'proportionalAllocation', e.target.value)}
                        placeholder="비례"
                        className="px-2 py-1.5 rounded bg-gray-800 text-white text-sm border border-gray-700 focus:border-blue-500 outline-none w-20"
                      />
                      <button onClick={() => removeBrokerRow(ipo.id, idx)} className="text-gray-500 hover:text-red-400 text-xs font-bold px-1">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addBrokerRow(ipo.id)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-bold">
                  + 증권사 추가
                </button>
              </div>

              <button
                onClick={() => save(ipo.id)}
                disabled={isSaving}
                className={`px-4 py-2 rounded text-sm font-bold transition-all ${isSaved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50`}
              >
                {isSaved ? '저장됨 ✓' : isSaving ? '저장 중...' : 'GitHub에 저장'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
