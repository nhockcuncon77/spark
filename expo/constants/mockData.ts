export const HOBBIES = [
  { id: "1", label: "Hiking", icon: "🏔️" },
  { id: "2", label: "Photography", icon: "📸" },
  { id: "3", label: "Cooking", icon: "🍳" },
  { id: "4", label: "Gaming", icon: "🎮" },
  { id: "5", label: "Reading", icon: "📚" },
  { id: "6", label: "Travel", icon: "✈️" },
  { id: "7", label: "Music", icon: "🎵" },
  { id: "8", label: "Art", icon: "🎨" },
  { id: "9", label: "Yoga", icon: "🧘" },
  { id: "10", label: "Tech", icon: "💻" },
  { id: "11", label: "Fitness", icon: "💪" },
  { id: "12", label: "Movies", icon: "🎬" },
  { id: "13", label: "Coffee", icon: "☕" },
  { id: "14", label: "Dancing", icon: "💃" },
  { id: "15", label: "Pets", icon: "🐕" },
  { id: "16", label: "Gardening", icon: "🌱" },
  { id: "17", label: "Writing", icon: "✍️" },
  { id: "18", label: "Meditation", icon: "🧘‍♀️" },
  { id: "19", label: "Board Games", icon: "🎲" },
  { id: "20", label: "Crafts", icon: "🧶" },
];

export const PERSONALITY_TRAITS = [
  { id: "1", label: "Introvert", color: "default" },
  { id: "2", label: "Extrovert", color: "default" },
  { id: "3", label: "Creative", color: "primary" },
  { id: "4", label: "Analytical", color: "primary" },
  { id: "5", label: "Adventurous", color: "accent" },
  { id: "6", label: "Chill", color: "success" },
  { id: "7", label: "Ambitious", color: "danger" },
  { id: "8", label: "Empathetic", color: "primary" },
  { id: "9", label: "Spontaneous", color: "accent" },
  { id: "10", label: "Organized", color: "default" },
  { id: "11", label: "Curious", color: "ai" },
  { id: "12", label: "Loyal", color: "success" },
];

