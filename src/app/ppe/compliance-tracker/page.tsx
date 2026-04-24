'use client'

import { useState } from 'react'
import { ClipboardList, Plus, Trash2, Edit3, CheckCircle2, Clock, AlertCircle, Calendar, ChevronDown, ChevronUp, Download, Filter, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPPECategories, getTargetMarkets } from '@/lib/ppe-data'
import { PPEIcon } from '@/components/ppe/PPEIcons'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

type ComplianceStatus = 'planned' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'expired'

interface ComplianceTask {
  id: string
  productName: string
  categoryId: string
  marketCode: string
  status: ComplianceStatus
  progress: number
  startDate: string
  targetDate: string
  completionDate?: string
  notes: string
  documents: string[]
  reminders: { date: string; note: string }[]
}

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  planned: { label: 'Planned', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <Calendar className="w-4 h-4" /> },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <Clock className="w-4 h-4" /> },
  submitted: { label: 'Submitted', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: <CheckCircle2 className="w-4 h-4" /> },
  approved: { label: 'Approved', color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle2 className="w-4 h-4" /> },
  rejected: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-100', icon: <AlertCircle className="w-4 h-4" /> },
  expired: { label: 'Expired', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: <AlertCircle className="w-4 h-4" /> },
}

const DEMO_TASKS: ComplianceTask[] = [
  {
    id: '1',
    productName: 'N95 Respirator Model A',
    categoryId: 'respiratory-protection',
    marketCode: 'US',
    status: 'in_progress',
    progress: 65,
    startDate: '2026-01-15',
    targetDate: '2026-06-30',
    notes: 'NIOSH testing in progress. FDA 510(k) documentation being prepared.',
    documents: ['Technical File v1.2', 'Test Report Draft', '510(k) Draft'],
    reminders: [
      { date: '2026-05-15', note: 'Follow up with NIOSH on test results' },
      { date: '2026-06-01', note: 'Submit 510(k) application' },
    ],
  },
  {
    id: '2',
    productName: 'Safety Boot Pro X1',
    categoryId: 'safety-footwear',
    marketCode: 'EU',
    status: 'submitted',
    progress: 80,
    startDate: '2026-02-01',
    targetDate: '2026-05-15',
    notes: 'CE marking application submitted to Notified Body. Awaiting review.',
    documents: ['CE Technical File', 'EN ISO 20345 Test Reports', 'DoC Draft'],
    reminders: [
      { date: '2026-05-01', note: 'Check Notified Body review status' },
    ],
  },
  {
    id: '3',
    productName: 'Chemical Suit Type 3',
    categoryId: 'protective-clothing',
    marketCode: 'UK',
    status: 'approved',
    progress: 100,
    startDate: '2023-08-01',
    targetDate: '2026-01-31',
    completionDate: '2026-01-25',
    notes: 'UKCA marking approved. Certificate valid until 2029-01-25.',
    documents: ['UKCA Certificate', 'Test Reports', 'Technical File', 'DoC'],
    reminders: [
      { date: '2028-07-25', note: 'Start renewal process 6 months before expiry' },
    ],
  },
]

