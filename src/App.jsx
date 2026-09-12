import React, { useState } from 'react';
import Header from './components/Header';
import Scenery from './components/Scenery';
import AngryBird from './components/AngryBird';
import KidAdventurer from './components/KidAdventurer';
import RightCliff from './components/RightCliff';
import HeroCenter from './components/HeroCenter';
import BottomDock from './components/BottomDock';
import Modals from './components/Modals';
import './App.css';

export default function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [activeNav, setActiveNav] = useState('HOME');
  const [activeDockCard, setActiveDockCard] = useState(null);

  const openModal = (type, data = null) => {
    setActiveModal(type);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    setActiveDockCard(null);
  };

  const handleDockCardClick = (cardId) => {
    setActiveDockCard(cardId);
    openModal(cardId);
  };

  return (
    <div className="playverse-world">
      {/* 1. Header Navigation Bar */}
      <Header 
        onOpenModal={openModal} 
        activeNav={activeNav} 
        setActiveNav={setActiveNav} 
      />

      {/* 2. Layered 16-bit Landscape Scenery */}
      <Scenery />

      {/* 3. Animated Soaring Angry Bird */}
      <AngryBird />

      {/* 4. Main Viewport Stage */}
      <main className="pv-main-stage">
        {/* Left Grassy Cliff with Animated Kid & Pet Shiba */}
        <KidAdventurer />

        {/* Center Hero: Taglines, 3D PLAYVERSE Logo, START PLAYING Button */}
        <HeroCenter onStartPlaying={() => openModal('games')} />

        {/* Right Grassy Cliff with Wooden Signpost, Treasure Chest, Mushroom */}
        <RightCliff onOpenModal={openModal} />
      </main>

      {/* 5. Bottom Curved Dock with 4 Feature Cards */}
      <BottomDock 
        onCardClick={handleDockCardClick} 
        activeCard={activeDockCard} 
      />

      {/* 6. Interactive Popups / Mini-games */}
      <Modals 
        modalType={activeModal} 
        modalData={modalData} 
        onClose={closeModal} 
      />
    </div>
  );
}