export const MOCK_USERS = [
  {
    id: "u1",
    firstName: "Alex",
    age: 26,
    bio: "I love getting lost in new cities and finding the best local coffee spots. Looking for someone who enjoys quiet weekends as much as spontaneous trips.",
    hobbies: ["Photography", "Travel", "Reading", "Coffee"],
    traits: ["Creative", "Introvert", "Chill"],
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ],
    isRevealed: false,
    isVerified: true,
    matchScore: 85,
    distance: "2 miles away",
    area: "Mission District, SF",
    languages: ["English", "Spanish"],
    zodiac: "Pisces",
    lastActive: "Online now",
    prompts: [
      {
        question: "My ideal Sunday looks like...",
        answer:
          "Farmer's market in the morning, coffee and a good book in the afternoon, homemade dinner with friends at night.",
      },
      {
        question: "A life goal of mine is...",
        answer:
          "To visit every continent and document the journey through photography.",
      },
    ],
  },
  {
    id: "u2",
    firstName: "Jordan",
    age: 29,
    bio: "Tech enthusiast by day, gamer by night. I'm really into sci-fi novels and building mechanical keyboards. Let's debate whether tabs or spaces are better.",
    hobbies: ["Gaming", "Tech", "Music", "Reading"],
    traits: ["Analytical", "Introvert", "Ambitious"],
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    ],
    isRevealed: true,
    isVerified: true,
    matchScore: 92,
    distance: "5 miles away",
    area: "SOMA, SF",
    languages: ["English", "Japanese"],
    zodiac: "Virgo",
    lastActive: "2h ago",
    prompts: [
      {
        question: "The key to my heart is...",
        answer:
          "Good coffee, interesting conversations about technology, and a willingness to try new games with me.",
      },
      {
        question: "I geek out on...",
        answer:
          "Custom mechanical keyboards. I can talk about switch types and keycap profiles for hours.",
      },
    ],
  },
  {
    id: "u3",
    firstName: "Taylor",
    age: 24,
    bio: "Always chasing the next mountain peak. If I'm not hiking, I'm probably painting or trying a new recipe. Life's too short for boring food!",
    hobbies: ["Hiking", "Art", "Cooking", "Yoga"],
    traits: ["Adventurous", "Extrovert", "Creative"],
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80",
    ],
    isRevealed: false,
    isVerified: false,
    matchScore: 78,
    distance: "12 miles away",
    area: "Marin County",
    languages: ["English", "French"],
    zodiac: "Sagittarius",
    lastActive: "1d ago",
    prompts: [
      {
        question: "My simple pleasures are...",
        answer:
          "Sunrise hikes, the smell of oil paints, and that first bite of a perfectly cooked pasta.",
      },
      {
        question: "I'm looking for someone who...",
        answer:
          "Can keep up on a trail but also enjoys lazy days making art together.",
      },
    ],
  },
  {
    id: "u4",
    firstName: "Morgan",
    age: 27,
    bio: "Coffee connoisseur and amateur chef. I believe every meal should be an adventure. Currently perfecting my homemade pasta recipe.",
    hobbies: ["Cooking", "Coffee", "Travel", "Photography"],
    traits: ["Chill", "Creative", "Curious"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80",
    ],
    isRevealed: false,
    isVerified: true,
    matchScore: 88,
    distance: "3 miles away",
    area: "Hayes Valley, SF",
    languages: ["English", "Italian"],
    zodiac: "Taurus",
    lastActive: "5h ago",
    prompts: [
      {
        question: "The way to my heart is...",
        answer:
          "A perfectly pulled espresso and genuine curiosity about the world.",
      },
      {
        question: "I'm convinced that...",
        answer:
          "Food is the universal language. Let me cook for you and you'll understand.",
      },
    ],
  },
  {
    id: "u5",
    firstName: "Riley",
    age: 25,
    bio: "Bookworm who occasionally touches grass. I've read over 100 books this year (yes, I keep count). Always down for a deep conversation about anything.",
    hobbies: ["Reading", "Writing", "Coffee", "Yoga"],
    traits: ["Introvert", "Empathetic", "Curious"],
    photos: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80",
    ],
    isRevealed: false,
    isVerified: true,
    matchScore: 91,
    distance: "1 mile away",
    area: "Noe Valley, SF",
    languages: ["English", "Korean", "Spanish"],
    zodiac: "Cancer",
    lastActive: "Online now",
    prompts: [
      {
        question: "My go-to comfort activity is...",
        answer:
          "Curling up with a great book, a cup of tea, and rain sounds in the background.",
      },
      {
        question: "I'll know it's love when...",
        answer:
          "We can sit in comfortable silence, each reading our own books, occasionally sharing passages.",
      },
    ],
  },
  {
    id: "u6",
    firstName: "Casey",
    age: 28,
    bio: "Fitness enthusiast and dog parent. My golden retriever Max is the real star here. Looking for someone who doesn't mind getting up early for hikes.",
    hobbies: ["Fitness", "Hiking", "Pets", "Cooking"],
    traits: ["Adventurous", "Extrovert", "Loyal"],
    photos: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80",
    ],
    isRevealed: false,
    isVerified: true,
    matchScore: 82,
    distance: "7 miles away",
    area: "Pacific Heights, SF",
    languages: ["English"],
    zodiac: "Aries",
    lastActive: "30m ago",
    prompts: [
      {
        question: "My greatest strength is...",
        answer:
          "Loyalty. Once you're my person, I'll show up for you no matter what.",
      },
      {
        question: "Together, we could...",
        answer:
          "Train for a half marathon, explore new trails with Max, and cook healthy meals together.",
      },
    ],
  },
  {
    id: "u7",
    firstName: "Sam",
    age: 31,
    bio: "Artist and dreamer. I spend my weekends at art galleries or creating my own pieces. Looking for someone who appreciates creativity in all forms.",
    hobbies: ["Art", "Music", "Photography", "Travel"],
    traits: ["Creative", "Spontaneous", "Empathetic"],
    photos: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80",
    ],
    isRevealed: false,
    isVerified: false,
    matchScore: 76,
    distance: "4 miles away",
    area: "Dogpatch, SF",
    languages: ["English", "Portuguese"],
    zodiac: "Aquarius",
    lastActive: "3h ago",
    prompts: [
      {
        question: "I'm most passionate about...",
        answer:
          "Creating art that makes people feel something. Whether it's joy, curiosity, or even discomfort.",
      },
      {
        question: "My love language is...",
        answer:
          "Quality time. Let's get lost in a museum together and talk about what moves us.",
      },
    ],
  },
  {
    id: "u8",
    firstName: "Avery",
    age: 26,
    bio: "Software engineer who doesn't want to talk about code on dates. Let's talk about our favorite movies, travel dreams, or why pineapple absolutely belongs on pizza.",
    hobbies: ["Tech", "Movies", "Gaming", "Travel"],
    traits: ["Analytical", "Chill", "Curious"],
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80",
    ],
    isRevealed: false,
    isVerified: true,
    matchScore: 89,
    distance: "6 miles away",
    area: "South Beach, SF",
    languages: ["English", "Mandarin"],
    zodiac: "Gemini",
    lastActive: "1h ago",
    prompts: [
      {
        question: "Unpopular opinion I'll defend...",
        answer:
          "Pineapple on pizza is actually good. The sweet and savory combo is chef's kiss.",
      },
      {
        question: "Best travel story...",
        answer:
          "Got lost in Tokyo at 2am, ended up at the best ramen shop I've ever been to. No regrets.",
      },
    ],
  },
];

