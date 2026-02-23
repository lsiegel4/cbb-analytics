import { useState } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LeaderboardPage from './pages/LeaderboardPage';
import PlayerProfilePage from './pages/PlayerProfilePage';
import ComparisonPage from './pages/ComparisonPage';
import GlossaryPage from './pages/GlossaryPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('leaderboard');
  const [pageData, setPageData] = useState(null);
  const [season, setSeason] = useState('2023-24');

  function navigate(page, data = null) {
    setCurrentPage(page);
    setPageData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPage() {
    switch (currentPage) {
      case 'leaderboard':
        return <LeaderboardPage season={season} onNavigate={navigate} />;
      case 'player':
        return <PlayerProfilePage playerId={pageData} season={season} onNavigate={navigate} />;
      case 'compare':
        return <ComparisonPage season={season} onNavigate={navigate} />;
      case 'glossary':
        return <GlossaryPage />;
      default:
        return <LeaderboardPage season={season} onNavigate={navigate} />;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation
        currentPage={currentPage}
        onNavigate={navigate}
        season={season}
        onSeasonChange={setSeason}
      />
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}
