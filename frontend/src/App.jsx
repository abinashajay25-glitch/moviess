import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import ProcessingQueue from './pages/ProcessingQueue';
import MyMovies from './pages/MyMovies';
import SubtitleStudio from './pages/SubtitleStudio';
import VoiceStudio from './pages/VoiceStudio';
import Settings from './pages/Settings';
import About from './pages/About';
import { CineDubAPI } from './api/client';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [languages, setLanguages] = useState({ source_languages: [], target_languages: [] });
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Initial Studio Data
  const loadStudioData = async () => {
    try {
      const [projList, langData, sysData] = await Promise.all([
        CineDubAPI.getProjects(),
        CineDubAPI.getLanguages(),
        CineDubAPI.getHardware()
      ]);
      setProjects(projList || []);
      setLanguages(langData || {});
      setSystemInfo(sysData || null);

      // Default active project
      if (projList && projList.length > 0 && !activeProject) {
        setActiveProject(projList[0]);
      }
    } catch (err) {
      console.error("Studio initialization error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioData();
    const interval = setInterval(async () => {
      try {
        const list = await CineDubAPI.getProjects();
        setProjects(list || []);
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectProject = (proj) => {
    setActiveProject(proj);
    if (proj.status === 'processing') {
      setCurrentView('processing_queue');
    } else if (proj.status === 'completed') {
      setCurrentView('my_movies');
    } else {
      setCurrentView('processing_queue');
    }
  };

  const handleProjectCreated = (newProj) => {
    setActiveProject(newProj);
    setProjects(prev => [newProj, ...prev]);
    setCurrentView('processing_queue');
  };

  const activeQueueCount = projects.filter(p => p.status === 'processing').length;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-brand-purple/30 selection:text-brand-blue">
      {/* Top Studio Navbar */}
      <Navbar 
        activeProject={activeProject} 
        onNewProjectClick={() => setCurrentView('new_project')}
        systemInfo={systemInfo}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          activeQueueCount={activeQueueCount}
        />

        {/* Main Studio Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-[#090a0f] to-[#0c0e15]">
          {currentView === 'dashboard' && (
            <Dashboard 
              projects={projects}
              onSelectProject={handleSelectProject}
              onNewProjectClick={() => setCurrentView('new_project')}
              systemInfo={systemInfo}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'new_project' && (
            <NewProject 
              languages={languages}
              onProjectCreated={handleProjectCreated}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'processing_queue' && (
            <ProcessingQueue 
              currentProject={activeProject || (projects.length > 0 ? projects[0] : null)}
              onSelectProject={handleSelectProject}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'my_movies' && (
            <MyMovies 
              projects={projects}
              onSelectProject={handleSelectProject}
              onRefresh={loadStudioData}
              onNewProjectClick={() => setCurrentView('new_project')}
            />
          )}

          {currentView === 'subtitle_studio' && (
            <SubtitleStudio 
              project={activeProject || (projects.length > 0 ? projects[0] : null)}
            />
          )}

          {currentView === 'voice_studio' && (
            <VoiceStudio 
              project={activeProject || (projects.length > 0 ? projects[0] : null)}
            />
          )}

          {currentView === 'settings' && (
            <Settings 
              systemInfo={systemInfo}
            />
          )}

          {currentView === 'about' && (
            <About />
          )}
        </main>
      </div>
    </div>
  );
}
