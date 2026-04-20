'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: 'active' | 'inactive' | 'revoked' | 'expired';
  createdAt: string;
  lastUsedAt: string | null;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  usage: {
    totalRequests: number;
    requestsThisMonth: number;
    requestsToday: number;
  };
}

interface NewKeyResponse {
  id: string;
  name: string;
  fullKey: string;
  keyPrefix: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch API keys on mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/api-keys');
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(data.keys || []);
      } else {
        setError(data.error || 'Failed to load API keys');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success && data.apiKey) {
        setNewKey({
          id: data.apiKey.id,
          name: data.apiKey.name,
          fullKey: data.apiKey.fullKey,
          keyPrefix: data.apiKey.keyPrefix,
          createdAt: data.apiKey.metadata?.createdAt,
        });
        setNewKeyName('');
        setShowCreateForm(false);
        fetchApiKeys(); // Refresh the list
      } else {
        setError(data.error || 'Failed to create API key');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      
      const response = await fetch(`/api/api-keys?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(apiKeys.filter(key => key.id !== id));
      } else {
        setError(data.error || 'Failed to revoke API key');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.substring(0, 8) + '•'.repeat(Math.max(0, key.length - 8));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      revoked: 'bg-red-100 text-red-700',
      expired: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#339999]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
          <p className="text-gray-500">Manage your API access keys for programmatic access to MDLooker data</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* New Key Success Modal */}
        {newKey && (
          <Card className="p-6 mb-6 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">API Key Created Successfully</h3>
                <p className="text-sm text-green-700 mb-4">
                  Copy your API key now. For security reasons, you won&apos;t be able to see it again.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <code className="flex-1 bg-white px-4 py-3 rounded-lg text-sm font-mono text-gray-800 break-all border">
                    {newKey.fullKey}
                  </code>
                  <Button
                    onClick={() => handleCopyKey(newKey.fullKey, 'new')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {copiedId === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => setNewKey(null)}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  I&apos;ve copied my key
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Create Button */}
        {!showCreateForm && (
          <Button
            className="mb-6 bg-[#339999] hover:bg-[#2a7a7a]"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Key
          </Button>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New API Key</h2>
            <div className="flex gap-4">
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Enter key name (e.g., Production, Development)"
                className="flex-1"
                disabled={creating}
              />
              <Button 
                onClick={handleCreateKey} 
                className="bg-[#339999] hover:bg-[#2a7a7a]"
                disabled={creating || !newKeyName.trim()}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <Card className="p-12 text-center">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
            <p className="text-gray-500 mb-4">Create your first API key to start using the MDLooker API</p>
            <Button
              className="bg-[#339999] hover:bg-[#2a7a7a]"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Key className="w-5 h-5 text-[#339999]" />
                      <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                      {getStatusBadge(apiKey.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-700">
                        {visibleKeys.has(apiKey.id) ? `${apiKey.keyPrefix}...` : maskKey(apiKey.keyPrefix + '•'.repeat(32))}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key prefix'}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Created</p>
                        <p className="text-gray-700">{new Date(apiKey.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Last Used</p>
                        <p className="text-gray-700">
                          {apiKey.lastUsedAt 
                            ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Requests</p>
                        <p className="text-gray-700">{apiKey.usage?.totalRequests?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">This Month</p>
                        <p className="text-gray-700">{apiKey.usage?.requestsThisMonth?.toLocaleString() || 0}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>Rate Limit: {apiKey.rateLimit?.requestsPerMinute || 60}/min</span>
                      <span>•</span>
                      <span>{apiKey.rateLimit?.requestsPerHour || 1000}/hour</span>
                      <span>•</span>
                      <span>{apiKey.rateLimit?.requestsPerDay || 10000}/day</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(apiKey.id)}
                    disabled={deletingId === apiKey.id || apiKey.status === 'revoked'}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-4 flex-shrink-0"
                  >
                    {deletingId === apiKey.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info */}
        <Card className="p-6 mt-6 bg-[#339999]/5 border-[#339999]/20">
          <h3 className="font-semibold text-[#339999] mb-3">API Usage Instructions</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">•</span>
              <span>Include your API key in the <code className="bg-gray-100 px-1 rounded">Authorization</code> header: <code className="bg-gray-100 px-1 rounded">Bearer YOUR_API_KEY</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">•</span>
              <span>Each key has rate limits. Upgrade your plan for higher limits.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">•</span>
              <span>Keep your keys secure. Never expose them in client-side code.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">•</span>
              <span>If a key is compromised, revoke it immediately and create a new one.</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-[#339999]/10">
            <a 
              href="/docs/api" 
              className="text-sm text-[#339999] hover:underline font-medium"
            >
              View API Documentation →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
