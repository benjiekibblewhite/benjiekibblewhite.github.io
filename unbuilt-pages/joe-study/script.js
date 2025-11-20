const quotes = [
    // Beloved - Toni Morrison
    { text: "124 was spiteful. Full of a baby's venom.", author: "Toni Morrison", work: "Beloved" },
    { text: "It's so hard for me to believe in [time]. Some things go. Pass on. Some things just stay.", author: "Toni Morrison", work: "Beloved" },
    { text: "Freeing yourself was one thing, claiming ownership of that freed self was another.", author: "Toni Morrison", work: "Beloved" },
    { text: "Love is or it ain't. Thin love ain't love at all.", author: "Toni Morrison", work: "Beloved" },
    { text: "She is a friend of my mind. She gather me, man. The pieces I am, she gather them and give them back to me in all the right order.", author: "Toni Morrison", work: "Beloved" },
    { text: "You your best thing, Sethe. You are.", author: "Toni Morrison", work: "Beloved" },
    { text: "Definitions belong to the definers, not the defined.", author: "Toni Morrison", work: "Beloved" },
    { text: "A man ain't a goddamn ax. Chopping, hacking, busting every goddamn minute of the day. Things get to him.", author: "Toni Morrison", work: "Beloved" },
    { text: "Unless carefree, mother love was a killer.", author: "Toni Morrison", work: "Beloved" },
    { text: "The dark, dark liver—love it, love it and the beat and beating heart, love that too.", author: "Toni Morrison", work: "Beloved" },

    // Frankenstein - Mary Shelley
    { text: "I was benevolent and good; misery made me a fiend. Make me happy, and I shall again be virtuous.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "Beware; for I am fearless, and therefore powerful.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "Life, although it may only be an accumulation of anguish, is dear to me, and I will defend it.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "Learn from me, if not by my precepts, at least by my example, how dangerous is the acquirement of knowledge...", author: "Mary Shelley", work: "Frankenstein" },
    { text: "If I cannot inspire love, I will cause fear.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "I have no friend… when I am glowing with the enthusiasm of success, there will be none to participate in my joy.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "Satan had his companions, fellow-devils, to admire and encourage him; but I am solitary and abhorred.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "I ought to be thy Adam, but I am rather the fallen angel.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "Nothing is so painful to the human mind as a great and sudden change.", author: "Mary Shelley", work: "Frankenstein" },
    { text: "How mutable are our feelings, and how strange is that clinging love we have of life even in the excess of misery!", author: "Mary Shelley", work: "Frankenstein" },

    // The Tempest - Shakespeare
    { text: "Be not afeard; the isle is full of noises, Sounds and sweet airs, that give delight and hurt not.", author: "William Shakespeare", work: "The Tempest" },
    { text: "We are such stuff As dreams are made on, and our little life Is rounded with a sleep.", author: "William Shakespeare", work: "The Tempest" },
    { text: "O brave new world, That has such people in't!", author: "William Shakespeare", work: "The Tempest" },
    { text: "Hell is empty and all the devils are here.", author: "William Shakespeare", work: "The Tempest" },
    { text: "What's past is prologue.", author: "William Shakespeare", work: "The Tempest" },
    { text: "Full fathom five thy father lies; Of his bones are coral made.", author: "William Shakespeare", work: "The Tempest" },
    { text: "My library Was dukedom large enough.", author: "William Shakespeare", work: "The Tempest" },
    { text: "The rarer action is In virtue than in vengeance.", author: "William Shakespeare", work: "The Tempest" },
    { text: "You taught me language, and my profit on't Is, I know how to curse.", author: "William Shakespeare", work: "The Tempest" },

    // The Rime of the Ancient Mariner - Coleridge
    { text: "Water, water, every where, / And all the boards did shrink; / Water, water, every where, / Nor any drop to drink.", author: "Samuel Taylor Coleridge", work: "The Rime of the Ancient Mariner" },
    { text: "He prayeth best, who loveth best / All things both great and small; / For the dear God who loveth us, / He made and loveth all.", author: "Samuel Taylor Coleridge", work: "The Rime of the Ancient Mariner" },
    { text: "Alone, alone, all, all alone, / Alone on a wide wide sea!", author: "Samuel Taylor Coleridge", work: "The Rime of the Ancient Mariner" },

    // The House of Asterion - Borges
    { text: "I know they accuse me of arrogance, and perhaps misanthropy, and perhaps of madness. Such accusations (for which I shall exact punishment in due time) are derisory.", author: "Jorge Luis Borges", work: "The House of Asterion" },
    { text: "It is true that I never leave my house, but it is also true that its doors (whose number is infinite) stand open night and day to men and also to animals.", author: "Jorge Luis Borges", work: "The House of Asterion" },
    { text: "Perhaps I have created the stars and the sun and this huge house, and no longer remember it.", author: "Jorge Luis Borges", work: "The House of Asterion" },
    { text: "Since then my loneliness does not pain me, because I know my redeemer lives and he will finally rise above the dust.", author: "Jorge Luis Borges", work: "The House of Asterion" },
    { text: "—Would you believe it, Ariadne? —said Theseus—. The Minotaur scarcely defended himself.", author: "Jorge Luis Borges", work: "The House of Asterion" },
    { text: "The house is as big as the world — or rather it is the world.", author: "Jorge Luis Borges", work: "The House of Asterion" },
    { text: "Everything exists many times, fourteen times, but there are two things in the world that apparently exist but once — on high, the intricate sun, and below, Asterion.", author: "Jorge Luis Borges", work: "The House of Asterion" },
    { text: "I hope he takes me to a place with fewer galleries and fewer doors.", author: "Jorge Luis Borges", work: "The House of Asterion" },

    // Life of Theseus - Plutarch
    { text: "These things sensibly affected Theseus, who, thinking it but just not to disregard, but rather partake of, the sufferings of his fellow citizens, offered himself for one without any lot.", author: "Plutarch", work: "Life of Theseus" },
    { text: "Desiring still further to enlarge the city, he invited all men thither on equal terms, and the phrase 'Come hither all ye people,' they say was a proclamation of Theseus...", author: "Plutarch", work: "Life of Theseus" },
    { text: "He without any difficulty set himself to the stone and lifted it up; but refused to take his journey by sea, though it was much the safer way...", author: "Plutarch", work: "Life of Theseus" },
    { text: "Being pleased with the club, he took it, and made it his weapon...", author: "Plutarch", work: "Life of Theseus" },
    { text: "Beyond this there is nothing but prodigies and fictions, the only inhabitants are the poets and inventors of fables...", author: "Plutarch", work: "Life of Theseus" },
    { text: "A brave man need only punish wicked men when they came in his way but that in the case of wild beasts he must himself seek him out and attack them.", author: "Plutarch", work: "Life of Theseus" },
    { text: "Theseus seemed to me to resemble Romulus in many particulars. Both of them, born out of wedlock and of uncertain parentage, had the repute of being sprung from the gods.", author: "Plutarch", work: "Life of Theseus" },
    { text: "Fable may, in what shall follow, so submit to the purifying processes of Reason as to take the character of exact history.", author: "Plutarch", work: "Life of Theseus" },

    // Speeches for Doctor Frankenstein - Atwood
    { text: "I was insane with skill: I made you perfect.", author: "Margaret Atwood", work: "Speeches for Doctor Frankenstein" },
    { text: "i stand in the presence of the destroyed god: a rubble of tendons, knuckles, and raw sinews knowing that the work is mine.", author: "Margaret Atwood", work: "Speeches for Doctor Frankenstein" },
    { text: "how can I love you?", author: "Margaret Atwood", work: "Speeches for Doctor Frankenstein" },
    { text: "you dangle on the leash of your own longing; your need grows teeth.", author: "Margaret Atwood", work: "Speeches for Doctor Frankenstein" },
    { text: "you sliced me loose. and said it was creation. i could feel the knife. now you would like to heal that chasm in your side. but I recede i prowl i will not come when you call.", author: "Margaret Atwood", work: "Speeches for Doctor Frankenstein" }
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
