const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
    { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "The amateur waits for inspiration. The professional gets to work.", author: "Steven Pressfield" },
    { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Focus is saying no to a hundred good ideas.", author: "Steve Jobs" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
    { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
    { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
    { text: "Shipping beats perfection.", author: "Khan Academy" },
    { text: "Your future self is watching you right now through memories.", author: "Aubrey de Grey" },
    { text: "Make each day your masterpiece.", author: "John Wooden" },
    { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
    { text: "Be so good they can't ignore you.", author: "Steve Martin" },
    { text: "Action expresses priorities.", author: "Mahatma Gandhi" },
    { text: "It's not about having time. It's about making time.", author: "Unknown" },
    { text: "A year from now you will wish you had started today.", author: "Karen Lamb" },
    { text: "Progress, not perfection.", author: "Unknown" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "The code you write makes you a programmer. The code you delete makes you a good one.", author: "Mario Fusco" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "What gets measured gets managed.", author: "Peter Drucker" },
    { text: "Build things that matter.", author: "Unknown" },
];

export function getQuoteOfTheDay() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return quotes[dayOfYear % quotes.length];
}
