"use client";

import { useState, useEffect } from "react";
import { Coffee } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function POSSessionPage() {
  const [terminals, setTerminals] = useState([]);
  const [selectedTerminal, setSelectedTerminal] = useState("");
  const [openingCash, setOpeningCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const { logout } = useAuthStore();

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        setCheckingSession(false);
        return;
      }

      const response = await fetch(`${API_URL}/sessions/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const session = await response.json();
        if (session) {
          setActiveSession(session);
          localStorage.setItem('activeSession', JSON.stringify(session));
        } else {
          // No active session in backend, clear local
          setActiveSession(null);
          localStorage.removeItem('activeSession');
          fetchTerminals(); // Need to fetch terminals to show open session screen
        }
      } else {
        // Fallback to local if fetch fails? Or clear? 
        // Better to trust local if network error, but trust backend if 200 OK null.
        // For now, if unauthorized, we logout.
        if (response.status === 401) {
           logout(); 
           window.location.href = '/login';
        }
        // If other error, maybe keep local? 
        const storedSession = localStorage.getItem('activeSession');
        if (storedSession) setActiveSession(JSON.parse(storedSession));
        else fetchTerminals();
      }
    } catch (error) {
      console.error("Failed to check active session", error);
      // Fallback
      const storedSession = localStorage.getItem('activeSession');
      if (storedSession) setActiveSession(JSON.parse(storedSession));
      else fetchTerminals();
    } finally {
      setCheckingSession(false);
    }
  };

  const fetchTerminals = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/terminals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTerminals(data);
        if (data.length > 0) {
          setSelectedTerminal(data[0].id);
        }
      } else if (response.status === 401) {
        logout();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to fetch terminals:', error);
    }
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/sessions/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          terminalId: selectedTerminal,
          openingCash: parseFloat(openingCash) || 0
        })
      });

      if (response.ok) {
        const session = await response.json();
        localStorage.setItem('activeSession', JSON.stringify(session));
        window.location.href = '/pos/terminal';
      } else if (response.status === 401) {
        logout();
        window.location.href = '/login';
      } else {
        const error = await response.json();
        
        // Handle "Terminal already has an open session" specifically
        if (response.status === 400 && error.session) {
          const stuckSession = error.session;
          const userChoice = confirm(
            `Terminal ${stuckSession.terminalId} is already open by you or another cashier.\n\n` +
            `ID: ${stuckSession.id}\n` +
            `Started: ${new Date(stuckSession.startAt).toLocaleString()}\n\n` +
            `Do you want to RESUME this session? \n(Click Cancel to FORCE CLOSE it instead)`
          );

          if (userChoice) {
            // Resume session
            localStorage.setItem('activeSession', JSON.stringify(stuckSession));
            setActiveSession(stuckSession);
            window.location.href = '/pos/terminal';
          } else {
            // Force close attempt
            if(confirm("Are you sure you want to force close the stuck session? This will require opening a new one.")) {
               await forceCloseSession(stuckSession.id);
            }
          }
        } else {
          alert(error.error || 'Failed to start session');
        }
      }
    } catch (error) {
      console.error('Session start error:', error);
      alert('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const forceCloseSession = async (sessionId) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/sessions/${sessionId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ closingCash: 0 }) // Force close with 0 if unknown
      });

      if (response.ok) {
        alert("Stuck session closed. You can now open a new session.");
        // Clear local state just in case
        localStorage.removeItem('activeSession');
        setActiveSession(null);
        // Refresh terminals/state
        window.location.reload(); 
      } else {
        alert("Failed to force close session.");
      }
    } catch (e) {
      console.error("Force close error", e);
      alert("Error closing session");
    }
  };

  const handleCloseSession = async () => {
    const closingCash = prompt("Enter closing cash amount:");
    if (closingCash === null) return; // User cancelled
    
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/sessions/${activeSession.id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          closingCash: parseFloat(closingCash) || 0
        })
      });

      if (response.ok) {
        localStorage.removeItem('activeSession');
        setActiveSession(null);
        alert('Session closed successfully!');
        fetchTerminals();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to close session');
      }
    } catch (error) {
      console.error('Session close error:', error);
      alert('Failed to close session');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center h-full bg-[#FBFBF2]">
        <CoffeeLoader size="lg" text="Checking Session..." />
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#FBFBF2]">
         <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-md w-full border border-[#E8F5E9]">
             <div className="h-20 w-20 bg-[#4ADE80] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Coffee className="h-10 w-10 text-white" />
             </div>
             <h2 className="text-2xl font-bold text-[#1A4D2E] mb-2">Session Active</h2>
             <p className="text-[#5F6F65] mb-8">
               You have an open session on <span className="font-bold text-[#1A4D2E]">{activeSession.terminal?.name || 'Terminal'}</span>
             </p>
             
             <div className="flex flex-col gap-3">
               <button 
                  onClick={() => window.location.href = '/pos/terminal'}
                  className="w-full py-4 bg-[#1A4D2E] text-white rounded-[2rem] font-bold hover:bg-[#143d24] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
               >
                 Continue Selling
               </button>
               <button 
                  onClick={handleCloseSession}
                  disabled={loading}
                  className="w-full py-4 bg-red-500 text-white rounded-[2rem] font-bold hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
               >
                 {loading ? 'Closing...' : 'Close Session'}
               </button>
             </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-[#FBFBF2]">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-xl w-full max-w-lg border border-[#E8F5E9]">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mb-4 transform rotate-3 shadow-lg">
            <Coffee className="h-8 w-8 text-[#1A4D2E]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A4D2E] tracking-tight">
            Open Session
          </h1>
          <p className="text-[#5F6F65] mt-2 font-medium">Select terminal to start selling</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#1A4D2E] mb-2 ml-1">
              Select Terminal
            </label>
            <div className="relative">
                <select
                value={selectedTerminal}
                onChange={(e) => setSelectedTerminal(e.target.value)}
                className="w-full px-5 py-4 rounded-[2rem] bg-[#FBFBF2] border-2 border-[#E8F5E9] focus:bg-white focus:border-[#1A4D2E] focus:outline-none transition-all font-semibold text-[#1A4D2E] appearance-none"
                >
                <option value="">Choose a terminal...</option>
                {terminals.map((terminal) => (
                    <option key={terminal.id} value={terminal.id}>
                    {terminal.name}
                    </option>
                ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5F6F65]">▼</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1A4D2E] mb-2 ml-1">
              Opening Cash
            </label>
            <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#5F6F65] font-bold">₹</span>
                <input
                type="number"
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-5 py-4 rounded-[2rem] bg-[#FBFBF2] border-2 border-[#E8F5E9] focus:bg-white focus:border-[#1A4D2E] focus:outline-none transition-all font-bold text-[#1A4D2E]"
                />
            </div>
          </div>

          <button
            onClick={handleStartSession}
            disabled={!selectedTerminal || loading}
            className="w-full bg-[#1A4D2E] text-white py-4 rounded-[2rem] font-bold text-lg hover:bg-[#143d24] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 mt-4"
          >
            {loading ? 'Starting System...' : 'Start Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
