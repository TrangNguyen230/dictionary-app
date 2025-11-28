// app/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Project = {
  id: number;
  name: string;
  description: string | null;
};

type Term = {
  id: number;
  term: string;
  description: string;
  projectId: number | null;
  project?: Project | null;
};

type Tab = 'terms' | 'projects';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  const [projects, setProjects] = useState<Project[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);

  // form state - term
  const [termText, setTermText] = useState('');
  const [termDesc, setTermDesc] = useState('');
  const [termProjectId, setTermProjectId] = useState<string>('');

  const [searchText, setSearchText] = useState('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');

  // form state - project
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const [error, setError] = useState<string | null>(null);

  async function fetchProjects() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }

  async function fetchTerms() {
    const params = new URLSearchParams();
    if (searchText.trim()) params.set('q', searchText.trim());
    if (filterProjectId) params.set('projectId', filterProjectId);

    const res = await fetch('/api/terms?' + params.toString());
    const data = await res.json();
    setTerms(data);
  }

  useEffect(() => {
    // load initial data
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProjects(), fetchTerms()]);
      } catch (e) {
        console.error(e);
        setError('Lỗi tải dữ liệu. Hãy F5 lại trang.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // refetch terms khi search/filter thay đổi
  useEffect(() => {
    fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterProjectId]);

  async function handleAddTerm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!termText.trim() || !termDesc.trim()) {
      setError('Vui lòng nhập đầy đủ Tên thuật ngữ và Mô tả.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-term',
          term: termText.trim(),
          description: termDesc.trim(),
          projectId: termProjectId ? Number(termProjectId) : null,
        }),
      });

      if (!res.ok) {
        throw new Error('Error creating term');
      }

      setTermText('');
      setTermDesc('');
      setTermProjectId('');
      await fetchTerms();
    } catch (e) {
      console.error(e);
      setError('Không thêm được thuật ngữ. Hãy thử lại.');
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
        body: JSON.stringify({
          action: 'delete-term',
          id,
        }),
      });
      if (!res.ok) throw new Error('Error deleting term');
      await fetchTerms();
    } catch (e) {
      console.error(e);
      setError('Không xóa được thuật ngữ.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!projectName.trim()) {
      setError('Vui lòng nhập Tên dự án.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-project',
          name: projectName.trim(),
          description: projectDesc.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Error creating project');

      setProjectName('');
      setProjectDesc('');
      await fetchProjects();
    } catch (e) {
      console.error(e);
      setError('Không thêm được dự án.');
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
        body: JSON.stringify({
          action: 'delete-project',
          id,
        }),
      });
      if (!res.ok) throw new Error('Error deleting project');
      await fetchProjects();
      await fetchTerms(); // reload terms vì projectId có thể thay đổi
    } catch (e) {
      console.error(e);
      setError('Không xóa được dự án.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Từ điển &amp; Dự án cá nhân</h1>
        <p className="subtitle">
          Web lưu thuật ngữ &amp; chức năng bạn hay dùng, thay cho file Excel.
        </p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'terms' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('terms')}
        >
          Từ điển
        </button>
        <button
          className={activeTab === 'projects' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('projects')}
        >
          Dự án
        </button>
      </nav>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="alert info">Đang xử lý...</div>}

      {activeTab === 'terms' ? (
        <section className="panel">
          <h2>Từ điển thuật ngữ</h2>

          <div className="filters">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mô tả..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
            >
              <option value="">Tất cả dự án</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <form className="form" onSubmit={handleAddTerm}>
            <h3>Thêm thuật ngữ mới</h3>
            <div className="form-row">
              <label>Tên thuật ngữ *</label>
              <input
                value={termText}
                onChange={(e) => setTermText(e.target.value)}
                placeholder="VD: Event Target, EDI, WMS..."
              />
            </div>
            <div className="form-row">
              <label>Mô tả *</label>
              <textarea
                value={termDesc}
                onChange={(e) => setTermDesc(e.target.value)}
                placeholder="Mô tả chi tiết, ví dụ, lưu ý..."
              />
            </div>
            <div className="form-row">
              <label>Thuộc dự án</label>
              <select
                value={termProjectId}
                onChange={(e) => setTermProjectId(e.target.value)}
              >
                <option value="">(Không chọn)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn primary">
              Lưu thuật ngữ
            </button>
          </form>

          <div className="list">
            <h3>Danh sách thuật ngữ</h3>
            {terms.length === 0 && <p>Chưa có thuật ngữ nào.</p>}
            {terms.map((t) => (
              <div key={t.id} className="card">
                <div className="card-main">
                  <div>
                    <div className="term-title">{t.term}</div>
                    <div className="term-desc">{t.description}</div>
                  </div>
                  <div className="card-meta">
                    {t.project && (
                      <span className="badge">Dự án: {t.project.name}</span>
                    )}
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="btn danger small"
                    onClick={() => handleDeleteTerm(t.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>Quản lý dự án</h2>
          <form className="form" onSubmit={handleAddProject}>
            <h3>Thêm dự án mới</h3>
            <div className="form-row">
              <label>Tên dự án *</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="VD: Naver Cloud Monitoring, BoxHero WMS..."
              />
            </div>
            <div className="form-row">
              <label>Mô tả</label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Ghi chú thêm về dự án..."
              />
            </div>
            <button type="submit" className="btn primary">
              Lưu dự án
            </button>
          </form>

          <div className="list">
            <h3>Danh sách dự án</h3>
            {projects.length === 0 && <p>Chưa có dự án nào.</p>}
            {projects.map((p) => (
              <div key={p.id} className="card">
                <div className="card-main">
                  <div className="term-title">{p.name}</div>
                  {p.description && (
                    <div className="term-desc">{p.description}</div>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    className="btn danger small"
                    onClick={() => handleDeleteProject(p.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
