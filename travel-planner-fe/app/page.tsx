"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [artId, setArtId] = useState("");
  const [error, setError] = useState("");

  const API_URL = "http://127.0.0.1:8000";

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects/`);
      if (!res.ok) throw new Error("Помилка сервера");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError("Не вдалося підключитися до бекенду. Перевірте, чи працює Python.");
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    const places = artId ? [{ external_id: artId, notes: "Хочу побачити" }] : [];
    
    try {
      const res = await fetch(`${API_URL}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, start_date: startDate, places }),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        setStartDate("");
        setArtId("");
        fetchProjects();
      } else {
        const errData = await res.json();
        setError(errData.detail || "Помилка створення");
      }
    } catch (err) {
      setError("Помилка з'єднання");
    }
  };

  const handleVisit = async (id: number) => {
    await fetch(`${API_URL}/places/${id}/visit`, { method: "PATCH" });
    fetchProjects();
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Видалити цей план подорожі?")) return;
    const res = await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchProjects();
    } else {
      const errData = await res.json();
      alert(errData.detail || "Не можна видалити активний проект");
    }
  };

  return (
    <main className="container">
      
      {/* ЗАГОЛОВОК */}
      <div className="header">
        <h1>✈️ Travel Planner</h1>
        <p>Плануй свої культурні подорожі до музею Чикаго</p>
      </div>

      {/* ФОРМА */}
      <div className="create-card">
        <div className="card-header">
          ➕ Нова подорож
        </div>
        
        <form onSubmit={handleSubmit} className="form-body">
          <div className="input-group">
            <label>Назва проекту</label>
            <input
              placeholder="Наприклад: Вікенд у Чикаго"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Опис</label>
              <input
                placeholder="Коротка замітка"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Дата</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Додати картину (ID)</label>
            <input
              placeholder="Наприклад: 27992"
              value={artId}
              onChange={(e) => setArtId(e.target.value)}
            />
          </div>

          <button className="btn-submit">
            Створити маршрут
          </button>

          {error && <div className="error-msg">⚠️ {error}</div>}
        </form>
      </div>

      {/* СПИСОК ПРОЕКТІВ */}
      <div className="projects-list">
        <h2 className="section-title">Мої Подорожі</h2>
        
        {projects.length === 0 && (
           <p style={{textAlign: 'center', color: '#64748b', padding: '2rem'}}>
              Список порожній. Створіть свій перший проект вище!
           </p>
        )}

        {projects.map((proj: any) => (
          <div key={proj.id} className="project-card">
            
            <div className="project-header">
              <div className="project-title">
                <h3>
                  {proj.name} 
                  {proj.is_completed && <span className="badge-completed">✅ Completed</span>}
                </h3>
                {proj.description && <p className="project-desc">{proj.description}</p>}
                {proj.start_date && <p className="project-date">📅 {proj.start_date}</p>}
              </div>
              
              <button onClick={() => handleDelete(proj.id)} className="btn-delete" title="Видалити">
                🗑️
              </button>
            </div>

            <div className="places-container">
              {proj.places && proj.places.length > 0 ? (
                proj.places.map((place: any) => (
                  <div key={place.id} className="place-item">
                    <div className="place-info">
                        <strong>🖼️ Artwork ID: {place.external_id}</strong>
                        <span>{place.notes}</span>
                    </div>
                    
                    {!place.is_visited ? (
                      <button onClick={() => handleVisit(place.id)} className="btn-visit">
                        Відвідати
                      </button>
                    ) : (
                      <div className="visited-status">
                         ✓ Відвідано
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{fontStyle: 'italic', color: '#94a3b8', fontSize: '0.9rem'}}>
                  Немає картин у цьому плані
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}