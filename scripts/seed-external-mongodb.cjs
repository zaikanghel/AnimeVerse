/**
 * Script to seed an external MongoDB database with initial data
 * Run with: node scripts/seed-external-mongodb.cjs
 * 
 * This script connects to the configured MongoDB (using environment variables)
 * and populates it with the same sample data used in the in-memory fallback.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const path = require('path');

// Get MongoDB connection details from environment variables with fallbacks
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animeverse';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'animeverse';

// Hardcoded data for seeding
const genreData = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 3, name: 'Comedy' },
  { id: 4, name: 'Drama' },
  { id: 5, name: 'Fantasy' },
  { id: 6, name: 'Horror' },
  { id: 7, name: 'Mecha' },
  { id: 8, name: 'Romance' },
  { id: 9, name: 'School' },
  { id: 10, name: 'Sci-Fi' },
  { id: 11, name: 'Slice of Life' },
  { id: 12, name: 'Sports' },
  { id: 13, name: 'Supernatural' },
  { id: 14, name: 'Mystery' },
  { id: 15, name: 'Psychological' }
];

const animeData = [
  {
    id: 1,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    description: 'It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself. Though devastated by this grim reality, Tanjiro resolves to become a "demon slayer" so that he can turn his sister back into a human, and kill the demon that massacred his family.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    releaseYear: 2019,
    status: 'Completed',
    type: 'TV',
    episodeCount: 26,
    rating: '8.53',
    studio: 'ufotable',
    genres: ['Action', 'Fantasy', 'Supernatural']
  },
  {
    id: 2,
    title: 'Attack on Titan',
    description: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called titans, forcing humans to hide in fear behind enormous concentric walls. What makes these giants truly terrifying is that their taste for human flesh is not born out of hunger but what appears to be out of pleasure. To ensure their survival, the remnants of humanity began living within defensive barriers, resulting in one hundred years without a single titan encounter. However, that fragile calm is soon shattered when a colossal titan manages to breach the supposedly impregnable outer wall, reigniting the fight for survival against the man-eating abominations.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg',
    releaseYear: 2013,
    status: 'Completed',
    type: 'TV',
    episodeCount: 25,
    rating: '8.50',
    studio: 'Wit Studio',
    genres: ['Action', 'Drama', 'Fantasy']
  },
  {
    id: 3,
    title: 'My Hero Academia',
    description: 'What would the world be like if 80 percent of the population manifested superpowers called "Quirks"? Heroes and villains would be battling it out everywhere! Being a hero would mean learning to use your power, but where would you go to study? The Hero Academy of course! But what would you do if you were one of the 20 percent who were born Quirkless?',
    coverImage: 'https://cdn.myanimelist.net/images/anime/10/78745.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg',
    releaseYear: 2016,
    status: 'Ongoing',
    type: 'TV',
    episodeCount: 113,
    rating: '7.92',
    studio: 'Bones',
    genres: ['Action', 'Comedy', 'School', 'Supernatural']
  },
  {
    id: 4,
    title: 'Fullmetal Alchemist: Brotherhood',
    description: 'After a horrific alchemy experiment goes wrong in the Elric household, brothers Edward and Alphonse are left in a catastrophic new reality. Ignoring the alchemical principle banning human transmutation, the boys attempted to bring their recently deceased mother back to life. Instead, they suffered brutal personal loss: Alphonse\'s body disintegrated while Edward lost a leg and then sacrificed an arm to keep Alphonse\'s soul in the physical realm by binding it to a hulking suit of armor.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
    releaseYear: 2009,
    status: 'Completed',
    type: 'TV',
    episodeCount: 64,
    rating: '9.11',
    studio: 'Bones',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy']
  },
  {
    id: 5,
    title: 'One Piece',
    description: 'Gol D. Roger was known as the "Pirate King," the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world. His last words before his death revealed the existence of the greatest treasure in the world, One Piece. It was this revelation that brought about the Grand Age of Pirates, men who dreamed of finding One Piece—which promises an unlimited amount of riches and fame—and quite possibly the pinnacle of glory and the title of the Pirate King.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    releaseYear: 1999,
    status: 'Ongoing',
    type: 'TV',
    episodeCount: 1000,
    rating: '8.67',
    studio: 'Toei Animation',
    genres: ['Action', 'Adventure', 'Comedy', 'Fantasy']
  },
  {
    id: 6,
    title: 'Jujutsu Kaisen',
    description: 'Idly indulging in baseless paranormal activities with the Occult Club, high schooler Yuuji Itadori spends his days at either the clubroom or the hospital, where he visits his bedridden grandfather. However, this leisurely lifestyle soon takes a turn for the strange when he unknowingly encounters a cursed item. Triggering a chain of supernatural occurrences, Yuuji finds himself suddenly thrust into the world of Curses—dreadful beings formed from human malice and negativity—after swallowing the said item, revealed to be a finger belonging to the demon Sukuna Ryoumen, the "King of Curses."',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
    releaseYear: 2020,
    status: 'Ongoing',
    type: 'TV',
    episodeCount: 24,
    rating: '8.64',
    studio: 'MAPPA',
    genres: ['Action', 'Fantasy', 'Supernatural']
  },
  {
    id: 7,
    title: 'Chainsaw Man',
    description: 'Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts. Using his pet devil Pochita as a weapon, he is ready to do anything for a bit of cash.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',
    releaseYear: 2022,
    status: 'Completed',
    type: 'TV',
    episodeCount: 12,
    rating: '8.59',
    studio: 'MAPPA',
    genres: ['Action', 'Adventure', 'Supernatural']
  },
  {
    id: 8,
    title: 'Spy x Family',
    description: 'For the agent known as "Twilight," no order is too high if it is for the sake of peace. Operating as Westalis\' master spy, Twilight works tirelessly to prevent extremists from sparking a war with neighboring country Ostania. For his latest mission, he must investigate Ostanian politician Donovan Desmond by infiltrating his son\'s school: the prestigious Eden Academy. Thus, the agent faces the most difficult task of his career: get married, have a child, and play family.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1441/122795l.jpg',
    releaseYear: 2022,
    status: 'Ongoing',
    type: 'TV',
    episodeCount: 25,
    rating: '8.60',
    studio: 'Wit Studio',
    genres: ['Action', 'Comedy', 'Slice of Life']
  },
  {
    id: 9,
    title: 'Bocchi the Rock!',
    description: 'Hitori Gotou is a high school girl who\'s starting to learn to play the guitar because she dreams of being in a band, but she\'s so shy that she hasn\'t made a single friend. However, her dream might come true after she meets Nijika Ijichi, a girl who plays drums and is looking for a new guitarist for her band.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1448/127956.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1448/127956l.jpg',
    releaseYear: 2022,
    status: 'Completed',
    type: 'TV',
    episodeCount: 12,
    rating: '8.74',
    studio: 'CloverWorks',
    genres: ['Comedy', 'Slice of Life']
  },
  {
    id: 10,
    title: 'Blue Lock',
    description: 'After reflecting on the current state of Japanese soccer, the Japanese Football Association decides to hire the enigmatic and eccentric coach Jinpachi Ego to achieve their dream of winning the World Cup. Believing that Japan has lacked an egoistic striker hungry for goals, Jinpachi initiates the Blue Lock project, where 300 talented strikers from high schools all over Japan are isolated and pitted against each other. The sole survivor will earn the right to become the national team\'s striker, and those who are defeated will be permanently banned from joining.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1476/128322.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1476/128322l.jpg',
    releaseYear: 2022,
    status: 'Ongoing',
    type: 'TV',
    episodeCount: 24,
    rating: '8.30',
    studio: '8bit',
    genres: ['Sports', 'Drama']
  },
  {
    id: 11,
    title: 'Hunter x Hunter',
    description: 'Abundant riches, hidden treasures, fearsome monsters, and exotic creatures are scattered around the world... Gon departs on a journey to become a Pro Hunter who risks his life in search of the unknown. Along the way, he meets other applicants for the Hunter exam: Kurapika, Leorio, and Killua. Can Gon pass the rigorous challenges of the Hunter exam and become the best Hunter in the world!? His wild and epic journey is about to begin!!',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1337/111381.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1337/111381l.jpg',
    releaseYear: 2011,
    status: 'Completed',
    type: 'TV',
    episodeCount: 148,
    rating: '9.04',
    studio: 'Madhouse',
    genres: ['Action', 'Adventure', 'Fantasy']
  },
  {
    id: 12,
    title: 'Vinland Saga',
    description: 'Young Thorfinn grew up listening to the stories of old sailors that had traveled the ocean and reached the place of legend, Vinland. It\'s said to be warm and fertile, a place where there would be no need for fighting—not at all like the frozen village in Iceland where he was born, and certainly not like his current life as a mercenary. War is his home now. Though his father once told him, "You have no enemies, nobody does. There is nobody who it\'s okay to hurt," as he grew, Thorfinn knew that nothing was further from the truth.',
    coverImage: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg',
    bannerImage: 'https://cdn.myanimelist.net/images/anime/1500/103005l.jpg',
    releaseYear: 2019,
    status: 'Completed',
    type: 'TV',
    episodeCount: 24,
    rating: '8.72',
    studio: 'Wit Studio',
    genres: ['Action', 'Adventure', 'Drama']
  }
];

const episodeData = [
  {
    id: 1,
    animeId: 1,
    title: 'Cruelty',
    number: 1,
    description: 'Tanjiro Kamado is a kindhearted boy who sells charcoal for a living. One day, he comes home to find his entire family slaughtered by a demon, with only his sister Nezuko still alive — but she has been transformed into a demon herself.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1286/99889t.jpg',
    videoUrl: 'https://example.com/videos/demon-slayer/ep1.mp4',
    duration: '23:39',
    releaseDate: '2019-04-06'
  },
  {
    id: 2,
    animeId: 1,
    title: 'Trainer of the Final Selection',
    number: 2,
    description: 'Tanjiro meets Urokodaki, who explains what happened to Nezuko and how to cure her. To save his sister, Tanjiro must become a Demon Slayer.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1286/99889t.jpg',
    videoUrl: 'https://example.com/videos/demon-slayer/ep2.mp4',
    duration: '23:39',
    releaseDate: '2019-04-13'
  },
  {
    id: 3,
    animeId: 1,
    title: 'Sabito and Makomo',
    number: 3,
    description: 'Tanjiro continues his training with Urokodaki, pushing himself beyond human limits to become stronger and avenge his family.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1286/99889t.jpg',
    videoUrl: 'https://example.com/videos/demon-slayer/ep3.mp4',
    duration: '23:39',
    releaseDate: '2019-04-20'
  },
  {
    id: 4,
    animeId: 1,
    title: 'Final Selection',
    number: 4,
    description: 'Tanjiro enters the Final Selection, a dangerous test where aspiring Demon Slayers must survive for seven days on a mountain infested with demons.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1286/99889t.jpg',
    videoUrl: 'https://example.com/videos/demon-slayer/ep4.mp4',
    duration: '23:39',
    releaseDate: '2019-04-27'
  },
  {
    id: 5,
    animeId: 2,
    title: 'To You, 2000 Years From Now',
    number: 1,
    description: 'After a hundred years of peace, humanity is suddenly reminded of the terror of being at the Titans\' mercy.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/10/47347t.jpg',
    videoUrl: 'https://example.com/videos/attack-on-titan/ep1.mp4',
    duration: '24:14',
    releaseDate: '2013-04-07'
  },
  {
    id: 6,
    animeId: 2,
    title: 'That Day: The Fall of Shiganshina',
    number: 2,
    description: 'After the Titans break through the wall, the citizens of Shiganshina must evacuate. But young Eren Yeager is determined to find his mother first.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/10/47347t.jpg',
    videoUrl: 'https://example.com/videos/attack-on-titan/ep2.mp4',
    duration: '24:14',
    releaseDate: '2013-04-14'
  },
  {
    id: 7,
    animeId: 2,
    title: 'A Dim Light Amid Despair',
    number: 3,
    description: 'Eren begins his training with the Cadet Corps, but questions about his past arise when he is confronted by a mysterious Titan.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/10/47347t.jpg',
    videoUrl: 'https://example.com/videos/attack-on-titan/ep3.mp4',
    duration: '24:14',
    releaseDate: '2013-04-21'
  },
  {
    id: 8,
    animeId: 3,
    title: 'Izuku Midoriya: Origin',
    number: 1,
    description: 'In a world where people with superpowers known as "Quirks" are the norm, Izuku Midoriya has dreams of one day becoming a Hero, despite being bullied for being "Quirkless".',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/10/78745t.jpg',
    videoUrl: 'https://example.com/videos/my-hero-academia/ep1.mp4',
    duration: '23:50',
    releaseDate: '2016-04-03'
  },
  {
    id: 9,
    animeId: 3,
    title: 'What It Takes to Be a Hero',
    number: 2,
    description: 'Izuku meets his idol, All Might, and asks if he can become a Hero even without a Quirk. All Might tells him the hard truth.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/10/78745t.jpg',
    videoUrl: 'https://example.com/videos/my-hero-academia/ep2.mp4',
    duration: '23:50',
    releaseDate: '2016-04-10'
  },
  {
    id: 10,
    animeId: 7,
    title: 'Dog & Chainsaw',
    number: 1,
    description: 'Denji dreams of living a normal life with a pretty girl by his side. Unfortunately, he is stuck working as a demon hunter for the yakuza to pay off his deceased father\'s debt.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1806/126216t.jpg',
    videoUrl: 'https://example.com/videos/chainsaw-man/ep1.mp4',
    duration: '24:12',
    releaseDate: '2022-10-11'
  },
  {
    id: 11,
    animeId: 7,
    title: 'Arrival in Tokyo',
    number: 2,
    description: 'Denji gets recruited by the Public Safety Division and moves to Tokyo, where he meets his new boss, Makima, and his new partner, Power.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1806/126216t.jpg',
    videoUrl: 'https://example.com/videos/chainsaw-man/ep2.mp4',
    duration: '24:12',
    releaseDate: '2022-10-18'
  },
  {
    id: 12,
    animeId: 7,
    title: 'The Final Battle',
    number: 12,
    description: 'Denji faces his strongest opponent yet in a climactic battle that will decide the fate of humanity.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1806/126216t.jpg',
    videoUrl: 'https://example.com/videos/chainsaw-man/ep12.mp4',
    duration: '24:12',
    releaseDate: '2022-12-27'
  },
  {
    id: 13,
    animeId: 8,
    title: 'Operation Strix',
    number: 1,
    description: 'Agent Twilight is assigned to Operation Strix, a mission that requires him to form a family in order to get close to his target.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1441/122795t.jpg',
    videoUrl: 'https://example.com/videos/spy-x-family/ep1.mp4',
    duration: '24:00',
    releaseDate: '2022-04-09'
  },
  {
    id: 14,
    animeId: 8,
    title: 'Secure a Wife',
    number: 2,
    description: 'Twilight, now using the alias Loid Forger, needs to find a wife to complete his fake family. He meets Yor Briar, who has her own reasons for needing a fake husband.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1441/122795t.jpg',
    videoUrl: 'https://example.com/videos/spy-x-family/ep2.mp4',
    duration: '24:00',
    releaseDate: '2022-04-16'
  },
  {
    id: 15,
    animeId: 8,
    title: 'Mission Complete',
    number: 25,
    description: 'The final mission puts the entire Forger family to the test as they must work together, whether they realize it or not.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1441/122795t.jpg',
    videoUrl: 'https://example.com/videos/spy-x-family/ep25.mp4',
    duration: '24:00',
    releaseDate: '2022-12-24'
  },
  {
    id: 16,
    animeId: 9,
    title: 'Bocchi the Rock!',
    number: 1,
    description: 'Hitori Gotou is a lonely high school girl who dreams of becoming a guitarist in a band. She practices endlessly but is too shy to actually play with anyone.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1448/127956t.jpg',
    videoUrl: 'https://example.com/videos/bocchi-the-rock/ep1.mp4',
    duration: '23:40',
    releaseDate: '2022-10-08'
  },
  {
    id: 17,
    animeId: 9,
    title: 'Live Performance',
    number: 8,
    description: 'After practicing together, the band prepares for their first live performance. Bocchi must overcome her stage fright to play in front of an audience.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1448/127956t.jpg',
    videoUrl: 'https://example.com/videos/bocchi-the-rock/ep8.mp4',
    duration: '23:40',
    releaseDate: '2022-11-26'
  },
  {
    id: 18,
    animeId: 10,
    title: 'Dream',
    number: 1,
    description: 'Following Japan\'s disastrous defeat at the 2018 World Cup, the Japanese Football Association decides to take drastic measures. They hire enigmatic coach Jinpachi Ego to initiate the Blue Lock project.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1476/128322t.jpg',
    videoUrl: 'https://example.com/videos/blue-lock/ep1.mp4',
    duration: '24:00',
    releaseDate: '2022-10-08'
  },
  {
    id: 19,
    animeId: 10,
    title: 'The Perfect Striker',
    number: 15,
    description: 'As the candidates face increasingly difficult challenges, they must confront their own weaknesses and strengths to become the ultimate striker.',
    thumbnail: 'https://cdn.myanimelist.net/images/anime/1476/128322t.jpg',
    videoUrl: 'https://example.com/videos/blue-lock/ep15.mp4',
    duration: '24:00',
    releaseDate: '2023-01-14'
  }
];

// Schema definitions (simplified versions of the actual models)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

const animeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  bannerImage: { type: String },
  releaseYear: { type: Number, required: true },
  status: { type: String, required: true },
  type: { type: String, required: true },
  episodes: { type: Number },
  rating: { type: String },
  studio: { type: String }
}, { timestamps: true });

const episodeSchema = new mongoose.Schema({
  animeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Anime', 
    required: true 
  },
  title: { type: String, required: true },
  number: { type: Number, required: true },
  description: { type: String },
  thumbnail: { type: String },
  videoUrl: { type: String, required: true },
  duration: { type: String },
  releaseDate: { type: Date, default: Date.now }
}, { timestamps: true });

const animeGenreSchema = new mongoose.Schema({
  animeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Anime', 
    required: true 
  },
  genreId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Genre', 
    required: true 
  }
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Genre = mongoose.model('Genre', genreSchema);
const Anime = mongoose.model('Anime', animeSchema);
const Episode = mongoose.model('Episode', episodeSchema);
const AnimeGenre = mongoose.model('AnimeGenre', animeGenreSchema);

/**
 * Connect to MongoDB using environment variables
 */
