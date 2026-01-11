'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Stats {
  totalRecipes: number;
  byCountry: { [key: string]: number };
  byDifficulty: { easy: number; medium: number; hard: number };
}

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'seed' | 'cleanup';
}

function ScriptModal({ isOpen, onClose, action }: ScriptModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const runScript = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      // Start script execution
      const response = await fetch('/api/admin/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params: action === 'seed' ? { count: 20 } : undefined }),
      });

      if (!response.ok) {
        throw new Error('Failed to start script');
      }

      const { executionId: id } = await response.json();
      setExecutionId(id);

      // Poll for logs
      const interval = setInterval(async () => {
        try {
          const logsResponse = await fetch(`/api/admin/scripts?executionId=${id}`);
          if (logsResponse.ok) {
            const data = await logsResponse.json();
            setLogs(data.logs);

            if (data.status === 'completed' || data.status === 'error') {
              clearInterval(interval);
              setIsRunning(false);
            }
          }
        } catch (error) {
          console.error('Error fetching logs:', error);
        }
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      setLogs(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !executionId) {
      runScript();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {action === 'seed' ? 'Ejecutando Seed' : 'Ejecutando Cleanup'}
          </h2>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 min-h-[400px]">
            {logs.length === 0 && isRunning && (
              <div className="text-yellow-400">Iniciando script...</div>
            )}
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {!isRunning && logs.length > 0 && (
              <div className="mt-4 text-blue-400">Script completado.</div>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50 text-gray-700"
          >
            {isRunning ? 'Ejecutando...' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptModal, setScriptModal] = useState<{ isOpen: boolean; action: 'seed' | 'cleanup' | null }>({
    isOpen: false,
    action: null,
  });

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const closeModal = () => {
    setScriptModal({ isOpen: false, action: null });
    fetchStats(); // Refresh stats after script execution
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Administración de recetas y scripts</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total de Recetas</h3>
          <p className="text-4xl font-bold text-blue-600">{stats?.totalRecipes || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Por Dificultad</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fácil:</span>
              <span className="font-semibold text-green-600">{stats?.byDifficulty.easy || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Media:</span>
              <span className="font-semibold text-yellow-600">{stats?.byDifficulty.medium || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Difícil:</span>
              <span className="font-semibold text-red-600">{stats?.byDifficulty.hard || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Por País</h3>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {stats?.byCountry && Object.entries(stats.byCountry)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([country, count]) => (
                <div key={country} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{country}:</span>
                  <span className="font-semibold text-blue-600">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Scripts Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Scripts de Mantenimiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">🌱 Seed Database</h3>
            <p className="text-sm text-gray-600 mb-4">
              Genera nuevas recetas usando Gemini API y las agrega a la base de datos
            </p>
            <button
              onClick={() => setScriptModal({ isOpen: true, action: 'seed' })}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Ejecutar Seed
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">🧹 Cleanup Duplicates</h3>
            <p className="text-sm text-gray-600 mb-4">
              Elimina recetas duplicadas, manteniendo la versión más reciente
            </p>
            <button
              onClick={() => setScriptModal({ isOpen: true, action: 'cleanup' })}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
            >
              Ejecutar Cleanup
            </button>
          </div>
        </div>
      </div>

      {/* Recipe Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Recetas</h2>
          <Link
            href="/admin/recipes/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            + Nueva Receta
          </Link>
        </div>
        <Link
          href="/admin/recipes"
          className="block text-blue-600 hover:text-blue-700 font-semibold"
        >
          Ver todas las recetas →
        </Link>
      </div>

      {/* Script Modal */}
      {scriptModal.action && (
        <ScriptModal
          isOpen={scriptModal.isOpen}
          onClose={closeModal}
          action={scriptModal.action}
        />
      )}
    </div>
  );
}
