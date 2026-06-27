import mongoose from 'mongoose';
import env from './config/env';
import User from './models/User';
import Task from './models/Task';
import logger from './utils/logger';

const seedDatabase = async () => {
  try {
    logger.info('Connecting to database for seeding...');
    await mongoose.connect(env.MONGO_URI);
    logger.info('Database connected successfully.');

    // Clear collections
    logger.info('Clearing existing users and tasks...');
    await User.deleteMany({});
    await Task.deleteMany({});

    logger.info('Seeding users...');
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskflow.com',
      password: 'Password123',
      role: 'admin',
    });

    const user1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@taskflow.com',
      password: 'Password123',
      role: 'user',
    });

    const user2 = await User.create({
      name: 'Bob Smith',
      email: 'bob@taskflow.com',
      password: 'Password123',
      role: 'user',
    });

    logger.info('Seeding tasks...');

    const sampleTasks = [
      {
        title: 'Design UI Layouts',
        description: 'Create wireframes and high-fidelity mockups for the dashboard, tasks panel, and settings screens.',
        priority: 'high',
        status: 'open',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
        createdBy: admin._id,
        assignedTo: user1._id,
      },
      {
        title: 'Setup API Gateway',
        description: 'Configure entry routes, proxy path parameters, and authentication token validation middlewares.',
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
        createdBy: admin._id,
        assignedTo: user2._id,
      },
      {
        title: 'Review PR for Authentication',
        description: 'Review the changes for the cookie-based session token storage and CORS header handling.',
        priority: 'medium',
        status: 'testing',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // tomorrow
        createdBy: user1._id,
        assignedTo: admin._id,
      },
      {
        title: 'Implement Toast Notification System',
        description: 'Develop custom context provider and animated feedback alerts showing mutation outcomes.',
        priority: 'low',
        status: 'done',
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // yesterday
        createdBy: user2._id,
        assignedTo: user1._id,
      },
      {
        title: 'Write Unit Tests for Task Controller',
        description: 'Integrate task creation, detail lookup, and update controller unit tests asserting role access.',
        priority: 'medium',
        status: 'open',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        createdBy: admin._id,
        assignedTo: admin._id,
      },
      {
        title: 'Optimize Database Indexing',
        description: 'Create compound indexes on search queries, statuses, priorities, and user scope parameters.',
        priority: 'high',
        status: 'done',
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        createdBy: admin._id,
        assignedTo: user2._id,
      },
      {
        title: 'Fix Sidebar Mobile Layout',
        description: 'Address rendering and alignment issues with the responsive sidebar menu on mobile displays.',
        priority: 'low',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
        createdBy: user1._id,
        assignedTo: user1._id,
      },
      {
        title: 'Accessibility Contrast Improvements',
        description: 'Audit light and dark style configurations to satisfy WCAG AA contrast standard criteria.',
        priority: 'medium',
        status: 'open',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdBy: admin._id,
        assignedTo: user2._id,
      },
      {
        title: 'Deploy to Staging Server',
        description: 'Setup build triggers and variables in continuous delivery pipelines for the hosted client.',
        priority: 'high',
        status: 'testing',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
        createdBy: admin._id,
        assignedTo: user1._id,
      },
      {
        title: 'Implement Dark Theme Styling',
        description: 'Inject CSS variables, setup tailwind modifiers, and theme provider state tracking systems.',
        priority: 'medium',
        status: 'done',
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        createdBy: user1._id,
        assignedTo: user2._id,
      },
      {
        title: 'Audit Focus Trap Elements',
        description: 'Implement focus trap hooks and Esc-key event listeners on popup dialog panels.',
        priority: 'medium',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        createdBy: admin._id,
        assignedTo: admin._id,
      },
      {
        title: 'Compose Project Readme',
        description: 'Provide an architecture map, setup guides, seeding information, and full API endpoint documentation.',
        priority: 'low',
        status: 'open',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
        createdBy: user2._id,
        assignedTo: user2._id,
      },
    ];

    await Task.insertMany(sampleTasks);
    logger.info('Database seeded successfully with users and sample tasks.');
  } catch (error) {
    logger.error('Failed to seed database:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Database disconnected.');
  }
};

seedDatabase();
