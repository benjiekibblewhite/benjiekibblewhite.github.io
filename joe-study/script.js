const quotes = [
    // Hag-Seed - Margaret Atwood
    { text: "You don't have to teach me my enemies. I can spot them for myself.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "These days, everyone is a snitch.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "Revenge is a dish best eaten cold.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "He'll make them feel his greatness, or else his nothingness.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "All it takes is the elimination of one generation.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "When you're excluded from power, the only power you have left is sabotage.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "It's dark as a tomb in there. He should know: it is a tomb.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "The best way to escape from a prison is to become a prisoner.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "When you take away all that a man has, you give him his freedom.", author: "Margaret Atwood", work: "Hag-Seed" },
    { text: "We're doing The Tempest in an actual tempest.", author: "Margaret Atwood", work: "Hag-Seed" },

    // Fun Home - Alison Bechdel
    { text: "I was Spartan to my father's Athenian. Modern to his Victorian.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "He used his skillful artifice not to make things, but to make things appear to be what they were not.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "My father began to seem mortal to me.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "It's imprecise and insufficient, but I don't know how else to say it: I was different.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "Between my parents there was a fundamental difference of style.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "Our home was like an artists' colony. We ate together, but otherwise were absorbed in our separate pursuits.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "In the end, I could not have created this without the distance that my father's death gave me.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "My father could spin garbage...into gold.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "The end of his life is the beginning of mine.", author: "Alison Bechdel", work: "Fun Home" },
    { text: "I employ these artistic conventions to indicate his silence.", author: "Alison Bechdel", work: "Fun Home" },

    // The Trees - Percival Everett
    { text: "The past is never dead. It's not even past.", author: "Percival Everett", work: "The Trees" },
    { text: "You can't drive down that road.", author: "Percival Everett", work: "The Trees" },
    { text: "Emmett Till's body had shown up again.", author: "Percival Everett", work: "The Trees" },
    { text: "Money, Mississippi was a real place.", author: "Percival Everett", work: "The Trees" },
    { text: "Every lynching photograph is a group portrait.", author: "Percival Everett", work: "The Trees" },
    { text: "The names kept coming.", author: "Percival Everett", work: "The Trees" },
    { text: "Find what you're afraid of and run toward it.", author: "Percival Everett", work: "The Trees" },
    { text: "This is America.", author: "Percival Everett", work: "The Trees" },
    { text: "All those names. All those people.", author: "Percival Everett", work: "The Trees" },
    { text: "We're just trying to make sense of the madness.", author: "Percival Everett", work: "The Trees" },

    // Metamorphosis - Kafka
    { text: "As Gregor Samsa awoke one morning from uneasy dreams he found himself transformed in his bed into a gigantic insect.", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "What's happened to me?", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "I cannot make you understand. I cannot make anyone understand what is happening inside me. I cannot even explain it to myself.", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "He felt as if the way to the unknown nourishment he longed for were coming to light.", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "Was he an animal, that music could move him so?", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "I can't go on like this much longer.", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "Did he really want the warm room, so cozily fitted with furniture he had inherited, transformed into a cave?", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "He thought back on his family with deep emotion and love.", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "Now then, said Gregor, fully aware that he was the only one who had kept his composure.", author: "Franz Kafka", work: "Metamorphosis" },
    { text: "The decision that he must disappear was one that he held to even more strongly than his sister.", author: "Franz Kafka", work: "Metamorphosis" }
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createCard(quote) {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
        <div class="card-content">
            <div class="quote-mark">"</div>
            <p class="quote-text">${quote.text}</p>
            <div class="reveal-content">
                <span class="author">${quote.author}</span>
                <span class="work">${quote.work}</span>
            </div>
        </div>
        <div class="hint">Click to reveal • Swipe to discard</div>
    `;

    // Click to reveal
    card.addEventListener('click', (e) => {
        // Don't trigger if we just swiped
        if (card.getAttribute('data-swiped') === 'true') return;

        card.classList.toggle('revealed');
        const hint = card.querySelector('.hint');
        if (card.classList.contains('revealed')) {
            hint.style.opacity = '0';
        } else {
            hint.style.opacity = '1';
        }
    });

    // Swipe Logic
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleStart = (e) => {
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        currentX = startX; // Initialize currentX to startX
        isDragging = true;
        card.style.transition = 'none';
        card.setAttribute('data-swiped', 'false');
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const diffX = currentX - startX;
        const rotation = diffX / 10; // Rotate while dragging

        card.style.transform = `translate(${diffX}px, 0) rotate(${rotation}deg)`;
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        card.style.transition = 'transform 0.3s ease';

        const diffX = currentX - startX;
        const threshold = 100; // Minimum distance to swipe

        if (Math.abs(diffX) > threshold) {
            // Swipe out
            card.setAttribute('data-swiped', 'true');
            const direction = diffX > 0 ? 'fly-out-right' : 'fly-out-left';
            card.classList.add(direction);

            setTimeout(() => {
                card.remove();
                checkEmpty();
            }, 300);
        } else {
            // Snap back
            card.style.transform = 'translate(0, 0) rotate(0deg)';
        }
    };

    // Touch events
    card.addEventListener('touchstart', handleStart);
    card.addEventListener('touchmove', handleMove);
    card.addEventListener('touchend', handleEnd);

    // Mouse events
    card.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    return card;
}

function checkEmpty() {
    const stack = document.getElementById('card-stack');
    if (stack.children.length === 0) {
        const msg = document.createElement('div');
        msg.innerHTML = `
            <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 1rem;">All Done!</h2>
            <button onclick="location.reload()" style="
                padding: 1rem 2rem; 
                background: var(--accent-1); 
                border: none; 
                border-radius: 50px; 
                color: white; 
                font-size: 1.1rem; 
                cursor: pointer;
                font-family: var(--font-main);
            ">Start Over</button>
        `;
        msg.style.textAlign = 'center';
        stack.appendChild(msg);
    }
}

function init() {
    const stack = document.getElementById('card-stack');
    const shuffledQuotes = shuffleArray([...quotes]);

    // Easter Egg: Insert "B ❤️ J" card at random position between 3 and 10
    const easterEggCard = { text: "B ❤️ J", author: "J ❤️ B", work: "" };
    const randomPos = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
    shuffledQuotes.splice(randomPos, 0, easterEggCard);

    shuffledQuotes.forEach((quote, index) => {
        const card = createCard(quote);
        // Stack them with z-index
        card.style.zIndex = index;
        // Add a tiny random rotation for a "messy stack" look
        const randomRot = (Math.random() - 0.5) * 5;
        card.style.transform = `rotate(${randomRot}deg)`;
        stack.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', init);
