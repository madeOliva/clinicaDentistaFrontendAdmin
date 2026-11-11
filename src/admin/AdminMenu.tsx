
import { useState } from 'react'
import {
  OPCIONES_MENU,
  OPCIONES_SECUNDARIAS,
  NOMENCLADORES,
} from './admin'

import type { Seccion } from './admin'
import { Icono } from './iconos'
import { useContacto } from '../contactConfig'

export default function AdminMenu({
  seccion,
  onSeleccionar,
  onVolverAlSitio,
  onCerrarSesion,
  cerrado,
  onToggle,
}: {
  seccion: Seccion
  onSeleccionar: (seccion: Seccion) => void
  onVolverAlSitio?: () => void
  onCerrarSesion: () => void
  cerrado: boolean
  onToggle: () => void
}) {
  const { contacto } = useContacto()
  const [abierto, setAbierto] = useState<string | null>(null)

  return (
    <aside
      className={`admin-sidebar ${
        cerrado ? 'admin-sidebar-cerrado' : ''
      }`}
      onMouseEnter={() => {
        if (cerrado) onToggle()
      }}
      onMouseLeave={() => {
        if (!cerrado) onToggle()
      }}
    >
      <nav className="sidebar-menu">
        {/* Opciones principales */}
        {OPCIONES_MENU.map((opcion: any) => {
          if (opcion.submenu) {
            const estaAbierto = abierto === opcion.id

            return (
              <div key={opcion.id} className="sidebar-group">
                <button
                  title={cerrado ? opcion.label : undefined}
                  className={`sidebar-link ${
                    opcion.submenu.some(
                      (s: any) => s.id === seccion,
                    )
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    if (cerrado) {
                      onToggle()
                      setAbierto(opcion.id)
                      return
                    }

                    setAbierto(
                      estaAbierto ? null : opcion.id,
                    )
                  }}
                >
                  <Icono nombre={opcion.icono} />
                  <span className="sidebar-texto">
                    {opcion.label}
                  </span>
                </button>

                {!cerrado && estaAbierto && (
                  <div className="sidebar-submenu">
                    {opcion.submenu.map((sub: any) => (
                      <button
                        key={sub.id}
                        title={cerrado ? sub.label : undefined}
                        className={`sidebar-link ${
                          seccion === sub.id ? 'active' : ''
                        }`}
                        onClick={() => onSeleccionar(sub.id)}
                      >
                        <span className="sidebar-texto">
                          {sub.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <button
              key={opcion.id}
              title={cerrado ? opcion.label : undefined}
              className={`sidebar-link ${
                seccion === opcion.id ? 'active' : ''
              }`}
              onClick={() => onSeleccionar(opcion.id)}
            >
              <Icono nombre={opcion.icono} />
              <span className="sidebar-texto">
                {opcion.label}
              </span>
            </button>
          )
        })}

        <div className="sidebar-divider" />

        {/* Opciones secundarias */}
        {OPCIONES_SECUNDARIAS.map((opcion) => {
          // Nomenclador tendrá un submenú propio.
          if (opcion.id === 'nomenclador') {
            const estaAbierto = abierto === 'nomenclador'

            const nomencladorActivo = NOMENCLADORES.some(
              (nomenclador) => nomenclador.id === seccion,
            )

            return (
              <div
                key={opcion.id}
                className="sidebar-group"
              >
                <button
                  type="button"
                  title={cerrado ? opcion.label : undefined}
                  className={`sidebar-link ${
                    seccion === opcion.id || nomencladorActivo
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    if (cerrado) {
                      onToggle()
                      setAbierto('nomenclador')
                      return
                    }

                    setAbierto(
                      estaAbierto ? null : 'nomenclador',
                    )
                  }}
                >
                  <Icono nombre={opcion.icono} />

                  <span className="sidebar-texto">
                    {opcion.label}
                  </span>
                </button>

                {!cerrado && estaAbierto && (
                  <div className="sidebar-submenu">
                    {NOMENCLADORES.map((nomenclador) => (
                      <button
                        key={nomenclador.id}
                        type="button"
                        className={`sidebar-link ${
                          seccion === nomenclador.id
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          onSeleccionar(nomenclador.id)
                        }
                      >
                        <span className="sidebar-texto">
                          {nomenclador.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          // Las demás opciones secundarias permanecen normales.
          return (
            <button
              key={opcion.id}
              title={cerrado ? opcion.label : undefined}
              className={`sidebar-link ${
                seccion === opcion.id ? 'active' : ''
              }`}
              onClick={() => onSeleccionar(opcion.id)}
            >
              <Icono nombre={opcion.icono} />

              <span className="sidebar-texto">
                {opcion.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Pie del menú */}
      <div className="sidebar-footer">
        {onVolverAlSitio && (
          <button
            type="button"
            className="sidebar-link sidebar-volver"
            title={cerrado ? 'Volver al sitio' : undefined}
            onClick={onVolverAlSitio}
          >
            <Icono nombre="home" />

            <span className="sidebar-texto">
              Volver al sitio
            </span>
          </button>
        )}

        <div className="admin-user">
          <span className="admin-avatar">ADM</span>

          <span className="admin-user-info">
            <span className="admin-user-name">
              Admin
            </span>

            <span className="admin-user-cargo">
              Administrador
            </span>
          </span>

          <button
            className="sidebar-logout"
            onClick={onCerrarSesion}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <Icono nombre="logout" size={20} />
          </button>
        </div>
      </div>
    </aside>
  )
}
