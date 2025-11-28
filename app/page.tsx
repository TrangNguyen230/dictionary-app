// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MoonStars,
  SunDim,
  List,
  SquaresFour,
  PencilSimple,
  Trash,
  Plus,
} from '@phosphor-icons/react';

type Project = {
  id: number;
  name: string;
  description: string | null;
  termCount?: number;
};

type Term = {
  id: number;
  term: string;
  description: string;
  projectId: number | null;
  project?: Project | null;
  extraTags?: string | null;
};

type Tab = 'terms' | 'projects';
type ViewMode = 'rows' | 'cards';
type ThemeMode = 'light' | 'dark';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('terms');
  const [viewMode, setViewMode] = useState<ViewMode>('rows');
  const [theme, setTheme] = useState<ThemeMode>('light');

  const [projects, setProjects] = useState<Project[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search + filter
  const [searchText, setSearchText] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');

  // pagination
  const [currentPage, setCurrentPage] = useState(1);

  // term form
  const [showTermForm, setShowTermForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termText, setTermText] = useState('');
  const [termDesc, setTermDesc] = useState('');
  const [termProjectId, setTermProjectId] = useState<string>('');
  const [termExtraTags, setTermExtraTags] = useState('');

  // project form
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // ---------- THEME ----------

  useEffect(() => {
    const saved =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('wikime-theme') as ThemeMode | null)) || 'light';
    applyTheme(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTheme(mode: ThemeMode) {
    setTheme(mode);
    if (mode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('wikime-theme', mode);
    }
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  // ---------- DATA FETCH ----------

  async function fetchProjects() {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Error fetching projects');
    const data = (await res.json()) as Project[];
    setProjects(data);
  }

  async function fetchTerms({
    keepPage = false,
  }: {
    keepPage?: boolean;
  } = {}) {
    const params = new URLSearchParams();
    if (searchText.trim()) params.set('q', searchText.trim());
    if (filterProjectId) params.set('projectId', filterProjectId);
    if (filterTag) params.set('tag', filterTag);

    const res = await fetch('/api/terms?' + params.toString());
    if (!res.ok) throw new Error('Error fetching terms');
    const data = (await res.json()) as Term[];
    setTerms(data);
    if (!keepPage) setCurrentPage(1);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchProjects(), fetchTerms()]);
      } catch (e) {
        console.error(e);
        setError('Lỗi tải dữ liệu. Hãy F5 lại trang.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await fetchTerms();
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterProjectId, filterTag]);

  // ---------- TERM FORM LOGIC ----------

  function openCreateTermForm() {
    setEditingTerm(null);
    setTermText('');
    setTermDesc('');
    setTermProjectId('');
    setTermExtraTags('');
    setShowTermForm(true);
  }

  function openEditTermForm(term: Term) {
    setEditingTerm(term);
    setTermText(term.term);
    setTermDesc(term.description);
    setTermProjectId(term.projectId ? String(term.projectId) : '');
    setTermExtraTags(term.extraTags || '');
    setShowTermForm(true);
  }

  function cancelTermForm() {
    setShowTermForm(false);
    setEditingTerm(null);
  }

  async function handleSaveTerm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!termText.trim() || !termDesc.trim()) {
      setError('Vui lòng nhập Tên thuật ngữ và Mô tả.');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        term: termText.trim(),
        description: termDesc.trim(),
        projectId: termProjectId ? Number(termProjectId) : null,
        extraTags: termExtraTags.trim() || null,
      };

      if (editingTerm) {
        body.action = 'update-term';
        body.id = editingTerm.id;
      } else {
        body.action = 'create-term';
      }

      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('Failed to save term:', msg);
        throw new Error('Error saving term');
      }

      // reload lại list thuật ngữ nhưng KHÔNG đóng form
      await fetchTerms({ keepPage: true });

      if (editingTerm) {
        // đang sửa: giữ nguyên dữ liệu hiện tại trên form
        // (user bấm Hủy nếu muốn đóng)
      } else {
        // đang thêm mới: sau khi lưu thì clear form để nhập tiếp
        setTermText('');
        setTermDesc('');
        setTermProjectId('');
        setTermExtraTags('');
      }
    } catch (e) {
      console.error(e);
      setError('Không lưu được thuật ngữ.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTerm(id: number) {
    if (!confirm('Bạn có chắc muốn xóa thuật ngữ này?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-term', id }),
      });
      if (!res.ok) throw new Error('Error deleting term');
      await fetchTerms({ keepPage: true });
    } catch (e) {
      console.error(e);
      setError('Không xóa được thuật ngữ.');
    } finally {
      setLoading(false);
    }
  }

  // ---------- PROJECT FORM LOGIC ----------

  function startCreateProject() {
    setEditingProject(null);
    setProjectName('');
    setProjectDesc('');
  }

  function startEditProject(p: Project) {
    setEditingProject(p);
    setProjectName(p.name);
    setProjectDesc(p.description || '');
  }

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!projectName.trim()) {
      setError('Vui lòng nhập Tên dự án.');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        name: projectName.trim(),
        description: projectDesc.trim() || null,
      };

      if (editingProject) {
        body.action = 'update-project';
        body.id = editingProject.id;
      } else {
        body.action = 'create-project';
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Error saving project');

      await fetchProjects();
      setEditingProject(null);
      setProjectName('');
      setProjectDesc('');
    } catch (e) {
      console.error(e);
      setError('Không lưu được dự án.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject(id: number) {
    if (
      !confirm(
        'Khi xóa dự án, các thuật ngữ gắn với dự án sẽ bị bỏ liên kết (projectId = null). Bạn chắc chứ?',
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-project', id }),
      });
      if (!res.ok) throw new Error('Error deleting project');
      await fetchProjects();
      await fetchTerms({ keepPage: true });
    } catch (e) {
      console.error(e);
      setError('Không xóa được dự án.');
    } finally {
      setLoading(false);
    }
  }

  // ---------- TAG LIST (cho filter Tags) ----------

  const allTags = useMemo(() => {
    const set = new Set<string>();

    for (const t of terms) {
      if (t.project?.name) set.add(t.project.name);
      if (t.extraTags) {
        t.extraTags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((tag) => set.add(tag));
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [terms]);

  // ---------- PAGINATION ----------

  const pageSize = viewMode === 'cards' ? 12 : 15;
  const totalPages = Math.max(1, Math.ceil(terms.length / pageSize));
  const currentPageSafe =
    currentPage > totalPages ? totalPages : currentPage;
  const startIndex = (currentPageSafe - 1) * pageSize;
  const visibleTerms = terms.slice(startIndex, startIndex + pageSize);

  function gotoPage(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleChangeView(mode: ViewMode) {
    setViewMode(mode);
    setCurrentPage(1);
  }

  // ---------- RENDER ----------

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="logo">wikime</div>
        </div>
        <div className="header-center">
          <div className="nav-tabs">
            <button
              className={
                activeTab === 'terms' ? 'nav-tab active' : 'nav-tab'
              }
              onClick={() => setActiveTab('terms')}
            >
              Từ điển
            </button>
            <button
              className={
                activeTab === 'projects' ? 'nav-tab active' : 'nav-tab'
              }
              onClick={() => setActiveTab('projects')}
            >
              Dự án
            </button>
          </div>
        </div>
        <div className="header-right">
          <button
            id="themeToggle"
            className="theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <MoonStars size={16} weight="fill" />
            ) : (
              <SunDim size={16} weight="fill" />
            )}
            <span style={{ marginLeft: 6 }}>
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
      </header>

      {/* TAB TỪ ĐIỂN */}
      {activeTab === 'terms' && (
        <>
          {/* TOOLBAR */}
          <section className="toolbar">
            <div className="search-input">
              <div className="search-icon" />
              <input
                type="text"
                placeholder="Tìm thuật ngữ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="filters">
              {/* Project filter */}
              <div className="filter-pill">
                <span className="filter-label">Project</span>
                <span className="filter-divider" />
                <select
                  className="filter-select"
                  value={filterProjectId}
                  onChange={(e) =>
                    setFilterProjectId(e.target.value)
                  }
                >
                  <option value="">Tất cả</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags filter */}
              <div className="filter-pill">
                <span className="filter-label">Tags</span>
                <span className="filter-divider" />
                <select
                  className="filter-select"
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="view-toggle">
              <button
                id="viewRow"
                className={viewMode === 'rows' ? 'active' : ''}
                onClick={() => handleChangeView('rows')}
              >
                <List
                  size={14}
                  weight={viewMode === 'rows' ? 'fill' : 'regular'}
                />
                <span>Row</span>
              </button>
              <button
                id="viewCard"
                className={viewMode === 'cards' ? 'active' : ''}
                onClick={() => handleChangeView('cards')}
              >
                <SquaresFour
                  size={14}
                  weight={viewMode === 'cards' ? 'fill' : 'regular'}
                />
                <span>Card</span>
              </button>
            </div>
          </section>

          {/* ADD TERM BUTTON */}
          <div className="add-term-bar">
            <button
              className="btn-add-term"
              onClick={openCreateTermForm}
            >
              <Plus size={18} weight="bold" />
              <span>
                {editingTerm ? 'Sửa thuật ngữ' : 'Thêm thuật ngữ'}
              </span>
            </button>
          </div>

          {/* TERM FORM */}
          {showTermForm && (
            <section className="add-term-form">
              <h3>
                {editingTerm ? 'Sửa thuật ngữ' : 'Thêm thuật ngữ mới'}
              </h3>
              <form onSubmit={handleSaveTerm}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Tên thuật ngữ *</label>
                    <input
                      type="text"
                      value={termText}
                      onChange={(e) => setTermText(e.target.value)}
                      placeholder="Ví dụ: Event Target"
                    />
                  </div>
                  <div className="form-field">
                    <label>Thuộc dự án</label>
                    <select
                      className="select-project"
                      value={termProjectId}
                      onChange={(e) =>
                        setTermProjectId(e.target.value)
                      }
                    >
                      <option value="">(Không thuộc dự án)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Mô tả *</label>
                    <textarea
                      rows={3}
                      value={termDesc}
                      onChange={(e) => setTermDesc(e.target.value)}
                      placeholder="Giải thích chi tiết ý nghĩa thuật ngữ..."
                    />
                  </div>
                  <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Tags (optional, ngăn cách bởi dấu phẩy)</label>
                    <input
                      type="text"
                      value={termExtraTags}
                      onChange={(e) =>
                        setTermExtraTags(e.target.value)
                      }
                      placeholder="monitoring, event, status"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelTermForm}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu thuật ngữ
                  </button>
                </div>
              </form>
            </section>
          )}

          {error && (
            <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>
              {error}
            </div>
          )}
          {loading && (
            <div style={{ color: '#1d4ed8', fontSize: 13, marginBottom: 8 }}>
              Đang xử lý...
            </div>
          )}

          {/* TERM LIST */}
          <section
            id="termsList"
            className={
              viewMode === 'cards' ? 'terms-list cards' : 'terms-list'
            }
          >
            {visibleTerms.length === 0 && (
              <p style={{ fontSize: 13 }}>Chưa có thuật ngữ nào.</p>
            )}
            {visibleTerms.map((t) => {
              const extraTags =
                (t.extraTags || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean) || [];

              return (
                <article key={t.id} className="term-item">
                  <div className="term-header">
                    <div className="term-name">{t.term}</div>
                    <div className="term-actions">
                      <button
                        className="icon-btn"
                        title="Sửa"
                        onClick={() => openEditTermForm(t)}
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Xóa"
                        onClick={() => handleDeleteTerm(t.id)}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="term-desc">{t.description}</p>
                  <div className="term-meta">
                    <div className="tags">
                      {extraTags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                      {t.project && (
                        <span className="tag cool">{t.project.name}</span>
                      )}
                    </div>
                    <div className="term-project">
                      {t.project ? `Project: ${t.project.name}` : ''}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => gotoPage(currentPageSafe - 1)}
                disabled={currentPageSafe === 1}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={
                    currentPageSafe === i + 1
                      ? 'page-btn active'
                      : 'page-btn'
                  }
                  onClick={() => gotoPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => gotoPage(currentPageSafe + 1)}
                disabled={currentPageSafe === totalPages}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB DỰ ÁN */}
      {activeTab === 'projects' && (
        <>
          <section className="add-term-form" style={{ marginTop: 16 }}>
            <h3>{editingProject ? 'Sửa dự án' : 'Thêm dự án mới'}</h3>
            <form onSubmit={handleSaveProject}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Tên dự án *</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="VD: Naver Cloud Monitoring, BoxHero WMS..."
                  />
                </div>
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Mô tả</label>
                  <textarea
                    rows={3}
                    value={projectDesc}
                    onChange={(e) =>
                      setProjectDesc(e.target.value)
                    }
                    placeholder="Ghi chú thêm về dự án..."
                  />
                </div>
              </div>
              <div className="form-actions">
                {editingProject && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={startCreateProject}
                  >
                    Hủy sửa
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  Lưu dự án
                </button>
              </div>
            </form>
          </section>

          <section className="projects-list" style={{ marginTop: 12 }}>
            {projects.length === 0 && (
              <p style={{ fontSize: 13 }}>Chưa có dự án nào.</p>
            )}
            {projects.map((p) => (
              <div key={p.id} className="project-item">
               <div>
                <div className="term-name">{p.name}</div>
                {p.description && (
                 <div className="term-desc">{p.description}</div>
                )}
                <div className="term-project" style={{ marginTop: 4 }}>
                 {(p.termCount ?? 0).toString()} thuật ngữ
                </div>
               </div>
                <div className="term-actions">
                  <button
                    className="icon-btn"
                    title="Sửa"
                    onClick={() => startEditProject(p)}
                  >
                    <PencilSimple size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    title="Xóa"
                    onClick={() => handleDeleteProject(p.id)}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
