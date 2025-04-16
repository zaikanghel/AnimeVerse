import { AnimeData, EpisodeData, GenreData } from "./types";

// Genre data
export const genreData: GenreData[] = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 3, name: "Comedy" },
  { id: 4, name: "Drama" },
  { id: 5, name: "Fantasy" },
  { id: 6, name: "Horror" },
  { id: 7, name: "Mecha" },
  { id: 8, name: "Romance" },
  { id: 9, name: "School" },
  { id: 10, name: "Sci-Fi" },
  { id: 11, name: "Slice of Life" },
  { id: 12, name: "Sports" },
  { id: 13, name: "Supernatural" },
  { id: 14, name: "Mystery" },
  { id: 15, name: "Psychological" }
];

// Anime data
export const animeData: AnimeData[] = [
  {
    id: 1,
    title: "Demon Slayer: Kimetsu no Yaiba",
    description: "Tanjiro sets out to become a demon slayer to avenge his family and cure his sister after they are viciously attacked by demons. His journey takes him through perilous dangers and new allies to defeat the demons threatening humanity.",
    coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2019,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 26,
    rating: "4.9",
    studio: "ufotable",
    genres: ["Action", "Adventure", "Fantasy", "Supernatural"]
  },
  {
    id: 2,
    title: "Attack on Titan",
    description: "Several hundred years ago, humans were nearly exterminated by titans. Titans are typically several stories tall, seem to have no intelligence, devour human beings and, worst of all, seem to do it for the pleasure rather than as a food source. A small percentage of humanity survived by walling themselves in a city protected by extremely high walls.",
    coverImage: "https://images.unsplash.com/photo-1541562232579-512a21360020?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1541562232579-512a21360020?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2013,
    status: "Completed",
    type: "TV Series",
    episodeCount: 87,
    rating: "4.9",
    studio: "Wit Studio, MAPPA",
    genres: ["Action", "Drama", "Fantasy", "Mystery"]
  },
  {
    id: 3,
    title: "My Hero Academia",
    description: "In a world where people with superpowers (known as 'Quirks') are the norm, Izuku Midoriya has dreams of one day becoming a Hero, despite being bullied by his classmates for not having a Quirk. After being the only one to try and save his childhood friend from a villain, Izuku is given a Quirk by the world's greatest Hero, All Might.",
    coverImage: "https://images.unsplash.com/photo-1612174301807-304a2a873648?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1612174301807-304a2a873648?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2016,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 113,
    rating: "4.7",
    studio: "Bones",
    genres: ["Action", "Adventure", "Supernatural", "School"]
  },
  {
    id: 4,
    title: "Fullmetal Alchemist: Brotherhood",
    description: "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes wrong and leaves them in damaged physical forms. Their journey leads them deep into the secrets of their country and the military that controls it.",
    coverImage: "https://images.unsplash.com/photo-1559981421-3e0c0d156f6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1559981421-3e0c0d156f6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2009,
    status: "Completed",
    type: "TV Series",
    episodeCount: 64,
    rating: "4.9",
    studio: "Bones",
    genres: ["Action", "Adventure", "Drama", "Fantasy"]
  },
  {
    id: 5,
    title: "One Piece",
    description: "Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger. The famous mystery treasure named 'One Piece'.",
    coverImage: "https://images.unsplash.com/photo-1560972550-aba3456b81a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1560972550-aba3456b81a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 1999,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 1000,
    rating: "4.8",
    studio: "Toei Animation",
    genres: ["Action", "Adventure", "Comedy", "Fantasy"]
  },
  {
    id: 6,
    title: "Jujutsu Kaisen",
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman school to be able to locate the demon's other body parts and thus exorcise himself.",
    coverImage: "https://images.unsplash.com/photo-1565452344518-47faca79dc69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1565452344518-47faca79dc69?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2020,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 24,
    rating: "4.8",
    studio: "MAPPA",
    genres: ["Action", "Supernatural", "Horror", "School"]
  },
  {
    id: 7,
    title: "Chainsaw Man",
    description: "Denji is robbed of a normal teenage life, left with nothing but his deadbeat father's overwhelming debt. His only companion is his pet, the chainsaw devil Pochita, with whom he slays devils for money that inevitably ends up in the yakuza's pockets.",
    coverImage: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2022,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 12,
    rating: "4.8",
    studio: "MAPPA",
    genres: ["Action", "Supernatural", "Horror", "Comedy"]
  },
  {
    id: 8,
    title: "Spy x Family",
    description: "A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own, and all three must strive to keep their true identities hidden from each other while still forming a loving bond.",
    coverImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2022,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 25,
    rating: "4.9",
    studio: "Wit Studio, CloverWorks",
    genres: ["Action", "Comedy", "Slice of Life"]
  },
  {
    id: 9,
    title: "Bocchi the Rock!",
    description: "Hitori Gotoh, 'Bocchi-chan,' is a lonely high school girl whose heart lies in her guitar. She does nothing every day except strum her guitar by herself at home. However, she happens one day to meet Nijika Ijichi, who is looking for a guitarist for her group.",
    coverImage: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2022,
    status: "Completed",
    type: "TV Series",
    episodeCount: 12,
    rating: "4.7",
    studio: "CloverWorks",
    genres: ["Comedy", "Slice of Life", "School"]
  },
  {
    id: 10,
    title: "Blue Lock",
    description: "After a disastrous defeat at the 2018 World Cup, Japan's team struggles to regroup. But what's missing? An absolute Ace Striker, who can guide them to the win. The Football Association is hell-bent on creating a striker who hungers for goals and thirsts for victory.",
    coverImage: "https://images.unsplash.com/photo-1560461396-de96bd75ef78?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1560461396-de96bd75ef78?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2022,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 24,
    rating: "4.6",
    studio: "8bit",
    genres: ["Sports", "Drama", "School"]
  },
  {
    id: 11,
    title: "Hunter x Hunter",
    description: "Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness. With his friends and his potential, he seeks out his father, who left him when he was younger.",
    coverImage: "https://images.unsplash.com/photo-1559981421-3e0c0d156f6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1559981421-3e0c0d156f6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2011,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 148,
    rating: "5.0",
    studio: "Madhouse",
    genres: ["Action", "Adventure", "Fantasy", "Supernatural"]
  },
  {
    id: 12,
    title: "Vinland Saga",
    description: "Thorfinn pursues a journey with his father's killer in order to take revenge and end his life in a duel as an honorable warrior and pay his father a homage.",
    coverImage: "https://images.unsplash.com/photo-1559981421-3e0c0d156f6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1559981421-3e0c0d156f6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80",
    releaseYear: 2019,
    status: "Ongoing",
    type: "TV Series",
    episodeCount: 24,
    rating: "4.8",
    studio: "Wit Studio",
    genres: ["Action", "Adventure", "Drama", "Historical"]
  }
];

