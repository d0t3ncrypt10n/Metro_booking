import { v4 as uuidv4 } from 'uuid';

// In-memory user storage (replace with database in production)
const users = new Map();

// Admin phone number - Jayant
const ADMIN_PHONE = '+919472747641';

/**
 * Create a new user
 */
export async function createUser(userData) {
  const user = {
    id: uuidv4(),
    name: userData.name,
    phone: userData.phone,
    phoneVerified: userData.phoneVerified || false,
    loginTime: new Date().toISOString(),
    role: userData.phone === ADMIN_PHONE ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.set(user.phone, user);
  console.log(`✅ User created: ${user.name} (${user.phone})`);
  
  return user;
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone) {
  return users.get(phone) || null;
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return null;
}

/**
 * Update user
 */
export async function updateUser(id, updates) {
  const user = await getUserById(id);
  
  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  users.set(user.phone, updatedUser);
  console.log(`✅ User updated: ${updatedUser.name} (${updatedUser.phone})`);
  
  return updatedUser;
}

/**
 * Delete user
 */
export async function deleteUser(id) {
  const user = await getUserById(id);
  
  if (!user) {
    throw new Error('User not found');
  }

  users.delete(user.phone);
  console.log(`🗑️  User deleted: ${user.name} (${user.phone})`);
  
  return true;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  return Array.from(users.values());
}
