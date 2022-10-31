const { resolve } = require("path");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Middleware functions
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dishId === dish.id);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

//checks for existance of property
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

//Price Validator
function validatePrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (!price || price <= 0 || !Number.isInteger(price)) {
    next({
      status: 400,
      message: `Requires a valid price`,
    });
  }
  next();
}

//Dish id/route validator
function dishRouteValidator(req, res, next) {
  const { data: { id } = {} } = req.body;
  const dishId = req.params.dishId;

  if (id !== dishId && id !== "" && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `Invalid dish id: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

//handlers
function list(req, res) {
  res.status(200).json({ data: dishes });
}

function read(req, res) {
  res.status(200).json({ data: res.locals.dish });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.status(200).json({ data: dish });
}

module.exports = {
  create: [
    hasBodyData("name"),
    hasBodyData("description"),
    hasBodyData("price"),
    hasBodyData("image_url"),
    validatePrice,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    dishRouteValidator,
    validatePrice,
    hasBodyData("name"),
    hasBodyData("description"),
    hasBodyData("price"),
    hasBodyData("image_url"),
    update,
  ],
};
