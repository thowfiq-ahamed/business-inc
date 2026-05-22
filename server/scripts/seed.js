require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Startup = require('../models/Startup');
const Mentor = require('../models/Mentor');
const Resource = require('../models/Resource');
const Interest = require('../models/Interest');
const MentorRequest = require('../models/MentorRequest');

async function seed() {
  await connectDB();

  await Promise.all([
    Interest.deleteMany({}),
    MentorRequest.deleteMany({}),
    Mentor.deleteMany({}),
    Resource.deleteMany({}),
    Startup.deleteMany({}),
    User.deleteMany({}),
  ]);

  const [founder, mentorUser, investor, admin] = await User.create([
    {
      name: 'Ava Founder',
      email: 'founder@example.com',
      password: 'password123',
      role: 'startup',
      bio: 'Building climate tech for small manufacturers.',
      verified: true,
    },
    {
      name: 'Marcus Mentor',
      email: 'mentor@example.com',
      password: 'password123',
      role: 'mentor',
      bio: 'Operator mentor focused on B2B growth and go-to-market.',
      verified: true,
    },
    {
      name: 'Nina Investor',
      email: 'investor@example.com',
      password: 'password123',
      role: 'investor',
      bio: 'Angel investor interested in early-stage SaaS and climate startups.',
      verified: true,
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      bio: 'Platform administrator for reviewing incubator activity.',
      verified: true,
    },
  ]);

  const startup = await Startup.create({
    name: 'ForgeFlow',
    description: 'Workflow software that helps small factories cut downtime and energy waste.',
    founderId: founder._id,
    industry: 'tech',
    stage: 'mvp',
    fundingNeeded: 150000,
    website: 'https://example.com',
    teamSize: 6,
    verified: true,
  });

  const mentor = await Mentor.create({
    userId: mentorUser._id,
    expertise: ['technology', 'business', 'marketing'],
    yearsOfExperience: 11,
    availability: 'part-time',
    mentorships: [startup._id],
    reviews: [
      {
        reviewer: founder._id,
        rating: 5,
        comment: 'Thoughtful, practical, and very easy to work with.',
      },
    ],
  });

  startup.mentors = [mentor._id];
  await startup.save();

  await Resource.create([
    {
      title: 'Founder Pitch Deck Template',
      description: 'A practical deck outline for investor conversations and demo days.',
      category: 'funding',
      link: 'https://example.com/pitch-deck',
      provider: 'Incubator Library',
      cost: 'free',
      tags: ['pitch', 'fundraising'],
      createdBy: founder._id,
    },
    {
      title: 'Startup Legal Checklist',
      description: 'A quick checklist for incorporation, IP, and early customer contracts.',
      category: 'legal',
      link: 'https://example.com/legal',
      provider: 'Startup Counsel',
      cost: 'freemium',
      tags: ['legal', 'contracts'],
      createdBy: mentorUser._id,
    },
  ]);

  await Interest.create({
    investorId: investor._id,
    startupId: startup._id,
    note: 'Interested in traction and pilot pipeline.',
  });

  await MentorRequest.create({
    startupId: startup._id,
    mentorId: mentor._id,
    startupFounderId: founder._id,
    message: 'Would love feedback on enterprise sales and pilot conversion.',
    status: 'accepted',
    respondedOn: new Date(),
  });

  console.log('Seed complete.');
  await mongoose.connection.close();
}

seed().catch(async error => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