// Episodes data
export const episodeData: EpisodeData[] = [
  // Demon Slayer episodes
  {
    id: 1,
    animeId: 1,
    title: "Cruelty",
    number: 1,
    description: "Tanjiro Kamado is a kind-hearted and intelligent boy who lives with his family in the mountains. One day, after returning home from selling charcoal in town, he discovers that his family has been attacked and slaughtered by demons.",
    thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/demon-slayer-1.mp4",
    duration: "24:00",
    releaseDate: "2023-05-01"
  },
  {
    id: 2,
    animeId: 1,
    title: "Trainer of the Final Selection",
    number: 2,
    description: "Tanjiro meets Urokodaki Sakonji, a retired demon slayer who begins training him to become a demon slayer himself.",
    thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/demon-slayer-2.mp4",
    duration: "24:00",
    releaseDate: "2023-05-08"
  },
  {
    id: 3,
    animeId: 1,
    title: "Sabito and Makomo",
    number: 3,
    description: "During his training to break a boulder, Tanjiro meets two mysterious children who help him prepare for the Final Selection.",
    thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/demon-slayer-3.mp4",
    duration: "24:00",
    releaseDate: "2023-05-15"
  },
  {
    id: 4,
    animeId: 1,
    title: "Final Selection",
    number: 4,
    description: "Tanjiro takes part in the Final Selection, a dangerous test that will determine if he has what it takes to become a Demon Slayer.",
    thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/demon-slayer-4.mp4",
    duration: "24:00",
    releaseDate: "2023-05-22"
  },

  // Attack on Titan episodes
  {
    id: 5,
    animeId: 2,
    title: "To You, 2000 Years From Now",
    number: 1,
    description: "After 100 years of peace, humanity is suddenly reminded of the terror of being at the Titans' mercy.",
    thumbnail: "https://images.unsplash.com/photo-1541562232579-512a21360020?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/attack-on-titan-1.mp4",
    duration: "24:00",
    releaseDate: "2023-06-01"
  },
  {
    id: 6,
    animeId: 2,
    title: "That Day: The Fall of Shiganshina",
    number: 2,
    description: "After the Titans break through the wall, the citizens of Shiganshina must run for their lives.",
    thumbnail: "https://images.unsplash.com/photo-1541562232579-512a21360020?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/attack-on-titan-2.mp4",
    duration: "24:00",
    releaseDate: "2023-06-08"
  },
  {
    id: 7,
    animeId: 2,
    title: "A Dim Light Amid Despair",
    number: 3,
    description: "Eren begins his training with the Cadet Corps, but questions about his mother's death still haunt him.",
    thumbnail: "https://images.unsplash.com/photo-1541562232579-512a21360020?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/attack-on-titan-3.mp4",
    duration: "24:00",
    releaseDate: "2023-06-15"
  },

  // My Hero Academia episodes
  {
    id: 8,
    animeId: 3,
    title: "Izuku Midoriya: Origin",
    number: 1,
    description: "In a world where people with superpowers known as 'Quirks' are the norm, Izuku Midoriya has dreams of one day becoming a Hero, despite being bullied by his classmates for not having a Quirk.",
    thumbnail: "https://images.unsplash.com/photo-1612174301807-304a2a873648?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/my-hero-academia-1.mp4",
    duration: "24:00",
    releaseDate: "2023-07-01"
  },
  {
    id: 9,
    animeId: 3,
    title: "What It Takes to Be a Hero",
    number: 2,
    description: "All Might tells Izuku that he can become a hero. He trains Izuku so he can inherit his Quirk.",
    thumbnail: "https://images.unsplash.com/photo-1612174301807-304a2a873648?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/my-hero-academia-2.mp4",
    duration: "24:00",
    releaseDate: "2023-07-08"
  },

  // Chainsaw Man episodes
  {
    id: 10,
    animeId: 7,
    title: "Dog & Chainsaw",
    number: 1,
    description: "Denji is a young man trapped in poverty, working off his deceased father's debt to the yakuza by working as a Devil Hunter, aided by Pochita, his canine companion.",
    thumbnail: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/chainsaw-man-1.mp4",
    duration: "24:00",
    releaseDate: "2023-04-01"
  },
  {
    id: 11,
    animeId: 7,
    title: "Arrival in Tokyo",
    number: 2,
    description: "Denji adjusts to his new life working for the Public Safety Bureau with Makima, and meets his new coworkers Power and Aki.",
    thumbnail: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/chainsaw-man-2.mp4",
    duration: "24:00",
    releaseDate: "2023-04-08"
  },
  {
    id: 12,
    animeId: 7,
    title: "The Final Battle",
    number: 12,
    description: "Denji faces off against the Gun Devil in an intense final confrontation that will determine the fate of humanity.",
    thumbnail: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/chainsaw-man-12.mp4",
    duration: "24:00",
    releaseDate: "2023-04-15"
  },

  // Spy x Family episodes
  {
    id: 13,
    animeId: 8,
    title: "Operation Strix",
    number: 1,
    description: "Agent Twilight is assigned a new mission that requires him to form a family in order to get close to his target. He adopts a child named Anya without knowing she's a telepath.",
    thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/spy-family-1.mp4",
    duration: "24:00",
    releaseDate: "2023-03-01"
  },
  {
    id: 14,
    animeId: 8,
    title: "Secure a Wife",
    number: 2,
    description: "Twilight, now under the alias of Loid Forger, must find a wife to complete his family for the mission. He encounters Yor Briar, who has secrets of her own.",
    thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/spy-family-2.mp4",
    duration: "24:00",
    releaseDate: "2023-03-08"
  },
  {
    id: 15,
    animeId: 8,
    title: "Mission Complete",
    number: 25,
    description: "The Forger family faces their biggest challenge yet as their separate worlds collide, testing their bonds and their individual missions.",
    thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/spy-family-25.mp4",
    duration: "24:00",
    releaseDate: "2023-03-15"
  },

  // Bocchi the Rock episodes
  {
    id: 16,
    animeId: 9,
    title: "Bocchi the Rock!",
    number: 1,
    description: "Hitori Gotoh, nicknamed 'Bocchi-chan', is a lonely high school girl whose heart lies in her guitar. She dreams of joining a band and making friends.",
    thumbnail: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/bocchi-1.mp4",
    duration: "24:00",
    releaseDate: "2023-02-01"
  },
  {
    id: 17,
    animeId: 9,
    title: "Live Performance",
    number: 8,
    description: "Bocchi and her band prepare for their biggest live performance yet, pushing Bocchi to overcome her social anxiety.",
    thumbnail: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/bocchi-8.mp4",
    duration: "24:00",
    releaseDate: "2023-02-08"
  },

  // Blue Lock episodes
  {
    id: 18,
    animeId: 10,
    title: "Dream",
    number: 1,
    description: "Following Japan's defeat in the 2018 World Cup, the Japanese Football Association decides to create a revolutionary program to create the world's greatest egotist striker.",
    thumbnail: "https://images.unsplash.com/photo-1560461396-de96bd75ef78?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/blue-lock-1.mp4",
    duration: "24:00",
    releaseDate: "2023-01-01"
  },
  {
    id: 19,
    animeId: 10,
    title: "The Perfect Striker",
    number: 15,
    description: "Yoichi Isagi faces his toughest challenges yet as he strives to become the perfect striker and secure his position in the Blue Lock program.",
    thumbnail: "https://images.unsplash.com/photo-1560461396-de96bd75ef78?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450&q=80",
    videoUrl: "https://example.com/videos/blue-lock-15.mp4",
    duration: "24:00",
    releaseDate: "2023-01-08"
  }
];
