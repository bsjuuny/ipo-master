import fs from 'fs';
import path from 'path';
import { IPO } from '@/types/ipo';
import IPODetailClient from '@/components/IPODetailClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'ipo_list.json');
    if (!fs.existsSync(dataPath)) return [];
    const file = fs.readFileSync(dataPath, 'utf8');
    const data: IPO[] = JSON.parse(file);
    return data.map((ipo) => ({
      id: ipo.id,
    }));
  } catch (err) {
    console.error('Error generating static params:', err);
    return [];
  }
}

async function getIpoData(id: string): Promise<IPO | null> {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'ipo_list.json');
    if (!fs.existsSync(dataPath)) return null;
    const file = fs.readFileSync(dataPath, 'utf8');
    const data: IPO[] = JSON.parse(file);
    return data.find(i => i.id === id) || null;
  } catch (err) {
    console.error('Error fetching IPO data:', err);
    return null;
  }
}

export default async function IPODetailPage({ params }: { params: { id: string } }) {
  const ipo = await getIpoData(params.id);

  if (!ipo) {
    notFound();
  }

  return <IPODetailClient ipo={ipo} />;
}
