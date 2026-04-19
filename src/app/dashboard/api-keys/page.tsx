'use client';

import React, { useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production Key',
      key: 'mk_live_xxxxxxxxxxxxxxxx',
      createdAt: '2026-03-20',
      lastUsed: '2026-03-24',
    },
    {
      id: '2',
      name: 'Test Key',
      key: 'mk_test_xxxxxxxxxxxxxxxx',
      createdAt: '2026-03-22',
      lastUsed: null,
    },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `mk_live_${Math.random().toString(36).substring(2, 18)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: null,
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setShowCreateForm(false);
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
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
    return key.substring(0, 8) + '•'.repeat(key.length - 8);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
          <p className="text-gray-500">Manage your API access keys</p>
        </div>

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
                placeholder="Enter key name (e.g., Production)"
                className="flex-1"
              />
              <Button onClick={handleCreateKey} className="bg-[#339999] hover:bg-[#2a7a7a]">Create</Button>
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* API Keys List */}
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="w-5 h-5 text-[#339999]" />
                    <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-700">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyKey(apiKey.key, apiKey.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {copiedId === apiKey.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Created: {apiKey.createdAt}</p>
                    <p>Last Used: {apiKey.lastUsed || 'Never'}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteKey(apiKey.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="p-6 mt-6 bg-[#339999]/5 border-[#339999]/20">
          <h3 className="font-semibold text-[#339999] mb-2">Usage Instructions</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• API keys are used to access MDLooker API endpoints</li>
            <li>• Please keep your keys secure and do not share them</li>
            <li>• If a key is compromised, delete it immediately and create a new one</li>
            <li>• Each key has a limit of 100 requests per minute</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
