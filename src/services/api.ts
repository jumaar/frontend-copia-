import apiClient from './api-client';

export default apiClient;

export { createRegistrationToken, createUserWithToken, login, refreshSession, logout, getRegistrationTokens } from './domains/auth.service';

export {
  getManagementData,
  toggleUserStatus,
  getUserDetails,
  updateUser,
  deleteUser,
  updateUserLogistica,
  updateUserLogisticaComplete,
} from './domains/usuarios.service';

export {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from './domains/productos.service';

export {
  getActiveFridgesCount,
  getCuentasNevera,
  getNeverasSurtir,
  getLogisticaSurtir,
  distribuirNeveras,
  getSurtidoPorNevera,
  postValidacionEmpaques,
  iniciarSurtidoNevera,
  finalizarSurtidoNevera,
  retirarEmpaquesEstado5,
  darDeBajaEmpaque,
  validacionDosaTres,
} from './domains/neveras.service';

export {
  getTransaccionesFrigorifico,
  getTransaccionesTienda,
  procesarPago,
  getHistorialTienda,
  getResumenFinanciero,
  registrarMovimientoAdmin,
} from './domains/transacciones.service';

export {
  getLogistica,
  getInventarioLogistica,
  getLogisticaHermanos,
} from './domains/logistica.service';

export {
  getTiendasSobrinas,
  getTiendaData,
  getTiendas,
  getTiendasNeveras,
  createTienda,
  updateTienda,
  deleteTienda,
  createNevera,
  deleteNevera,
  updateProductoStock,
  updateNeveraStocks,
} from './domains/tiendas.service';

export {
  getFrigorificoData,
  createFrigorifico,
  updateFrigorifico,
  deleteFrigorifico,
  createEstacion,
  deleteEstacion,
  getHermanos,
  getGestionLogistica,
  getGestionLogisticaByUser,
  deleteEmpaque,
  cambiarEstadoEmpaques,
} from './domains/frigorifico.service';

export {
  getEmpaque,
} from './domains/trazabilidad.service';
