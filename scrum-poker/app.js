import { joinRoom, selfId } from 'https://cdn.skypack.dev/trystero'

// Configuration
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const APP_ID = 'scrum-poker-benjie'

// Helper for timestamped logging
const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args)

// Global state
let room = null
let sendMessage = null
let receiveMessage = null
let myPeerId = null
let myName = null
let myJoinedAt = null
let isHost = false
let connectionCheckTimeout = null
let hasCheckedForPeers = false

// Reactive state management
const createReactiveState = (initialState, onChange) => {
  return new Proxy(initialState, {
    set(target, property, value) {
      target[property] = value
      onChange(target)
      return true
    },
    deleteProperty(target, property) {
      delete target[property]
      onChange(target)
      return true
    },
  })
}

const sessionState = createReactiveState(
  {
    users: {},
    votes: {},
    votesRevealed: false,
    hostId: null,
  },
  () => updateVotesDisplay()
)

// Track last revealed state for confetti animation
let lastVotesRevealed = false

/**
 * UTILITY FUNCTIONS
 */

function showSessionUI() {
  document.getElementById('connecting').classList.add('hidden')
  document.getElementById('sessionContent').classList.remove('hidden')
}

function generateRoomId() {
  return crypto.randomUUID()
}

function getRandomSuit() {
  return SUITS[Math.floor(Math.random() * SUITS.length)]
}

function showError(error, hideUI) {
  const errorsDiv = document.getElementById('errors')
  errorsDiv.textContent = error
  errorsDiv.classList.remove('hidden')
  if (hideUI) {
    document.querySelector('.landing').classList.remove('hidden')
    document.getElementById('session').classList.add('hidden')
  }
}

function enableShareButton() {
  const shareButton = document.getElementById('shareSession')
  shareButton.disabled = false
  shareButton.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href)
    // show feedback
    shareButton.textContent = 'Copied!'
    setTimeout(() => {
      shareButton.textContent = 'Copy URL'
    }, 2000)
  })
}

function removedFromSession() {
  const sessionDiv = document.getElementById('session')
  const votingUI = sessionDiv.querySelector('#voteButtons')
  const actionButtons = sessionDiv.querySelectorAll(
    '#reveal, #clearVotes, #hideVotes'
  )

  // Hide voting UI
  votingUI.classList.add('hidden')
  actionButtons.forEach((button) => button.classList.add('hidden'))

  // Show removal message
  showError('You have been removed from the session')
  document.getElementById('session').classList.add('hidden')
  document.getElementById('landing').classList.remove('hidden')
}

/**
 * VOTE DISPLAY FUNCTIONS
 */

function createVoteMarkup(revealed, vote, suit) {
  if (!vote) return ''
  if (vote === '?' || Number(vote) > 10) {
    if (!revealed)
      return `<playing-card rank="0" suit="hearts"></playing-card>`
    return `<div class="custom-number ${
      revealed ? '' : 'custom-hidden'
    } ${suit}"><span>${vote}</span></div>`
  }
  return `<playing-card rank="${revealed ? vote : '0'}" suit="${
    suit || 'hearts'
  }"></playing-card>`
}

