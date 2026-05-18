require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Item = require('../models/Item');
const Interaction = require('../models/Interaction');

const movieData = [
  { title: 'The Dark Knight', category: 'Action', tags: ['superhero', 'crime', 'thriller'], features: { genre: ['Action', 'Crime'], releaseYear: 2008 }, popularity: 950 },
  { title: 'Inception', category: 'Sci-Fi', tags: ['dream', 'thriller', 'mind-bending'], features: { genre: ['Sci-Fi', 'Thriller'], releaseYear: 2010 }, popularity: 920 },
  { title: 'The Shawshank Redemption', category: 'Drama', tags: ['prison', 'hope', 'friendship'], features: { genre: ['Drama'], releaseYear: 1994 }, popularity: 980 },
  { title: 'Pulp Fiction', category: 'Crime', tags: ['nonlinear', 'violence', 'dark-comedy'], features: { genre: ['Crime', 'Drama'], releaseYear: 1994 }, popularity: 890 },
  { title: 'The Matrix', category: 'Sci-Fi', tags: ['cyberpunk', 'philosophy', 'action'], features: { genre: ['Sci-Fi', 'Action'], releaseYear: 1999 }, popularity: 910 },
  { title: 'Forrest Gump', category: 'Drama', tags: ['romance', 'history', 'inspirational'], features: { genre: ['Drama', 'Romance'], releaseYear: 1994 }, popularity: 880 },
  { title: 'Interstellar', category: 'Sci-Fi', tags: ['space', 'time', 'emotional'], features: { genre: ['Sci-Fi', 'Adventure'], releaseYear: 2014 }, popularity: 900 },
  { title: 'The Godfather', category: 'Crime', tags: ['mafia', 'family', 'power'], features: { genre: ['Crime', 'Drama'], releaseYear: 1972 }, popularity: 970 },
  { title: 'Fight Club', category: 'Drama', tags: ['psychological', 'twist', 'dark'], features: { genre: ['Drama', 'Thriller'], releaseYear: 1999 }, popularity: 870 },
  { title: 'Avengers: Endgame', category: 'Action', tags: ['superhero', 'epic', 'time-travel'], features: { genre: ['Action', 'Sci-Fi'], releaseYear: 2019 }, popularity: 940 },
  { title: 'Parasite', category: 'Thriller', tags: ['social-commentary', 'twist', 'dark-comedy'], features: { genre: ['Thriller', 'Drama'], releaseYear: 2019 }, popularity: 860 },
  { title: 'Spirited Away', category: 'Animation', tags: ['fantasy', 'anime', 'magical'], features: { genre: ['Animation', 'Fantasy'], releaseYear: 2001 }, popularity: 850 },
  { title: 'The Silence of the Lambs', category: 'Thriller', tags: ['psychological', 'horror', 'crime'], features: { genre: ['Thriller', 'Crime'], releaseYear: 1991 }, popularity: 840 },
  { title: 'La La Land', category: 'Romance', tags: ['musical', 'dreams', 'love'], features: { genre: ['Romance', 'Musical'], releaseYear: 2016 }, popularity: 830 },
  { title: 'Mad Max: Fury Road', category: 'Action', tags: ['post-apocalyptic', 'chase', 'visual'], features: { genre: ['Action', 'Adventure'], releaseYear: 2015 }, popularity: 820 },
  { title: 'Get Out', category: 'Horror', tags: ['social-thriller', 'twist', 'race'], features: { genre: ['Horror', 'Thriller'], releaseYear: 2017 }, popularity: 810 },
  { title: 'The Social Network', category: 'Drama', tags: ['tech', 'biography', 'startup'], features: { genre: ['Drama', 'Biography'], releaseYear: 2010 }, popularity: 800 },
  { title: 'Coco', category: 'Animation', tags: ['family', 'music', 'death'], features: { genre: ['Animation', 'Family'], releaseYear: 2017 }, popularity: 790 },
  { title: 'Dune', category: 'Sci-Fi', tags: ['space', 'politics', 'epic'], features: { genre: ['Sci-Fi', 'Adventure'], releaseYear: 2021 }, popularity: 880 },
  { title: 'Oppenheimer', category: 'Drama', tags: ['biography', 'history', 'physics'], features: { genre: ['Drama', 'Biography'], releaseYear: 2023 }, popularity: 920 },
  { title: 'Barbie', category: 'Comedy', tags: ['fantasy', 'feminism', 'colorful'], features: { genre: ['Comedy', 'Fantasy'], releaseYear: 2023 }, popularity: 900 },
  { title: 'Everything Everywhere All At Once', category: 'Sci-Fi', tags: ['multiverse', 'family', 'absurdist'], features: { genre: ['Sci-Fi', 'Adventure'], releaseYear: 2022 }, popularity: 870 },
  { title: 'Spider-Man: Into the Spider-Verse', category: 'Animation', tags: ['superhero', 'multiverse', 'innovation'], features: { genre: ['Animation', 'Action'], releaseYear: 2018 }, popularity: 910 },
  { title: 'Joker', category: 'Drama', tags: ['psychological', 'origin-story', 'dark'], features: { genre: ['Drama', 'Thriller'], releaseYear: 2019 }, popularity: 860 },
  { title: 'Blade Runner 2049', category: 'Sci-Fi', tags: ['cyberpunk', 'visual', 'philosophy'], features: { genre: ['Sci-Fi', 'Thriller'], releaseYear: 2017 }, popularity: 820 },
  { title: 'Whiplash', category: 'Drama', tags: ['music', 'obsession', 'intense'], features: { genre: ['Drama', 'Music'], releaseYear: 2014 }, popularity: 840 },
  { title: 'The Grand Budapest Hotel', category: 'Comedy', tags: ['visual', 'quirky', 'adventure'], features: { genre: ['Comedy', 'Adventure'], releaseYear: 2014 }, popularity: 830 },
  { title: 'Black Panther', category: 'Action', tags: ['superhero', 'africa', 'representation'], features: { genre: ['Action', 'Sci-Fi'], releaseYear: 2018 }, popularity: 890 },
  { title: 'Hereditary', category: 'Horror', tags: ['family', 'trauma', 'atmospheric'], features: { genre: ['Horror', 'Drama'], releaseYear: 2018 }, popularity: 780 },
  { title: 'Knives Out', category: 'Mystery', tags: ['whodunit', 'family', 'witty'], features: { genre: ['Mystery', 'Comedy'], releaseYear: 2019 }, popularity: 850 },
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    await Interaction.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const users = [];
    for (let i = 1; i <= 20; i++) {
      users.push({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: 'password123'
      });
    }
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create items
    const itemsWithImages = movieData.map((movie, idx) => ({
      ...movie,
      imageUrl: `https://picsum.photos/seed/${idx + 1}/300/450`,
      averageRating: 3 + Math.random() * 2,
      ratingCount: Math.floor(Math.random() * 500) + 50
    }));
    const createdItems = await Item.create(itemsWithImages);
    console.log(`Created ${createdItems.length} items`);

    // Create interactions
    const interactions = [];
    for (const user of createdUsers) {
      // Each user interacts with 5-15 random items
      const numInteractions = 5 + Math.floor(Math.random() * 11);
      const shuffled = [...createdItems].sort(() => 0.5 - Math.random());

      for (let i = 0; i < numInteractions; i++) {
        const types = ['view', 'view', 'view', 'click', 'click', 'rating', 'rating', 'wishlist', 'purchase'];
        const type = types[Math.floor(Math.random() * types.length)];

        interactions.push({
          userId: user._id,
          itemId: shuffled[i]._id,
          type,
          rating: type === 'rating' ? Math.floor(1 + Math.random() * 5) : null
        });
      }
    }

    await Interaction.create(interactions);
    console.log(`Created ${interactions.length} interactions`);

    // Update all item rating stats
    for (const item of createdItems) {
      await Item.updateRatingStats(item._id);
    }
    console.log('Updated item rating stats');

    console.log('\nSeed completed successfully!');
    console.log('Demo login: user1@example.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