export default function ComplianceTrackerPage() {
  const categories = getPPECategories()
  const markets = getTargetMarkets()

  const [tasks, setTasks] = useState<ComplianceTask[]>(DEMO_TASKS)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ComplianceStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const [newTask, setNewTask] = useState<Partial<ComplianceTask>>({
    status: 'planned',
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    documents: [],
    reminders: [],
  })

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesSearch = task.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.notes.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleAddTask = () => {
    if (!newTask.productName || !newTask.categoryId || !newTask.marketCode) return

    const task: ComplianceTask = {
      id: Date.now().toString(),
      productName: newTask.productName,
      categoryId: newTask.categoryId,
      marketCode: newTask.marketCode,
      status: newTask.status as ComplianceStatus || 'planned',
      progress: newTask.progress || 0,
      startDate: newTask.startDate || new Date().toISOString().split('T')[0],
      targetDate: newTask.targetDate || new Date().toISOString().split('T')[0],
      notes: newTask.notes || '',
      documents: [],
      reminders: [],
    }

    setTasks(prev => [...prev, task])
    setShowAddForm(false)
    setNewTask({
      status: 'planned',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      documents: [],
      reminders: [],
    })
  }

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleUpdateProgress = (id: string, progress: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      let status = t.status
      if (progress === 100) status = 'approved'
      else if (progress > 0) status = 'in_progress'
      return { ...t, progress, status }
    }))
  }

  const handleExport = () => {
    const report = tasks.map(t => ({
      Product: t.productName,
      Category: categories.find(c => c.id === t.categoryId)?.name,
      Market: markets.find(m => m.code === t.marketCode)?.name,
      Status: STATUS_CONFIG[t.status].label,
      Progress: `${t.progress}%`,
      Start: t.startDate,
      Target: t.targetDate,
      Completed: t.completionDate || '-',
      Notes: t.notes,
    }))

    const csv = [
      Object.keys(report[0]).join(','),
      ...report.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance-tracker-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    approved: tasks.filter(t => t.status === 'approved').length,
    pending: tasks.filter(t => t.status === 'planned' || t.status === 'submitted').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.section
        className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" variants={fadeInUp}>
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <ClipboardList className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Compliance Status Tracker
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track and manage your PPE certification progress across all markets
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Projects', value: stats.total, color: 'bg-gray-100 text-gray-900' },
              { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-100 text-blue-700' },
              { label: 'Approved', value: stats.approved, color: 'bg-green-100 text-green-700' },
              { label: 'Pending', value: stats.pending, color: 'bg-orange-100 text-orange-700' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className={`${stat.color} rounded-xl p-6 text-center`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all' ? 'bg-[#339999] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {(Object.keys(STATUS_CONFIG) as ComplianceStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filterStatus === status ? 'bg-[#339999] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {STATUS_CONFIG[status].icon}
                  {STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-4 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Compliance Project</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newTask.productName || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, productName: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                  <select
                    value={newTask.categoryId || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={newTask.marketCode || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, marketCode: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  >
                    <option value="">Select Market</option>
                    {markets.map(m => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newTask.targetDate || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
                  >
                    Add Project
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const status = STATUS_CONFIG[task.status]
              const category = categories.find(c => c.id === task.categoryId)
              const market = markets.find(m => m.code === task.marketCode)
              const isExpanded = expandedTask === task.id

              return (
                <motion.div
                  key={task.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Main Row */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          {category && <PPEIcon categoryId={category.id} size={28} />}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{task.productName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{category?.name}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-lg">{market?.flag_emoji}</span>
                            <span className="text-sm text-gray-500">{market?.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${status.bgColor} ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTask(task.id)
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-[#339999]">{task.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#339999] to-[#2d8b8b] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Started: {task.startDate}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Target: {task.targetDate}
                      </div>
                      {task.completionDate && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Completed: {task.completionDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-6 space-y-6">
                          {/* Progress Control */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Update Progress</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={task.progress}
                              onChange={(e) => handleUpdateProgress(task.id, Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#339999]"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{task.notes || 'No notes added'}</p>
                          </div>

                          {/* Documents */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                            <div className="flex flex-wrap gap-2">
                              {task.documents.length > 0 ? task.documents.map((doc, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                                  {doc}
                                </span>
                              )) : (
                                <span className="text-sm text-gray-400">No documents uploaded</span>
                              )}
                            </div>
                          </div>

                          {/* Reminders */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Reminders</h4>
                            <div className="space-y-2">
                              {task.reminders.length > 0 ? task.reminders.map((reminder, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                                  <div>
                                    <span className="text-sm font-medium text-yellow-800">{reminder.date}</span>
                                    <p className="text-sm text-yellow-700">{reminder.note}</p>
                                  </div>
                                </div>
                              )) : (
                                <span className="text-sm text-gray-400">No reminders set</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-500">Add a new compliance project to get started</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