// Main function to update the UI. Called through Proxy when the state changes
function updateVotesDisplay() {
  const votesDiv = document.getElementById('votes')
  let users = Object.entries(sessionState.users)

  // Check if votes are being revealed (transition from hidden to revealed)
  const isRevealing = !lastVotesRevealed && sessionState.votesRevealed
  lastVotesRevealed = sessionState.votesRevealed

  if (sessionState.votesRevealed) {
    users.sort((a, b) => {
      const voteA = sessionState.votes[a[0]] || 0
      const voteB = sessionState.votes[b[0]] || 0
      return voteA - voteB
    })

    // Only check for matching votes when actually revealing
    if (isRevealing) {
      const votes = Object.values(sessionState.votes).filter(
        (vote) => vote && vote !== '?'
      )
      if (votes.length > 1) {
        const allMatch = votes.every((vote) => vote === votes[0])
        if (allMatch && typeof confetti !== 'undefined') {
          confetti({
            particleCount: 400,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF'],
            shapes: ['circle', 'square'],
            ticks: 300, // how long the confetti will fall
            gravity: 0.8, // affects how fast they fall
            scalar: 1.2, // makes the confetti pieces bigger
          })
        }
      }
    }
  }

  votesDiv.innerHTML = users
    .map(([name, user]) => {
      const vote = sessionState.votes[name]
      const voteMarkup = createVoteMarkup(
        sessionState.votesRevealed,
        vote,
        user.suit
      )
      return `
          <div class="vote-slot" data-user="${name}">
            <div class="user-info">
              <span>${name}</span>
            </div>
            <div class="cards-area">
              <div class="card-container">
                <div class="card-slot"></div>
                ${voteMarkup}
              </div>
            </div>
            <div class="action-buttons">
              <button class="removeUser button-small" data-name="${name}">Remove</button>
            </div>
          </div>`
    })
    .join('')

  votesDiv.classList.remove('hidden')

  document.querySelectorAll('.removeUser').forEach((button) => {
    button.addEventListener('click', () => {
      const shouldRemove = confirm(
        'Are you sure you want to remove this user?'
      )
      if (shouldRemove) {
        broadcastRemoveUser(button.dataset.name)
      }
    })
  })
}

/**
 * HOST ELECTION LOGIC
 */

function electNewHost() {
  let earliestUser = null
  let earliestTime = Infinity

  // Check all users including myself
  for (const [name, user] of Object.entries(sessionState.users)) {
    if (user.peerId === myPeerId) {
      if (myJoinedAt < earliestTime) {
        earliestUser = name
        earliestTime = myJoinedAt
      }
    } else if (user.online && user.joinedAt < earliestTime) {
      earliestUser = name
      earliestTime = user.joinedAt
    }
  }

  // Return true if I should become host
  const shouldBeHost =
    earliestUser && sessionState.users[earliestUser]?.peerId === myPeerId
  return shouldBeHost
}

function becomeHost() {
  isHost = true
  sessionState.hostId = myPeerId
  log('🎩 I am now the host')

  // Broadcast host migration
  const migrationMessage = {
    type: 'host_migration',
    newHostId: myPeerId,
    state: {
      users: sessionState.users,
      votes: sessionState.votes,
      votesRevealed: sessionState.votesRevealed,
      hostId: myPeerId,
    },
  }

  if (sendMessage) {
    sendMessage(migrationMessage)
  }
}

/**
 * MESSAGE HANDLERS
 */

function handleMessage(message, peerId) {
  log('Received message:', message, 'from:', peerId)

  switch (message.type) {
    case 'join':
      handleJoin(message, peerId)
      break
    case 'state_sync':
      handleStateSync(message, peerId)
      break
    case 'vote':
      handleVote(message)
      break
    case 'reveal':
      handleReveal()
      break
    case 'hide_votes':
      handleHideVotes()
      break
    case 'clear_votes':
      handleClearVotes()
      break
    case 'remove_user':
      handleRemoveUser(message)
      break
    case 'host_migration':
      handleHostMigration(message)
      break
  }
}

