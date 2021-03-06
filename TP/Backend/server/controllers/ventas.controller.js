const VentasModel = require("../models/ventas");
const ProductosModel = require("../models/productos");
const https = require("https");

const controller = {};

controller.getVentas = async (req, res) => {
  const venta = await VentasModel.find();
  res.json(venta);
};

controller.getVentasByComprador = async (req, res) => {
  const ventas = await VentasModel.find({ idComprador: req.params.id }).populate("idComprador");
  res.json(ventas);
};

controller.getVentasByVendedor = async (req, res) => {
  const ventas = await VentasModel.find({ "productos.producto.idVendedor": req.params.id });
  ventas.forEach((venta) => {
    venta.productos = venta.productos.filter((item) => item.producto.idVendedor === req.params.id);
  });
  res.json(ventas);
};
controller.getVenta = (req, res) => {
  VentasModel.findById(req.params.id)
    .then((respuesta) => res.json(respuesta))
    .catch((error) => res.json({ mensaje: "No se encuentra esa venta con el id brindado", error: error }));
};

controller.createVenta = async (req, res) => {
  req.body.fecha = Date.now();
  const venta = new VentasModel(req.body);

  // acá debería actualizar el stock de los productos que vendi
  venta.productos.forEach(async (element) => {
    element.producto.stock -= element.cantidad;
    await ProductosModel.findByIdAndUpdate(element.producto._id, { $set: element.producto }, { new: true });
  });

  await venta.save();
  res.json({
    status: "Venta Saved",
  });
};

controller.editVenta = (req, res) => {
  const venta = {
    idComprador: req.body.idComprador,
    productos: req.body.productos,
    fecha: Date.now(),
    comisionista: req.body.comisionista,
  };
  VentasModel.findByIdAndUpdate(req.params.id, { $set: venta }, { new: true })
    .then(res.json({ status: "Venta Updated" }))
    .catch((err) => res.json({ status: "error", error: err }));
};

controller.deleteVenta = (req, res) => {
  VentasModel.findByIdAndRemove(req.params.id)
    .then((req) => res.json({ status: "Venta Deleted", request: req }))
    .catch((error) => res.json({ mensaje: "No se encuentra la venta para borrar", error: error }));
};

module.exports = controller;
