
import './AdminNavbar.css'

export default function AdminNavbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-buscador">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          type="text"
          placeholder="Buscar..."
          aria-label="Buscar"
        />
      </div>

      <div className="admin-topbar-acciones">
        <button
          type="button"
          className="admin-topbar-notificaciones"
          aria-label="Notificaciones"
        >
          <svg viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
          <span className="admin-notificacion-punto" />
        </button>

        <button
          type="button"
          className="admin-topbar-perfil"
        >
          <span className="admin-topbar-avatar">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
          </span>

          <span className="admin-topbar-nombre">
            Administrador
          </span>

          <svg
            className="admin-topbar-flecha"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </header>
  )
}