async function connectToMongoDB() {
  try {
    // Build connection URI with credentials if provided
    let connectionUri = MONGODB_URI;
    if (MONGODB_USER && MONGODB_PASSWORD && !MONGODB_URI.includes('@')) {
      // Extract protocol and host
      const uriParts = MONGODB_URI.split('//');
      if (uriParts.length > 1) {
        connectionUri = `${uriParts[0]}//${MONGODB_USER}:${encodeURIComponent(MONGODB_PASSWORD)}@${uriParts[1]}`;
        console.log('Using MongoDB with provided credentials');
      }
    }
    
    // Ensure the database name is included in URI
    if (!connectionUri.includes('/')) {
      connectionUri = `${connectionUri}/${MONGODB_DB_NAME}`;
    }
    
    // Display masked URI for security
    const displayUri = connectionUri.replace(/\/\/.*@/, '//****:****@');
    console.log(`Connecting to MongoDB at ${displayUri}`);
    
    // Connect with appropriate options
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    
    console.log('Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
}

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log('Seeding database with initial data...');
  
  try {
    // Check if database is empty
    const genreCount = await Genre.countDocuments();
    const animeCount = await Anime.countDocuments();
    
    if (genreCount > 0 || animeCount > 0) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const response = await new Promise(resolve => {
        rl.question('Database already contains data. Clear all existing data and reseed? (y/n): ', answer => {
          rl.close();
          resolve(answer.toLowerCase());
        });
      });
      
      if (response !== 'y') {
        console.log('Seeding cancelled. Exiting...');
        return false;
      }
      
      // Clear existing data
      console.log('Clearing existing data...');
      await AnimeGenre.deleteMany({});
      await Episode.deleteMany({});
      await Anime.deleteMany({});
      await Genre.deleteMany({});
      console.log('Existing data cleared');
    }
    
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        isAdmin: true
      });
      await admin.save();
      console.log('Admin user created');
    }
    
    // Seed genres
    const genreMap = new Map(); // To store id mappings
    for (const genreItem of genreData) {
      const genre = new Genre({
        name: genreItem.name
      });
      const savedGenre = await genre.save();
      genreMap.set(genreItem.id, savedGenre._id);
      console.log(`Created genre: ${genreItem.name}`);
    }
    
    // Seed animes
    const animeMap = new Map(); // To store id mappings
    for (const animeItem of animeData) {
      const anime = new Anime({
        title: animeItem.title,
        description: animeItem.description,
        coverImage: animeItem.coverImage,
        bannerImage: animeItem.bannerImage,
        releaseYear: animeItem.releaseYear,
        status: animeItem.status,
        type: animeItem.type,
        episodes: animeItem.episodeCount,
        rating: animeItem.rating,
        studio: animeItem.studio
      });
      const savedAnime = await anime.save();
      animeMap.set(animeItem.id, savedAnime._id);
      console.log(`Created anime: ${animeItem.title}`);
      
      // Create genre relationships
      for (const genreName of animeItem.genres) {
        // Find the genre id from our initial data
        const genreItem = genreData.find(g => g.name === genreName);
        if (genreItem && genreMap.has(genreItem.id)) {
          const animeGenre = new AnimeGenre({
            animeId: savedAnime._id,
            genreId: genreMap.get(genreItem.id)
          });
          await animeGenre.save();
        }
      }
    }
    
    // Seed episodes
    for (const episodeItem of episodeData) {
      if (animeMap.has(episodeItem.animeId)) {
        const episode = new Episode({
          animeId: animeMap.get(episodeItem.animeId),
          title: episodeItem.title,
          number: episodeItem.number,
          description: episodeItem.description,
          thumbnail: episodeItem.thumbnail,
          videoUrl: episodeItem.videoUrl,
          duration: episodeItem.duration,
          releaseDate: new Date(episodeItem.releaseDate)
        });
        await episode.save();
        console.log(`Created episode ${episodeItem.number}: ${episodeItem.title}`);
      }
    }
    
    console.log('Database seeding completed successfully');
    return true;
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    if (error.stack) console.error(error.stack);
    return false;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }
    
    // Seed the database
    const seeded = await seedDatabase();
    if (!seeded) {
      console.log('Database seeding failed or was cancelled.');
    } else {
      console.log('Database has been successfully seeded with initial data!');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.stack) console.error(error.stack);
  } finally {
    // Disconnect from MongoDB
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    
    process.exit(0);
  }
}

// Run the script
main();