function handleJoin(data, peerId) {
  const { name, joinedAt, suit } = data
  log('📥 Received join:', { name, joinedAt, suit, peerId })

  // Check for duplicate name (different peerId)
  if (sessionState.users[name] && sessionState.users[name].peerId !== peerId) {
    console.warn('Duplicate name detected:', name, 'ignoring join')
    // Host will send state_sync and the duplicate user will see error and leave
    return
  }

  // Add user to state (use their suit or generate one if not provided)
  sessionState.users[name] = {
    suit: suit || getRandomSuit(),
    online: true,
    joinedAt,
    peerId,
  }
  log('✅ Added user to state:', name, sessionState.users[name])

  // Clear the 30s timeout - we found a peer
  if (connectionCheckTimeout) {
    clearTimeout(connectionCheckTimeout)
    hasCheckedForPeers = true
  }

  // Determine who should be host based on joinedAt timestamps
  const shouldBeHost = myJoinedAt < joinedAt

  if (shouldBeHost) {
    // I joined earlier, so I'm the host
    if (!isHost) {
      isHost = true
      sessionState.hostId = myPeerId
      log('🎩 I am the host (earlier joiner)')
    }

    // Send state sync to all peers
    log('📤 Host sending state_sync to all peers')
    const syncMessage = {
      type: 'state_sync',
      state: {
        users: sessionState.users,
        votes: sessionState.votes,
        votesRevealed: sessionState.votesRevealed,
        hostId: sessionState.hostId,
      },
    }
    sendMessage(syncMessage)

    // Show UI for host
    showSessionUI()
  } else {
    // They joined earlier, wait for their state_sync
    log('⏳ Waiting for state_sync from host')
  }

  updateVotesDisplay()
}

function handleStateSync(data) {
  log('🔄 Syncing state from host', data.state)

  // Check for duplicate name
  const existingUser = data.state.users[myName]
  if (existingUser && existingUser.peerId !== myPeerId) {
    // Name is already taken
    showError(`Name '${myName}' is already in use. Please choose a different name.`, true)
    if (room) {
      room.leave()
    }
    return
  }

  Object.assign(sessionState, data.state)

  // Now we know the host, show the UI
  showSessionUI()

  log('✅ State synced. Users:', Object.keys(sessionState.users))
}

function handleVote(message) {
  sessionState.votes = { ...sessionState.votes, [message.name]: message.value }
}

function handleReveal() {
  sessionState.votesRevealed = true
}

function handleHideVotes() {
  sessionState.votesRevealed = false
}

function handleClearVotes() {
  sessionState.votes = {}
  sessionState.votesRevealed = false
}

function handleRemoveUser(message) {
  if (message.name === myName) {
    if (room) {
      room.leave()
    }
    removedFromSession()
  } else {
    // Create new objects without the removed user to trigger Proxy
    const { [message.name]: _, ...remainingUsers } = sessionState.users
    const { [message.name]: __, ...remainingVotes } = sessionState.votes
    sessionState.users = remainingUsers
    sessionState.votes = remainingVotes
  }
}

function handleHostMigration(message) {
  sessionState.hostId = message.hostId
  isHost = message.hostId === myPeerId
  log(`Host migrated to: ${message.hostName} (${message.hostId})`)
}

/**
 * BROADCAST FUNCTIONS
 */

function broadcastVote(value) {
  sessionState.votes = { ...sessionState.votes, [myName]: value }
  sendMessage({
    type: 'vote',
    name: myName,
    value: value,
  })
}

function broadcastReveal() {
  sessionState.votesRevealed = true
  sendMessage({
    type: 'reveal',
  })
}

function broadcastHideVotes() {
  sessionState.votesRevealed = false
  sendMessage({
    type: 'hide_votes',
  })
}

function broadcastClearVotes() {
  sessionState.votes = {}
  sessionState.votesRevealed = false
  sendMessage({
    type: 'clear_votes',
  })
}

function broadcastRemoveUser(name) {
  // Create new objects without the removed user to trigger Proxy
  const { [name]: _, ...remainingUsers } = sessionState.users
  const { [name]: __, ...remainingVotes } = sessionState.votes
  sessionState.users = remainingUsers
  sessionState.votes = remainingVotes
  sendMessage({
    type: 'remove_user',
    name: name,
  })
}

/**
 * TRYSTERO ROOM INITIALIZATION
 */

