export default function ProductosView() {
  return (
    <div className="admin-seccion">
      <div className="admin-section-header">
        <div>
          <h2 className="dashboard-bienvenida">Productos</h2>
        </div>
        <button type="button" className="btn btn-primary">
          Agregar productos
        </button>
      </div>

      <div className="productos-top-row">
        <div className="resumen-tarjetas resumen-tarjetas-pequenas resumen-tarjetas-centradas">
          <div className="resumen-card resumen-card-pequena">
            <span className="resumen-label">Productos</span>
            <span className="resumen-valor">0</span>
          </div>
          <div className="resumen-card resumen-card-pequena">
            <span className="resumen-label">Categoría</span>
            <span className="resumen-valor">0</span>
          </div>
          <div className="resumen-card resumen-card-pequena">
            <span className="resumen-label">Total</span>
            <span className="resumen-valor">0</span>
          </div>
        </div>
      </div>

      <div className="empty-box">
        <p className="empty">No hay productos registrados.</p>
      </div>
    </div>
  )
}