export const MOCK_CHATS = [
  {
    id: "c1",
    matchId: "m1",
    userId: "u2", // Jordan
    lastMessage: "That sounds awesome! Have you ever built one from scratch?",
    unreadCount: 2,
    updatedAt: "10:30 AM",
    messagesCount: 15,
    messagesRequired: 20,
    canUnlock: false,
    messages: [
      {
        id: "m1",
        text: "Hey! I saw you're into mechanical keyboards too.",
        senderId: "me",
        timestamp: "10:00 AM",
        isAiSuggested: false,
      },
      {
        id: "m2",
        text: "Yeah! I just finished my first build. It's a 65% layout with Gateron switches.",
        senderId: "u2",
        timestamp: "10:05 AM",
        isAiSuggested: false,
      },
      {
        id: "m3",
        text: "That sounds awesome! Have you ever built one from scratch?",
        senderId: "me",
        timestamp: "10:30 AM",
        isAiSuggested: true, // This was an AI suggestion
      },
    ],
  },
  {
    id: "c2",
    matchId: "m2",
    userId: "u1", // Alex
    lastMessage: "I'd love to see your photography sometime.",
    unreadCount: 0,
    updatedAt: "Yesterday",
    messagesCount: 8,
    messagesRequired: 20,
    canUnlock: false,
    messages: [
      {
        id: "m1",
        text: "Hi Alex, your bio really resonated with me.",
        senderId: "me",
        timestamp: "Yesterday",
        isAiSuggested: false,
      },
      {
        id: "m2",
        text: "Thank you! I noticed you're into photography too?",
        senderId: "u1",
        timestamp: "Yesterday",
        isAiSuggested: false,
      },
      {
        id: "m3",
        text: "I'd love to see your photography sometime.",
        senderId: "me",
        timestamp: "Yesterday",
        isAiSuggested: false,
      },
    ],
  },
  {
    id: "c3",
    matchId: "m3",
    userId: "u5", // Riley
    lastMessage: "What's your favorite book this year?",
    unreadCount: 1,
    updatedAt: "2h ago",
    messagesCount: 22,
    messagesRequired: 20,
    canUnlock: true,
    messages: [
      {
        id: "m1",
        text: "A fellow bookworm! What genres do you usually read?",
        senderId: "me",
        timestamp: "3h ago",
        isAiSuggested: false,
      },
      {
        id: "m2",
        text: "Mostly literary fiction and some sci-fi. I just finished Project Hail Mary and loved it!",
        senderId: "u5",
        timestamp: "2h ago",
        isAiSuggested: false,
      },
      {
        id: "m3",
        text: "What's your favorite book this year?",
        senderId: "u5",
        timestamp: "2h ago",
        isAiSuggested: false,
      },
    ],
  },
];

