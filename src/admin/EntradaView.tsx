export default function EntradaView() {
  return (
    <div className="admin-seccion">
      <div className="admin-section-header">
        <div>
          <h2>Movimientos</h2>
          <p className="page-subtitle">Registra las entradas o salidas de productos al inventario.</p>
        </div>
        <button type="button" className="btn btn-primary">
          Ajuste de inventario
        </button>
      </div>
      <div className="empty-box">
        <p className="empty">No hay entradas registradas todavía.</p>
      </div>
    </div>
  )
}