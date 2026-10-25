import type { ReactNode } from 'react'

interface ConfirmarEliminacionProps {
  abierto: boolean
  titulo?: string
  children: ReactNode
  textoConfirmar?: string
  cargando?: boolean
  onCancelar: () => void
  onConfirmar: () => void | Promise<void>
}

export default function ConfirmarEliminacion({
  abierto,
  titulo = 'Confirmar eliminación',
  children,
  textoConfirmar = 'Sí, eliminar',
  cargando = false,
  onCancelar,
  onConfirmar,
}: ConfirmarEliminacionProps) {
  if (!abierto) return null

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!cargando) onCancelar()
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmar-eliminacion"
      >
        <div className="modal-header">
          <h2 id="titulo-confirmar-eliminacion">{titulo}</h2>

          <button
            type="button"
            className="modal-close"
            onClick={onCancelar}
            disabled={cargando}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="modal-confirmacion-contenido">
          {children}
        </div>

        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Eliminando...' : textoConfirmar}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}