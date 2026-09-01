import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  Search, 
  SlidersHorizontal, 
  FileText, 
  FileCode, 
  Database, 
  Activity, 
  BookOpen, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  auditCurriculum, 
  formatAuditReportAsMarkdown, 
  formatAuditReportAsJson, 
  formatAuditReportAsCsv,
  CurriculumAuditReport,
  CurriculumAuditIssue,
  AuditSeverity,
  GradeSubjectStats
} from '../utils/curriculumAuditor';
import { cn } from '../lib/utils';

export function CurriculumAuditViewer() {
  const [report, setReport] = useState<CurriculumAuditReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'STATS'>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [includeCombinedSecondary, setIncludeCombinedSecondary] = useState<boolean>(false);
  const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>({});

  // Run audit on mount and on trigger
  const runAudit = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const res = auditCurriculum({ includeCombinedSecondary });
        setReport(res);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to run curriculum audit:", err);
        toast.error("Failed to execute curriculum audit.");
        setLoading(false);
      }
    }, 100);
  };

  useEffect(() => {
    runAudit();
  }, [includeCombinedSecondary]);

  // Unique grades and subjects for filters
  const uniqueGrades = useMemo(() => {
    if (!report) return [];
    const set = new Set(report.gradeSubjectStats.map(s => s.grade));
    return Array.from(set).sort();
  }, [report]);

  const uniqueSubjects = useMemo(() => {
    if (!report) return [];
    const set = new Set(report.gradeSubjectStats.map(s => s.subject));
    return Array.from(set).sort();
  }, [report]);

  // Filtered issues
  const filteredIssues = useMemo<CurriculumAuditIssue[]>(() => {
    if (!report) return [];

    return report.issues.filter(issue => {
      if (severityFilter !== 'ALL' && severityFilter !== 'STATS') {
        if (issue.severity !== severityFilter) return false;
      }

      if (selectedGradeFilter !== 'ALL' && issue.grade !== selectedGradeFilter) {
        return false;
      }

      if (selectedSubjectFilter !== 'ALL' && issue.subject !== selectedSubjectFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchGrade = issue.grade.toLowerCase().includes(term);
        const matchSubj = issue.subject.toLowerCase().includes(term);
        const matchTopic = (issue.topicTitle || '').toLowerCase().includes(term);
        const matchSubtopic = (issue.subtopicTitle || '').toLowerCase().includes(term);
        const matchMsg = issue.message.toLowerCase().includes(term);
        const matchType = issue.type.toLowerCase().includes(term);
        return matchGrade || matchSubj || matchTopic || matchSubtopic || matchMsg || matchType;
      }

      return true;
    });
  }, [report, severityFilter, selectedGradeFilter, selectedSubjectFilter, searchTerm]);

  // Filtered stats
  const filteredStats = useMemo<GradeSubjectStats[]>(() => {
    if (!report) return [];

    return report.gradeSubjectStats.filter(stat => {
      if (selectedGradeFilter !== 'ALL' && stat.grade !== selectedGradeFilter) {
        return false;
      }
      if (selectedSubjectFilter !== 'ALL' && stat.subject !== selectedSubjectFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        return stat.grade.toLowerCase().includes(term) || stat.subject.toLowerCase().includes(term);
      }
      return true;
    });
  }, [report, selectedGradeFilter, selectedSubjectFilter, searchTerm]);

  // Copy helper
  const handleCopy = (format: 'markdown' | 'json' | 'csv') => {
    if (!report) return;
    let text = '';
    if (format === 'markdown') text = formatAuditReportAsMarkdown(report);
    if (format === 'json') text = formatAuditReportAsJson(report);
    if (format === 'csv') text = formatAuditReportAsCsv(report);

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    toast.success(`Copied ${format.toUpperCase()} audit log to clipboard!`);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Download helper
  const handleDownload = (format: 'md' | 'json' | 'csv') => {
    if (!report) return;
    let content = '';
    let mimeType = 'text/plain';
    let filename = `curriculum-audit-report.${format}`;

    if (format === 'md') {
      content = formatAuditReportAsMarkdown(report);
      mimeType = 'text/markdown;charset=utf-8';
    } else if (format === 'json') {
      content = formatAuditReportAsJson(report);
      mimeType = 'application/json;charset=utf-8';
      filename = 'curriculum-audit-log.json';
    } else if (format === 'csv') {
      content = formatAuditReportAsCsv(report);
      mimeType = 'text/csv;charset=utf-8';
      filename = 'curriculum-audit-issues.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const toggleExpand = (id: string) => {
    setExpandedIssueIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading || !report) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <RefreshCw className="animate-spin text-[#00A86B] mx-auto" size={36} />
        <h3 className="text-lg font-black uppercase text-slate-800 tracking-tight">Systematically Auditing Curriculum Core...</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Iterating through all uploaded subject files (Agriculture Science, Biology, Chemistry, English, Mathematics, Sciences, Arts, etc.) and verifying subtopics, competencies, and expected standards across all grade levels.
        </p>
      </div>
    );
  }

  const { summary } = report;
  const criticalCount = summary.criticalCount;
  const warningCount = summary.warningCount;
  const infoCount = summary.infoCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-400" />
                Management Audit Protocol
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-300 border border-white/20 rounded-full text-[11px] font-black uppercase tracking-widest">
                Automated Verification Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              Curriculum Audit & Management Log
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl font-normal leading-relaxed">
              Systematic verification log of all Zambian national syllabi files. Detects missing subtopics, competencies, and expected standards across all grade levels for streamlined manual auditing.
            </p>
          </div>

          {/* Action Buttons & Re-run */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={runAudit}
              className="bg-[#00A86B] hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              Re-Run Audit
            </button>
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                onClick={() => handleDownload('md')}
                title="Download Markdown Report"
                className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                <span className="text-[11px]">.MD</span>
              </button>
              <button
                onClick={() => handleDownload('json')}
                title="Download JSON Log"
                className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <FileCode size={13} />
                <span className="text-[11px]">.JSON</span>
              </button>
              <button
                onClick={() => handleDownload('csv')}
                title="Download CSV Spreadsheet"
                className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <FileText size={13} />
                <span className="text-[11px]">.CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Health Score</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">{summary.overallHealthScore}%</span>
            <span className="text-[10px] text-slate-300">Curriculum Health</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Grade Levels</span>
            <span className="text-xl font-black text-white mt-1 block">{summary.totalGrades}</span>
            <span className="text-[10px] text-slate-300">ECE to Form 6 (A Level)</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Topics</span>
            <span className="text-xl font-black text-white mt-1 block">{summary.totalTopics}</span>
            <span className="text-[10px] text-slate-300">{summary.totalSubtopics} Subtopics</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Competencies</span>
            <span className="text-xl font-black text-blue-400 mt-1 block">{summary.totalCompetencies}</span>
            <span className="text-[10px] text-slate-300">{summary.totalStandards} Standards</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">🔴 Critical Deficiencies</span>
            <span className={cn("text-xl font-black mt-1 block", criticalCount > 0 ? "text-rose-400" : "text-emerald-400")}>
              {criticalCount}
            </span>
            <span className="text-[10px] text-slate-300">Missing Subtopics/Comps</span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">🟡 Missing Standards</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">{warningCount}</span>
            <span className="text-[10px] text-slate-300">Needs standard tags</span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Severity View Mode Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: `All Issues (${report.issues.length})`, color: 'bg-slate-900' },
              { id: 'CRITICAL', label: `🔴 Critical (${criticalCount})`, color: 'bg-rose-600' },
              { id: 'WARNING', label: `🟡 Missing Standards (${warningCount})`, color: 'bg-amber-600' },
              { id: 'INFO', label: `🔵 Info (${infoCount})`, color: 'bg-blue-600' },
              { id: 'STATS', label: `📊 Grade Matrix (${report.gradeSubjectStats.length})`, color: 'bg-emerald-600' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id as any)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  severityFilter === tab.id
                    ? `${tab.color} text-white shadow-md`
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Copy Dropdown */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('markdown')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedFormat === 'markdown' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              Copy Markdown Report
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Filter by Grade Level</label>
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Grade Levels ({uniqueGrades.length})</option>
              {uniqueGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Filter by Subject</label>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Subjects ({uniqueSubjects.length})</option>
              {uniqueSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Search Audit Logs</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search topic, subtopic, issue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Either Grade Matrix or Issue Cards */}
      {severityFilter === 'STATS' ? (
        /* Grade & Subject Matrix Table */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
                <Database className="text-[#00A86B]" size={18} />
                Grade & Subject Compliance Matrix
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Showing completeness health scores and section counts across all curriculum datasets.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {filteredStats.length} Subjects Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-4">Grade Level</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-3 text-center">Topics</th>
                  <th className="py-3.5 px-3 text-center">Subtopics</th>
                  <th className="py-3.5 px-3 text-center">Competencies</th>
                  <th className="py-3.5 px-3 text-center">Standards</th>
                  <th className="py-3.5 px-4 text-center">Health</th>
                  <th className="py-3.5 px-4">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredStats.map((stat, idx) => {
                  const isHealthy = stat.criticalIssuesCount === 0 && stat.warningsCount === 0;
                  const hasCrit = stat.criticalIssuesCount > 0;
                  return (
                    <tr key={`${stat.grade}-${stat.subject}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{stat.grade}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{stat.subject}</td>
                      <td className="py-3.5 px-3 text-center">{stat.totalTopics}</td>
                      <td className="py-3.5 px-3 text-center">{stat.totalSubtopics}</td>
                      <td className="py-3.5 px-3 text-center text-blue-600 font-bold">{stat.totalCompetencies}</td>
                      <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">{stat.totalStandards}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                stat.completenessScore >= 90 ? "bg-emerald-500" : stat.completenessScore >= 60 ? "bg-amber-500" : "bg-rose-500"
                              )} 
                              style={{ width: `${stat.completenessScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px]">{stat.completenessScore}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {hasCrit ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <AlertOctagon size={12} />
                            {stat.criticalIssuesCount} Deficiencies
                          </span>
                        ) : stat.warningsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <AlertTriangle size={12} />
                            {stat.warningsCount} No Standards
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 size={12} />
                            Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Issues List Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Activity className="text-[#00A86B]" size={16} />
              Logged Audit Findings ({filteredIssues.length})
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              Showing {filteredIssues.length} of {report.issues.length} total logged items
            </span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <CheckCircle2 className="text-emerald-500 mx-auto" size={40} />
              <h3 className="text-base font-black uppercase text-slate-800">No Issues Match Current Filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All subtopics and competencies meet the criteria for the selected filter and search terms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredIssues.slice(0, 100).map((issue, idx) => {
                const isExpanded = expandedIssueIds[issue.id];
                const isCrit = issue.severity === 'CRITICAL';
                const isWarn = issue.severity === 'WARNING';

                return (
                  <div
                    key={issue.id || idx}
                    className={cn(
                      "bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs",
                      isCrit 
                        ? "border-rose-200 hover:border-rose-300 bg-rose-50/10" 
                        : isWarn
                          ? "border-amber-200 hover:border-amber-300 bg-amber-50/10"
                          : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                            isCrit 
                              ? "bg-rose-100 text-rose-800 border-rose-300" 
                              : isWarn
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-blue-100 text-blue-800 border-blue-300"
                          )}>
                            {issue.severity}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {issue.grade}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {issue.subject}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            [{issue.type}]
                          </span>
                        </div>

                        {/* Breadcrumbs / Titles */}
                        <div className="text-xs text-slate-500 font-semibold pt-0.5">
                          <span>Topic: <b className="text-slate-800">{issue.topicTitle}</b></span>
                          {issue.subtopicTitle && (
                            <span> → Subtopic: <b className="text-slate-800">{issue.subtopicTitle}</b></span>
                          )}
                        </div>

                        {/* Message */}
                        <p className={cn(
                          "text-xs font-bold leading-relaxed pt-1",
                          isCrit ? "text-rose-900" : isWarn ? "text-amber-900" : "text-slate-700"
                        )}>
                          {issue.message}
                        </p>
                      </div>

                      {/* Toggle / Fix suggestion */}
                      <button
                        onClick={() => toggleExpand(issue.id)}
                        className="self-start px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                      >
                        {isExpanded ? 'Hide Fix' : 'View Action'}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Expandable Fix Guidance */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3 text-xs space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                              <Sparkles size={11} className="text-[#00A86B]" />
                              Suggested Manual Auditing Remedy:
                            </span>
                            <p className="text-slate-700 font-medium leading-relaxed">
                              {issue.recommendation}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filteredIssues.length > 100 && (
                <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-bold">
                  Showing first 100 issues of {filteredIssues.length}. Download the full report (.MD / .JSON / .CSV) to view the complete log.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