async function initRoom(roomId) {
  // Check WebRTC support
  if (!('RTCPeerConnection' in window)) {
    showError('Your browser doesn\'t support WebRTC. Please use a modern browser.', true)
    return
  }

  try {
    // Join the room using Trystero with Nostr strategy
    room = joinRoom({ appId: APP_ID }, roomId)

    // Set up message channel first
    ;[sendMessage, receiveMessage] = room.makeAction('message')

    // Get our peer ID from Trystero's selfId export
    myPeerId = selfId
    myJoinedAt = Date.now()

    log('Joined room:', roomId, 'as peer:', myPeerId)

    // Add ourselves to users
    const mySuit = getRandomSuit()
    sessionState.users[myName] = {
      suit: mySuit,
      online: true,
      joinedAt: myJoinedAt,
      peerId: myPeerId,
    }
    log('✅ Added myself to state:', myName, sessionState.users[myName])

    // Start a 30s timeout to check if we're alone
    connectionCheckTimeout = setTimeout(() => {
      if (!hasCheckedForPeers) {
        // 30 seconds passed, no peers joined
        // We must be alone
        isHost = true
        sessionState.hostId = myPeerId
        log('🎩 I am the host (no peers found after 30s)')
        showSessionUI()
      }
    }, 30000) // 30 second timeout

    // Listen for messages
    receiveMessage((message, peerId) => {
      handleMessage(message, peerId)
    })

    // Handle peer join
    room.onPeerJoin((peerId) => {
      log('👋 Peer joined:', peerId)

      // Clear the timeout - we found a peer!
      if (connectionCheckTimeout) {
        clearTimeout(connectionCheckTimeout)
        hasCheckedForPeers = true
      }

      // Broadcast our join to the newly connected peer
      log('📤 Broadcasting join message to peer:', { type: 'join', name: myName, suit: mySuit, peerId: myPeerId, joinedAt: myJoinedAt })
      sendMessage({
        type: 'join',
        name: myName,
        suit: mySuit,
        peerId: myPeerId,
        joinedAt: myJoinedAt,
      })
    })

    // Handle peer leave
    room.onPeerLeave((peerId) => {
      log('Peer left:', peerId)

      // Remove user with this peerId
      for (const [name, user] of Object.entries(sessionState.users)) {
        if (user.peerId === peerId) {
          // Create new objects without the removed user to trigger Proxy
          const { [name]: _, ...remainingUsers } = sessionState.users
          const { [name]: __, ...remainingVotes } = sessionState.votes
          sessionState.users = remainingUsers
          sessionState.votes = remainingVotes
          break
        }
      }

      // If the host left, elect new host
      if (sessionState.hostId === peerId) {
        if (electNewHost()) {
          becomeHost()
        }
      }
    })
  } catch (error) {
    console.error('Failed to join room:', error)
    showError('Unable to connect to session. Please check your internet connection.', true)
  }
}

/**
 * EVENT LISTENERS
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search)
  const roomId = urlParams.get('session')

  // Handle new session creation
  document.getElementById('newSession').addEventListener('click', () => {
    const newRoomId = generateRoomId()
    window.location.href = `?session=${newRoomId}`
  })

  // If we have a room ID, show the name input
  if (roomId) {
    enableShareButton()

    document.getElementById('landing').classList.add('hidden')
    document.getElementById('nameInput').classList.remove('hidden')

    // Handle join session
    document.getElementById('joinSession').addEventListener('click', (e) => {
      e.preventDefault()
      myName = document.getElementById('userName').value.trim()
      if (myName) {
        document.getElementById('landing').classList.add('hidden')
        document.getElementById('nameInput').classList.add('hidden')
        document.getElementById('session').classList.remove('hidden')

        // Initialize Trystero room
        initRoom(roomId)

        // Attach vote button listeners
        document.querySelectorAll('.vote-button').forEach((button) => {
          button.addEventListener('click', () => {
            broadcastVote(button.dataset.value)
          })
        })

        // Attach action button listeners
        document.getElementById('reveal').addEventListener('click', () => {
          broadcastReveal()
        })

        document.getElementById('clearVotes').addEventListener('click', () => {
          broadcastClearVotes()
        })

        document.getElementById('hideVotes').addEventListener('click', () => {
          broadcastHideVotes()
        })
      }
    })
  }
})
