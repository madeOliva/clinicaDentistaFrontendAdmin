
import { useState } from 'react'

interface ConfirmacionEliminarModalProps {
  nombreElemento: string
  onConfirmar: () => void
  onCerrar: () => void
}

export default function ConfirmacionEliminarModal({
  nombreElemento,
  onConfirmar,
  onCerrar,
}: ConfirmacionEliminarModalProps) {
  const [eliminado, setEliminado] = useState(false)

  const confirmarEliminacion = () => {
    onConfirmar()
    setEliminado(true)
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-card modal-eliminar"
        onClick={(e) => e.stopPropagation()}
      >
        {!eliminado ? (
          <>
            <div className="modal-eliminar-icono">
              !
            </div>

            <h2>¿Eliminar producto?</h2>

            <p className="modal-texto">
              ¿Estás seguro de que deseas eliminar{' '}
              <strong>{nombreElemento}</strong>?
              Esta acción no se puede deshacer.
            </p>

            <div className="modal-eliminar-acciones">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onCerrar}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmarEliminacion}
              >
                Sí, eliminar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-eliminar-icono modal-eliminar-exito">
              ✓
            </div>

            <h2>¡Producto eliminado con éxito!</h2>

            <p className="modal-texto">
              El producto <strong>{nombreElemento}</strong> fue eliminado
              correctamente del inventario.
            </p>

            <div className="modal-eliminar-acciones modal-eliminar-acciones-final">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCerrar}
              >
                Aceptar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
