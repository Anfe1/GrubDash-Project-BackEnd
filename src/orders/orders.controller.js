const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Middleware functions

//Checks if the order exists by searching for the id of the order
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => orderId === order.id);
  if (foundOrder) {
    //if the order is found then move to the next function
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

//checks if the data requested has a specific property
function hasBodyData(property) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[property]) {
      next();
    }
    next({
      status: 400,
      message: `Must include a ${property}`,
    });
  };
}

//Checks if the dished property is an array and if its populated with data
function dishesValidator(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: `Must include valid dishes.`,
    });
  }
  next();
}

//Checks if the quantity property is present, an integer, and if its not Zero
function dishQuantityValidator(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.forEach((dish) => {
    const quantity = dish.quantity;
    if (!quantity || quantity === 0 || !Number.isInteger(quantity)) {
      next({
        status: 400,
        message: `dish ${dish.id} must have quantity property, quantity must be an integer, and it must not be equal to or be less than 0`,
      });
    }
  });
  next();
}

//Checks if id property matches the id from found order
function orderRouteValidator(req, res, next) {
  const { data: { id } = {} } = req.body;
  const orderId = res.locals.order.id;

  if (id !== orderId && id !== "" && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `Id ${id} must match orderId provided in parameters`,
    });
  }
  next();
}

//Checks if the status property is present, empty, or invalid
function statusValidator(req, res, next) {
  const { data: { status } = {} } = req.body;

  if (status === "invalid" || !status || status.length === 0) {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}

//handlers, list, read, create, update, delete

//List all the data avalible
function list(req, res) {
  res.status(200).json({ data: orders });
}

//Checks for a specifict order, when found it will return the order data
function read(req, res) {
  res.status(200).json({ data: res.locals.order });
}

//Checks to make sure the data has the rigth properties, then creates a new object and populates
//with the parameter inputs then responds with that new object

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//Checks for a specific order, calling on the middleware functions to validate that the properties are valid before
//before updating the data with new information.
function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.status(200).json({ data: order });
}

//Checks for a specific order then if the status is pending it deletes the order
function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  if (foundOrder.status === "pending") {
    const index = orders.findIndex((order) => order.id === Number(orderId));
    orders.splice(index, 1);
    res.sendStatus(204);
  }
  return next({
    status: 400,
    message: `order cannot be deleted unless order status = 'pending'`,
  });
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    hasBodyData("deliverTo"),
    hasBodyData("mobileNumber"),
    hasBodyData("dishes"),
    dishesValidator,
    dishQuantityValidator,
    create,
  ],
  update: [
    orderExists,
    orderRouteValidator,
    dishesValidator,
    dishQuantityValidator,
    hasBodyData("deliverTo"),
    hasBodyData("mobileNumber"),
    hasBodyData("status"),
    hasBodyData("dishes"),
    statusValidator,
    update,
  ],
  delete: [orderExists, destroy],
};
