import { useState, useEffect, useCallback } from 'react';
import TopNav from './components/TopNav';
import HeroSection from './components/HeroSection';
import CheckInForm from './components/CheckInForm';
import AtmosphereCanvas from './components/AtmosphereCanvas';
import StatsSection from './components/StatsSection';
import ChartsSection from './components/ChartsSection';
import MethodologySection from './components/MethodologySection';
import Footer from './components/Footer';
import { loadData, saveCheckIn } from './utils/storage';

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData()
      .then(d => {
        console.log('[App] Loaded', d.length, 'check-ins from backend');
        setData(d);
      })
      .catch(err => console.error('[App] Load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = useCallback(async (entry) => {
    const saved = await saveCheckIn(entry);
    if (saved) {
      console.log('[App] Saved new check-in:', saved.id);
      setData(prev => [...prev, saved]);
    }

    setTimeout(() => {
      document.getElementById('canvas-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading check-ins from server...</div>;
  }

  return (
    <>
      <TopNav />
      <main className="main-content no-sidebar">
        <HeroSection data={data} />
        <CheckInForm onSubmit={handleCheckIn} />
        <AtmosphereCanvas data={data} />
        <StatsSection data={data} />
        <ChartsSection data={data} />
        <MethodologySection />
        <Footer />
      </main>
    </>
  );
}
