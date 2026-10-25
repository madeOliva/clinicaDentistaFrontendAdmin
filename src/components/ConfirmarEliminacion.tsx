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
      className="modal-overlay modal-overlay-danger"
      onClick={() => {
        if (!cargando) onCancelar()
      }}
    >
      <div
        className="modal-card modal-card-danger"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmar-eliminacion"
      >
        <div className="modal-danger-header">
          <div className="modal-danger-icon">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.901 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.901 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="modal-danger-titulos">
            <h2 id="titulo-confirmar-eliminacion">{titulo}</h2>
            <p className="modal-danger-subtitulo">Esta acción no se puede deshacer</p>
          </div>
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

        <div className="modal-confirmacion-contenido modal-confirmacion-contenido-danger">
          {children}
        </div>

        <div className="form-buttons form-buttons-danger">
          <button
            type="button"
            className="btn btn-danger btn-danger-glow"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Eliminando...
              </>
            ) : (
              textoConfirmar
            )}
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