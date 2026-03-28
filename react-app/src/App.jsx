import { useState, useEffect, useCallback } from 'react';
import TopNav from './components/TopNav';
import HeroSection from './components/HeroSection';
import CheckInForm from './components/CheckInForm';
import AtmosphereCanvas from './components/AtmosphereCanvas';
import StatsSection from './components/StatsSection';
import ChartsSection from './components/ChartsSection';
import MethodologySection from './components/MethodologySection';
import Footer from './components/Footer';
import { ensureSeedData, loadData, saveData } from './utils/storage';

export default function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const initial = ensureSeedData();
    setData(initial);
  }, []);

  const handleCheckIn = useCallback((entry) => {
    const current = loadData();
    current.push(entry);
    saveData(current);
    setData([...current]);

    setTimeout(() => {
      document.getElementById('canvas-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

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
