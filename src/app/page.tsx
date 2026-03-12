'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CORE_ARSENAL, Resource } from '../lib/arsenal';

export default function Home() {
  const [intent, setIntent] = useState('');
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [suggestedResources, setSuggestedResources] = useState<Resource[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLaunching, setIsLaunching] = useState(false);
  
  const [userArsenal, setUserArsenal] = useState<Resource[]>(CORE_ARSENAL);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuSearch, setAddMenuSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPath, setCustomPath] = useState('');

  useEffect(() => {
    const loadArsenal = async () => {
      let customArsenal: Resource[] = [];
      const saved = localStorage.getItem('my_custom_arsenal');
      if (saved) customArsenal = JSON.parse(saved);

      try {
        const scannedApps: Resource[] = await invoke('scan_installed_apps');
        setUserArsenal([...CORE_ARSENAL, ...customArsenal, ...scannedApps]);
      } catch (e) {
        console.error("Failed to scan PC apps:", e);
        setUserArsenal([...CORE_ARSENAL, ...customArsenal]);
      }
    };
    loadArsenal();
  }, []);

  const handleIntentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;

    // TODO: We will hook your Gemini API back up here shortly. 
    // For now, using the local matcher so you can test the UI quickly.
    const lowerIntent = intent.toLowerCase();
    let matchedApps = userArsenal.filter(resource => 
      resource.keywords?.some(keyword => lowerIntent.includes(keyword))
    );

    if (matchedApps.length === 0) matchedApps = []; // Return empty slate if no match

    setSuggestedResources(matchedApps);
    setSelectedIds(new Set(matchedApps.map(r => r.id))); 
    setStep('review');
    setShowAddMenu(false);
    setShowCustomForm(false);
  };

  const toggleResource = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const manuallyAddResource = (resource: Resource) => {
    if (!suggestedResources.some(r => r.id === resource.id)) {
      setSuggestedResources(prev => [...prev, resource]);
    }
    setSelectedIds(prev => new Set(prev).add(resource.id));
    setShowAddMenu(false);
    setAddMenuSearch('');
  };

  const saveCustomTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPath) return;

    const newTool: Resource = {
      id: `custom_${Date.now()}`,
      name: customName,
      type: customPath.startsWith('http') ? 'url' : 'app',
      path: customPath,
      keywords: [customName.toLowerCase()]
    };

    const updatedArsenal = [...userArsenal, ...[newTool]];
    setUserArsenal(updatedArsenal);
    localStorage.setItem('my_custom_arsenal', JSON.stringify(updatedArsenal));

    manuallyAddResource(newTool);
    setShowCustomForm(false);
    setCustomName('');
    setCustomPath('');
  };

  const executeWorkflow = async () => {
    setIsLaunching(true);
    const selectedResources = suggestedResources.filter(r => selectedIds.has(r.id));
    const appPaths = selectedResources.filter(r => r.type === 'app').map(r => r.path);
    const urls = selectedResources.filter(r => r.type === 'url').map(r => r.path);

    try {
      await invoke('launch_workspace', { appPaths, urls });
      setTimeout(() => {
        setStep('input');
        setIntent('');
        setSelectedIds(new Set());
        setSuggestedResources([]);
      }, 1000);
    } catch (error) {
      console.error("Failed to launch workspace:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  // Filter unselected arsenal based on the search input
  const unselectedArsenal = userArsenal.filter(
    (item) => !suggestedResources.some((suggested) => suggested.id === item.id)
  );
  const filteredAddMenu = unselectedArsenal.filter(item => 
    item.name.toLowerCase().includes(addMenuSearch.toLowerCase())
  );

  return (
    <main className="flex min-h-screen flex-col bg-black text-white p-8 sm:p-16 font-mono selection:bg-white selection:text-black">
      <div className="w-full max-w-4xl mx-auto">
        
        <div className="mb-16">
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-wide" style={{ fontFamily: 'Impact, sans-serif' }}>
            Focus Orchestrator
          </h1>
          <hr className="border-t-2 border-white mt-8" />
        </div>

        <form onSubmit={handleIntentSubmit} className="mb-12">
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="WHAT ARE WE BUILDING TODAY?"
            autoFocus
            disabled={step === 'review' || isLaunching}
            className="w-full bg-transparent border-b-2 border-neutral-700 pb-4 text-3xl sm:text-4xl font-mono uppercase focus:outline-none focus:border-white transition-colors placeholder:text-neutral-800 disabled:opacity-50"
          />
        </form>

        {step === 'review' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <ul className="space-y-6 mb-12">
              {suggestedResources.map((resource) => (
                <li key={resource.id} className="flex items-center text-3xl group cursor-pointer select-none" onClick={() => toggleResource(resource.id)}>
                  <div className={`w-8 h-8 border-2 mr-6 flex items-center justify-center transition-colors ${selectedIds.has(resource.id) ? 'border-white bg-white' : 'border-neutral-700 group-hover:border-neutral-400'}`}>
                    {selectedIds.has(resource.id) && <div className="w-4 h-4 bg-black" />}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`${selectedIds.has(resource.id) ? 'text-white' : 'text-neutral-600 line-through'}`}>
                      {resource.name}
                    </span>
                    {resource.position && (
                       <span className={`text-xs border px-2 py-1 uppercase tracking-widest ${selectedIds.has(resource.id) ? 'border-neutral-500 text-neutral-400' : 'border-neutral-800 text-neutral-700'}`}>
                         [{resource.position}]
                       </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mb-12 relative flex gap-8 border-t-2 border-dashed border-neutral-800 pt-6">
              <button onClick={() => { setShowAddMenu(!showAddMenu); setShowCustomForm(false); setAddMenuSearch(''); }} className="text-neutral-500 hover:text-white uppercase tracking-wider transition-colors">
                + Add Tool
              </button>
              <button onClick={() => { setShowCustomForm(!showCustomForm); setShowAddMenu(false); }} className="text-neutral-500 hover:text-white uppercase tracking-wider transition-colors">
                + Custom
              </button>

              {/* SCROLLABLE & SEARCHABLE MENU */}
              {showAddMenu && (
                <div className="absolute top-14 left-0 bg-black border-2 border-white w-96 shadow-2xl z-50 flex flex-col max-h-80">
                  <div className="p-2 border-b-2 border-neutral-800 sticky top-0 bg-black">
                    <input
                      type="text"
                      placeholder="SEARCH TOOLS..."
                      value={addMenuSearch}
                      onChange={(e) => setAddMenuSearch(e.target.value)}
                      autoFocus
                      className="w-full bg-transparent text-white uppercase font-mono focus:outline-none p-2 border border-neutral-800 focus:border-white placeholder:text-neutral-700"
                    />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    {filteredAddMenu.map(item => (
                      <div key={item.id} onClick={() => manuallyAddResource(item)} className="p-4 hover:bg-neutral-900 cursor-pointer text-sm uppercase tracking-wide border-b border-neutral-900 last:border-0 truncate">
                        {item.name}
                      </div>
                    ))}
                    {filteredAddMenu.length === 0 && (
                      <div className="p-4 text-neutral-600 text-sm uppercase text-center">No tools found.</div>
                    )}
                  </div>
                </div>
              )}

              {showCustomForm && (
                <form onSubmit={saveCustomTool} className="absolute top-14 left-0 bg-black border-2 border-white p-6 shadow-2xl w-96 flex flex-col gap-4 z-50">
                  <input type="text" placeholder="TOOL NAME" value={customName} onChange={e => setCustomName(e.target.value)} className="bg-transparent border-b-2 border-neutral-700 p-2 text-white uppercase focus:outline-none focus:border-white" />
                  <input type="text" placeholder="URL OR .EXE PATH" value={customPath} onChange={e => setCustomPath(e.target.value)} className="bg-transparent border-b-2 border-neutral-700 p-2 text-white focus:outline-none focus:border-white" />
                  <button type="submit" className="border-2 border-white py-2 mt-2 uppercase font-bold hover:bg-white hover:text-black transition-colors">Save To Arsenal</button>
                </form>
              )}
            </div>

            <button
              onClick={executeWorkflow}
              disabled={isLaunching || selectedIds.size === 0}
              className="w-full border-2 border-white py-6 text-2xl uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
            >
              {isLaunching ? 'DEPLOYING...' : 'DEPLOY'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
