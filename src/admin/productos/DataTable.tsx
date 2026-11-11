
import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: keyof T
  label: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
}

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  emptyMessage = 'No hay registros para mostrar.',
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const mostrarAcciones = Boolean(onEdit || onDelete)

  return (
    <div className="orders-table-wrap inventario-tabla-wrap">
      <table className="orders-table inventario-tabla">
        <thead>
          <tr>
            {columns.map((columna) => (
              <th key={String(columna.key)}>
                {columna.label}
              </th>
            ))}

            {mostrarAcciones && <th>Acciones</th>}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (mostrarAcciones ? 1 : 0)}
                className="empty"
              >
                Cargando datos...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (mostrarAcciones ? 1 : 0)}
                className="empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((fila) => (
              <tr key={getRowId(fila)}>
                {columns.map((columna) => (
                  <td key={String(columna.key)}>
                    {columna.render
                      ? columna.render(fila)
                      : String(fila[columna.key] ?? '')}
                  </td>
                ))}

                {mostrarAcciones && (
                  <td>
                    <div className="inventario-acciones">
                      {onEdit && (
                        <button
                          type="button"
                          className="inventario-btn-editar"
                          onClick={() => onEdit(fila)}
                          title="Editar registro"
                        >
                          Editar
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          className="inventario-btn-eliminar"
                          onClick={() => onDelete(fila)}
                          title="Eliminar registro"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
