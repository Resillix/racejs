/**
 * User routes moduconst createUser = (req, res) => {
  const newUser = {
    id: users.length + 1,
    name: 'New User',
    email: 'newuser@example.com',
  };
  users.push(newUser);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser,
  });
};this file and save - the changes will hot reload automatically!
 * Try changing the response messages or adding new routes.
 */

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
];

const getUsers = (req, res) => {
  res.json({
    success: true,
    message: 'Users fetched - Error FIXED! v5',
    data: users,
    version: 5, // Changed after fixing error!
    count: users.length,
  });
};

const createUser = (req, res) => {
  const newUser = {
    id: users.length + 1,
    name: 'New User',
    email: 'newuser@example.com',
  };
  users.push(newUser);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser,
  });
};

const getUserById = (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
};

// Export routes array for hot reload system
exports.routes = [
  { method: 'GET', path: '/users', handlers: [getUsers] },
  { method: 'POST', path: '/users', handlers: [createUser] },
  { method: 'GET', path: '/users/:id', handlers: [getUserById] },
];
