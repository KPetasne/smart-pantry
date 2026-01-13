'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Stats {
  totalRecipes: number;
  byCountry: { [key: string]: number };
  byDifficulty: { easy: number; medium: number; hard: number };
}

interface User {
  id: string;
  username: string;
  created_at: string;
}

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'seed' | 'cleanup' | 'cleanup-empty' | 'create-user';
  username?: string;
  password?: string;
}

function ScriptModal({ isOpen, onClose, action, username: propUsername, password: propPassword }: ScriptModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(action === 'seed' || action === 'create-user');
  
  // Seed parameters
  const [targetRecipes, setTargetRecipes] = useState('20');
  const [batchSize, setBatchSize] = useState('2');
  const [model, setModel] = useState('gemini-2.5-flash');
  
  // User parameters
  const [username, setUsername] = useState(propUsername || '');
  const [password, setPassword] = useState(propPassword || '');
  
  const models = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.0-flash'
  ];

  const runScript = async () => {
    setIsRunning(true);
    setLogs([]);
    setShowForm(false);
    
    try {
      // Prepare params based on action
      const params = action === 'seed' 
        ? {
            targetRecipes: parseInt(targetRecipes),
            batchSize: parseInt(batchSize),
            model
          }
        : action === 'create-user'
        ? {
            username,
            password
          }
        : undefined;
      
      // Start script execution
      const response = await fetch('/api/admin/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params }),
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
    if (isOpen && !executionId && !showForm) {
      runScript();
    }
  }, [isOpen, showForm]);
  
  useEffect(() => {
    // Reset state when modal closes
    if (!isOpen) {
      setLogs([]);
      setExecutionId(null);
      setIsRunning(false);
      setShowForm(action === 'seed' || action === 'create-user');
      setTargetRecipes('20');
      setBatchSize('2');
      setModel('gemini-2.5-flash');
      setUsername('');
      setPassword('');
    }
  }, [isOpen, action]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {action === 'seed' ? 'Ejecutando Seed' : 
             action === 'cleanup' ? 'Ejecutando Cleanup' : 
             action === 'cleanup-empty' ? 'Limpiando Recetas Vacías' :
             'Creando Usuario Admin'}
          </h2>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">{showForm ? (
            <div className="space-y-4">
              {action === 'seed' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuántas recetas deseas generar?
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={targetRecipes}
                      onChange={(e) => setTargetRecipes(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Ejemplo: 20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuál es el tamaño del batch?
                    </label>
                    <input
                      type="number"
                  min="1"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Ejemplo: 2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona el modelo de Gemini
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={runScript}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Ejecutar Seed
                </button>
              </div>
                </>
              ) : action === 'create-user' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de usuario
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="admin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={runScript}
                      disabled={!username || !password}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Crear Usuario
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 min-h-[400px]">
              {logs.length === 0 && isRunning && (
                <div className="text-yellow-400">Iniciando script...</div>
              )}
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {isRunning ? (
                <span className="flex items-center">
                  <span className="animate-pulse mr-2">●</span>
                  Ejecutando...
                </span>
              ) : logs.length > 0 ? (
                'Completado'
              ) : showForm ? (
                'Configura los parámetros'
              ) : (
                'Listo para ejecutar'
              )}
            </div>
            {!showForm && (
              <button
                onClick={onClose}
                disabled={isRunning}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptModal, setScriptModal] = useState<{ isOpen: boolean; action: 'seed' | 'cleanup' | 'cleanup-empty' | 'create-user' | null }>({
    isOpen: false,
    action: null,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const closeModal = () => {
    setScriptModal({ isOpen: false, action: null });
    fetchStats(); // Refresh stats after script execution
    if (scriptModal.action === 'create-user') {
      fetchUsers(); // Refresh users if a user was created
    }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-salvia/30 rounded-lg p-4">
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

          <div className="border border-salvia/30 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">🧹 Cleanup Duplicates</h3>
            <p className="text-sm text-gray-600 mb-4">
              Elimina recetas duplicadas basado en similitud de título
            </p>
            <button
              onClick={() => setScriptModal({ isOpen: true, action: 'cleanup' })}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
            >
              Ejecutar Cleanup
            </button>
          </div>

          <div className="border border-salvia/30 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">🗑️ Limpiar Recetas Vacías</h3>
            <p className="text-sm text-gray-600 mb-4">
              Elimina recetas que no tienen ingredientes asociados
            </p>
            <button
              onClick={() => setScriptModal({ isOpen: true, action: 'cleanup-empty' })}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Limpiar Recetas Vacías
            </button>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
          <button
            onClick={() => setScriptModal({ isOpen: true, action: 'create-user' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            + Crear Usuario
          </button>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No hay usuarios registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-salvia/30">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-salvia/30">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteUser(user.id, user.username)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