export const MOCK_MATCHES = [
  {
    id: "m1",
    profileId: "u2",
    messagesCount: 15,
    messagesRequired: 20,
    isUnlockRequested: false,
    isUnlocked: false,
    rating: null,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "m2",
    profileId: "u1",
    messagesCount: 8,
    messagesRequired: 20,
    isUnlockRequested: false,
    isUnlocked: false,
    rating: null,
    createdAt: "2024-01-14T15:30:00Z",
  },
  {
    id: "m3",
    profileId: "u5",
    messagesCount: 22,
    messagesRequired: 20,
    isUnlockRequested: true,
    isUnlocked: false,
    rating: null,
    createdAt: "2024-01-13T09:15:00Z",
  },
];

// MOCK_POSTS removed - using real API data from useCommunityStore


export const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    question: "I enjoy social gatherings with large groups of people.",
    trait: "Extroversion",
  },
  {
    id: 2,
    question:
      "I prefer planning everything in detail rather than being spontaneous.",
    trait: "Organization",
  },
  {
    id: 3,
    question:
      "I often get so lost in my thoughts that I ignore or forget my surroundings.",
    trait: "Introspection",
  },
  {
    id: 4,
    question:
      "I find it easy to stay relaxed and focused even when there is some pressure.",
    trait: "Calmness",
  },
  {
    id: 5,
    question: "I often feel deeply moved by art, music, or nature.",
    trait: "Sensitivity",
  },
  {
    id: 6,
    question: "I prefer trying new experiences over sticking to what I know.",
    trait: "Openness",
  },
  {
    id: 7,
    question: "I find it important to understand others' perspectives.",
    trait: "Empathy",
  },
  {
    id: 8,
    question: "I enjoy taking the lead in group situations.",
    trait: "Leadership",
  },
];

export const AI_RIZZ_SUGGESTIONS = [
  "That sounds amazing! Tell me more about it.",
  "I've never tried that, but I'd love to learn.",
  "Haha, that's hilarious! 😂",
  "What's your favorite thing about it?",
  "I can totally relate to that!",
  "That's such a cool perspective. What made you think of that?",
  "I'd love to hear more about your experience with that.",
  "That reminds me of something similar that happened to me...",
  "You seem really passionate about this. I love that energy!",
  "What got you interested in that in the first place?",
];

export const AI_BIO_SUGGESTIONS = [
  "Coffee lover ☕ | Weekend explorer 🌍 | Always looking for the next great book 📚",
  "Tech geek by day, aspiring chef by night. Let's swap recipes and sci-fi recommendations.",
  "Nature enthusiast who loves hiking and photography. Looking for a partner in crime for my next adventure.",
  "Introvert with extrovert energy when I'm comfortable. Let's skip the small talk and have real conversations.",
  "Creative soul who believes in the power of good coffee and great music. What's on your playlist?",
  "Amateur chef, professional food critic (of my own cooking). Looking for someone to share meals and laughs with.",
  "Book nerd, movie buff, and occasional gym-goer. My ideal date involves cozy cafes and deep conversations.",
  "Adventure seeker with a soft spot for lazy Sunday mornings. Balance is key, right?",
];

// Helper function to get user by ID
export const getUserById = (userId: string) =>
  MOCK_USERS.find((u) => u.id === userId);

// Helper function to get chat by ID
export const getChatById = (chatId: string) =>
  MOCK_CHATS.find((c) => c.id === chatId);

// Helper function to get match by ID
export const getMatchById = (matchId: string) =>
  MOCK_MATCHES.find((m) => m.id === matchId);
